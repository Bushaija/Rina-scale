import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";

// ---------------------------------------------
// Client setup
// ---------------------------------------------
const plannedFacilitiesApi = honoClient.api["planning"];
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const $get = plannedFacilitiesApi.$get;

// ---------------------------------------------
// Type Definitions
// ---------------------------------------------
type PlannedFacilitiesResponse = InferResponseType<typeof $get>;

// ---------------------------------------------
// API Function
// ---------------------------------------------
const getPlannedFacilities = async () =>
  handleHonoResponse<PlannedFacilitiesResponse>($get({}));

// ---------------------------------------------
// Query Keys
// ---------------------------------------------
export const plannedFacilitiesKeys = {
  all: ["planning"] as const,
  lists: () => [...plannedFacilitiesKeys.all, "list"] as const,
  list: () => [...plannedFacilitiesKeys.lists(), "all"] as const,
};

// ---------------------------------------------
// Custom Hook
// ---------------------------------------------
export const useGetPlannedFacilities = () => {
  return useQuery<PlannedFacilitiesResponse, Error>({
    queryKey: plannedFacilitiesKeys.list(),
    queryFn: getPlannedFacilities,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
