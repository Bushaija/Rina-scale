import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";

// --------------------------------------------------
// Client setup – maps to GET /projects/{id}
// --------------------------------------------------
const projectsApi = honoClient.api.projects;
const $getProject = (projectsApi as any)[":id"].$get;

// --------------------------------------------------
// Type definitions
// --------------------------------------------------
export type GetProjectResponse = { id: number };

// --------------------------------------------------
// API function
// --------------------------------------------------
const getProject = async (id: number | string) =>
  handleHonoResponse<GetProjectResponse>(
    $getProject({ param: { id: id.toString() } })
  );

// --------------------------------------------------
// React-Query hook
// --------------------------------------------------
export const useGetProject = (id: number | string, enabled = true) => {
  return useQuery<GetProjectResponse, Error>({
    queryKey: ["projects", "detail", id],
    queryFn: () => getProject(id),
    enabled: enabled && !!id,
  });
};
