import { useQuery } from '@tanstack/react-query';
import { honoClient, handleHonoResponse } from '@/lib/hono';
import { ReportingPeriod } from '@/lib/types';

export const reportingPeriodsApi = {
  getAll: () => 
    handleHonoResponse<{ data: ReportingPeriod[] }>(
      honoClient.api["reporting-periods"].$get({})
    ),
  
  getActive: () => 
    handleHonoResponse<{ data: ReportingPeriod[] }>(
      (honoClient.api["reporting-periods"] as any)["active"].$get({})
    ),
  
  getCurrent: () => 
    handleHonoResponse<ReportingPeriod>(
      (honoClient.api["reporting-periods"] as any)["current"].$get({})
    ),
  
  getById: (id: number) => 
    handleHonoResponse<ReportingPeriod>(
      (honoClient.api["reporting-periods"] as any)[":id"].$get({ param: { id: id.toString() } })
    ),
};


export const reportingPeriodsKeys = {
  all: ['reporting-periods'] as const,
  active: ['reporting-periods', 'active'] as const,
  current: ['reporting-periods', 'current'] as const,
  byId: (id: number) => ['reporting-periods', id] as const,
};


export const useReportingPeriods = () => {
  return useQuery({
    queryKey: reportingPeriodsKeys.all,
    queryFn: reportingPeriodsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes - relatively stable data
  });
};

export const useActiveReportingPeriods = () => {
  return useQuery({
    queryKey: reportingPeriodsKeys.active,
    queryFn: reportingPeriodsApi.getActive,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCurrentReportingPeriod = () => {
  return useQuery({
    queryKey: reportingPeriodsKeys.current,
    queryFn: reportingPeriodsApi.getCurrent,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useReportingPeriod = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: reportingPeriodsKeys.byId(id),
    queryFn: () => reportingPeriodsApi.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};