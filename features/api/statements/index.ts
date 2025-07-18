import { useQuery, useQueries } from "@tanstack/react-query";
import { honoClient, handleHonoResponse } from "@/lib/hono";
import { InferResponseType } from "hono";
import { useMemo } from "react";

// -----------------------------------------------------------------------------
// Client helpers
// -----------------------------------------------------------------------------
const statementsApi = honoClient.api.statements as any;

const makeFetch = <T>(
  pathArray: (string | ":facilityId" | ":periodId")[],
) => {
  // Navigate through the proxy path e.g. ["revenue-expenditure", ":facilityId", ":periodId"]
  let ref: any = statementsApi;
  for (const segment of pathArray) {
    ref = ref[segment];
  }
  return (facilityId: number, periodId: number) =>
    handleHonoResponse<T>(
      ref.$get({
        param: { facilityId: String(facilityId), periodId: String(periodId) },
      })
    );
};

// -----------------------------------------------------------------------------
// Endpoints & Types
// -----------------------------------------------------------------------------

type StatementRows = {
  description: string;
  note: number | null;
  current: number | null;
  previous: number | null;
  isTotal: boolean;
  isSubtotal: boolean;
};

// Using InferResponseType to keep runtime types correct
// Define fetchers
const fetchRevExp = makeFetch<StatementRows[]>([
  "revenue-expenditure",
  ":facilityId",
  ":periodId",
]);

const fetchAssetsLiab = makeFetch<StatementRows[]>(["assets-liabilities", ":facilityId", ":periodId"]);
const fetchCashFlow = makeFetch<StatementRows[]>(["cash-flow", ":facilityId", ":periodId"]);
const fetchBudgetVsActual = makeFetch<StatementRows[]>(["budget-vs-actual", ":facilityId", ":periodId"]);
const fetchNetAssetsChanges = makeFetch<StatementRows[]>(["net-assets-changes", ":facilityId", ":periodId"]);

const fetchRevExpAgg = makeFetch<StatementRows[]>(["revenue-expenditure", "aggregate", ":periodId"]);
const fetchAssetsLiabAgg = makeFetch<StatementRows[]>(["assets-liabilities", "aggregate", ":periodId"]);
const fetchCashFlowAgg = makeFetch<StatementRows[]>(["cash-flow", "aggregate", ":periodId"]);
const fetchBvaAgg = makeFetch<StatementRows[]>(["budget-vs-actual", "aggregate", ":periodId"]);
const fetchNetAssetsAgg = makeFetch<StatementRows[]>(["net-assets-changes", "aggregate", ":periodId"]);

// -----------------------------------------------------------------------------
// Query Keys
// -----------------------------------------------------------------------------
export const statementsKeys = {
  all: ["statements"] as const,
  statement: (type: string, facilityId: number, periodId: number) =>
    [...statementsKeys.all, type, facilityId, periodId] as const,
};

// -----------------------------------------------------------------------------
// Hooks
// -----------------------------------------------------------------------------

export const useRevenueExpenditure = (
  facilityId?: number,
  periodId?: number,
  enabled: boolean = true,
) =>
  useQuery<StatementRows[], unknown>({
    queryKey: statementsKeys.statement("rev-exp", facilityId ?? 0, periodId ?? 0),
    queryFn: () => fetchRevExp(facilityId!, periodId!),
    enabled: enabled && !!facilityId && !!periodId,
  });

export const useAssetsLiabilities = (
  facilityId?: number,
  periodId?: number,
  enabled: boolean = true,
) =>
  useQuery<StatementRows[], unknown>({
    queryKey: statementsKeys.statement("assets-liab", facilityId ?? 0, periodId ?? 0),
    queryFn: () => fetchAssetsLiab(facilityId!, periodId!),
    enabled: enabled && !!facilityId && !!periodId,
  });

export const useCashFlow = (
  facilityId?: number,
  periodId?: number,
  enabled: boolean = true,
) =>
  useQuery<StatementRows[], unknown>({
    queryKey: statementsKeys.statement("cash-flow", facilityId ?? 0, periodId ?? 0),
    queryFn: () => fetchCashFlow(facilityId!, periodId!),
    enabled: enabled && !!facilityId && !!periodId,
  });

export const useBudgetVsActual = (
  facilityId?: number,
  periodId?: number,
  enabled: boolean = true,
) =>
  useQuery<StatementRows[], unknown>({
    queryKey: statementsKeys.statement("bva", facilityId ?? 0, periodId ?? 0),
    queryFn: () => fetchBudgetVsActual(facilityId!, periodId!),
    enabled: enabled && !!facilityId && !!periodId,
  });

