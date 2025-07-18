import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { executionApiClient as apiClient } from './client';
import type { Category, SubCategory, Activity, HierarchicalData, MasterDataFilters } from './types';

// Query Keys Factory
export const masterDataKeys = {
  all: ['masterData'] as const,
  categories: () => [...masterDataKeys.all, 'categories'] as const,
  subCategories: (filters?: { categoryId?: number }) => 
    [...masterDataKeys.all, 'subCategories', filters] as const,
  activities: (filters?: MasterDataFilters) => 
    [...masterDataKeys.all, 'activities', filters] as const,
  hierarchical: () => [...masterDataKeys.all, 'hierarchical'] as const,
};

// Categories Hook
export function useCategories(
  options?: UseQueryOptions<{ data: Category[] }, Error>
) {
  return useQuery({
    queryKey: masterDataKeys.categories(),
    queryFn: apiClient.getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes - master data changes rarely
    gcTime: 1000 * 60 * 30, // 30 minutes
    ...options,
  });
}

// Sub-categories Hook
export function useSubCategories(
  filters?: { categoryId?: number },
  options?: UseQueryOptions<{ data: SubCategory[] }, Error>
) {
  return useQuery({
    queryKey: masterDataKeys.subCategories(filters),
    queryFn: () => apiClient.getSubCategories(filters),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    ...options,
  });
}

// Activities Hook
export function useActivities(
  filters?: MasterDataFilters,
  options?: UseQueryOptions<{ data: Activity[] }, Error>
) {
  return useQuery({
    queryKey: masterDataKeys.activities(filters),
    queryFn: () => apiClient.getActivities(filters),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    ...options,
  });
}

// Hierarchical Data Hook
export function useHierarchicalData(
  options?: UseQueryOptions<HierarchicalData, Error>
) {
  return useQuery({
    queryKey: masterDataKeys.hierarchical(),
    queryFn: apiClient.getHierarchicalData,
    staleTime: 1000 * 60 * 15, // 15 minutes for complex hierarchical data
    gcTime: 1000 * 60 * 45, // 45 minutes
    ...options,
  });
}
