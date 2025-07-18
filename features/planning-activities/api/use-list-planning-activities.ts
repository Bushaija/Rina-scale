import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType, InferRequestType } from "hono";

// client setup
const planningActivitiesApi = honoClient.api["planning-activities"];
const $get = planningActivitiesApi.$get;

// type definitions
interface PlanningActivity {
    id: number;
    name: string;
    projectId: number;
    // add other fields if needed
}

type ListPlanningActivitiesResponse = { data: PlanningActivity[] };

// API functions
const listPlanningActivities = async () =>
    handleHonoResponse<ListPlanningActivitiesResponse>($get({ query: {} }));

// query keys
export const planningActivitiesKeys = {
    all: ["planning-activities"] as const,
    lists: () => [...planningActivitiesKeys.all, "list"] as const,
    list: () => [...planningActivitiesKeys.lists(), "all"] as const,
};

// custom hooks
export const useListPlanningActivities = () => {
    return useQuery<ListPlanningActivitiesResponse, Error>({
        queryKey: planningActivitiesKeys.list(),
        queryFn: listPlanningActivities,
        staleTime: 5 * 60 * 1000,
    });
};