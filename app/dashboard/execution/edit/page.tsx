"use client"

import React, { useMemo } from "react"
import { FinancialTableDataPayload } from "@/types"
import { ExecutionForm } from "@/features/execution/components/execution-form"
import { useSearchParams } from "next/navigation"
import { useGetFacilityExecutionData } from "@/features/api/frontend"
import { useUpdateExecutionData } from "@/features/api/execution-data"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { FormSkeleton } from "@/components/skeletons"
import { useGetFacilityById } from "@/features/facilities/api/use-get-facility"
import { useGetDistrictById } from "@/features/api/districts"

export default function ExecutionEditPage() {
  const searchParams = useSearchParams();
  const facilityIdParam = searchParams.get("facilityId");
  const facilityType = searchParams.get("facilityType")
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
  // console.log("initialData", initialData);

  const updateExecutionData = useUpdateExecutionData();
  const queryClient = useQueryClient();

  const initialData = useMemo(() => {
    const mapRows = (rows: any[]): any[] =>
      rows.map((row) => {
        const { comment, children, q1, q2, q3, q4, cumulativeBalance, ...rest } = row;
        const mapped: any = {
          ...rest,
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

    return fetchedData?.tableData ? mapRows(fetchedData.tableData) : undefined;
  }, [fetchedData]);

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

  // const fiscalYear = new Date().getFullYear();
  const selectedHealthCenter = (facilityData as any)?.name ?? "";
  const district = (districtData as any)?.name ?? "";
  const selectedReportingPeriod = "";
  const isHospitalMode = (facilityData as any)?.facilityType === "hospital";

  const handleSave = async (data: FinancialTableDataPayload) => {
    // Flatten rows helper
    const flatten = (rows: any[]): any[] =>
      rows.flatMap((r) => (r.children ? [r, ...flatten(r.children)] : [r]));

    const rows = flatten(data.tableData || []);

    try {
      await Promise.all(
        rows
          .filter((r) => typeof r.executionId === "number")
          .map((r) => {
            const buildPayload = (row: any) => {
              const json: Record<string, string | undefined> = {
                q1Amount: row.q1?.toString(),
                q2Amount: row.q2?.toString(),
                q3Amount: row.q3?.toString(),
                q4Amount: row.q4?.toString(),
                comment: row.comments || undefined,
              };

              // remove undefined values
              Object.keys(json).forEach((k) => json[k] === undefined && delete json[k]);
              return json;
            };

            const payload = buildPayload(r);
            if (Object.keys(payload).length) {
              return updateExecutionData.mutateAsync({ id: r.executionId, json: payload });
            }
          })
      );

      // After all mutations succeed, refetch the facility execution data so the UI shows the latest numbers
      await queryClient.invalidateQueries({ queryKey: ["frontend", "project-execution", facilityId] });

      toast.success("Execution report updated successfully");
    } catch (e: any) {
      console.error("Error saving data:", e);
      toast.error("Failed to update report", {
        description: e?.message || "Unable to save changes",
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ExecutionForm
        data={initialData}
        // fiscalYear={fiscalYear}
        onSave={handleSave}
        mode="edit"
        status="draft"
        selectedFacility={selectedHealthCenter}
        facilityType={facilityData?.facilityType || undefined}
        district={district}
        selectedReportingPeriod={selectedReportingPeriod}
        isHospitalMode={isHospitalMode}
        disabled={updateExecutionData.isPending}
      />
    </div>
  );
} 