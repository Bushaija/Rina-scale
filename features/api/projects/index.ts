import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";

// Client setup
const projectsApi = honoClient.api.projects;
const $get = projectsApi.$get;
const $post = projectsApi.$post;
const $listUserProjects = (projectsApi as any)["by-user"][":userId"].$get;
const $checkProjectExists = (projectsApi as any).exists.$get;
const $updateProjectStatus = (projectsApi as any)[":id"].status.$patch;

// Type Definitions
type ListProjectsQuery = InferRequestType<typeof $get>["query"];
type ListProjectsResponse = InferResponseType<typeof $get>;

type CreateProjectRequest = InferRequestType<typeof $post>["json"];
type CreateProjectResponse = InferResponseType<typeof $post>;

type ListUserProjectsParams = { userId: string };
type ListUserProjectsResponse = InferResponseType<typeof $listUserProjects>;

type CheckProjectExistsQuery = {
  facilityId: string;
  reportingPeriodId: string;
  userId: string;
};
type CheckProjectExistsResponse = InferResponseType<typeof $checkProjectExists>;

type UpdateProjectStatusParams = { id: string };
type UpdateProjectStatusBody = {
  status: "ACTIVE" | "INACTIVE" | "COMPLETED";
  userId: number;
};
type UpdateProjectStatusResponse = { id: number; status: string };

// API Functions
const listProjects = async (query?: ListProjectsQuery) =>
  handleHonoResponse<ListProjectsResponse>($get({ query }));

const createProject = async (json: CreateProjectRequest) => {
  const res = await $post({ json });
  if (!res.ok) {
    throw new Error("Failed to create project");
  }
  return (await res.json()) as CreateProjectResponse;
};

const listUserProjects = async (params: ListUserProjectsParams) =>
  handleHonoResponse<ListUserProjectsResponse>($listUserProjects({ param: params }));

const checkProjectExists = async (query: CheckProjectExistsQuery) =>
  handleHonoResponse<CheckProjectExistsResponse>($checkProjectExists({ query }));

const updateProjectStatus = async ({
  params,
  json,
}: {
  params: UpdateProjectStatusParams;
  json: UpdateProjectStatusBody;
}) => {
  const res = await $updateProjectStatus({ param: params, json });
  if (!res.ok) {
    throw new Error("Failed to update project status");
  }
  return (await res.json()) as UpdateProjectStatusResponse;
};

// Query Keys
export const projectsKeys = {
  all: ["projects"] as const,
  lists: () => [...projectsKeys.all, "list"] as const,
  list: (query?: ListProjectsQuery) =>
    [...projectsKeys.lists(), { query }] as const,
  details: () => [...projectsKeys.all, "detail"] as const,
  detail: (id: number) => [...projectsKeys.details(), id] as const,
  userProjects: (userId: number) =>
    [...projectsKeys.lists(), "user", userId] as const,
  exists: (query: CheckProjectExistsQuery) =>
    [...projectsKeys.all, "exists", { query }] as const,
};

// Custom Hooks
export const useListProjects = (query?: ListProjectsQuery) => {
  return useQuery({
    queryKey: projectsKeys.list(query),
    queryFn: () => listProjects(query),
    staleTime: 5 * 60 * 1000,
  });
};

export const useListUserProjects = (userId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: projectsKeys.userProjects(userId),
    queryFn: () => listUserProjects({ userId: userId.toString() }),
    enabled: enabled && !!userId,
  });
};

export const useCheckProjectExists = (
  query: CheckProjectExistsQuery,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: projectsKeys.exists(query),
    queryFn: () => checkProjectExists(query),
    enabled,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateProjectResponse, Error, CreateProjectRequest>({
    mutationFn: createProject,
    onSuccess: () => {
      toast.success("Project created successfully");
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<
    UpdateProjectStatusResponse,
    Error,
    { params: UpdateProjectStatusParams; json: UpdateProjectStatusBody }
  >({
    mutationFn: updateProjectStatus,
    onSuccess: (data) => {
      toast.success("Project status updated successfully");
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(data.id) });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
