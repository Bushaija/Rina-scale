import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";

// Client setup
const executionReportingApi = honoClient.api["execution-reporting"];
const $getComprehensiveReport = (executionReportingApi as any)["by-period"][":reportingPeriodId"].$get;
const $getCategorySummary = (executionReportingApi as any)["summary"]["by-category"][":reportingPeriodId"].$get;
const $getUserExecutionData = (executionReportingApi as any)["by-user"][":userId"]["by-period"][":reportingPeriodId"].$get;

// Type Definitions
type GetComprehensiveReportResponse = InferResponseType<typeof $getComprehensiveReport>;
type GetCategorySummaryResponse = InferResponseType<typeof $getCategorySummary>;
type GetUserExecutionDataResponse = InferResponseType<typeof $getUserExecutionData>;

type UserExecutionDataParams = {
  userId: string;
  reportingPeriodId: number;
};

// API Functions
const getComprehensiveReport = async (reportingPeriodId: number) =>
  handleHonoResponse<GetComprehensiveReportResponse>(
    $getComprehensiveReport({ param: { reportingPeriodId: reportingPeriodId.toString() } })
  );

const getCategorySummary = async (reportingPeriodId: number) =>
  handleHonoResponse<GetCategorySummaryResponse>(
    $getCategorySummary({ param: { reportingPeriodId: reportingPeriodId.toString() } })
  );

const getUserExecutionData = async ({
  userId,
  reportingPeriodId,
}: UserExecutionDataParams) =>
  handleHonoResponse<GetUserExecutionDataResponse>(
    $getUserExecutionData({
      param: { userId, reportingPeriodId: reportingPeriodId.toString() },
    })
  );

// Query Keys
export const executionReportingKeys = {
  all: ["execution-reporting"] as const,
  reports: () => [...executionReportingKeys.all, "reports"] as const,
  comprehensive: (reportingPeriodId: number) =>
    [...executionReportingKeys.reports(), "comprehensive", reportingPeriodId] as const,
  categorySummary: (reportingPeriodId: number) =>
    [...executionReportingKeys.reports(), "category-summary", reportingPeriodId] as const,
  userExecutionData: (params: UserExecutionDataParams) =>
    [...executionReportingKeys.reports(), "user-execution-data", params] as const,
};

// Custom Hooks for Queries
export const useGetComprehensiveReport = (
  reportingPeriodId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: executionReportingKeys.comprehensive(reportingPeriodId),
    queryFn: () => getComprehensiveReport(reportingPeriodId),
    enabled: enabled && !!reportingPeriodId,
  });
};

export const useGetCategorySummary = (
  reportingPeriodId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: executionReportingKeys.categorySummary(reportingPeriodId),
    queryFn: () => getCategorySummary(reportingPeriodId),
    enabled: enabled && !!reportingPeriodId,
  });
};

export const useGetUserExecutionData = (
  params: UserExecutionDataParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: executionReportingKeys.userExecutionData(params),
    queryFn: () => getUserExecutionData(params),
    enabled: enabled && !!params.userId && !!params.reportingPeriodId,
  });
};
