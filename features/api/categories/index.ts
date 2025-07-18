import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";

// Client setup
const categoriesApi = honoClient.api.categories;
const $get = categoriesApi.$get;
const $getById = (categoriesApi as any)[":id"].$get;
const $getWithSubCategoryCount = (categoriesApi as any)["with-sub-category-count"]
  .$get;

// Type Definitions
type ListCategoriesResponse = InferResponseType<typeof $get>;
type CategoryResponse = InferResponseType<typeof $getById>;
type ListCategoriesWithSubCategoryCountResponse = InferResponseType<
  typeof $getWithSubCategoryCount
>;

// API Functions
const listCategories = async () =>
  handleHonoResponse<ListCategoriesResponse>($get({}));

const getCategoryById = async (id: number) =>
  handleHonoResponse<CategoryResponse>(
    $getById({ param: { id: id.toString() } })
  );

const listCategoriesWithSubCategoryCount = async () =>
  handleHonoResponse<ListCategoriesWithSubCategoryCountResponse>(
    $getWithSubCategoryCount({})
  );

// Query Keys
export const categoriesKeys = {
  all: ["categories"] as const,
  lists: () => [...categoriesKeys.all, "list"] as const,
  list: () => [...categoriesKeys.lists(), "all"] as const,
  listWithSubCategoryCount: () =>
    [...categoriesKeys.lists(), "with-sub-category-count"] as const,
  details: () => [...categoriesKeys.all, "detail"] as const,
  detail: (id: number) => [...categoriesKeys.details(), id] as const,
};

// Custom Hooks for Queries
export const useListCategories = () => {
  return useQuery({
    queryKey: categoriesKeys.list(),
    queryFn: listCategories,
    staleTime: 5 * 60 * 1000,
  });
};

export const useGetCategoryById = (id: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: categoriesKeys.detail(id),
    queryFn: () => getCategoryById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useListCategoriesWithSubCategoryCount = () => {
  return useQuery({
    queryKey: categoriesKeys.listWithSubCategoryCount(),
    queryFn: listCategoriesWithSubCategoryCount,
    staleTime: 5 * 60 * 1000,
  });
};