export const useNetAssetsChanges = (
  facilityId?: number,
  periodId?: number,
  enabled: boolean = true,
) =>
  useQuery<StatementRows[], unknown>({
    queryKey: statementsKeys.statement("net-assets", facilityId ?? 0, periodId ?? 0),
    queryFn: () => fetchNetAssetsChanges(facilityId!, periodId!),
    enabled: enabled && !!facilityId && !!periodId,
  });

export const useRevExpAggregate = (periodId?: number, enabled = true) =>
  useQuery({
    queryKey: statementsKeys.statement("rev-exp-agg", 0, periodId ?? 0),
    queryFn: () => fetchRevExpAgg(0, periodId!),
    enabled: enabled && !!periodId,
  });

export const useAssetsLiabilitiesAggregate = (periodId?: number, enabled = true) =>
  useQuery({
    queryKey: statementsKeys.statement("assets-liab-agg", 0, periodId ?? 0),
    queryFn: () => fetchAssetsLiabAgg(0, periodId!),
    enabled: enabled && !!periodId,
  });

export const useCashFlowAggregate = (periodId?: number, enabled = true) =>
  useQuery({
    queryKey: statementsKeys.statement("cash-flow-agg", 0, periodId ?? 0),
    queryFn: () => fetchCashFlowAgg(0, periodId!),
    enabled: enabled && !!periodId,
  });

export const useBudgetVsActualAggregate = (periodId?: number, enabled = true) =>
  useQuery({
    queryKey: statementsKeys.statement("bva-agg", 0, periodId ?? 0),
    queryFn: () => fetchBvaAgg(0, periodId!),
    enabled: enabled && !!periodId,
  });

export const useNetAssetsChangesAggregate = (periodId?: number, enabled = true) =>
  useQuery({
    queryKey: statementsKeys.statement("net-assets-agg", 0, periodId ?? 0),
    queryFn: () => fetchNetAssetsAgg(0, periodId!),
    enabled: enabled && !!periodId,
  });

// Project-specific aggregate hook for revenue expenditure
export const useRevExpAggregateByProject = (periodId?: number, projectCode?: string, enabled = true) => {
  // First get all facilities with their project codes
  const { data: allFacilities, isLoading: isFacilitiesLoading } = useQuery({
    queryKey: ['executed-facilities'],
    queryFn: async () => {
      const response = await fetch('/api/frontend/executed-facilities');
      const result = await response.json();
      return result.data;
    },
    enabled: enabled && !!periodId,
  });

  // Filter facilities by project code
  const facilities = projectCode 
    ? allFacilities?.filter((f: any) => f.projectCode === projectCode)
    : allFacilities;

  // Fetch individual facility data and aggregate
  const facilitiesQueries = useQueries({
    queries: (facilities ?? []).map((facility: any) => ({
      queryKey: statementsKeys.statement("rev-exp", facility.id, periodId ?? 0),
      queryFn: () => fetchRevExp(facility.id, periodId!),
      enabled: enabled && !!periodId && !!facilities,
    }))
  });

  const isLoading = isFacilitiesLoading || facilitiesQueries.some(q => q.isLoading);
  const hasError = facilitiesQueries.some(q => q.isError);

  // Aggregate the data from all facilities
  const aggregatedData = useMemo(() => {
    if (isLoading || hasError || !facilitiesQueries.length) return [];

    // Get all successful queries
    const successfulQueries = facilitiesQueries.filter(q => q.data && !q.isError);
    if (successfulQueries.length === 0) return [];

    // Use the first facility's data as template structure
    const template = successfulQueries[0].data as StatementRows[];
    if (!template || !Array.isArray(template)) return [];
    
    // Aggregate values across all facilities
    return template.map((templateRow, index) => {
      const aggregatedRow = { ...templateRow };
      
      // Sum current values from all facilities
      aggregatedRow.current = successfulQueries.reduce((sum, query) => {
        const facilityData = query.data as StatementRows[];
        const facilityRow = facilityData?.[index];
        return sum + (facilityRow?.current ?? 0);
      }, 0);

      // Sum previous values from all facilities
      aggregatedRow.previous = successfulQueries.reduce((sum, query) => {
        const facilityData = query.data as StatementRows[];
        const facilityRow = facilityData?.[index];
        return sum + (facilityRow?.previous ?? 0);
      }, 0);

      return aggregatedRow;
    });
  }, [facilitiesQueries, isLoading, hasError]);

  return {
    data: aggregatedData,
    isLoading,
    isError: hasError,
  };
};

