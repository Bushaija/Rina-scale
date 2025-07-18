import { FinancialRow } from '@/features/execution/schemas/execution-form-schema'

/**
 * Normalizes an ID by removing hyphens from the sub-category part.
 * e.g., "B-01-1" -> "B01-1" and "B-01" -> "B01"
 * @param id The ID to normalize
 * @returns The normalized ID
 */
function normalizeId(id: string): string {
  const parts = id.split('-');
  if (parts.length > 1) {
    // Re-join, but only process the first hyphen if it's like 'B-01'
    if (/^[A-Z]$/.test(parts[0]) && /^\d+$/.test(parts[1])) {
      return `${parts[0]}${parts[1]}` + (parts.length > 2 ? `-${parts.slice(2).join('-')}` : '');
    }
  }
  return id;
}

/**
 * Merges saved financial data with the standard template structure
 * This ensures edit mode has the same structure as create mode
 * 
 * @param savedData - Data loaded from database (edit mode)
 * @param template - Standard template structure (from generateEmptyFinancialTemplate)
 * @returns Normalized data with template structure + saved values
 */
export function mergeWithTemplate(
  savedData: FinancialRow[], 
  template: FinancialRow[]
): FinancialRow[] {
  
  // Create a lookup map for saved data by ID for efficient searching
  const savedDataMap = createDataMap(savedData)
  
  // Recursively merge template with saved values
  return template.map(templateRow => mergeRow(templateRow, savedDataMap))
}

/**
 * Creates a flat map of all financial rows by ID for quick lookup
 */
function createDataMap(rows: FinancialRow[]): Map<string, FinancialRow> {
  const map = new Map<string, FinancialRow>()
  
  function addToMap(row: FinancialRow) {
    // Normalize the ID before setting it in the map
    const normalizedId = normalizeId(row.id);
    map.set(normalizedId, row)
    if (row.children) {
      row.children.forEach(addToMap)
    }
  }
  
  rows.forEach(addToMap)
  return map
}

/**
 * Merges a single template row with corresponding saved data
 */
function mergeRow(templateRow: FinancialRow, savedDataMap: Map<string, FinancialRow>): FinancialRow {
  // Start with template structure (preserves all metadata and flags)
  const mergedRow: FinancialRow = {
    ...templateRow,
  }
  
  // Find corresponding saved data
  const savedRow = savedDataMap.get(normalizeId(templateRow.id));
  
  if (savedRow) {
    // Merge values from saved data (but preserve template structure)
    mergedRow.executionId = savedRow.executionId;
    mergedRow.q1 = savedRow.q1
    mergedRow.q2 = savedRow.q2
    mergedRow.q3 = savedRow.q3
    mergedRow.q4 = savedRow.q4
    mergedRow.cumulativeBalance = savedRow.cumulativeBalance
    mergedRow.comments = savedRow.comments
    
    // Preserve calculated flags from template but allow override if needed
    if (savedRow.isCalculated !== undefined) {
      mergedRow.isCalculated = savedRow.isCalculated
    }
    
    if (savedRow.calculationSource !== undefined) {
      mergedRow.calculationSource = savedRow.calculationSource
    }
    
    // IMPORTANT: Always preserve isEditable flag from template
    // This ensures calculated fields like G3 remain non-editable even after merge
    // Only override if the template doesn't have an explicit setting
    if (templateRow.isEditable !== undefined) {
      mergedRow.isEditable = templateRow.isEditable
    } else if (savedRow.isEditable !== undefined) {
      mergedRow.isEditable = savedRow.isEditable
    }
  }
  
  // Recursively merge children if they exist in template
  if (templateRow.children) {
    mergedRow.children = templateRow.children.map(childTemplate => 
      mergeRow(childTemplate, savedDataMap)
    )
  }
  
  return mergedRow
}

/**
 * Validates that merged data maintains structural integrity
 */
