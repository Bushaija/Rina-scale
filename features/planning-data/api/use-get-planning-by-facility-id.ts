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

// Map API category names to frontend category names by program
const hivCategoryNameMap: Record<string, string> = {
  "Human Resources": "Human Resources (HR)",
  "Travel Related Costs": "Travel Related Costs (TRC)", 
  "Health Products & Equipment": "Health Products & Equipment (HPE)",
  "Program Administration Costs": "Program Administration Costs (PA)"
};

const malariaCategoryNameMap: Record<string, string> = {
  "Epidemiology": "Epidemiology",
  "Program Management": "Program Management",
  "Human Resources": "Human Resources"
};

const tbCategoryNameMap: Record<string, string> = {
  "Human Resources": "Human Resources (HR)",
  "Travel Related Costs": "Travel Related Costs (TRC)",
  "Program Administration Costs": "Program Administration Costs (PA)"
};

// Map typeOfActivity to the correct activity description expected by the constants
// Separate maps for health centers and hospitals to avoid conflicts

const hivHealthCenterActivityDescriptionMap: Record<string, string> = {
  // Human Resources (HR)
  "HC Nurses (A1) Salary": "Provide salaries for health facilities staff (DHs, HCs)",
  "HC Lab Technician (A1) Salary": "Provide salaries for health facilities staff (DHs, HCs)",
  "Bonus (All staff paid on GF)": "Provide salaries for health facilities staff (DHs, HCs)",
  
  // Travel Related Costs (TRC)
  "Workshop": "Conduct support group meeting at Health Facilities especially for adolescents and children",
  "Supervision (CHWs)": "Conduct supervision from Health centers to CHWs",
  "Supervision (Home Visit)": "Conduct home visit for lost to follow up",
  "Transport": "Conduct sample transportation from Health centers to District Hospitals",
  
  // Health Products & Equipment (HPE)
  "Maintenance and Repair": "Support to DHs and HCs to improve and maintain infrastructure standards",
  
  // Program Administration Costs (PA)
  "Communication": "Provide running costs for DHs & HCs",
  "Office Supplies": "Provide running costs for DHs & HCs",
  "Transport (Mission & Reporting Fee)": "Provide running costs for DHs & HCs",
  "Bank charges": "Provide running costs for DHs & HCs",
};

const hivHospitalActivityDescriptionMap: Record<string, string> = {
  // Human Resources (HR)
  "DH Medical Dr. Salary": "Provide salaries for health facilities staff (DHs, HCs)",
  "Senior Medical Dr. Salary": "Provide salaries for health facilities staff (DHs, HCs)",
  "Chief Medical Dr. Salary": "Provide salaries for health facilities staff (DHs, HCs)",
  "Junior Medical Dr. or Mentor Salary": "Provide salaries for health facilities staff (DHs, HCs)",
  "Pharmacist Salary": "Provide salaries for health facilities staff (DHs, HCs)",
  "Nurse Salary": "Provide salaries for health facilities staff (DHs, HCs)",
  "CHW supervisor Salary": "Provide salaries for health facilities staff (DHs, HCs)",
  "Accountant Salary": "Provide salaries for health facilities staff (DHs, HCs)",
  "All Staff Bonus": "Provide bonus for 2023-24",
  
  // Travel Related Costs (TRC)
  "Campaign for HIV testing": "Conduct outreach to provide HIV testing service in communities",
  "Campaign (All)": "Conduct outreach VMMC provision at decentralized level",
  "Training": "Conduct training of Peer educators for Negative partner of Sero-Discordant couples on HIV and AIDS and sexual health issues",
  "Supervision (All)": "Conduct integrated clinical mentorship  from District Hospital to Health centres  to support Treat All and DSDM implementation",
  "Workshop (Transport & Perdiem)": "Conduct quarterly multidisciplinary team meeting (MDT). Participants are those not supported by other donor",
  "Meeting": "Conduct support group meeting at Health Facilities especially for adolescents and children and younger adults",
  "Transport": "Conduct sample transportation from  District Hospitals to Referal hospitals/NRL",
  
  // Health Products & Equipment (HPE)
  "Maintenance": "Support to DHs and HCs to improve and maintain infrastructure standards- Motor car Vehicles",
  
  // Program Administration Costs (PA)
  "Bank charges & commissions": "National and sub-HIV databases",
  "Fuel": "National and sub-HIV databases",
  "Communication (Airtime)": "Infrastructure and Equipment",
  "Communication (Internet)": "Infrastructure and Equipment",
};

// Malaria activity mappings - both hospital and health center use same activities for malaria
const malariaActivityDescriptionMap: Record<string, string> = {
  // Epidemiology
  "Participants at DHs staff": "Data Manager, Planning and M&E officer, CHWs Supervisor, DG or Clinical Director",
  "Provide Perdiem to Health Centers staff": "Data Manager or CEHO Supervisor and Head of Health Center",
  "Provide Mineral water to participants": "Refreshments",
  "Transport fees for remote distance based HCs staff": "Follow the District Council Decision/Hospital Health Committee Meeting resolution on Transport tariffs per District",
  "Bank Charges": "Financial Services",
  
  // Program Management
  "Running costs": "Mission fees while for report submission",
  
  // Human Resources - Note: "Running costs" appears in both categories with different meanings
  // "Supervisor Salary": "Supervision fees for Malaria Supervisor",
  "DH CHWs supervisors A0": "Staff Salary",
  "DH Lab technicians": "Staff Salary", 
  "DH Nurses A1": "Staff Salary",
  "CHW supervisor, lab techs, 2 Nurses": "Staff Salary"
};

