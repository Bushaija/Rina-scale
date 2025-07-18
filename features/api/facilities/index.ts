import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";

// Client setup
const facilitiesApi = honoClient.api.facilities;
const $get = facilitiesApi.$get;
const $getById = (facilitiesApi as any)[":id"].$get;
const $getByDistrict = (facilitiesApi as any)["by-district"].$get;
const $getByName = (facilitiesApi as any)["by-name"].$get;

// Type Definitions
type FacilitiesResponse = InferResponseType<typeof $get>;
type FacilityResponse = InferResponseType<typeof $getById>;
type FacilitiesByDistrictResponse = InferResponseType<typeof $getByDistrict>;
export type FacilityByNameResponse = InferResponseType<typeof $getByName>;

// API Functions
const getFacilities = async () =>
  handleHonoResponse<FacilitiesResponse>($get({}));

const getFacilityById = async (id: number) =>
  handleHonoResponse<FacilityResponse>($getById({ param: { id: id.toString() } }));

const getFacilitiesByDistrict = async (districtId: number) =>
  handleHonoResponse<FacilitiesByDistrictResponse>(
    $getByDistrict({ query: { districtId: districtId.toString() } })
  );

const getFacilityByName = async (facilityName: string) =>
  handleHonoResponse<FacilityByNameResponse>(
    $getByName({ query: { facilityName } })
  );

// Query Keys
export const facilitiesKeys = {
    all: ["facilities"] as const,
    lists: () => [...facilitiesKeys.all, 'list'] as const,
    listAll: () => [...facilitiesKeys.lists(), 'all'] as const, 
    listByDistrict: (districtId: number) => [...facilitiesKeys.lists(), 'by-district', districtId] as const,

    details: () => [...facilitiesKeys.all, 'detail'] as const,
    detailById: (id: number) => [...facilitiesKeys.details(), 'id', id] as const,
    detailByName: (name: string) => [...facilitiesKeys.details(), 'name', name] as const,
};


// Custom Hooks for Queries
export const useGetFacilities = () => {
  return useQuery({
    queryKey: facilitiesKeys.listAll(),
    queryFn: getFacilities,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useGetFacilityById = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: facilitiesKeys.detailById(id),
    queryFn: () => getFacilityById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetFacilitiesByDistrict = (districtId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: facilitiesKeys.listByDistrict(districtId),
    queryFn: () => getFacilitiesByDistrict(districtId),
    enabled: enabled && !!districtId,
  });
};

export const useGetFacilityByName = (
  facilityName: string,
  enabled: boolean = true
) => {
  return useQuery<FacilityByNameResponse>({
    queryKey: facilitiesKeys.detailByName(facilityName),
    queryFn: () => getFacilityByName(facilityName),
    enabled: enabled && !!facilityName,
    staleTime: 5 * 60 * 1000,
  });
};
