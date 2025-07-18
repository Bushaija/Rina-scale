import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";
import { executionDataKeys } from "../execution-data";

// Client setup
const utilitiesApi = honoClient.api.utilities;
const $deleteExecutionData = (utilitiesApi as any)["execution-data"][":id"]
  .$delete;
const $getRecentActivity = (utilitiesApi as any)["recent-activity"][":userId"]
  .$get;
const $bulkUpsertExecutionData = (utilitiesApi as any)["execution-data"][
  "bulk-upsert"
].$post;

// Type Definitions
type DeleteExecutionDataBody = { userId: string };
type DeleteExecutionDataResponse = { id: number };

type GetRecentActivityParams = { userId: string };
type GetRecentActivityResponse = InferResponseType<typeof $getRecentActivity>;

type BulkUpsertExecutionDataRequest = InferRequestType<
  typeof $bulkUpsertExecutionData
>["json"];
type BulkUpsertExecutionDataResponse = InferResponseType<
  typeof $bulkUpsertExecutionData
>;

// API Functions
const deleteExecutionData = async ({
  id,
  body,
}: {
  id: number;
  body: DeleteExecutionDataBody;
}) => {
  const res = await $deleteExecutionData({
    param: { id: id.toString() },
    json: body,
  });
  if (!res.ok) throw new Error("Failed to delete execution data");
  return (await res.json()) as DeleteExecutionDataResponse;
};

const getRecentActivity = async (params: GetRecentActivityParams) =>
  handleHonoResponse<GetRecentActivityResponse>(
    $getRecentActivity({ param: params })
  );

const bulkUpsertExecutionData = async (
  json: BulkUpsertExecutionDataRequest
) => {
  const res = await $bulkUpsertExecutionData({ json });
  if (!res.ok) throw new Error("Failed to bulk upsert execution data");
  return (await res.json()) as BulkUpsertExecutionDataResponse;
};

// Query Keys
export const utilitiesKeys = {
  all: ["utilities"] as const,
  recentActivity: (userId: string) =>
    [...utilitiesKeys.all, "recent-activity", userId] as const,
};

// Custom Hooks for Queries
export const useGetRecentActivity = (
  userId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: utilitiesKeys.recentActivity(userId),
    queryFn: () => getRecentActivity({ userId }),
    enabled: enabled && !!userId,
  });
};

// Custom Hooks for Mutations
export const useDeleteExecutionData = () => {
  const queryClient = useQueryClient();
  return useMutation<
    DeleteExecutionDataResponse,
    Error,
    { id: number; body: DeleteExecutionDataBody }
  >({
    mutationFn: deleteExecutionData,
    onSuccess: () => {
      toast.success("Execution data deleted successfully");
      queryClient.invalidateQueries({ queryKey: executionDataKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useBulkUpsertExecutionData = () => {
  const queryClient = useQueryClient();
  return useMutation<
    BulkUpsertExecutionDataResponse,
    Error,
    BulkUpsertExecutionDataRequest
  >({
    mutationFn: bulkUpsertExecutionData,
    onSuccess: () => {
      toast.success("Data saved successfully");
      queryClient.invalidateQueries({ queryKey: executionDataKeys.all });
    },
    onError: (error) => toast.error(error.message),
  });
};
