import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { honoClient } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";

// --------------------------------------------------
// Client setup – maps to PATCH /planning-data/:id
// --------------------------------------------------
const planningDataApi = honoClient.api["planning-data"] as any;
const $update = planningDataApi[":id"]?.$patch as any;

// --------------------------------------------------
// Type Definitions
// --------------------------------------------------
export type UpdatePlanningDataRequest = Record<string, any>;
export type UpdatePlanningDataResponse = any;

// --------------------------------------------------
// API Function
// --------------------------------------------------
const updatePlanningData = async ({ id, json }: { id: number; json: UpdatePlanningDataRequest }) => {
  const res = await $update({ param: { id: id.toString() }, json });
  if (!res.ok) throw new Error("Failed to update planning data");
  return (await res.json()) as UpdatePlanningDataResponse;
};

// --------------------------------------------------
// Query Keys (duplicated)
// --------------------------------------------------
export const planningDataKeys = {
  all: ["planning-data"] as const,
  lists: () => [...planningDataKeys.all, "list"] as const,
  details: () => [...planningDataKeys.all, "detail"] as const,
  detail: (id: number) => [...planningDataKeys.details(), id] as const,
};

// --------------------------------------------------
// Custom Hook
// --------------------------------------------------
export const useUpdatePlanningData = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdatePlanningDataResponse,
    Error,
    { id: number; json: UpdatePlanningDataRequest }
  >({
    mutationFn: updatePlanningData,
    onSuccess: () => {
      // toast.success("Planning data updated successfully");
      queryClient.invalidateQueries({ queryKey: planningDataKeys.lists() });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
