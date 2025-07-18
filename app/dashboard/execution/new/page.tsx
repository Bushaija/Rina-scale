"use client"

import React from "react"
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";

import { FinancialTableDataPayload } from "@/types"
import { ExecutionForm } from "@/features/execution/components/execution-form"
import { mapExecutionPayload } from "@/features/execution/utils/map-execution-payload";
import { FormSkeleton } from "@/components/skeletons";

import { authClient } from "@/lib/auth-client";
import { useGetActiveReportingPeriods } from "@/features/api/reporting-periods";
import { useGetProject } from '@/features/projects/use-get-project';
import { useCreateExecutionData } from "@/features/api/execution-data";
import { useGetFacilityByName } from "@/features/api/facilities";
import { useListActivities } from "@/features/api/activities";

// local minimal shape returned by /facilities/by-name
type FacilityByName = { facilityId: number; facilityName: string };

export default function ExecutionNewPage() {  
  const router = useRouter();
  const searchParams = useSearchParams();
  const facilityNameParam = searchParams.get("facilityName")?.toLowerCase() ?? "";
  const facilityTypeParam = searchParams.get("facilityType");
  const programParam = searchParams.get("program");

  const { data: session } = authClient.useSession();
  const { data: facility, isLoading: isLoadingFacility } = useGetFacilityByName(facilityNameParam, !!facilityNameParam);
  const { data: reportingPeriods, isLoading: isLoadingReportingPeriods } = useGetActiveReportingPeriods();
  const createExecutionData = useCreateExecutionData();
  const { data: activitiesResp, isLoading: isActivitiesLoading } = useListActivities();
  
  const currentYear = React.useMemo(() => new Date().getFullYear(), []);
  const fiscalYear = currentYear;
  const isHospitalMode = facilityTypeParam === "hospital";
  
  const projectIdLookup: Record<string, number> = {
    hiv: 1,
    malaria: 2,
    tb: 3,
  };
  const selectedProjectId = projectIdLookup[programParam ?? "hiv"] ?? 1;
  const { data: projectResp, isLoading: isLoadingProject } = useGetProject(selectedProjectId);

  const facilityData = (facility as FacilityByName | undefined) || undefined;
  const selectedFacility = facilityData?.facilityName ?? "Your Health Center";
  const selectedReportingPeriod = (reportingPeriods as any)?.data;

  const handleSave = async (data: FinancialTableDataPayload) => {
    if (!session?.user?.facilityId || !session?.user?.id) {
      toast.error("User or facility information is missing. Please log in again.");
      return;
    }

    if (!selectedReportingPeriod?.id) {
      toast.error("Please select a reporting period.");
      return;
    }

    const activitiesMap: Record<string, number> = {};
    activitiesResp?.data?.forEach((a) => {
      activitiesMap[a.name] = a.id;
    });

    const facilityIdNum = facilityData?.facilityId ?? session.user.facilityId;
    if (!facilityIdNum) {
      toast.error("Facility not identified");
      return;
    }

    const executionRows = mapExecutionPayload(data, {
      projectId: selectedProjectId,
      reportingPeriodId: selectedReportingPeriod.id,
      facilityId: facilityIdNum,
      activitiesMap,
    });

    if (executionRows.length === 0) {
      toast.error("No line items to save.");
      return;
    }

    try {
      const totalRows = executionRows.length;
      // Initialise a loading toast and keep its id so we can update it.
      const toastId = toast.loading("Saving 0% ...");

      for (let i = 0; i < totalRows; i++) {
        // Save each row sequentially so we can accurately track progress.
        await createExecutionData.mutateAsync(executionRows[i]);

        const percent = Math.round(((i + 1) / totalRows) * 100);
        toast.loading(`Saving ${percent}% ...`, { id: toastId });
      }

      toast.success("Execution submitted successfully!", { id: toastId });

      // Redirect user to execution dashboard once saving is complete.
      router.push("/dashboard/execution");
    } catch (e) {
      toast.error("An error occurred while saving some execution data entries.");
    }
  };

  const initialLoading = isLoadingFacility || isLoadingReportingPeriods || isActivitiesLoading || isLoadingProject;

  if (initialLoading) {
    return (
      <div className="container mx-auto p-4">
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ExecutionForm
        data={undefined}
        fiscalYear={fiscalYear}
        onSave={handleSave}
        mode="create"
        selectedFacility={selectedFacility}
        facilityType={facilityTypeParam || undefined}
        selectedReportingPeriod={selectedReportingPeriod ? `${selectedReportingPeriod.year}` : "Loading..."}
        isHospitalMode={isHospitalMode}
        facilityId={facilityData?.facilityId}
        disabled={
          isLoadingReportingPeriods ||
          createExecutionData.isPending ||
          isLoadingFacility
        }
      />
    </div>
  );
} 