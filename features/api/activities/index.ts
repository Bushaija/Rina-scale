import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType, InferRequestType } from "hono";

// Client setup
const activitiesApi = honoClient.api.activities;
const $get = activitiesApi.$get;
const $getById = (activitiesApi as any)[":id"].$get;
const $getByCategory = (activitiesApi as any)["by-category"][":id"].$get;
const $getByCategoryNoTotals = (activitiesApi as any)["by-category"][":id"]["no-totals"].$get;

// Type Definitions
type ListActivitiesResponse = InferResponseType<typeof $get>;
type ActivityResponse = InferResponseType<typeof $getById>;
// Manual type since inference fails due to deep path casting
type ListActivitiesByCategoryQuery = {
  subCategoryId?: string;
};
type ListActivitiesByCategoryResponse = InferResponseType<typeof $getByCategory>;
type ListActivitiesByCategoryNoTotalsResponse = InferResponseType<typeof $getByCategoryNoTotals>;

// API Functions
const listActivities = async () =>
  handleHonoResponse<ListActivitiesResponse>(
    $get({ query: {} })
  );

const getActivityById = async (id: number) =>
  handleHonoResponse<ActivityResponse>($getById({ param: { id: id.toString() } }));

const listActivitiesByCategory = async (
  id: number,
  query?: ListActivitiesByCategoryQuery
) =>
  handleHonoResponse<ListActivitiesByCategoryResponse>(
    $getByCategory({ param: { id: id.toString() }, query })
  );

const listActivitiesByCategoryNoTotals = async (id: number) =>
  handleHonoResponse<ListActivitiesByCategoryNoTotalsResponse>(
    $getByCategoryNoTotals({ param: { id: id.toString() } })
  );

// Query Keys
export const activitiesKeys = {
  all: ["activities"] as const,
  lists: () => [...activitiesKeys.all, "list"] as const,
  list: () => [...activitiesKeys.lists(), "all"] as const,
  listByCategory: (categoryId: number, query?: ListActivitiesByCategoryQuery) =>
    [...activitiesKeys.lists(), "by-category", categoryId, { query }] as const,
  listByCategoryNoTotals: (categoryId: number) =>
    [...activitiesKeys.lists(), "by-category", categoryId, "no-totals"] as const,
  details: () => [...activitiesKeys.all, "detail"] as const,
  detail: (id: number) => [...activitiesKeys.details(), id] as const,
};

// Custom Hooks for Queries
export const useListActivities = () => {
  return useQuery({
    queryKey: activitiesKeys.list(),
    queryFn: listActivities,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetActivityById = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: activitiesKeys.detail(id),
    queryFn: () => getActivityById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useListActivitiesByCategory = (
  categoryId: number,
  query?: ListActivitiesByCategoryQuery,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: activitiesKeys.listByCategory(categoryId, query),
    queryFn: () => listActivitiesByCategory(categoryId, query),
    enabled: enabled && !!categoryId,
  });
};

export const useListActivitiesByCategoryNoTotals = (
  categoryId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: activitiesKeys.listByCategoryNoTotals(categoryId),
    queryFn: () => listActivitiesByCategoryNoTotals(categoryId),
    enabled: enabled && !!categoryId,
  });
};
