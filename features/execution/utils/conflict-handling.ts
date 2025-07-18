import { TempSaveData, TempSaveMetadata } from '@/features/execution/stores/temp-save-store'

// Constants for conflict handling
const CURRENT_FORM_VERSION = '1.0.0'
const TAB_HEARTBEAT_INTERVAL = 10000 // 10 seconds
const TAB_TIMEOUT = 30000 // 30 seconds

// Interface for tab tracking
interface TabInfo {
  tabId: string
  lastHeartbeat: number
  sessionId: string
  formContext: string
}

// Generate unique tab ID
export const generateTabId = (): string => {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Generate session ID (survives until browser is closed)
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('temp-save-session-id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('temp-save-session-id', sessionId)
  }
  return sessionId
}

// Create form context identifier
export const createFormContext = (metadata: TempSaveMetadata): string => {
  return `${metadata.facilityId}_${metadata.reportingPeriod}_${metadata.programName}`
}

// Tab tracking in localStorage
const TAB_STORAGE_KEY = 'temp-save-active-tabs'

// Get active tabs for a form context
export const getActiveTabs = (formContext: string): TabInfo[] => {
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY)
    if (!stored) return []
    
    const allTabs: Record<string, TabInfo> = JSON.parse(stored)
    const now = Date.now()
    
    // Filter to active tabs for this form context
    return Object.values(allTabs).filter(tab => 
      tab.formContext === formContext && 
      (now - tab.lastHeartbeat) < TAB_TIMEOUT
    )
  } catch (error) {
    console.warn('Error reading active tabs:', error)
    return []
  }
}

// Register current tab as active
export const registerTab = (tabId: string, formContext: string): void => {
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY)
    const allTabs: Record<string, TabInfo> = stored ? JSON.parse(stored) : {}
    
    allTabs[tabId] = {
      tabId,
      lastHeartbeat: Date.now(),
      sessionId: getSessionId(),
      formContext
    }
    
    localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(allTabs))
  } catch (error) {
    console.warn('Error registering tab:', error)
  }
}

// Update tab heartbeat
export const updateTabHeartbeat = (tabId: string): void => {
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY)
    if (!stored) return
    
    const allTabs: Record<string, TabInfo> = JSON.parse(stored)
    if (allTabs[tabId]) {
      allTabs[tabId].lastHeartbeat = Date.now()
      localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(allTabs))
    }
  } catch (error) {
    console.warn('Error updating tab heartbeat:', error)
  }
}

// Cleanup inactive tabs
export const cleanupInactiveTabs = (): number => {
  try {
    const stored = localStorage.getItem(TAB_STORAGE_KEY)
    if (!stored) return 0
    
    const allTabs: Record<string, TabInfo> = JSON.parse(stored)
    const now = Date.now()
    let cleanedCount = 0
    
    Object.keys(allTabs).forEach(tabId => {
      if ((now - allTabs[tabId].lastHeartbeat) >= TAB_TIMEOUT) {
        delete allTabs[tabId]
        cleanedCount++
      }
    })
    
    localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(allTabs))
    return cleanedCount
  } catch (error) {
    console.warn('Error cleaning up tabs:', error)
    return 0
  }
}

// Check for multiple tabs editing same form
export const detectMultipleTabs = (formContext: string, currentTabId: string): {
  hasMultipleTabs: boolean
  activeTabs: TabInfo[]
  otherTabs: TabInfo[]
} => {
  const activeTabs = getActiveTabs(formContext)
  const otherTabs = activeTabs.filter(tab => tab.tabId !== currentTabId)
  
  return {
    hasMultipleTabs: otherTabs.length > 0,
    activeTabs,
    otherTabs
  }
}

// Version compatibility checking
export const checkVersionCompatibility = (savedData: TempSaveData): {
  isCompatible: boolean
  canMigrate: boolean
  warnings: string[]
} => {
  const warnings: string[] = []
  const savedVersion = savedData.version || '0.0.0'
  
  // Check if versions match
  if (savedVersion === CURRENT_FORM_VERSION) {
    return {
      isCompatible: true,
      canMigrate: false,
      warnings: []
    }
  }
  
  // Check if migration is possible
  const canMigrate = isVersionMigratable(savedVersion, CURRENT_FORM_VERSION)
  
  if (!canMigrate) {
    warnings.push(`Incompatible version: saved (${savedVersion}) vs current (${CURRENT_FORM_VERSION})`)
    warnings.push('The saved data structure is too old and cannot be migrated.')
  } else {
    warnings.push(`Version mismatch: saved (${savedVersion}) vs current (${CURRENT_FORM_VERSION})`)
    warnings.push('The saved data will be migrated to the current version.')
  }
  
  return {
    isCompatible: false,
    canMigrate,
    warnings
  }
}

