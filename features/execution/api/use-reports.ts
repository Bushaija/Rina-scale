import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from './client';
import type { FinancialReport, ReportFilters } from './types';

export const reportsKeys = {
  all: ['reports'] as const,
  financialSummary: (filters: ReportFilters) => 
    [...reportsKeys.all, 'financialSummary', filters] as const,
  varianceAnalysis: (filters: ReportFilters & { budgetPeriodId: number }) =>
    [...reportsKeys.all, 'varianceAnalysis', filters] as const,
  facilityComparison: (filters: {
    reportingPeriodId: number;
    facilityIds: number[];
    categoryCode?: string;
  }) => [...reportsKeys.all, 'facilityComparison', filters] as const,
};

export function useFinancialSummary(
  filters: ReportFilters,
  options?: UseQueryOptions<FinancialReport, Error>
) {
  return useQuery({
    queryKey: reportsKeys.financialSummary(filters),
    queryFn: () => apiClient.getFinancialSummary(filters),
    enabled: !!filters.reportingPeriodId, // Only run if reportingPeriodId is provided
    staleTime: 1000 * 60 * 2, // 2 minutes - reports can change frequently
    gcTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useVarianceAnalysis(
  filters: ReportFilters & { budgetPeriodId: number },
  options?: UseQueryOptions<any, Error>
) {
  return useQuery({
    queryKey: reportsKeys.varianceAnalysis(filters),
    queryFn: () => apiClient.getVarianceAnalysis(filters),
    enabled: !!(filters.reportingPeriodId && filters.budgetPeriodId),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useFacilityComparison(
  filters: {
    reportingPeriodId: number;
    facilityIds: number[];
    categoryCode?: string;
  },
  options?: UseQueryOptions<any, Error>
) {
  return useQuery({
    queryKey: reportsKeys.facilityComparison(filters),
    queryFn: () => apiClient.getFacilityComparison(filters),
    enabled: !!(filters.reportingPeriodId && filters.facilityIds.length > 0),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    ...options,
  });
}
