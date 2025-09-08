'use client';

import React from 'react';
import { toast } from 'sonner';
import { PlanForm } from '@/features/planning/components/plan-form';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';
import { useRouter, useSearchParams } from 'next/navigation';

import { authClient } from '@/lib/auth-client';
import { useGetProject } from '@/features/projects/use-get-project';
import { useGetFacilityByName } from '@/features/api/facilities';
import { useGetActiveReportingPeriods } from '@/features/api/reporting-periods';

import { mapPlanningPayload } from '@/features/execution/utils/map-planning-payload';
import { useListPlanningActivities } from '@/features/planning-activities/api/use-list-planning-activities';
import { useCreatePlanningData } from '@/features/planning-data/api/use-create-planning-data';

// Centralized hooks
import { useGenerateDefaultActivities } from '@/features/planning-config/api/use-planning-activities';

type FacilityByName = { facilityId: number; facilityName: string };

export default function PlanningNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const facilityNameParam = searchParams.get("facilityName")?.toLowerCase() ?? "";
  const facilityTypeParam = searchParams.get("facilityType");
  const programCodeParam = searchParams.get("program")?.toUpperCase() ?? "HIV";

  const { data: session } = authClient.useSession();
  const { data: facility, isLoading: isLoadingFacility } = useGetFacilityByName(facilityNameParam, !!facilityNameParam);
  const { data: reportingPeriods, isLoading: isLoadingReportingPeriods } = useGetActiveReportingPeriods();
  const { data: activitiesResp } = useListPlanningActivities();
  const createPlanningData = useCreatePlanningData();

  // Map possible URL program codes (both short and long forms) to canonical keys
  const codeToNameMap: Record<string, string> = {
    HIV: 'hiv',
    MAL: 'malaria',   // 3-letter code
    MALARIA: 'malaria', // full name
    TB: 'tb',
  };
  const programKey = codeToNameMap[programCodeParam] ?? 'hiv';

  // Map canonical program keys to 3-letter project codes expected by the API
  const programToProjectCode: Record<string, string> = {
    hiv: 'HIV',
    malaria: 'MAL',
    tb: 'TB',
  };

  const projectCodeForApi = programToProjectCode[programKey] ?? 'HIV';

  // Map canonical program keys (lower-case) to project IDs
  const projectIdLookup: Record<string, number> = {
    hiv: 1,
    malaria: 2,
    tb: 3,
  };

  const selectedProjectId = projectIdLookup[programKey] ?? 1;

  const { data: projectResp, isLoading: isLoadingProject } = useGetProject(selectedProjectId);

  const selectedReportingPeriod = (reportingPeriods as any)?.data;

  // Determine if it's a hospital based on facility type
  const isHospital = facilityTypeParam === "health_center" ? false : true;


  // Generate initial activities dynamically from centralized system
  const initialActivities = useGenerateDefaultActivities(
    projectCodeForApi,
    isHospital ? 'hospital' : 'health_center'
  );

  const isLoadingInitialActivities = initialActivities.length === 0; // until data arrives

  const handleFormSubmit = async (plan: any) => {

    if (!session?.user?.facilityId || !session?.user?.id) {
      toast.error("User or facility information is missing. Please log in again.");
      return;
    }

    if(!selectedReportingPeriod?.id) {
      toast.error("Please select a reporting period.");
      return;
    }

    const activitiesMap: Record<string, number> = {};
    activitiesResp?.data
      ?.filter((a) => a.projectId === projectResp?.id) // include only activities for current program
      ?.forEach((a) => {
        activitiesMap[a.name] = a.id;
        activitiesMap[a.name.toLowerCase()] = a.id;
        // Also try trimmed versions
        activitiesMap[a.name.trim()] = a.id;
        activitiesMap[a.name.trim().toLowerCase()] = a.id;
      });

    const facilityIdNum = (facility as FacilityByName | undefined)?.facilityId ?? session.user.facilityId;
    if (!facilityIdNum) {
      toast.error("Facility not identified");
      return;
    }

    if (!projectResp) {
      toast.error("Project not found");
      return;
    }

    const planningRows = mapPlanningPayload(plan, {
      reportingPeriodId: selectedReportingPeriod.id,
      facilityId: facilityIdNum,
      projectId: projectResp.id,
      activitiesMap,
    });


    if (planningRows.length === 0) {
      toast.error("No line items to save.");
      return;
    }


    try {
      const totalRows = planningRows.length;
      const toastId = toast.loading("Preparing to save your planning data...", {
        description: "Please wait while we process your activities"
      });

      for (let i = 0; i < totalRows; i++) {
        
        try {
          await createPlanningData.mutateAsync(planningRows[i]);
        } catch (rowError) {
          // Continue with the next row instead of breaking the entire loop
          toast.error(`Failed to save activity ${i + 1}: ${rowError}`);
          console.error("failed to save activity: ", rowError)
          continue;
        }

        const percent = Math.round(((i + 1) / totalRows) * 100);
        toast.loading(`Saving planning data... ${percent}%`, { 
          id: toastId,
          description: `Processing activity ${i + 1} of ${totalRows}`
        });
      }

      // Show success notification
      toast.success("🎉 Planning data saved successfully!", { 
        id: toastId,
        description: `${totalRows} activities have been saved to your planning data.`
      });

      // Add a small delay before redirect to let users see the success message
      setTimeout(() => {
        router.push("/dashboard/planning");
      }, 1500);
    } catch (e) {
      toast.error("Failed to save planning data", {
        description: "An error occurred while saving some planning data entries. Please try again."
      });
      console.error("Error saving planning data", e);
    }
  };

  const initialLoading = isLoadingFacility || isLoadingReportingPeriods || isLoadingProject || isLoadingInitialActivities;
  if (initialLoading) {
    return <div className="container mx-auto p-4">
      <FormSkeleton />
    </div>
  }

  return (
    <div className="containerr mx-autoo p-4 md:p-8 h-full">
      <div className="border-2 border-blue-500">
        <div>
          <PlanForm
            isHospital={isHospital}
            initialActivities={initialActivities}
            isEdit={false}
            onSubmitSuccess={handleFormSubmit}
            metadata={{
              program: programCodeParam ?? "No Program Selected",
              facilityType: facilityTypeParam === "health_center" ? "Health Center" : "Hospital",
              facilityName: facilityNameParam ?? "No Facility Selected",
            }}
          />
        </div>
      </div>
    </div>
  );
}