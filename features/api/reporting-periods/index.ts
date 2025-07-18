import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";

const reportingPeriodsApi = honoClient.api["reporting-periods"];

const $get = reportingPeriodsApi.$get;
const $post = reportingPeriodsApi.$post;
const $getById = (reportingPeriodsApi as any)[":id"].$get;
const $getActive = (reportingPeriodsApi as any)["active"].$get;
const $getCurrent = (reportingPeriodsApi as any)["current"].$get;

// Types
type ReportingPeriodsResponse = InferResponseType<typeof $get>;
type ReportingPeriodResponse = InferResponseType<typeof $getById>;
type CreateReportingPeriodRequest = InferRequestType<typeof $post>["json"];

// API Functions
const getReportingPeriods = async () =>
  handleHonoResponse<ReportingPeriodsResponse>($get({}));

const getActiveReportingPeriod = async () =>
  handleHonoResponse<{ data: ReportingPeriod }>($getActive({}));

const getCurrentReportingPeriod = async () =>
  handleHonoResponse<ReportingPeriodResponse>($getCurrent({}));

const getReportingPeriodById = async (id: number) =>
  handleHonoResponse<ReportingPeriodResponse>(
    $getById({ param: { id: id.toString() } })
  );

const createReportingPeriod = async (json: CreateReportingPeriodRequest) => {
    const res = await $post({ json });
    if (!res.ok) {
        throw new Error("Failed to create reporting period");
    }
    return res.json();
};

// Query Keys
export const reportingPeriodsKeys = {
  all: ["reporting-periods"] as const,
  active: ["reporting-periods", "active"] as const,
  current: ["reporting-periods", "current"] as const,
  byId: (id: number) => ["reporting-periods", id] as const,
};

// Custom Hooks
export const useGetReportingPeriods = () => {
  return useQuery({
    queryKey: reportingPeriodsKeys.all,
    queryFn: getReportingPeriods,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGetActiveReportingPeriod = () => {
  return useQuery({
    queryKey: reportingPeriodsKeys.active,
    queryFn: getActiveReportingPeriod,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useGetCurrentReportingPeriod = () => {
  return useQuery({
    queryKey: reportingPeriodsKeys.current,
    queryFn: getCurrentReportingPeriod,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useGetReportingPeriodById = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: reportingPeriodsKeys.byId(id),
    queryFn: () => getReportingPeriodById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateReportingPeriod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReportingPeriod,
    onSuccess: () => {
      toast.success("Reporting period created successfully");
      queryClient.invalidateQueries({ queryKey: reportingPeriodsKeys.all });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

// Backward-compat alias (plural name)
export const useGetActiveReportingPeriods = useGetActiveReportingPeriod;