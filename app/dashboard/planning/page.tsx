"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { PlanListingTable } from "@/features/planning/components/plan-listing-table"
import { NewPlanDialog } from "@/features/planning/components/new-plan-dialog"
import { authClient } from "@/lib/auth-client"
import { useGetFacilityById } from "@/features/facilities/api/use-get-facility"
import { getHealthCentersByHospital } from "@/features/on-boarding/utils/location-utils"
import { ListingTableSkeleton } from "@/components/skeletons"
import { useGetPlannedFacilities } from "@/features/planned-facilities/api/use-get-planning-data"
import { PlanRecord } from "@/features/planning/components/plan-listing-table"
import { useListProjects, type Project } from "@/features/projects/use-list-projects"

// Define facility types for each program
const getFacilityTypesForProgram = (program?: string) => {
  if (program === 'TB') {
    // TB only applies to hospitals
    return [{ id: "hospital", label: "Hospital" }];
  }
  // HIV and Malaria apply to both hospitals and health centers
  return [
    { id: "hospital", label: "Hospital" },
    { id: "health_center", label: "Health Center" },
  ];
};

  
export default function PlanningPage() {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false) 
  
  // Access session data in client component
  const { data: session, isPending } = authClient.useSession();
  const { data: facility, isPending: isFacilityPending } = useGetFacilityById(session?.user?.facilityId ?? undefined);
  const { data: planningActivities = [], isLoading: isPlanningLoading } = useGetPlannedFacilities();
  const { data: alreadyPlannedFacilities = [], isLoading: isAlreadyPlannedLoading } = useGetPlannedFacilities();
  const { data: projectsResponse, isLoading: isProjectsLoading } = useListProjects({ status: "ACTIVE" });
  const projectData: Project[] = projectsResponse?.data || [];

  // Helper to derive URL program name from a project row
  const getProgramName = (project: Project): string => {
    const n = project.name.toLowerCase();

    if (n.includes('malaria') || project.code === 'MAL') return 'MAL';
    if (n.includes('tuberculosis') || project.code === 'TB') return 'TB';

    return 'HIV'; // default
  };

  // Create dynamic programs list from projects data
  const programs = projectData.map(project => ({
    id: getProgramName(project),
    name: project.name
  }));

  // // Create dynamic mapping from project code to program name (for URL params)
  // const createProjectCodeMapping = () => {
  //   const mapping: Record<string, string> = {};
  //   projectData.forEach(project => {
  //     if (project.code) {
  //       mapping[project.code] = getProgramName(project);
  //     }
  //   });
  //   return mapping;
  // };

  const mapProjectCodeToProgram = (code?: string): string => {
    console.log("code:: ", code)
    if (!code) return 'HIV';
    switch (code) {
      case 'MAL':
        return 'MAL';
      case 'TB':
        return 'TB';
      default:
        return 'HIV';
    }
  };

  // Build facilities array with current facility and associated health centers
  const facilities: Array<{ id: string; name: string; type: string; program?: string }> = []
  
  if (facility) {
    facilities.push({
      id: "1",
      name: facility.name,
      type: facility.facilityType,
    });

    const healthCenters = getHealthCentersByHospital(facility.name);
    healthCenters.forEach((healthCenter, index) => {
      facilities.push({
        id: (index + 2).toString(),
        name: healthCenter.label,
        type: "health_center",
      });
    });
  }

  const tableData: PlanRecord[] = planningActivities.map((record: any) => ({
    id: record.id.toString(),
    facilityName: record.facilityName,
    district: record.districtName,
    lastModified: record.dateModified ? new Date(record.dateModified) : new Date(0),
    facilityType: record.facilityType || 'health_center', // Fallback to health_center if not specified
    projectCode: record.projectCode
  }));

  

  if (isPending || isFacilityPending || isPlanningLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-xl font-semibold mb-4">Plan Records</h1>
        <ListingTableSkeleton rows={5} />
      </div> 
    )
  }

  // Create a set of facility-program combinations that have been planned
  const plannedFacilityPrograms = new Set(
    alreadyPlannedFacilities
      .map((a: any) => {
        const facilityName = (a.facilityName ?? a.name ?? "").toLowerCase();
        const projectCode = a.projectCode;
        return facilityName && projectCode ? `${facilityName}:${projectCode}` : null;
      })
      .filter(Boolean)
  );

  // Helper function to get project code for a program
  const getProjectCodeForProgram = (program: string): string => {
    const mapping = { 'hiv': 'HIV', 'malaria': 'MAL', 'tb': 'TB' };
    return mapping[program as keyof typeof mapping] || program.toUpperCase();
  };

  const handleCreatePlan = (
    facilityId: string,      // still receives the id
    facilityType: string,
    program?: string
  ) => {
    const programParam   = program ? `&program=${program}` : ""
    const facilityObj    = facilities.find(f => f.id === facilityId)
    const facilityName   = encodeURIComponent(facilityObj?.name ?? facilityId)   // fallback just in case

    router.push(
      `/dashboard/planning/new?facilityName=${facilityName}&facilityType=${facilityType}${programParam}`
    )
    setDialogOpen(false)
  }

  // These handlers would typically interact with your backend
    // (createProjectCodeMapping already declared above)

  const handleView = (id: string, facilityType: string, projectCode?: string) => {
    // Find the record to get more context
    const record = tableData.find(r => r.id === id);

    // Use dynamic project code mapping
    const programName = mapProjectCodeToProgram(projectCode);
    const programParam = programName ? `&program=${programName}` : '';
    const facilityNameParam = record?.facilityName ? `&facilityName=${encodeURIComponent(record.facilityName)}` : '';
    
    router.push(`/dashboard/planning/view?recordId=${id}&facilityType=${facilityType}${programParam}${facilityNameParam}`)
  }

  const handleUpdate = (id: string, facilityType: string, projectCode?: string) => {
    // Find the record to get more context
    const record = tableData.find(r => r.id === id);
    
    // Use dynamic project code mapping
    const programName = mapProjectCodeToProgram(projectCode);
    const programParam = programName ? `&program=${programName}` : '';
    const facilityNameParam = record?.facilityName ? `&facilityName=${encodeURIComponent(record.facilityName)}` : '';
    
    router.push(`/dashboard/planning/edit?recordId=${id}&facilityType=${facilityType}${programParam}${facilityNameParam}`)
  }

  const handleExport = (id: string) => {
    console.log("Exporting record:", id)
    // Trigger export functionality
  }

  return (
    <div className="container">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Plan Records</h1>
          {/* {user && (
            <p className="text-sm text-muted-foreground">
              Welcome, {user.name} {user.facilityId && `(Facility: ${user.facilityId})`}
            </p>
          )} */}
        </div>

        <NewPlanDialog
          programs={programs}
          facilities={facilities}
          getFacilityTypes={getFacilityTypesForProgram}
          onCreatePlan={handleCreatePlan}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isAvailableForPlanning={(facilityName: string, program: string) => {
            const projectCode = getProjectCodeForProgram(program);
            const facilityProgramKey = `${facilityName.toLowerCase()}:${projectCode}`;
            return !plannedFacilityPrograms.has(facilityProgramKey);
          }}
        />

        <PlanListingTable
          data={tableData}
          onView={handleView}
          onUpdate={handleUpdate}
          onExport={handleExport}
        />
      </div>
    </div>
  )
}