import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";

// Client setup
const executionDataApi = honoClient.api["execution-data"];
const $list = executionDataApi.$get;
const $create = executionDataApi.$post;
const $getById = (executionDataApi as any)[":id"].$get;
const $update = (executionDataApi as any)[":id"].$patch;
const $delete = (executionDataApi as any)[":id"].$delete;
const $getByPeriodAndActivity = (executionDataApi as any)["by-period-activity"].$get;
const $checkExists = (executionDataApi as any)["exists"].$get;

// Type Definitions
type ListExecutionDataQuery = InferRequestType<typeof $list>["query"];
type ListExecutionDataResponse = InferResponseType<typeof $list>;

type GetExecutionDataResponse = InferResponseType<typeof $getById>;

type GetByPeriodAndActivityQuery = {
  reportingPeriodId: string;
  activityId: string;
  facilityId: string;
  projectId: string;
};
type GetByPeriodAndActivityResponse = InferResponseType<
  typeof $getByPeriodAndActivity
>;

type CheckExistsQuery = GetByPeriodAndActivityQuery;
type CheckExistsResponse = InferResponseType<typeof $checkExists>;

type CreateExecutionDataRequest = InferRequestType<typeof $create>["json"];
type CreateExecutionDataResponse = InferResponseType<typeof $create>;

// Inference fails due to deep any-cast path. Define manually.
type UpdateExecutionDataRequest = Partial<CreateExecutionDataRequest>;
type UpdateExecutionDataResponse = CreateExecutionDataResponse;


// API Functions
const listExecutionData = async (query?: ListExecutionDataQuery) =>
  handleHonoResponse<ListExecutionDataResponse>($list({ query: query ?? {} }));

const getExecutionDataById = async (id: number) =>
  handleHonoResponse<GetExecutionDataResponse>(
    $getById({ param: { id: id.toString() } })
  );

const getByPeriodAndActivity = async (query: GetByPeriodAndActivityQuery) =>
    handleHonoResponse<GetByPeriodAndActivityResponse>($getByPeriodAndActivity({ query }));

const checkExists = async (query: CheckExistsQuery) =>
    handleHonoResponse<CheckExistsResponse>($checkExists({ query }));

const createExecutionData = async (json: CreateExecutionDataRequest) => {
  const res = await $create({ json });
  if (!res.ok) throw new Error("Failed to create execution data");
  return (await res.json()) as CreateExecutionDataResponse;
};

const updateExecutionData = async ({ id, json }: { id: number, json: UpdateExecutionDataRequest }) => {
    const res = await $update({ param: { id: id.toString() }, json });
    if (!res.ok) throw new Error("Failed to update execution data");
    return (await res.json()) as UpdateExecutionDataResponse;
};

const deleteExecutionData = async (id: number) => {
    const res = await $delete({ param: { id: id.toString() } });
    if (!res.ok) throw new Error("Failed to delete execution data");
};

// Query Keys
export const executionDataKeys = {
  all: ["execution-data"] as const,
  lists: () => [...executionDataKeys.all, "list"] as const,
  list: (query?: ListExecutionDataQuery) =>
    [...executionDataKeys.lists(), { query }] as const,
  details: () => [...executionDataKeys.all, "detail"] as const,
  detail: (id: number) => [...executionDataKeys.details(), id] as const,
  byPeriodActivity: (query: GetByPeriodAndActivityQuery) => [...executionDataKeys.all, "by-period-activity", query] as const,
  exists: (query: CheckExistsQuery) => [...executionDataKeys.all, "exists", query] as const,
};

// Custom Hooks
export const useListExecutionData = (query?: ListExecutionDataQuery) => {
  return useQuery({
    queryKey: executionDataKeys.list(query),
    queryFn: () => listExecutionData(query),
  });
};

export const useGetExecutionDataById = (id: number, enabled: boolean = true) => {
    return useQuery({
        queryKey: executionDataKeys.detail(id),
        queryFn: () => getExecutionDataById(id),
        enabled: enabled && !!id,
    });
};

export const useGetExecutionDataByPeriodAndActivity = (query: GetByPeriodAndActivityQuery, enabled: boolean = true) => {
    return useQuery({
        queryKey: executionDataKeys.byPeriodActivity(query),
        queryFn: () => getByPeriodAndActivity(query),
        enabled: enabled && !!query.reportingPeriodId && !!query.activityId && !!query.facilityId && !!query.projectId,
    });
};

export const useCheckExecutionDataExists = (query: CheckExistsQuery, enabled: boolean = true) => {
    return useQuery({
        queryKey: executionDataKeys.exists(query),
        queryFn: () => checkExists(query),
        enabled: enabled && !!query.reportingPeriodId && !!query.activityId && !!query.facilityId && !!query.projectId,
    });
};

export const useCreateExecutionData = () => {
  const queryClient = useQueryClient();
  return useMutation<
    CreateExecutionDataResponse,
    Error,
    CreateExecutionDataRequest
  >({
    mutationFn: createExecutionData,
    onSuccess: () => {
      // toast.success("Execution data created successfully");
      queryClient.invalidateQueries({ queryKey: executionDataKeys.lists() });
    },
    onError: (error: any) => {
      // If the backend returns a 409 we assume it's a duplicate entry
      if (error?.status === 409 || /already exists/i.test(error?.message)) {
        toast.info("Some activities have already been executed and were skipped.");
      } else {
        toast.error(error.message);
      }
    },
  });
};

export const useUpdateExecutionData = () => {
    const queryClient = useQueryClient();
    return useMutation<
        UpdateExecutionDataResponse,
        Error,
        { id: number, json: UpdateExecutionDataRequest }
    >({
        mutationFn: updateExecutionData,
        onSuccess: (data) => {
            toast.success("Execution data updated successfully");
            queryClient.invalidateQueries({ queryKey: executionDataKeys.lists() });
        },
        onError: (error) => toast.error(error.message),
    });
};

export const useDeleteExecutionData = () => {
    const queryClient = useQueryClient();
    return useMutation<
        void,
        Error,
        number
    >({
        mutationFn: deleteExecutionData,
        onSuccess: () => {
            toast.success("Execution data deleted successfully");
            queryClient.invalidateQueries({ queryKey: executionDataKeys.lists() });
        },
        onError: (error) => toast.error(error.message),
    });
};