// Check if version can be migrated
const isVersionMigratable = (fromVersion: string, toVersion: string): boolean => {
  // Simple version comparison - in production, implement proper semantic versioning
  const parseVersion = (v: string) => v.split('.').map(Number)
  const from = parseVersion(fromVersion)
  const to = parseVersion(toVersion)
  
  // Allow migration if major version is same or only 1 version behind
  const majorDiff = to[0] - from[0]
  
  return majorDiff <= 1 && majorDiff >= 0
}

// Migrate saved data to current version
export const migrateSavedData = (savedData: TempSaveData): TempSaveData | null => {
  try {
    const compatibility = checkVersionCompatibility(savedData)
    
    if (compatibility.isCompatible) {
      return savedData // No migration needed
    }
    
    if (!compatibility.canMigrate) {
      return null // Cannot migrate
    }
    
    // Perform migration based on version differences
    const migratedData = { ...savedData }
    
    // Example migration logic (customize based on actual version changes)
    if (savedData.version === '0.9.0' && CURRENT_FORM_VERSION === '1.0.0') {
      // Add any new required fields
      migratedData.version = CURRENT_FORM_VERSION
      
      // Ensure all required fields exist
      if (!migratedData.expandedRows) {
        migratedData.expandedRows = []
      }
      
      // Update metadata structure if needed
      if (migratedData.metadata && !migratedData.metadata.facilityType) {
        migratedData.metadata.facilityType = 'health_center' // default
      }
    }
    
    migratedData.version = CURRENT_FORM_VERSION
    return migratedData
    
  } catch (error) {
    console.error('Error migrating saved data:', error)
    return null
  }
}

// Conflict resolution strategies
export type ConflictResolution = 'use-local' | 'use-remote' | 'merge' | 'ask-user'

export const resolveConflict = (
  localData: TempSaveData,
  remoteData: TempSaveData,
  strategy: ConflictResolution = 'ask-user'
): TempSaveData | null => {
  switch (strategy) {
    case 'use-local':
      return localData
      
    case 'use-remote':
      return remoteData
      
    case 'merge':
      // Simple merge strategy - use latest timestamp
      const localTime = new Date(localData.timestamps.lastSaved).getTime()
      const remoteTime = new Date(remoteData.timestamps.lastSaved).getTime()
      return localTime > remoteTime ? localData : remoteData
      
    case 'ask-user':
    default:
      return null // Let UI handle user choice
  }
}

// Enhanced validation for saved data integrity
export const validateSavedDataIntegrity = (savedData: TempSaveData): {
  isValid: boolean
  errors: string[]
  canRecover: boolean
} => {
  const errors: string[] = []
  
  // Check required fields
  if (!savedData.id) errors.push('Missing save ID')
  if (!savedData.formData) errors.push('Missing form data')
  if (!Array.isArray(savedData.formData)) errors.push('Invalid form data structure')
  if (!savedData.metadata) errors.push('Missing metadata')
  if (!savedData.timestamps) errors.push('Missing timestamps')
  if (!savedData.version) errors.push('Missing version')
  
  // Check metadata structure
  if (savedData.metadata) {
    if (!savedData.metadata.facilityName) errors.push('Missing facility name in metadata')
    if (!savedData.metadata.reportingPeriod) errors.push('Missing reporting period in metadata')
  }
  
  // Check timestamps
  if (savedData.timestamps) {
    const requiredTimestamps = ['created', 'lastSaved', 'lastAccessed']
    requiredTimestamps.forEach(field => {
      if (!savedData.timestamps[field as keyof typeof savedData.timestamps]) {
        errors.push(`Missing timestamp: ${field}`)
      } else {
        try {
          new Date(savedData.timestamps[field as keyof typeof savedData.timestamps])
        } catch {
          errors.push(`Invalid timestamp format: ${field}`)
        }
      }
    })
  }
  
  const isValid = errors.length === 0
  const canRecover = errors.length < 3 && // Allow some missing non-critical fields
                     savedData.formData && 
                     Array.isArray(savedData.formData) &&
                     savedData.metadata
  
  return {
    isValid,
    errors,
    canRecover
  }
} 