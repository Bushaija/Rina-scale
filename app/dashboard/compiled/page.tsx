"use client"

import React, { useState } from 'react'
import { CompiledReport } from '@/features/compilation/compiled-report'
import { useCompiledReport } from '@/features/compilation/use-compiled-report'
import { ReportSkeleton } from '@/components/skeletons'
import { FilterTabs, getProjectCodeForTab, type FilterTab } from '@/components/ui/filter-tabs'
import { getCurrentFiscalYear, generateQuarterLabels } from '@/features/execution/utils'

// Project configuration
const projectTabs: FilterTab[] = [
  {
    value: 'hiv',
    label: 'HIV',
    content: null // Will be populated with the report component
  },
  {
    value: 'malaria', 
    label: 'Malaria',
    content: null
  },
  {
    value: 'tb',
    label: 'TB',
    content: null
  }
]

const getProjectDisplayName = (tabValue: string): string => {
  const mapping = {
    'hiv': 'HIV NSP BUDGET SUPPORT',
    'malaria': 'MALARIA BUDGET SUPPORT', 
    'tb': 'TB BUDGET SUPPORT'
  }
  return mapping[tabValue as keyof typeof mapping] || 'BUDGET SUPPORT'
}

// Report Header Component
const ReportHeader = ({ project, reportingPeriod }: {
  project: string
  reportingPeriod?: string
}) => (
  <div className="mb-6 text-left">
    <h1 className="text-lg font-bold mb-2">Compiled Financial Report</h1>
    <div className="text-gray-600 text-sm">
      <p>{project}</p>
      {/* <p>{fiscalYear}</p> */}
      {reportingPeriod && <p>Reporting Period: {reportingPeriod}</p>}
    </div>
  </div>
)

// Tab Content Component that handles loading state
const TabContent = ({ tabValue }: { tabValue: string }) => {
  const selectedProjectCode = getProjectCodeForTab(tabValue)
  const { compiledFacilities, isLoading } = useCompiledReport({ 
    projectCode: selectedProjectCode 
  })

  if (isLoading) {
    return <ReportSkeleton />
  }

  return <CompiledReport facilities={compiledFacilities} />
}

export default function AggregatedReportPage() {
    const [selectedTab, setSelectedTab] = useState('hiv')

    // Determine fiscal year & Q1 period using shared utils
    const currentFY = getCurrentFiscalYear().toString()
    const q1 = generateQuarterLabels(Number(currentFY))[0].line2   // e.g. "(Jul-Sep 2026)"
    const currentPeriod = q1.replace(/[()]/g, "")                 // → "Jul-Sep 2026"

    // Create tabs with content that handles its own loading state
    const tabsWithContent = projectTabs.map(tab => ({
        ...tab,
        content: <TabContent tabValue={tab.value} />
    }))

    return (
        <div className="container mx-auto py-4">
            {/* Report Header */}
            <ReportHeader 
                project={getProjectDisplayName(selectedTab)}
                reportingPeriod={currentPeriod}
            />
            
            {/* Filter Tabs with Report Content */}
            <FilterTabs
                tabs={tabsWithContent}
                value={selectedTab}
                onValueChange={setSelectedTab}
                defaultValue="hiv"
            />
        </div>
    )
}