import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import React from "react";

// Types for the centralized system
interface ActivityTemplate {
  id: number;
  name: string;
  description: string | null;
  categoryType: string;
  tags: string[];
  isActive: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

interface PlanningCategoryVersion {
  id: number;
  categoryId: number;
  version: number;
  projectId: number;
  facilityType: "hospital" | "health_center";
  code: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  validFrom: string;
  validTo: string | null;
  changeReason: string | null;
}

interface PlanningActivityVersion {
  id: number;
  activityId: number;
  version: number;
  templateId: number | null;
  categoryVersionId: number;
  facilityType: "hospital" | "health_center";
  name: string;
  displayOrder: number;
  isTotalRow: boolean;
  isActive: boolean;
  validFrom: string;
  validTo: string | null;
  config: Record<string, any> | null;
  defaultFrequency: number | null;
  defaultUnitCost: number | null;
  changeReason: string | null;
}

interface ActivityStructure {
  categories: PlanningCategoryVersion[];
  activities: PlanningActivityVersion[];
  templates: ActivityTemplate[];
}

interface CreateActivityTemplateRequest {
  name: string;
  description?: string;
  categoryType: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// API client functions
const planningConfigApi = {
  getActivityStructure: async (params: {
    projectCode?: string;
    projectId?: number;
    facilityType: "hospital" | "health_center";
    version?: number;
    active?: boolean;
  }): Promise<ActivityStructure> => {
    const searchParams = new URLSearchParams();
    
    if (params.projectCode) searchParams.append('projectCode', params.projectCode);
    if (params.projectId) searchParams.append('projectId', params.projectId.toString());
    searchParams.append('facilityType', params.facilityType);
    if (params.version) searchParams.append('version', params.version.toString());
    if (params.active !== undefined) searchParams.append('active', params.active.toString());

    const response = await fetch(`/api/planning-config/activities?${searchParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch activity structure: ${response.statusText}`);
    }
    return response.json();
  },

  getActivityTemplates: async (params?: {
    categoryType?: string;
    tags?: string;
    active?: boolean;
  }): Promise<{ data: ActivityTemplate[] }> => {
    const searchParams = new URLSearchParams();
    
    if (params?.categoryType) searchParams.append('categoryType', params.categoryType);
    if (params?.tags) searchParams.append('tags', params.tags);
    if (params?.active !== undefined) searchParams.append('active', params.active.toString());

    const response = await fetch(`/api/planning-config/templates?${searchParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch activity templates: ${response.statusText}`);
    }
    return response.json();
  },

  createActivityTemplate: async (data: CreateActivityTemplateRequest): Promise<ActivityTemplate> => {
    const response = await fetch('/api/planning-config/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create activity template: ${response.statusText}`);
    }
    return response.json();
  },

  getProjectStructure: async (projectId: number) => {
    const response = await fetch(`/api/admin/planning/projects/${projectId}/structure`);
    if (!response.ok) {
      throw new Error(`Failed to fetch project structure: ${response.statusText}`);
    }
    return response.json();
  },
};

// React hooks for the centralized system

/**
 * Hook to fetch planning activities for a specific project and facility type
 * This replaces the hardcoded constants approach
 */
export const usePlanningActivities = (
  projectCode: string,
  facilityType: "hospital" | "health_center",
  options?: {
    version?: number;
    active?: boolean;
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: ['planning-activities', projectCode, facilityType, options?.version, options?.active],
    queryFn: () => planningConfigApi.getActivityStructure({
      projectCode,
      facilityType,
      version: options?.version,
      active: options?.active,
    }),
    enabled: options?.enabled !== false && !!projectCode && !!facilityType,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 2,
  });
};

/**
 * Hook to fetch activity templates
 * Useful for admin interfaces and activity creation
 */
export const useActivityTemplates = (filters?: {
  categoryType?: string;
  tags?: string;
  active?: boolean;
}) => {
  return useQuery({
    queryKey: ['activity-templates', filters],
    queryFn: () => planningConfigApi.getActivityTemplates(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes cache for templates
  });
};

/**
 * Hook to create new activity templates
 */
export const useCreateActivityTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: planningConfigApi.createActivityTemplate,
    onSuccess: (newTemplate) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['activity-templates'] });
      
      toast.success("Activity template created successfully!", {
        description: `Template "${newTemplate.name}" is now available for use.`
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to create activity template", {
        description: error.message
      });
    },
  });
};

