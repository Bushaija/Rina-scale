"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { ExecutionListingTable } from "@/features/execution/execution-listing-table"
import { NewExecutionDialog } from "@/features/execution/components/new-execution-dialog"
import { getHealthCentersByHospital } from "@/features/on-boarding/utils/location-utils"
import { authClient } from "@/lib/auth-client"
import { useGetFacilityById } from "@/features/facilities/api/use-get-facility"
import {
  useListFacilityUpdateInfo,
  useListExecutedFacilities,
} from "@/features/api/frontend"
import { ListingTableSkeleton } from "@/components/skeletons"
import { useGetPlannedFacilities } from "@/features/planned-facilities/api/use-get-planning-data"

const facilityTypes = [
  { id: "hospital", label: "Hospital" },
  { id: "health_center", label: "Health Center" },
]

const programs = [
  { id: "hiv", name: "HIV" },
  { id: "malaria", name: "Malaria" },
  { id: "tb", name: "TB" },
]

export default function ExecutionPage() {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const searchParams = useSearchParams();
  
  // Access session data in client component
  const { data: session, isPending } = authClient.useSession();
  const { data: facility, isPending: isFacilityPending } = useGetFacilityById(session?.user?.facilityId ?? 0)
  const { data: executionData, isPending: isExecutionPending } = useListFacilityUpdateInfo();
  const { data: executedFacilities, isLoading: isExecutedLoading } = useListExecutedFacilities();
  const { data: plannedFacilities = [], isLoading: isPlannedLoading } = useGetPlannedFacilities();
  


  // Build facilities array with current facility and associated health centers
  const facilities: Array<{ id: string, name: string, type: string, program?: string }> = []
  
  if (facility) {
    facilities.push({
      id: "1",
      name: facility.name,
      type: facility.facilityType,
    });

    const healthCenters = getHealthCentersByHospital(facility.name);
    console.log("health centers found:", healthCenters)
    healthCenters.forEach((healthCenter, index) => {
      facilities.push({
        id: (index + 2).toString(),
        name: healthCenter.label,
        type: "health_center",
        program: healthCenter.programs?.[0], // Take the first program if available
      });
    });
  }



  const tableData = executionData?.map((record) => ({
    facilityId: record.id.toString(),
    facilityName: record.facilityName,
    district: record.districtName,
    lastModified: record.dateModified ? new Date(record.dateModified) : new Date(0),
    projectCode: record.projectCode,
  })) ?? [];



  if (isPending || isExecutionPending || isFacilityPending || isExecutedLoading || isPlannedLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-xl font-semibold mb-4">Execution Records</h1>
        <ListingTableSkeleton rows={5} />
      </div>
    )
  }



  // Create facility-program combinations for planned and executed facilities
  const plannedFacilityPrograms = new Set(
    plannedFacilities.map((p: any) => {
      const facilityName = (p.facilityName ?? p.name ?? "").toLowerCase();
      const projectCode = p.projectCode;
      return facilityName && projectCode ? `${facilityName}:${projectCode}` : null;
    }).filter(Boolean)
  );

  const executedFacilityPrograms = new Set(
    executedFacilities?.map((f) => {
      const facilityName = f.name.toLowerCase();
      const projectCode = f.projectCode; // assuming executed facilities also have projectCode
      return facilityName && projectCode ? `${facilityName}:${projectCode}` : null;
    }).filter(Boolean) ?? []
  );

  // Helper function to get project code for a program
  const getProjectCodeForProgram = (program: string): string => {
    const mapping = { 'hiv': 'HIV', 'malaria': 'MAL', 'tb': 'TB' };
    return mapping[program as keyof typeof mapping] || program.toUpperCase();
  };

  // Function to check if a facility is available for execution for a specific program
  const isAvailableForExecution = (facilityName: string, program: string): boolean => {
    const projectCode = getProjectCodeForProgram(program);
    const facilityProgramKey = `${facilityName.toLowerCase()}:${projectCode}`;
    
    // Must be planned for this program AND not executed for this program
    return plannedFacilityPrograms.has(facilityProgramKey) && !executedFacilityPrograms.has(facilityProgramKey);
  };

  // Debug logging to help troubleshoot
  console.log("📋 Execution Filtering Debug:")
  console.log("- All facilities:", facilities.map(f => f.name))
  console.log("- Planned facility-programs:", Array.from(plannedFacilityPrograms))
  console.log("- Executed facility-programs:", Array.from(executedFacilityPrograms))

  const handleCreateExecution = (
    facilityId: string,      // receives the facility id
    facilityType: string,
    program?: string
  ) => {
    const programParam   = program ? `&program=${program}` : ""
    const facilityObj    = facilities.find(f => f.id === facilityId)
    const facilityName   = encodeURIComponent(facilityObj?.name ?? facilityId)   // fallback just in case

    router.push(
      `/dashboard/execution/new?facilityName=${facilityName}&facilityType=${facilityType}${programParam}`
    )
    setDialogOpen(false)
  }

  // These handlers would typically interact with your backend
  const handleView = (facilityId: string) => {
    router.push(`/dashboard/execution/report?facilityId=${facilityId}`)
  }

  const handleUpdate = (facilityId: string) => {
    router.push(`/dashboard/execution/edit?facilityId=${facilityId}`)
  }

  const handleExport = (facilityId: string) => {
    console.log("Exporting record:", facilityId)
    // Trigger export functionality
  }


  return (
    <div className="container mx-auto">
      <div className="flex flex-col space-y-6">
        <h1 className="text-xl font-semibold">Execution Records</h1>

        <NewExecutionDialog
          programs={programs}
          facilities={facilities}
          facilityTypes={facilityTypes}
          onCreateExecution={handleCreateExecution}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isAvailableForExecution={isAvailableForExecution}
        />

        <ExecutionListingTable
          data={tableData}
          onView={handleView}
          onUpdate={handleUpdate}
          onExport={handleExport}
        />
      </div>
    </div>
  )
}