// Special handling for malaria activities that have context-dependent descriptions
const getMalariaActivityDescription = (typeOfActivity: string, category: string): string => {
  if (typeOfActivity === "Running costs") {
    if (category === "Program Management") {
      return "Mission fees while for report submission";
    } else if (category === "Human Resources") {
      return "Supervision fees for Malaria Supervisor";
    }
  }
  return malariaActivityDescriptionMap[typeOfActivity] || typeOfActivity;
};

// TB activity mappings - both hospital and health center use same activities for TB
const tbActivityDescriptionMap: Record<string, string> = {
  // Human Resources (HR)
  "Provincial TB Coordinator Salary": "Salaries for the Provincial TB coordinators",
  "Provincial TB Coordinator Bonus": "TB Provincial Coordinator bonus 2022/2023",
  
  // Travel Related Costs (TRC)
  "Contact Tracing (Perdiem)": "Conduct contacts tracing among TB cases contact by Health Care Providers at HCs (Refreshment or perdiem)",
  "Contact Tracing (Transport)": "Conduct contacts tracing among TB cases contact by Health Care Providers at HCs (transportation fees)",
  "Contact Tracing (General)": "Conduct contacts tracing among TB cases contact by Health Care Providers at HCs",
  "TPT Guidelines Mentoring (Mission)": "Mentor the implementation of the TPT guidelines from DHs to HCs (mission fees)",
  "TPT Guidelines Mentoring (Transport)": "Mentor the implementation of the TPT guidelines from DHs to HCs (transportation fees)",
  "HCW Mentorship HC Level (Mission)": "Mentorship of HCW at health center level (mission fees)",
  "HCW Mentorship HC Level (Transport)": "Mentorship of HCW at health center level (transportation fees)",
  "HCW Mentorship Community (Mission)": "Mentorship of HCW at community level (mission fees)",
  "HCW Mentorship Community (Transport)": "Mentorship of HCW at community level (transportation fees)",
  "Quarterly Evaluation Meetings (Transport)": "Held quarterly evaluation meetings with facilities to cross-check, analyze and use TB data (Transport fees)",
  "Quarterly Evaluation Meetings (Allowance)": "Held quarterly evaluation meetings with facilities to cross-check, analyze and use TB data (mission allowance)",
  
  // Program Administration Costs (PA)
  "Hospital Running Costs": "Running cost for the hospital",
  "Bank charges": "Provide running costs for DH",
  "Office Supplies": "Provide running costs for DH"
};

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

  // Determine facility type to choose the appropriate activity description map
  const firstItem = apiResponse.data[0];
  const facilityType = firstItem?.facilityType || (facilityId === '1' || facilityId === 1 ? "hospital" : "health_center");
  const isHospital = facilityType.toLowerCase() === 'hospital';
  
  // Determine program type to choose appropriate mappings
  const projectName = firstItem?.projectName;
  const isMalariaProgram = projectName.toLowerCase().includes('malaria') || projectName.toLowerCase().includes('mal');
  const isTbProgram = projectName.toLowerCase().includes('tb') || projectName.toLowerCase().includes('tuberculosis');
  
  // Choose the right mappings based on program
  let categoryNameMap: Record<string, string>;
  let activityDescriptionMap: Record<string, string>;
  
  if (isTbProgram) {
    categoryNameMap = tbCategoryNameMap;
    activityDescriptionMap = tbActivityDescriptionMap;
  } else if (isMalariaProgram) {
    categoryNameMap = malariaCategoryNameMap;
    activityDescriptionMap = malariaActivityDescriptionMap;
  } else {
    // Default to HIV
    categoryNameMap = hivCategoryNameMap;
    activityDescriptionMap = isHospital ? hivHospitalActivityDescriptionMap : hivHealthCenterActivityDescriptionMap;
  }

  console.log('🐛 Transform - Program Detection:', {
    projectName,
    isMalariaProgram,
    isTbProgram,
    isHospital,
    categoryMapKeys: Object.keys(categoryNameMap),
    activityMapKeys: Object.keys(activityDescriptionMap).slice(0, 5) // First 5 for debugging
  });

  // Transform the planning data into the format expected by the frontend
  const activities: Activity[] = apiResponse.data.map((item: any) => {
    const apiCategoryName = item.categoryName || '';
    const mappedCategoryName = categoryNameMap[apiCategoryName] || apiCategoryName;
    const typeOfActivity = item.activityName || '';
    
    // Use appropriate activity description mapping based on program
    let activityDescription: string;
    if (isMalariaProgram) {
      activityDescription = getMalariaActivityDescription(typeOfActivity, apiCategoryName);
    } else {
      // For TB and HIV programs, use direct mapping
      activityDescription = activityDescriptionMap[typeOfActivity] || typeOfActivity;
    }
    
    return {
      activityCategory: mappedCategoryName,
      typeOfActivity: typeOfActivity,
      activity: activityDescription, // Use the mapped activity description
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
      planningDataId: item.planningDataId, // ← Add the actual planning data ID
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
