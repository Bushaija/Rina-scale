'use client';

import React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlanForm } from '@/features/planning/components/plan-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useGetPlanDataByFacilityId } from '@/features/planning-data/api/use-get-planning-by-facility-id';
import { useUpdatePlanningData } from '@/features/planning-data/api/use-update-planning-data';
import { toast } from 'sonner';
import { Plan } from '@/features/planning/schema/hiv/plan-form-schema';
// Import other plan types for type flexibility
import { Plan as MalariaPlan } from '@/features/planning/schema/malaria/plan-form-schema';
import { Plan as TBPlan } from '@/features/planning/schema/tb/plan-form-schema';

export default function EditPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('recordId');
  const facilityId = searchParams.get('facilityId'); // Keep for backward compatibility
  const facilityType = searchParams.get('facilityType');
  const program = searchParams.get('program');
  const facilityName = searchParams.get('facilityName');
  const readOnlyParam = searchParams.get('readonly');
  
  // Use recordId if available, fallback to facilityId for backward compatibility
  const idToUse = recordId || facilityId;
  
  // Support readonly mode via query parameter
  const isReadOnlyMode = readOnlyParam === 'true';
  
  // Convert URL program code (HIV, MAL, TB) to canonical program names for API (hiv, malaria, tb)
  const codeToNameMap: Record<string, string> = { HIV: 'hiv', MAL: 'malaria', TB: 'tb' };
  const programFilter = program ? codeToNameMap[program.toUpperCase()] : undefined;
  
  const { 
    data: planData, 
    isLoading, 
    error, 
    isError 
  } = useGetPlanDataByFacilityId(idToUse, true, { 
    program: programFilter,
    facilityType: facilityType || 'health_center'
  });

  const updatePlanningData = useUpdatePlanningData();

  // Debug logging for planData changes
  React.useEffect(() => {
    console.log('🐛 Edit Page - planData changed:', {
      hasData: !!planData,
      activitiesCount: planData?.activities?.length || 0,
      metadata: planData?.metadata,
      firstActivity: planData?.activities?.[0],
      recordId,
      facilityId,
      facilityType,
      program,
      isReadOnlyMode
    });
  }, [planData, recordId, facilityId, facilityType, program, isReadOnlyMode]);

  // Determine if it's a hospital based on facilityType parameter
  const isHospital = facilityType === 'hospital' || facilityType === 'Hospital';

  const handlePlanUpdate = async (plan: Plan | MalariaPlan | TBPlan) => {
    if (!planData?.activities) {
      toast.error("No planning data found to update");
      return;
    }

    try {
      // Include every activity that has a planningDataId – counts or comments may have changed
      const updateRows = plan.activities.filter((activity) => activity.planningDataId);

      if (updateRows.length === 0) {
        toast.warning("Nothing to update – no valid activities found.");
        return;
      }

      const totalRows = updateRows.length;
      const toastId = toast.loading("Preparing to update plan…", {
        description: `0 of ${totalRows} activities`,
      });

      let successCount = 0;
      let failureCount = 0;

      // Sequentially update each activity so we can show progress
      for (let i = 0; i < totalRows; i++) {
        const activity = updateRows[i];
        try {
          await updatePlanningData.mutateAsync({
            id: activity.planningDataId!,
            json: {
              frequency: Number(activity.frequency) || 0,
              unitCost: Number(activity.unitCost) || 0,
              countQ1: Number(activity.countQ1) || 0,
              countQ2: Number((activity as any).countQ2) || 0,
              countQ3: Number((activity as any).countQ3) || 0,
              countQ4: Number((activity as any).countQ4) || 0,
              comment: activity.comment || "",
            },
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to update activity ${activity.typeOfActivity}:`, error);
          failureCount++;
        } finally {
          const percent = Math.round(((i + 1) / totalRows) * 100);
          toast.loading(`Updating plan… ${percent}%`, {
            id: toastId,
            description: `${i + 1} of ${totalRows} activities`,
          });
        }
      }

      if (failureCount === 0) {
        toast.success("🎉 Plan updated successfully!", {
          id: toastId,
          description: `${successCount} activities updated`,
        });

        // Allow users to see success message briefly before redirect
        setTimeout(() => router.push("/dashboard/planning"), 1500);
      } else {
        toast.error(`Plan updated with ${failureCount} failed activities`, {
          id: toastId,
          description: `${successCount} succeeded, ${failureCount} failed`,
        });
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("An unexpected error occurred while updating the plan");
    }
  };

  if (isLoading) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Loading Plan...</CardTitle>
                    <CardDescription>Please wait while the plan data is being fetched.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  if (isError || !idToUse) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                    <CardDescription>
                      {error?.message || 'No record ID provided in the URL parameters.'}
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  if (!planData) {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Error</CardTitle>
                    <CardDescription>Could not load plan data. It may have been deleted or an error occurred.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  // Dynamic title and description based on mode
  // const getPageTitle = () => {
  //   if (isReadOnlyMode) return "View Plan Details";
  //   return "Edit Plan";
  // };

  // const getPageDescription = () => {
  //   const facilityDisplayName = planData.metadata.facilityName;
  //   if (isReadOnlyMode) {
  //     return `This is a read-only view of the plan for ${facilityDisplayName}.`;
  //   }
  //   return `You are editing the plan for ${facilityDisplayName}.`;
  // };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        {/* <CardHeader>
          <CardTitle>{getPageTitle()}</CardTitle>
          <CardDescription>
            {getPageDescription()}
          </CardDescription>
        </CardHeader> */}
        <CardContent>
          <PlanForm
            key={`plan-form-${idToUse}-${planData.activities.length}-${planData.metadata.program}`}
            isEdit={!isReadOnlyMode}
            isReadOnly={isReadOnlyMode}
            initialActivities={planData.activities}
            metadata={{
              ...planData.metadata,
              program: planData.metadata.program || 'HIV', // Always use API program, ignore URL param
              facilityName: facilityName || planData.metadata.facilityName || 'Unknown Facility'
            }}
            isHospital={facilityType === 'hospital' || facilityType === 'Hospital' || planData.metadata.facilityType?.toLowerCase() === 'hospital'}
            onSubmitSuccess={isReadOnlyMode ? undefined : handlePlanUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
} 