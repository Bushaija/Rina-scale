import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";

// --------------------------------------------------
// Client setup – maps to GET /projects
// --------------------------------------------------
const projectsApi = honoClient.api.projects;
const $listProjects = projectsApi.$get;

// --------------------------------------------------
// Type definitions
// --------------------------------------------------
export type ListProjectsResponse = InferResponseType<typeof $listProjects>;
export type Project = {
  id: number;
  name: string;
  code: string;
  status: string | null;
  facilityId: number | null;
  reportingPeriodId: number | null;
  userId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  facility: {
    id: number;
    name: string;
    facilityType: string;
  } | null;
  reportingPeriod: {
    id: number;
    year: number;
    periodType: string | null;
  } | null;
  user: {
    id: number;
    name: string;
  } | null;
};

// --------------------------------------------------
// Query parameters
// --------------------------------------------------
export type ListProjectsParams = {
  facilityId?: number;
  status?: "ACTIVE" | "INACTIVE" | "COMPLETED";
};

// --------------------------------------------------
// API function
// --------------------------------------------------
const listProjects = async (params?: ListProjectsParams) => {
  const queryParams: Record<string, string> = {};
  
  if (params?.facilityId) {
    queryParams.facilityId = params.facilityId.toString();
  }
  if (params?.status) {
    queryParams.status = params.status;
  }

  return handleHonoResponse<ListProjectsResponse>(
    $listProjects({ 
      query: queryParams
    })
  );
};

// --------------------------------------------------
// React-Query hook
// --------------------------------------------------
export const useListProjects = (params?: ListProjectsParams, enabled = true) => {
  return useQuery<ListProjectsResponse, Error>({
    queryKey: ["projects", "list", params],
    queryFn: () => listProjects(params),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}; 