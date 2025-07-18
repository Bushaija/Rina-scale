'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { PlanForm } from '@/features/planning/components/plan-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { FileDown } from 'lucide-react';
import { useGetPlanDataByFacilityId } from '@/features/planning-data/api/use-get-planning-by-facility-id';

// const ExportButton = () => {
//   const handleExport = () => {
//     // Placeholder for PDF export logic
//     alert("Export to PDF functionality coming soon!");
//     // For a real implementation, you might use a library like jsPDF or react-to-print.
//     // Example with react-to-print:
//     // 1. Wrap PlanForm in a component with a ref.
//     // 2. Use the `useReactToPrint` hook and trigger it here.
//   };

//   return (
//     <Button variant="outline" onClick={handleExport}>
//       <FileDown className="mr-2 h-4 w-4" />
//       Export as PDF
//     </Button>
//   );
// };

export default function ViewPlanPage() {
  const searchParams = useSearchParams();
  const recordId = searchParams.get('recordId');
  const facilityId = searchParams.get('facilityId'); // Keep for backward compatibility
  const facilityType = searchParams.get('facilityType');
  const program = searchParams.get('program');
  const facilityName = searchParams.get('facilityName');
  
  // Use recordId if available, fallback to facilityId for backward compatibility
  const idToUse = recordId || facilityId;
  
  // Map project codes to consistent program names for API
  const programFilter = program?.toLowerCase() || undefined;
  
  const { 
    data: planData, 
    isLoading, 
    error, 
    isError 
  } = useGetPlanDataByFacilityId(idToUse, true, { program: programFilter });

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

  return (
    <div className="container mx-auto">
      <Card>
        {/* <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>View Plan Details</CardTitle>
                    <CardDescription>
                        This is a read-only view of the plan for {planData.metadata.facilityName}.
                    </CardDescription>
                </div>
                <ExportButton />
            </div>
        </CardHeader> */}
        <CardContent>
          <PlanForm
            isEdit={false}
            isReadOnly={true}
            initialActivities={planData.activities}
            metadata={{
              ...planData.metadata,
              program: planData.metadata.program || 'HIV', // Always use API program, ignore URL param
              facilityName: facilityName || planData.metadata.facilityName || 'Unknown Facility'
            }}
            isHospital={facilityType === 'hospital' || facilityType === 'Hospital' || planData.metadata.facilityType?.toLowerCase() === 'hospital'}
          />
        </CardContent>
      </Card>
    </div>
  );
} 