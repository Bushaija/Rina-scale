"use client";

import React, { useRef, useState } from 'react';
import { FinancialStatementHeader, getProjectCodeForFinancialStatement } from '@/components/reports/financial-statement-header';
import { BalanceSheetStatement } from '@/features/reports/balance-sheet';
import { useAssetsLiabilitiesAggregateByProject } from '@/features/api/statements';
import { getCurrentFiscalYear } from '@/features/execution/utils';
import { ReportSkeleton } from '@/components/skeletons';
import { FilterTabs, type FilterTab } from '@/components/ui/filter-tabs';
import { useGetActiveReportingPeriod } from '@/features/api/reporting-periods';

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

// Tab Content Component that handles loading state (only for report content)
const TabContent = ({ tabValue, periodId }: { tabValue: string; periodId: number }) => {
  const selectedProjectCode = getProjectCodeForFinancialStatement(tabValue)
  const { data, isLoading, isError } = useAssetsLiabilitiesAggregateByProject(periodId, selectedProjectCode, !!periodId)

  const currentEndingYear = getCurrentFiscalYear();
  const currentStartYear = currentEndingYear - 1;
  const prevEndingYear = currentEndingYear - 1;
  const prevStartYear = prevEndingYear - 1;

  const periodLabels = {
    currentPeriodLabel: `FY ${currentStartYear}/${currentEndingYear} (Frw)`,
    previousPeriodLabel: `FY ${prevStartYear}/${prevEndingYear} (Frw)`
  };

  if (isLoading) {
    return <ReportSkeleton />
  }

  if (isError) {
    return <div className="bg-white p-6 rounded-lg border">Failed to load balance sheet for {tabValue.toUpperCase()}</div>
  }

  return <BalanceSheetStatement initialData={data as any} {...periodLabels} />
}

export default function BalanceSheetPage() {
  const [selectedTab, setSelectedTab] = useState('hiv')
  const reportContentRef = useRef<HTMLDivElement>(null!)

  // Fetch active reporting period
  const { data: activePeriodResp, isLoading: isActiveLoading } = useGetActiveReportingPeriod();
  const periodId =activePeriodResp?.data?.id;

  const initialLoading = isActiveLoading;

  if (initialLoading || !periodId) {
    return <ReportSkeleton />;
  }

  // Create tabs with content that handles its own loading state
  const tabsWithContent = projectTabs.map(tab => ({
    ...tab,
    content: <TabContent tabValue={tab.value} periodId={periodId} />
  }))

  return (
    <main className="max-w-6xl mx-auto">
      <div className="">
        {/* 1. Financial Statement Header - Always visible */}
        <div ref={reportContentRef} className="bg-white">
          <FinancialStatementHeader
            statementType="assets-liabilities"
            selectedProject={selectedTab as 'hiv' | 'malaria' | 'tb'}
            contentRef={reportContentRef}
          />
        
          {/* 2. Filter Tabs - Always visible */}
          <FilterTabs
            tabs={tabsWithContent}
            value={selectedTab}
            onValueChange={setSelectedTab}
            defaultValue="hiv"
          />
        </div>
      </div>
    </main>
  )
}
