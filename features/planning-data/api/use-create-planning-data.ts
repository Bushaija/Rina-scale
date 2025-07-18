import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { honoClient } from "@/lib/hono";
import { InferRequestType, InferResponseType } from "hono";

// --------------------------------------------------
// Client setup – maps to POST /planning-data
// --------------------------------------------------
const planningDataApi = honoClient.api["planning-data"];
const $create = planningDataApi.$post;

// --------------------------------------------------
// Type Definitions
// --------------------------------------------------
export type CreatePlanningDataRequest = InferRequestType<typeof $create>["json"];
export type CreatePlanningDataResponse = InferResponseType<typeof $create>;

// --------------------------------------------------
// API Function
// --------------------------------------------------
const createPlanningData = async (json: CreatePlanningDataRequest) => {
  // Strip projectId; server derives it from the planning activity's project association.
  // Keep a local copy for optimistic UI if needed.
  const { projectId: _omit, ...cleanJson } = json as any;

  const res = await $create({ json: cleanJson });
  if (!res.ok) throw new Error("Failed to create planning data");
  return (await res.json()) as CreatePlanningDataResponse;
};

// --------------------------------------------------
// Query Keys (duplicated here to avoid circular deps)
// --------------------------------------------------
export const planningDataKeys = {
  all: ["planning-data"] as const,
  lists: () => [...planningDataKeys.all, "list"] as const,
};

// --------------------------------------------------
// Custom Hook
// --------------------------------------------------
export const useCreatePlanningData = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatePlanningDataResponse, Error, CreatePlanningDataRequest>({
    mutationFn: createPlanningData,
    onSuccess: () => {
      // toast.success("Planning data created successfully");
      queryClient.invalidateQueries({ queryKey: planningDataKeys.lists() });
    },
    onError: (error: any) => {
      if (error?.status === 409 || /already exists/i.test(error?.message)) {
        toast.info(
          "Planning data already exists for this period/activity/facility combination"
        );
      } else {
        toast.error(error.message);
      }
    },
  });
};