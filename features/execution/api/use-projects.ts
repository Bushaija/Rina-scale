import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from './client';
import type { Project, CreateProject, ProjectFilters } from './types';

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: (filters?: ProjectFilters) => [...projectsKeys.lists(), filters] as const,
};

export function useProjects(
  filters?: ProjectFilters,
  options?: UseQueryOptions<{ data: Project[] }, Error>
) {
  return useQuery({
    queryKey: projectsKeys.list(filters),
    queryFn: () => apiClient.getProjects(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,
    ...options,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createProject,
    onSuccess: () => {
      // Invalidate all project lists
      queryClient.invalidateQueries({
        queryKey: projectsKeys.lists(),
      });
    },
    onError: (error) => {
      console.error('Failed to create project:', error);
    },
  });
}