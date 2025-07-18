"use client"

import React, { useMemo } from "react" // Simplified imports
import { FinancialTableDataPayload } from "@/types"
import { ExecutionForm } from "@/features/execution/components/execution-form" // Import the moved component
import { useSearchParams, useRouter } from "next/navigation"
import { useGetFacilityExecutionData } from "@/features/api/frontend"
import { FormSkeleton } from "@/components/skeletons"
import { useGetFacilityById } from "@/features/facilities/api/use-get-facility"
import { useGetDistrictById } from "@/features/api/districts"
// import { useUpdateExecutionData } from "@/features/api/execution"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

// All ExecutionForm component code and its specific imports have been removed from here.

// Default export for the page
export default function ExecutionReportPage() {
  'use client';

  const searchParams = useSearchParams();
  const router = useRouter();
  const facilityIdParam = searchParams.get("facilityId");
  const facilityId = facilityIdParam ? Number(facilityIdParam) : undefined;

  const {
    data: fetchedData,
    isLoading,
    isError,
  } = useGetFacilityExecutionData(facilityId);
  const {
    data: facilityData,
    isLoading: isFacilityLoading,
    isError: isFacilityError,
  } = useGetFacilityById(facilityId ?? 0, { enabled: !!facilityId });
  const {
    data: districtData,
    isLoading: isDistrictLoading,
  } = useGetDistrictById(facilityData?.districtId ?? 0, !!facilityData?.districtId);

  // const updateExecutionData = useUpdateExecutionData();
  const queryClient = useQueryClient();

  const initialData = useMemo(() => {
    if (!fetchedData?.tableData) return undefined;
    
    // Helper function to normalize IDs to match template format
    const normalizeId = (id: string): string => {
      // Convert "B-01" to "B01", "B-01-1" to "B01-1", etc.
      // Also ensure uppercase to match template
      return id.replace(/^([A-G])-(\d+)/, '$1$2').toUpperCase();
    };
    
    const mapRows = (rows: any[]): any[] =>
      rows.map((row) => {
        const { comment, isTotalRow, children, q1, q2, q3, q4, cumulativeBalance, ...rest } = row;
        const mapped: any = {
          ...rest,
          id: normalizeId(row.id), // Normalize the ID to match template format
          q1: q1 != null ? parseFloat(q1) : undefined,
          q2: q2 != null ? parseFloat(q2) : undefined,
          q3: q3 != null ? parseFloat(q3) : undefined,
          q4: q4 != null ? parseFloat(q4) : undefined,
          cumulativeBalance: cumulativeBalance != null ? parseFloat(cumulativeBalance) : undefined,
          comments: comment,
        };
        if (children) mapped.children = mapRows(children);
        return mapped;
      });
    
    const result = mapRows(fetchedData.tableData);
    return result;
  }, [fetchedData?.tableData]);

  const initialLoading = (!fetchedData?.tableData && isLoading) || (!facilityData && isFacilityLoading) || (!districtData && isDistrictLoading);

  if (!facilityId) {
    return <div className="container mx-auto p-4 text-red-500">Invalid facility id</div>;
  }

  if (initialLoading) {
    return (
      <div className="container mx-auto p-4">
        <FormSkeleton />
      </div>
    );
  }

  if (isError || isFacilityError) {
    return <div className="container mx-auto p-4 text-red-500">Failed to load data</div>;
  }

  if (facilityId && !fetchedData?.tableData?.length) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/execution')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Execution List
          </Button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Execution Data Available</h3>
          <p className="text-yellow-700 mb-4">
            No execution data has been submitted for facility ID {facilityId} yet.
          </p>
          <div className="text-sm text-yellow-600">
            <p>Possible reasons:</p>
            <ul className="list-disc ml-5 mt-2">
              <li>No execution data has been created for this facility</li>
              <li>The facility ID might be incorrect</li>
              <li>The data might be in a different reporting period</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const fiscalYear = new Date().getFullYear();
  const selectedHealthCenter = (facilityData as any)?.name ?? "";
  const district = (districtData as any)?.name ?? "";
  const selectedReportingPeriod = "";
  const isHospitalMode = (facilityData as any)?.facilityType === "hospital";

  if (facilityId && (isLoading || !fetchedData?.tableData)) {
    return (
      <div className="container mx-auto p-4">
        <FormSkeleton />
      </div>
    );
  }

  if (facilityId && isError) {
    return <div className="container mx-auto p-4 text-red-500">Failed to load data</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Back Button */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/execution')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Execution List
        </Button>
      </div>
      
      <ExecutionForm
        data={initialData}
        fiscalYear={fiscalYear}
        mode="view"
        selectedFacility={selectedHealthCenter}
        district={district}
        selectedReportingPeriod={selectedReportingPeriod}
        isHospitalMode={isHospitalMode}
      />
    </div>
  );
} 