// Project-specific aggregate hook for assets & liabilities
export const useAssetsLiabilitiesAggregateByProject = (periodId?: number, projectCode?: string, enabled = true) => {
  // First get all facilities with their project codes
  const { data: allFacilities, isLoading: isFacilitiesLoading } = useQuery({
    queryKey: ['executed-facilities'],
    queryFn: async () => {
      const response = await fetch('/api/frontend/executed-facilities');
      const result = await response.json();
      return result.data;
    },
    enabled: enabled && !!periodId,
  });

  // Filter facilities by project code
  const facilities = projectCode 
    ? allFacilities?.filter((f: any) => f.projectCode === projectCode)
    : allFacilities;

  // Fetch individual facility data and aggregate
  const facilitiesQueries = useQueries({
    queries: (facilities ?? []).map((facility: any) => ({
      queryKey: statementsKeys.statement("assets-liab", facility.id, periodId ?? 0),
      queryFn: () => fetchAssetsLiab(facility.id, periodId!),
      enabled: enabled && !!periodId && !!facilities,
    }))
  });

  const isLoading = isFacilitiesLoading || facilitiesQueries.some(q => q.isLoading);
  const hasError = facilitiesQueries.some(q => q.isError);

  // Aggregate the data from all facilities
  const aggregatedData = useMemo(() => {
    if (isLoading || hasError || !facilitiesQueries.length) return [];

    // Get all successful queries
    const successfulQueries = facilitiesQueries.filter(q => q.data && !q.isError);
    if (successfulQueries.length === 0) return [];

    // Use the first facility's data as template structure
    const template = successfulQueries[0].data as StatementRows[];
    if (!template || !Array.isArray(template)) return [];
    
    // Aggregate values across all facilities
    return template.map((templateRow, index) => {
      const aggregatedRow = { ...templateRow };
      
      // Sum current values from all facilities
      aggregatedRow.current = successfulQueries.reduce((sum, query) => {
        const facilityData = query.data as StatementRows[];
        const facilityRow = facilityData?.[index];
        return sum + (facilityRow?.current ?? 0);
      }, 0);

      // Sum previous values from all facilities
      aggregatedRow.previous = successfulQueries.reduce((sum, query) => {
        const facilityData = query.data as StatementRows[];
        const facilityRow = facilityData?.[index];
        return sum + (facilityRow?.previous ?? 0);
      }, 0);

      return aggregatedRow;
    });
  }, [facilitiesQueries, isLoading, hasError]);

  return {
    data: aggregatedData,
    isLoading,
    isError: hasError,
  };
};

