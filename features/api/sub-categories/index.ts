import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";

// Client setup
const subCategoriesApi = honoClient.api["sub-categories"];
const $get = subCategoriesApi.$get;
const $getById = (subCategoriesApi as any)[":id"].$get;
const $getByCategory = (subCategoriesApi as any)["by-category"][":id"].$get;

// Type Definitions
type ListSubCategoriesResponse = InferResponseType<typeof $get>;
type SubCategoryResponse = InferResponseType<typeof $getById>;
type ListSubCategoriesByCategoryResponse = InferResponseType<
  typeof $getByCategory
>;

// API Functions
const listSubCategories = async () =>
  handleHonoResponse<ListSubCategoriesResponse>($get({}));

const getSubCategoryById = async (id: number) =>
  handleHonoResponse<SubCategoryResponse>(
    $getById({ param: { id: id.toString() } })
  );

const listSubCategoriesByCategory = async (id: number) =>
  handleHonoResponse<ListSubCategoriesByCategoryResponse>(
    $getByCategory({ param: { id: id.toString() } })
  );

// Query Keys
export const subCategoriesKeys = {
  all: ["sub-categories"] as const,
  lists: () => [...subCategoriesKeys.all, "list"] as const,
  list: () => [...subCategoriesKeys.lists(), "all"] as const,
  listByCategory: (categoryId: number) =>
    [...subCategoriesKeys.lists(), "by-category", categoryId] as const,
  details: () => [...subCategoriesKeys.all, "detail"] as const,
  detail: (id: number) => [...subCategoriesKeys.details(), id] as const,
};

// Custom Hooks for Queries
export const useListSubCategories = () => {
  return useQuery({
    queryKey: subCategoriesKeys.list(),
    queryFn: listSubCategories,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetSubCategoryById = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: subCategoriesKeys.detail(id),
    queryFn: () => getSubCategoryById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useListSubCategoriesByCategory = (
  categoryId: number,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: subCategoriesKeys.listByCategory(categoryId),
    queryFn: () => listSubCategoriesByCategory(categoryId),
    enabled: enabled && !!categoryId,
  });
};
