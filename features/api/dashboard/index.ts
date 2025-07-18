import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";

// Client setup
const analyticsApi = honoClient.api.analytics;
const $getUserProgress = (analyticsApi as any).progress["by-user"][":userId"].$get;
const $getQuarterlyTotals = (analyticsApi as any)["quarterly-totals"][
  ":reportingPeriodId"
].$get;

// Type Definitions
type GetUserProgressResponse = InferResponseType<typeof $getUserProgress>;
type GetQuarterlyTotalsResponse = InferResponseType<
  typeof $getQuarterlyTotals
>;

// API Functions
const getUserProgress = async (userId: string) =>
  handleHonoResponse<GetUserProgressResponse>(
    $getUserProgress({ param: { userId } })
  );

const getQuarterlyTotals = async (reportingPeriodId: number) =>
  handleHonoResponse<GetQuarterlyTotalsResponse>(
    $getQuarterlyTotals({
      param: { reportingPeriodId: reportingPeriodId.toString() },
    })
  );

// Query Keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  progress: () => [...dashboardKeys.all, "progress"] as const,
  userProgress: (userId: string) =>
    [...dashboardKeys.progress(), userId] as const,
  totals: () => [...dashboardKeys.all, "totals"] as const,
  quarterlyTotals: (reportingPeriodId: number) =>
    [...dashboardKeys.totals(), "quarterly", reportingPeriodId] as const,
};

// Custom Hooks for Queries
export const useGetUserProgress = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: dashboardKeys.userProgress(userId),
    queryFn: () => getUserProgress(userId),
    enabled: enabled && !!userId,
  });
};

export const useGetQuarterlyTotals = (
  reportingPeriodId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: dashboardKeys.quarterlyTotals(reportingPeriodId),
    queryFn: () => getQuarterlyTotals(reportingPeriodId),
    enabled: enabled && !!reportingPeriodId,
  });
};