/**
 * Hook to get complete project structure (for admin interfaces)
 */
export const useProjectStructure = (projectId: number, enabled = true) => {
  return useQuery({
    queryKey: ['project-structure', projectId],
    queryFn: () => planningConfigApi.getProjectStructure(projectId),
    enabled: enabled && !!projectId,
    staleTime: 15 * 60 * 1000, // 15 minutes cache for project structure
  });
};

/**
 * Utility hook to get categorized activities (mimics the old constants structure)
 * This provides backward compatibility while using the new centralized system
 */
export const useCategorizedActivities = (
  projectCode: string,
  facilityType: "hospital" | "health_center"
) => {
  const { data, isLoading, error } = usePlanningActivities(projectCode, facilityType);

  const categorizedActivities = React.useMemo(() => {
    if (!data?.categories || !data?.activities) return {};

    const result: Record<string, PlanningActivityVersion[]> = {};
    
    // Group activities by category
    data.categories.forEach(category => {
      const categoryActivities = data.activities.filter(
        activity => activity.categoryVersionId === category.id
      );
      result[category.name] = categoryActivities;
    });

    return result;
  }, [data]);

  const activityCategories = React.useMemo(() => {
    if (!data?.categories) return {};

    const result: Record<string, { code: string; name: string; displayOrder: number }> = {};
    data.categories.forEach(category => {
      result[category.name] = {
        code: category.code,
        name: category.name,
        displayOrder: category.displayOrder,
      };
    });
    return result;
  }, [data]);

  return {
    categorizedActivities,
    activityCategories,
    templates: data?.templates || [],
    isLoading,
    error,
    refetch: () => {
      // Could trigger a refetch if needed
    },
  };
};

/**
 * Hook to generate default activities based on the centralized structure
 * Replaces the hardcoded generateDefaultActivities functions
 */
export const useGenerateDefaultActivities = (
  projectCode: string,
  facilityType: "hospital" | "health_center"
) => {
  const { data } = usePlanningActivities(projectCode, facilityType);

  return React.useMemo(() => {
    if (!data?.activities) return [];

    // Convert centralized activities to form-compatible format
    return data.activities
      .filter(activity => !activity.isTotalRow && activity.isActive)
      .map(activity => ({
        id: activity.id.toString(),
        activityCategory: data.categories.find(cat => cat.id === activity.categoryVersionId)?.name || '',
        typeOfActivity: activity.name,
        activity: activity.name,
        frequency: activity.defaultFrequency || 0,
        unitCost: activity.defaultUnitCost || 0,
        countQ1: 0,
        countQ2: 0,
        countQ3: 0,
        countQ4: 0,
        amountQ1: 0,
        amountQ2: 0,
        amountQ3: 0,
        amountQ4: 0,
        totalBudget: 0,
        comment: '',
        planningActivityId: activity.id,
        planningDataId: undefined,
      }));
  }, [data]);
};

/**
 * Hook for real-time activity updates
 * Could be extended with WebSocket support for collaborative editing
 */
export const useActivityUpdates = (projectCode: string, facilityType: "hospital" | "health_center") => {
  const queryClient = useQueryClient();

  React.useEffect(() => {
    // Placeholder for WebSocket connection
    // const ws = new WebSocket(`ws://localhost:3000/planning-updates/${projectCode}/${facilityType}`);
    
    // ws.onmessage = (event) => {
    //   const update = JSON.parse(event.data);
    //   if (update.type === 'ACTIVITY_STRUCTURE_UPDATED') {
    //     queryClient.invalidateQueries({ 
    //       queryKey: ['planning-activities', projectCode, facilityType] 
    //     });
    //   }
    // };

    // return () => ws.close();

    // For now, just set up periodic refresh for demo
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['planning-activities', projectCode, facilityType] 
      });
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [projectCode, facilityType, queryClient]);
};

