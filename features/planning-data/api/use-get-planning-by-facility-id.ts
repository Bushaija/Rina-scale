import React from "react";
import { useQuery } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";
// Import Activity types from all programs
import { Activity as HIVActivity } from "@/features/planning/schema/hiv/plan-form-schema";
import { Activity as MalariaActivity } from "@/features/planning/schema/malaria/plan-form-schema";
import { Activity as TBActivity } from "@/features/planning/schema/tb/plan-form-schema";
import { PlanMetadata } from "@/features/planning/types";

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
  facilityId: string | number
): PlanData => {
  console.log('🐛 Transform - Raw API Response:', {
    hasData: !!apiResponse?.data,
    dataLength: apiResponse?.data?.length || 0,
    firstItem: apiResponse?.data?.[0],
    facilityId
  });

  if (!apiResponse || !apiResponse.data || apiResponse.data.length === 0) {
    // Return empty structure if no data
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

  // Transform the planning data into the format expected by the frontend
  const activities: Activity[] = apiResponse.data.map((item: any) => {
    // Use the API data directly - no need for hardcoded mappings anymore
    const categoryName = item.categoryName || '';
    const activityName = item.activityName || '';
    
    return {
      activityCategory: categoryName,
      typeOfActivity: activityName,
      activity: activityName, // Use activityName as the description
      frequency: item.frequency ? parseFloat(item.frequency) : undefined,
      unitCost: item.unitCost ? parseFloat(item.unitCost) : undefined,
      countQ1: item.countQ1 || 0,
      countQ2: item.countQ2 || 0,
      countQ3: item.countQ3 || 0,
      countQ4: item.countQ4 || 0,
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
    metadata
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
  filters?: { program?: string; reportingPeriod?: number; projectCode?: string }
) => {
  const query = useGetPlanningByFacilityId(facilityId, enabled, filters);
  
  const transformedData = React.useMemo(() => {
    if (!(query as any).data || !facilityId) return null;
    return transformPlanningDataResponse((query as any).data, facilityId);
  }, [query.data, facilityId]);

  return {
    ...query,
    data: transformedData,
  };
};
