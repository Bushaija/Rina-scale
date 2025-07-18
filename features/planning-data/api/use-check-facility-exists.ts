import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";

// ---------------------------------------------
// Client setup – maps to GET /planning-data/exists
// ---------------------------------------------
const planningDataApi = honoClient.api["planning-data"] as any;
const $checkExists = planningDataApi["exists"]["$get"] as (typeof planningDataApi["exists"])["$get"];

// ---------------------------------------------
// Type Definitions
// ---------------------------------------------
export type CheckFacilityExistsQuery = {
  facilityId: string | number;
  projectId: string | number;
  reportingPeriodId: string | number;
};

type CheckFacilityExistsResponse = InferResponseType<typeof $checkExists>;

// ---------------------------------------------
// API Function
// ---------------------------------------------
const checkFacilityExists = async (query: CheckFacilityExistsQuery) =>
  handleHonoResponse<CheckFacilityExistsResponse>($checkExists({ query }));

// ---------------------------------------------
// Query Keys
// ---------------------------------------------
export const planningDataKeys = {
  all: ["planning-data"] as const,
  exists: (query: CheckFacilityExistsQuery) => [
    ...planningDataKeys.all,
    "exists",
    query,
  ] as const,
};

// ---------------------------------------------
// Custom Hook
// ---------------------------------------------
export const useCheckFacilityExists = (
  query: CheckFacilityExistsQuery,
  enabled: boolean = true
) => {
  return useQuery<CheckFacilityExistsResponse, Error>({
    queryKey: planningDataKeys.exists(query),
    queryFn: () => checkFacilityExists(query),
    enabled:
      enabled &&
      !!query.reportingPeriodId &&
      !!query.projectId &&
      !!query.facilityId,
  });
};
