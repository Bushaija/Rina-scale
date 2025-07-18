"use client"

import React, { useMemo } from "react"
import { FinancialRow, generateEmptyFinancialTemplate, calculateHierarchicalTotals } from "../execution/schemas/execution-form-schema"
import { CompiledReportRow } from "./components/compiled-report-row"

// Types for the compiled report
type FacilityData = {
  facilityName: string
  data: FinancialRow[]
}

type CompiledReportProps = {
  facilities: FacilityData[]
}

// Helper function to calculate totals across facilities
function calculateTotalRow(facilities: FacilityData[], rowId: string): FinancialRow | null {
  let totalRow: FinancialRow | null = null
  
  facilities.forEach(facility => {
    const findRow = (rows: FinancialRow[]): FinancialRow | null => {
      for (const row of rows) {
        if (row.id === rowId) return row
        if (row.children) {
          const found = findRow(row.children)
          if (found) return found
        }
      }
      return null
    }
    
    const row = findRow(facility.data)
    if (!row) return
    
    if (!totalRow) {
      totalRow = {
        ...row,
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0,
        cumulativeBalance: 0,
        children: undefined // Remove children for total row
      }
    }
    
    totalRow.q1 = (totalRow.q1 || 0) + (row.q1 || 0)
    totalRow.q2 = (totalRow.q2 || 0) + (row.q2 || 0)
    totalRow.q3 = (totalRow.q3 || 0) + (row.q3 || 0)
    totalRow.q4 = (totalRow.q4 || 0) + (row.q4 || 0)
    totalRow.cumulativeBalance = (totalRow.cumulativeBalance || 0) + (row.cumulativeBalance || 0)
  })
  
  return totalRow
}

// Helper function to recursively render rows
function renderRows(
  rows: FinancialRow[],
  facilities: FacilityData[],
  depth: number = 0
): React.ReactElement[] {
  return rows.map(row => {
    const elements: React.ReactElement[] = [
      <CompiledReportRow
        key={row.id}
        rowData={{
          id: row.id,
          title: row.title,
          isCategory: row.isCategory,
          children: row.children
        }}
        facilities={facilities}
        depth={depth}
      />
    ]

    if (row.children && row.children.length > 0) {
      elements.push(...renderRows(row.children, facilities, depth + 1))
    }

    return elements
  }).flat()
}

export function CompiledReport({
  facilities
}: CompiledReportProps) {
  const tableStructure = useMemo(() => {
    // Always derive the row hierarchy from the source-of-truth template, so
    // the compiled report stays in sync with ExecutionForm.
    return generateEmptyFinancialTemplate()
  }, [])

  // Ensure each facility's data has up-to-date calculated totals that match
  // the current schema (e.g. if their payload comes from the DB without
  // category totals pre-computed).
  const normalizedFacilities = useMemo(() => {
    return facilities.map((f) => ({
      ...f,
      data: calculateHierarchicalTotals(f.data ?? [])
    }))
  }, [facilities])

  return (
    <div className="w-full">
      {/* Report Table */}
      <div className="relative overflow-x-auto shadow-md rounded-lg border">
        <table className="min-w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {/* Fixed Event Details Column */}
              <th scope="col" className="sticky left-0 z-20 px-6 py-3 bg-gray-50 border-r w-[300px]">
                Event Details
              </th>
              
              {/* Scrollable Facility Columns */}
              {normalizedFacilities.map((facility, index) => (
                <th key={index} scope="col" className="px-4 py-3 text-center w-[200px]">
                  {facility.facilityName}
                </th>
              ))}
              
              {/* Fixed Total Column */}
              <th scope="col" className="sticky right-[300px] z-20 px-6 py-3 bg-gray-50 border-x w-[200px] text-center">
                Total
              </th>
              
              {/* Fixed Comments Column */}
              <th scope="col" className="sticky right-0 z-20 px-6 py-3 bg-gray-50 border-l w-[300px] text-left">
                Comments
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200 bg-white">
            {renderRows(tableStructure, normalizedFacilities)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
