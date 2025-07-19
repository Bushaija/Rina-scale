import React from "react";
import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";
// Import Activity types from all programs
import { Activity as HIVActivity } from "@/features/planning/schema/hiv/plan-form-schema";
import { Activity as MalariaActivity } from "@/features/planning/schema/malaria/plan-form-schema";
import { Activity as TBActivity } from "@/features/planning/schema/tb/plan-form-schema";
import { PlanMetadata } from "@/features/planning/types";
import { usePlanningActivities } from "@/features/planning-config/api/use-planning-activities";

// Union type for all Activity types
type Activity = HIVActivity | MalariaActivity | TBActivity;

// ---------------------------------------------
// Client setup – maps to GET /planning-activities/by-facility/{facilityId}
// ---------------------------------------------
const planningActivitiesApi = honoClient.api["planning-activities"] as any;
const $getPlanningByFacilityId = planningActivitiesApi["by-facility"][":facilityId"]["$get"] as (typeof planningActivitiesApi["by-facility"][":facilityId"])["$get"];

// ---------------------------------------------
// Type Definitions
// ---------------------------------------------
export type GetPlanningByFacilityIdParams = {
  facilityId: string | number;
  program?: string;
  reportingPeriod?: number;
  projectCode?: string;
};

type GetPlanningByFacilityIdResponse = InferResponseType<typeof $getPlanningByFacilityId>;

export interface PlanData {
  metadata: PlanMetadata;
  activities: Activity[];
}

// ---------------------------------------------
// Helper function to transform API response
// ---------------------------------------------

export const transformPlanningDataResponse = (
  apiResponse: any,
  facilityId: string | number,
  completeActivityStructure?: any // Add parameter for complete activity structure
): PlanData => {
  console.log('🐛 Transform - Raw API Response:', {
    hasData: !!apiResponse?.data,
    dataLength: apiResponse?.data?.length || 0,
    firstItem: apiResponse?.data?.[0],
    facilityId,
    hasCompleteStructure: !!completeActivityStructure
  });

  if (!apiResponse || !apiResponse.data || apiResponse.data.length === 0) {
    // If we have complete activity structure but no saved data, show all activities with defaults
    if (completeActivityStructure && completeActivityStructure.activities) {
      const activities = completeActivityStructure.activities
        .filter((activity: any) => !activity.isTotalRow && activity.isActive)
        .map((activity: any) => {
          const categoryName = completeActivityStructure.categories.find(
            (cat: any) => cat.id === activity.categoryVersionId
          )?.name || '';
          
          return {
            activityCategory: categoryName,
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
          };
        });

      return {
        metadata: {
          facilityName: `Facility ${facilityId}`,
          facilityType: facilityId === '1' || facilityId === 1 ? "Hospital" : "Health Center",
          district: `District ${facilityId}`,
          province: "Central Province",
          period: "2024-2025",
          program: "HIV Program",
          submittedBy: "Jane Doe",
          createdBy: "John Smith",
          status: 'draft',
        },
        activities
      };
    }
    
    // Return empty structure if no data and no complete structure
    return {
      metadata: {
        facilityName: `Facility ${facilityId}`,
        facilityType: facilityId === '1' || facilityId === 1 ? "Hospital" : "Health Center",
        district: `District ${facilityId}`,
        province: "Central Province",
        period: "2024-2025",
        program: "HIV Program",
        submittedBy: "Jane Doe",
        createdBy: "John Smith",
        status: 'draft',
      },
      activities: []
    };
  }

  // Get basic info from first item for metadata
  const firstItem = apiResponse.data[0];
  const facilityType = firstItem?.facilityType || (facilityId === '1' || facilityId === 1 ? "hospital" : "health_center");
  
  console.log('🐛 Transform - API Data:', {
    dataLength: apiResponse.data.length,
    firstItem: {
      categoryName: firstItem?.categoryName,
      activityName: firstItem?.activityName,
      projectName: firstItem?.projectName,
      facilityType: firstItem?.facilityType
    }
  });

  // Create a map of saved activities by activityId for quick lookup
  const savedActivitiesMap = new Map();
  apiResponse.data.forEach((item: any) => {
    savedActivitiesMap.set(item.activityId, item);
  });

  // Transform the planning data into the format expected by the frontend
  let activities: Activity[] = [];

  if (completeActivityStructure && completeActivityStructure.activities) {
    // Merge complete activity structure with saved data
    activities = completeActivityStructure.activities
      .filter((activity: any) => !activity.isTotalRow && activity.isActive)
      .map((activity: any) => {
        const savedData = savedActivitiesMap.get(activity.id);
        const categoryName = completeActivityStructure.categories.find(
          (cat: any) => cat.id === activity.categoryVersionId
        )?.name || '';
        
        if (savedData) {
          // Activity was saved - use saved data with defaults for missing values
          return {
            activityCategory: categoryName,
            typeOfActivity: activity.name,
            activity: activity.name,
            frequency: savedData.frequency ? parseFloat(savedData.frequency) : 0,
            unitCost: savedData.unitCost ? parseFloat(savedData.unitCost) : 0,
            countQ1: savedData.countQ1 ? parseFloat(savedData.countQ1) : 0,
            countQ2: savedData.countQ2 ? parseFloat(savedData.countQ2) : 0,
            countQ3: savedData.countQ3 ? parseFloat(savedData.countQ3) : 0,
            countQ4: savedData.countQ4 ? parseFloat(savedData.countQ4) : 0,
            amountQ1: parseFloat(savedData.amountQ1) || 0,
            amountQ2: parseFloat(savedData.amountQ2) || 0,
            amountQ3: parseFloat(savedData.amountQ3) || 0,
            amountQ4: parseFloat(savedData.amountQ4) || 0,
            totalBudget: parseFloat(savedData.totalBudget) || 0,
            comment: savedData.comment || '',
            planningActivityId: activity.id,
            planningDataId: savedData.planningDataId,
          };
        } else {
          // Activity was not saved - create with default values
          return {
            activityCategory: categoryName,
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
            planningDataId: undefined, // No saved data for this activity
          };
        }
      });
  } else {
    // Fallback to original behavior if no complete structure provided
    activities = apiResponse.data.map((item: any) => {
      const categoryName = item.categoryName || '';
      const activityName = item.activityName || '';
      
      return {
        activityCategory: categoryName,
        typeOfActivity: activityName,
        activity: activityName,
        frequency: item.frequency ? parseFloat(item.frequency) : 0,
        unitCost: item.unitCost ? parseFloat(item.unitCost) : 0,
        countQ1: item.countQ1 ? parseFloat(item.countQ1) : 0,
        countQ2: item.countQ2 ? parseFloat(item.countQ2) : 0,
        countQ3: item.countQ3 ? parseFloat(item.countQ3) : 0,
        countQ4: item.countQ4 ? parseFloat(item.countQ4) : 0,
        amountQ1: parseFloat(item.amountQ1) || 0,
        amountQ2: parseFloat(item.amountQ2) || 0,
        amountQ3: parseFloat(item.amountQ3) || 0,
        amountQ4: parseFloat(item.amountQ4) || 0,
        totalBudget: parseFloat(item.totalBudget) || 0,
        comment: item.comment || '',
        planningActivityId: item.activityId,
        planningDataId: item.planningDataId,
      };
    });
  }

  // Get metadata from the first item or use defaults
  const metadata: PlanMetadata = {
    facilityName: firstItem ? `Facility ${firstItem.facilityId}` : `Facility ${facilityId}`,
    facilityType: firstItem?.facilityType || (facilityId === '1' || facilityId === 1 ? "Hospital" : "Health Center"),
    district: `District ${facilityId}`,
    province: "Central Province",
    period: "2024-2025",
    program: firstItem?.projectName || "HIV Program",
    submittedBy: "Jane Doe",
    createdBy: "John Smith",
    status: 'draft',
  };

  console.log('🐛 Transform - Final Result:', {
    activitiesCount: activities.length,
    program: metadata.program,
    facilityType: metadata.facilityType,
    firstActivity: activities[0],
    metadata,
    hasCompleteStructure: !!completeActivityStructure
  });

  return { metadata, activities };
};