export function validateMergedStructure(mergedData: FinancialRow[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Check for required top-level categories
  const requiredCategories = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
  const foundCategories = mergedData.map(row => row.id)
  
  requiredCategories.forEach(categoryId => {
    if (!foundCategories.includes(categoryId)) {
      errors.push(`Missing required category: ${categoryId}`)
    }
  })
  
  // Check for required subcategories under B. Expenditures
  const expenditureCategory = mergedData.find(row => row.id === 'B')
  if (expenditureCategory?.children) {
    const requiredSubcategories = ['B01', 'B02', 'B03', 'B04', 'B05']
    const foundSubcategories = expenditureCategory.children.map(row => row.id)
    
    requiredSubcategories.forEach(subId => {
      if (!foundSubcategories.includes(subId)) {
        warnings.push(`Missing expenditure subcategory: ${subId}`)
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Debug utility to compare structures
 */
export function compareStructures(data1: FinancialRow[], data2: FinancialRow[]): {
  differences: string[]
  summary: {
    data1Only: string[]
    data2Only: string[]
    common: string[]
  }
} {
  const differences: string[] = []
  
  const getIds = (rows: FinancialRow[]): Set<string> => {
    const ids = new Set<string>()
    const addIds = (row: FinancialRow) => {
      ids.add(row.id)
      if (row.children) {
        row.children.forEach(addIds)
      }
    }
    rows.forEach(addIds)
    return ids
  }
  
  const ids1 = getIds(data1)
  const ids2 = getIds(data2)
  
  const data1Only = Array.from(ids1).filter(id => !ids2.has(id))
  const data2Only = Array.from(ids2).filter(id => !ids1.has(id))
  const common = Array.from(ids1).filter(id => ids2.has(id))
  
  if (data1Only.length > 0) {
    differences.push(`IDs only in first dataset: ${data1Only.join(', ')}`)
  }
  
  if (data2Only.length > 0) {
    differences.push(`IDs only in second dataset: ${data2Only.join(', ')}`)
  }
  
  return {
    differences,
    summary: {
      data1Only,
      data2Only,
      common
    }
  }
}

/**
 * Utility to log merge results for debugging
 */
export function debugMergeResults(
  savedData: FinancialRow[],
  template: FinancialRow[],
  merged: FinancialRow[]
): void {
  // Structure comparison
  const structureComparison = compareStructures(savedData, template)
  
  // Validation check
  const validation = validateMergedStructure(merged)
  
  // Sample a few merged values to verify data preservation
  const sampleIds = ['A1', 'B01-1', 'C', 'F', 'G1']
  const sampleResults = sampleIds.map(id => {
    const savedItem = createDataMap(savedData).get(id)
    const mergedItem = createDataMap(merged).get(id)
    
    if (savedItem && mergedItem) {
      return {
        id,
        saved: { q1: savedItem.q1, q2: savedItem.q2 },
        merged: { q1: mergedItem.q1, q2: mergedItem.q2 },
        preserved: savedItem.q1 === mergedItem.q1 && savedItem.q2 === mergedItem.q2
      }
    }
    return null
  }).filter(Boolean)
  
  // Return structured debug info instead of logging
  const debugInfo = {
    structureComparison,
    validation,
    sampleResults,
    summary: {
      totalSaved: savedData.length,
      totalTemplate: template.length,
      totalMerged: merged.length,
      allSamplesPreserved: sampleResults.every(result => result?.preserved)
    }
  }
  
  // Only log if there are errors or warnings
  if (validation.errors.length > 0 || validation.warnings.length > 0) {
    console.warn('Merge validation issues:', debugInfo)
  }
}

/**
 * Production-ready merge function with error handling and logging
 */
export function mergeWithTemplateRobust(
  savedData: FinancialRow[], 
  template: FinancialRow[],
  options: {
    enableDebug?: boolean
    enableValidation?: boolean
    throwOnErrors?: boolean
  } = {}
): FinancialRow[] {
  const { enableDebug = false, enableValidation = true, throwOnErrors = false } = options
  
  try {
    // Perform the merge
    const merged = mergeWithTemplate(savedData, template)
    
    // Optional validation
    if (enableValidation) {
      const validation = validateMergedStructure(merged)
      
      if (!validation.isValid && throwOnErrors) {
        throw new Error(`Merge validation failed: ${validation.errors.join(', ')}`)
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Data merge warnings:', validation.warnings)
      }
    }
    
    // Optional debug logging
    if (enableDebug) {
      debugMergeResults(savedData, template, merged)
    }
    
    return merged
    
  } catch (error) {
    console.error('Failed to merge data with template:', error)
    
    if (throwOnErrors) {
      throw error
    }
    
    // Fallback to template structure
    console.warn('Falling back to template structure')
    return template
  }
} 