// Migration helpers: Provides the old interface using new centralized data

/**
 * Legacy compatibility hook - provides the old constants format
 * Use this for gradual migration from hardcoded constants
 */
export const useLegacyPlanningInterface = (
  projectCode: string,
  facilityType: "hospital" | "health_center"
) => {
  const { categorizedActivities, activityCategories, isLoading, error } = useCategorizedActivities(
    projectCode,
    facilityType
  );

  // Convert to the old constants format for backward compatibility
  const legacyFormat = React.useMemo(() => {
    const result: Record<string, Array<{ activity: string; typeOfActivity: string }>> = {};
    
    Object.entries(categorizedActivities).forEach(([categoryName, activities]) => {
      result[categoryName] = activities.map(activity => ({
        activity: activity.name,
        typeOfActivity: activity.name,
      }));
    });

    return result;
  }, [categorizedActivities]);

  return {
    activities: legacyFormat,
    categories: activityCategories,
    isLoading,
    error,
  };
};

/**
 * Hook that provides the structure for specific program codes (HIV, TB, Malaria)
 * This is backward compatible with the existing program-specific constants
 */
export const useProgramActivities = (
  programCode: 'HIV' | 'TB' | 'MAL',
  facilityType: "hospital" | "health_center"
) => {
  const { data, isLoading, error } = usePlanningActivities(programCode, facilityType);

  // Group activities by category for the specific program
  const programStructure = React.useMemo(() => {
    if (!data?.categories || !data?.activities) return null;

    const structure: Record<string, any> = {};
    
    data.categories.forEach(category => {
      const categoryActivities = data.activities
        .filter(activity => activity.categoryVersionId === category.id && !activity.isTotalRow)
        .map(activity => ({
          activity: activity.name,
          typeOfActivity: activity.name,
          frequency: activity.defaultFrequency || 0,
          unitCost: activity.defaultUnitCost || 0,
        }));
      
      structure[category.code] = categoryActivities;
    });

    return structure;
  }, [data]);

  return {
    activities: programStructure,
    isLoading,
    error,
    refetch: () => {
      // Could implement refetch if needed
    },
  };
};

/**
 * Hook for form validation schema generation based on centralized activities
 */
export const usePlanningValidationSchema = (
  projectCode: string,
  facilityType: "hospital" | "health_center"
) => {
  const { data } = usePlanningActivities(projectCode, facilityType);

  return React.useMemo(() => {
    if (!data?.activities) return null;

    // Generate validation rules based on activity configuration
    const validationRules: Record<string, any> = {};
    
    data.activities.forEach(activity => {
      if (activity.config) {
        const activityKey = `activity_${activity.id}`;
        validationRules[activityKey] = {
          frequency: {
            min: activity.config.minFrequency || 0,
            max: activity.config.maxFrequency || 999999,
          },
          unitCost: {
            min: activity.config.minUnitCost || 0,
            max: activity.config.maxUnitCost || 999999999,
          },
          required: activity.config.required || false,
        };
      }
    });

    return validationRules;
  }, [data]);
};

/**
 * Hook for activity search and filtering
 */
export const useActivitySearch = (
  projectCode: string,
  facilityType: "hospital" | "health_center",
  searchTerm: string = '',
  categoryFilter?: string
) => {
  const { data } = usePlanningActivities(projectCode, facilityType);

  return React.useMemo(() => {
    if (!data?.activities || !searchTerm) return data?.activities || [];

    let filteredActivities = data.activities.filter(activity =>
      activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.changeReason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (categoryFilter) {
      const category = data.categories.find(cat => cat.code === categoryFilter);
      if (category) {
        filteredActivities = filteredActivities.filter(
          activity => activity.categoryVersionId === category.id
        );
      }
    }

    return filteredActivities;
  }, [data, searchTerm, categoryFilter]);
};

/**
 * Export the types for use in other components
 */
export type {
  ActivityTemplate,
  PlanningCategoryVersion,
  PlanningActivityVersion,
  ActivityStructure,
  CreateActivityTemplateRequest,
}; 