// Project-specific aggregate hook for budget vs actual
export const useBudgetVsActualAggregateByProject = (periodId?: number, projectCode?: string, enabled = true) => {
  console.log("🔍 useBudgetVsActualAggregateByProject called with:", { periodId, projectCode, enabled });

  // Fetch both executed and planned facilities
  const { data: executedFacilities, isLoading: isExecutedLoading } = useQuery({
    queryKey: ['executed-facilities'],
    queryFn: async () => {
      console.log("📡 Fetching executed-facilities...");
      const response = await fetch('/api/frontend/executed-facilities');
      const result = await response.json();
      console.log("📡 Executed facilities response:", result);
      return result.data;
    },
    enabled: enabled && !!periodId,
  });

  const { data: plannedFacilities, isLoading: isPlannedLoading } = useQuery({
    queryKey: ['planned-facilities'],
    queryFn: async () => {
      console.log("📡 Fetching planned-facilities...");
      const response = await fetch('/api/planning');
      const result = await response.json();
      console.log("📡 Planned facilities response:", result);
      return result; // This endpoint returns an array directly
    },
    enabled: enabled && !!periodId,
  });

  // Combine facilities from both sources, avoiding duplicates
  const allFacilities = useMemo(() => {
    const executed = Array.isArray(executedFacilities) ? executedFacilities : [];
    const planned = Array.isArray(plannedFacilities) ? plannedFacilities : [];
    
    console.log("🔄 Processing facilities - executed:", executed.length, "planned:", planned.length);
    
    // Create a map to avoid duplicates by facility ID
    const facilityMap = new Map();
    
    // Add executed facilities
    executed.forEach((facility: any) => {
      facilityMap.set(facility.id, facility);
    });
    
    // Add planned facilities (they have slightly different structure)
    planned.forEach((facility: any) => {
      if (!facilityMap.has(facility.id)) {
        // Transform planned facility structure to match executed facility structure
        facilityMap.set(facility.id, {
          id: facility.id,
          name: facility.facilityName,
          facilityType: facility.facilityType,
          districtName: facility.districtName,
          projectCode: facility.projectCode,
          // Set defaults for execution-specific fields
          executionRows: 0,
          totalExecutedAmount: null,
          lastExecutedAt: null,
        });
      }
    });
    
    const result = Array.from(facilityMap.values());
    console.log("🔄 Combined facilities result:", result);
    return result;
  }, [executedFacilities, plannedFacilities]);

  const isFacilitiesLoading = isExecutedLoading || isPlannedLoading;

  console.log("📋 Executed facilities:", executedFacilities);
  console.log("📋 Planned facilities:", plannedFacilities);
  console.log("📋 Combined facilities:", allFacilities);
  console.log("📋 Facilities loading:", isFacilitiesLoading);

  // Filter facilities by project code
  const facilities = projectCode 
    ? allFacilities?.filter((f: any) => f.projectCode === projectCode)
    : allFacilities;

  console.log("🔧 Filtered facilities by project code '" + projectCode + "':", facilities);
  console.log("🔧 Number of matching facilities:", facilities?.length || 0);

  // Fetch individual facility data and aggregate
  const facilitiesQueries = useQueries({
    queries: (facilities ?? []).map((facility: any) => ({
      queryKey: statementsKeys.statement("bva", facility.id, periodId ?? 0),
      queryFn: () => fetchBudgetVsActual(facility.id, periodId!),
      enabled: enabled && !!periodId && !!facilities,
    }))
  });

  const isLoading = isFacilitiesLoading || facilitiesQueries.some(q => q.isLoading);
  const hasError = facilitiesQueries.some(q => q.isError);

  console.log("📊 Facilities queries status:");
  facilitiesQueries.forEach((query, index) => {
    console.log(`  Query ${index}:`, {
      isLoading: query.isLoading,
      isError: query.isError,
      hasData: !!query.data,
      dataLength: Array.isArray(query.data) ? query.data.length : 'not-array',
      error: query.error
    });
  });

  // Aggregate the data from all facilities
  const aggregatedData = useMemo(() => {
    console.log("🧮 Starting aggregation...");
    console.log("🧮 Aggregation conditions:", { isLoading, hasError, queriesLength: facilitiesQueries.length });

    if (isLoading || hasError || !facilitiesQueries.length) {
      console.log("🧮 Early return - not ready for aggregation");
      return [];
    }

    // Get all successful queries
    const successfulQueries = facilitiesQueries.filter(q => q.data && !q.isError);
    console.log("🧮 Successful queries:", successfulQueries.length);
    console.log("🧮 Sample successful query data:", successfulQueries[0]?.data);

    if (successfulQueries.length === 0) {
      console.log("🧮 No successful queries - returning empty array");
      return [];
    }

    // Use the first facility's data as template structure
    const template = successfulQueries[0].data as StatementRows[];
    console.log("🧮 Template data:", template);
    console.log("🧮 Template length:", template?.length);

    if (!template || !Array.isArray(template)) {
      console.log("🧮 Invalid template - returning empty array");
      return [];
    }
    
    // Aggregate values across all facilities
    const result = template.map((templateRow, index) => {
      const aggregatedRow = { ...templateRow };
      
      // Sum current values from all facilities (Actual column)
      aggregatedRow.current = successfulQueries.reduce((sum, query) => {
        const facilityData = query.data as StatementRows[];
        const facilityRow = facilityData?.[index];
        return sum + (facilityRow?.current ?? 0);
      }, 0);

      // Sum previous values from all facilities (Budget column)
      aggregatedRow.previous = successfulQueries.reduce((sum, query) => {
        const facilityData = query.data as StatementRows[];
        const facilityRow = facilityData?.[index];
        return sum + (facilityRow?.previous ?? 0);
      }, 0);

      return aggregatedRow;
    });

    console.log("🧮 Final aggregated result:", result);
    console.log("🧮 Goods and services in result:", result.find(r => r.description === "Goods and services"));

    return result;
  }, [facilitiesQueries, isLoading, hasError]);

  console.log("🎯 Final hook result:", {
    data: aggregatedData,
    isLoading,
    isError: hasError,
  });

  return {
    data: aggregatedData,
    isLoading,
    isError: hasError,
  };
};

