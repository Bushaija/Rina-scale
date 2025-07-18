import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";

// Client setup
const districtsApi = honoClient.api.districts;
const $list = districtsApi.$get;
const $getById = (districtsApi as any)[":id"].$get;

// Type Definitions
type ListDistrictsResponse = InferResponseType<typeof $list>;
type DistrictResponse = InferResponseType<typeof $getById>;

// API Functions
const listDistricts = async () =>
  handleHonoResponse<ListDistrictsResponse>($list({}));

const getDistrictById = async (id: number) =>
  handleHonoResponse<DistrictResponse>(
    $getById({ param: { id: id.toString() } })
  );

// Query Keys
export const districtsKeys = {
  all: ["districts"] as const,
  lists: () => [...districtsKeys.all, "list"] as const,
  list: () => [...districtsKeys.lists(), "all"] as const,
  details: () => [...districtsKeys.all, "detail"] as const,
  detail: (id: number) => [...districtsKeys.details(), id] as const,
};

// Custom Hooks for Queries
export const useListDistricts = () => {
  return useQuery({
    queryKey: districtsKeys.list(),
    queryFn: listDistricts,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  });
};

export const useGetDistrictById = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: districtsKeys.detail(id),
    queryFn: () => getDistrictById(id),
    enabled: enabled && !!id,
    staleTime: 24 * 60 * 60 * 1000,
  });
};
