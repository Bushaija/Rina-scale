import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from './client';
import type { ReportingPeriod, CreateReportingPeriod } from './types';

export const reportingPeriodsKeys = {
  all: ['reportingPeriods'] as const,
  lists: () => [...reportingPeriodsKeys.all, 'list'] as const,
};

export function useReportingPeriods(
  options?: UseQueryOptions<{ data: ReportingPeriod[] }, Error>
) {
  return useQuery({
    queryKey: reportingPeriodsKeys.lists(),
    queryFn: apiClient.getReportingPeriods,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,
    ...options,
  });
}

export function useCreateReportingPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createReportingPeriod,
    onSuccess: () => {
      // Invalidate and refetch reporting periods
      queryClient.invalidateQueries({
        queryKey: reportingPeriodsKeys.all,
      });
    },
    onError: (error) => {
      console.error('Failed to create reporting period:', error);
    },
  });
}