// Project-specific aggregate hook for cash flow
export const useCashFlowAggregateByProject = (periodId?: number, projectCode?: string, enabled = true) => {
  // First get all facilities with their project codes
  const { data: allFacilities, isLoading: isFacilitiesLoading } = useQuery({
    queryKey: ['executed-facilities'],
    queryFn: async () => {
      const response = await fetch('/api/frontend/executed-facilities');
      const result = await response.json();
      return result.data;
    },
    enabled: enabled && !!periodId,
  });

  // Filter facilities by project code
  const facilities = projectCode 
    ? allFacilities?.filter((f: any) => f.projectCode === projectCode)
    : allFacilities;

  // Fetch individual facility data and aggregate
  const facilitiesQueries = useQueries({
    queries: (facilities ?? []).map((facility: any) => ({
      queryKey: statementsKeys.statement("cash-flow", facility.id, periodId ?? 0),
      queryFn: () => fetchCashFlow(facility.id, periodId!),
      enabled: enabled && !!periodId && !!facilities,
    }))
  });

  const isLoading = isFacilitiesLoading || facilitiesQueries.some(q => q.isLoading);
  const hasError = facilitiesQueries.some(q => q.isError);

  // Aggregate the data from all facilities
  const aggregatedData = useMemo(() => {
    if (isLoading || hasError || !facilitiesQueries.length) return [];

    // Get all successful queries
    const successfulQueries = facilitiesQueries.filter(q => q.data && !q.isError);
    if (successfulQueries.length === 0) return [];

    // Use the first facility's data as template structure
    const template = successfulQueries[0].data as StatementRows[];
    if (!template || !Array.isArray(template)) return [];
    
    // Aggregate values across all facilities
    return template.map((templateRow, index) => {
      const aggregatedRow = { ...templateRow };
      
      // Sum current values from all facilities
      aggregatedRow.current = successfulQueries.reduce((sum, query) => {
        const facilityData = query.data as StatementRows[];
        const facilityRow = facilityData?.[index];
        return sum + (facilityRow?.current ?? 0);
      }, 0);

      // Sum previous values from all facilities
      aggregatedRow.previous = successfulQueries.reduce((sum, query) => {
        const facilityData = query.data as StatementRows[];
        const facilityRow = facilityData?.[index];
        return sum + (facilityRow?.previous ?? 0);
      }, 0);

      return aggregatedRow;
    });
  }, [facilitiesQueries, isLoading, hasError]);

  return {
    data: aggregatedData,
    isLoading,
    isError: hasError,
  };
};

// Project-specific aggregate hook for net assets changes
export const useNetAssetsChangesAggregateByProject = (periodId?: number, projectCode?: string, enabled = true) => {
  // First get all facilities with their project codes
  const { data: allFacilities, isLoading: isFacilitiesLoading } = useQuery({
    queryKey: ['executed-facilities'],
    queryFn: async () => {
      const response = await fetch('/api/frontend/executed-facilities');
      const result = await response.json();
      return result.data;
    },
    enabled: enabled && !!periodId,
  });

  // Filter facilities by project code
  const facilities = projectCode 
    ? allFacilities?.filter((f: any) => f.projectCode === projectCode)
    : allFacilities;

  // Fetch individual facility data and aggregate
  const facilitiesQueries = useQueries({
    queries: (facilities ?? []).map((facility: any) => ({
      queryKey: statementsKeys.statement("net-assets", facility.id, periodId ?? 0),
      queryFn: () => fetchNetAssetsChanges(facility.id, periodId!),
      enabled: enabled && !!periodId && !!facilities,
    }))
  });

  const isLoading = isFacilitiesLoading || facilitiesQueries.some(q => q.isLoading);
  const hasError = facilitiesQueries.some(q => q.isError);

  // Aggregate the data from all facilities
  const aggregatedData = useMemo(() => {
    if (isLoading || hasError || !facilitiesQueries.length) return [];

    // Get all successful queries
    const successfulQueries = facilitiesQueries.filter(q => q.data && !q.isError);
    if (successfulQueries.length === 0) return [];

    // Use the first facility's data as template structure
    const template = successfulQueries[0].data as StatementRows[];
    if (!template || !Array.isArray(template)) return [];
    
    // Aggregate values across all facilities
    return template.map((templateRow, index) => {
      const aggregatedRow = { ...templateRow };
      
      // Sum current values from all facilities
      aggregatedRow.current = successfulQueries.reduce((sum, query) => {
        const facilityData = query.data as StatementRows[];
        const facilityRow = facilityData?.[index];
        return sum + (facilityRow?.current ?? 0);
      }, 0);

      // Sum previous values from all facilities
      aggregatedRow.previous = successfulQueries.reduce((sum, query) => {
        const facilityData = query.data as StatementRows[];
        const facilityRow = facilityData?.[index];
        return sum + (facilityRow?.previous ?? 0);
      }, 0);

      return aggregatedRow;
    });
  }, [facilitiesQueries, isLoading, hasError]);

  return {
    data: aggregatedData,
    isLoading,
    isError: hasError,
  };
};