// ---------------------------------------------
// API Function
// ---------------------------------------------
const getPlanningByFacilityId = async (params: GetPlanningByFacilityIdParams) => {
  const queryParams: Record<string, string> = {};
  
  if (params.program) {
    queryParams.program = params.program;
  }
  if (params.reportingPeriod) {
    queryParams.reportingPeriod = params.reportingPeriod.toString();
  }
  if (params.projectCode) {
    queryParams.projectCode = params.projectCode;
  }

  console.log('🔗 API Call Parameters:', { 
    facilityId: params.facilityId, 
    queryParams 
  });

  return handleHonoResponse<GetPlanningByFacilityIdResponse>(
    $getPlanningByFacilityId({ 
      param: { 
        facilityId: params.facilityId.toString() 
      },
      query: queryParams
    })
  );
};

// ---------------------------------------------
// Query Keys
// ---------------------------------------------
export const planningByFacilityKeys = {
  all: ["planning-by-facility"] as const,
  byFacility: (facilityId: string | number) => [
    ...planningByFacilityKeys.all,
    "facility",
    facilityId,
  ] as const,
};

// ---------------------------------------------
// Custom Hook
// ---------------------------------------------
export const useGetPlanningByFacilityId = (
  facilityId: string | number | null | undefined,
  enabled: boolean = true,
  filters?: { program?: string; reportingPeriod?: number; projectCode?: string }
) => {
  return useQuery<GetPlanningByFacilityIdResponse, Error>({
    queryKey: [...planningByFacilityKeys.byFacility(facilityId || ""), filters],
    queryFn: () => getPlanningByFacilityId({ 
      facilityId: facilityId!, 
      ...filters 
    }),
    enabled: enabled && !!facilityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

// ---------------------------------------------
// Custom Hook with Transformed Data
// ---------------------------------------------
export const useGetPlanDataByFacilityId = (
  facilityId: string | number | null | undefined,
  enabled: boolean = true,
  filters?: { program?: string; reportingPeriod?: number; projectCode?: string; facilityType?: string }
) => {
  const query = useGetPlanningByFacilityId(facilityId, enabled, filters);
  
  // Map program filter to project code for activity structure
  const getProjectCodeFromProgram = (program?: string): string => {
    if (!program) return 'HIV';
    switch (program.toLowerCase()) {
      case 'malaria':
      case 'mal':
        return 'MAL';
      case 'tb':
        return 'TB';
      default:
        return 'HIV';
    }
  };

  const projectCode = getProjectCodeFromProgram(filters?.program);
  
  // Determine facility type from filter or fallback to guessing
  const facilityType = filters?.facilityType === 'hospital' ? 'hospital' : 'health_center';
  
  // Fetch complete activity structure for the program
  const { data: activityStructure } = usePlanningActivities(
    projectCode,
    facilityType,
    { enabled: enabled && !!facilityId }
  );
  
  const transformedData = React.useMemo(() => {
    if (!(query as any).data || !facilityId) return null;
    return transformPlanningDataResponse((query as any).data, facilityId, activityStructure);
  }, [query.data, facilityId, activityStructure]);

  return {
    ...query,
    data: transformedData,
  };
};
