import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { ApiError, honoClient, handleHonoResponse } from "@/lib/hono";
import {
  FacilityUpdateInfoSchema,
  ExecutionHierarchySchema,
  InsertExecutionDataResponseSchema,
  FinancialReportBodySchema,
  ExecutedFacilityInfoSchema,
} from "@/app/api/[[...route]]/routes/frontend/frontend.types";

export type FacilityUpdateInfo = z.infer<typeof FacilityUpdateInfoSchema>;
export type ExecutedFacilityInfo = z.infer<typeof ExecutedFacilityInfoSchema>;
type ProjectExecutionData = z.infer<
  typeof ExecutionHierarchySchema
>["tableData"];

type ResponseType = {
  data: FacilityUpdateInfo[];
};

const fetchFacilityUpdateInfo = async (): Promise<FacilityUpdateInfo[]> =>
  handleHonoResponse<ResponseType>(
    honoClient.api.frontend["facility-update-info"].$get({})
  ).then((res) => res.data);

/**
 * Returns the list of facilities with their latest execution modification date.
 * The data shape is defined by `FacilityUpdateInfoSchema`.
 */
export const useListFacilityUpdateInfo = () =>
  useQuery<FacilityUpdateInfo[], ApiError>({
    queryKey: ["frontend", "facility-update-info"],
    queryFn: fetchFacilityUpdateInfo,
  });

/**
 * @deprecated Prefer `useListFacilityUpdateInfo` – kept only for backward compatibility.
 */
export const useListExecutionData = useListFacilityUpdateInfo;

export const fetchProjectExecutionData = async (
  facilityId: number
): Promise<{ tableData: ProjectExecutionData; metadata?: any }> =>
  handleHonoResponse<{ tableData: ProjectExecutionData; metadata?: any }>(
    honoClient.api.frontend["project-execution"][":facilityId"].$get({
      param: { facilityId: facilityId.toString() },
    })
  );

export const useGetFacilityExecutionData = (facilityId?: number) =>
  useQuery<{ tableData: ProjectExecutionData; metadata?: any }, ApiError>({
    queryKey: ["frontend", "project-execution", facilityId],
    queryFn: () => fetchProjectExecutionData(facilityId!),
    enabled: !!facilityId,
  });

// Deprecated alias for backward compatibility
export const useGetProjectExecutionData = useGetFacilityExecutionData;

type InsertExecutionResp = z.infer<typeof InsertExecutionDataResponseSchema>;

export const useInsertExecutionData = () =>
  useMutation<
    InsertExecutionResp,
    ApiError,
    { facilityId: number; reportingPeriodId: number; report: any }
  >({
    mutationFn: ({ facilityId, reportingPeriodId, report }) =>
      handleHonoResponse(
        (honoClient.api.frontend as any)["execution-data"][":facilityId"][":reportingPeriodId"].$post({
          param: { facilityId: String(facilityId), reportingPeriodId: String(reportingPeriodId) },
          json: report,
        })
      ),
  });

// --- Executed Facilities ---

type ExecutedFacilitiesResponseType = {
  data: ExecutedFacilityInfo[];
};

const fetchExecutedFacilities = async (): Promise<ExecutedFacilityInfo[]> =>
  handleHonoResponse<ExecutedFacilitiesResponseType>(
    honoClient.api.frontend["executed-facilities"].$get({})
  ).then((res) => res.data);

/**
 * Returns a list of all facilities that have at least one execution data entry.
 * The data shape is defined by `ExecutedFacilityInfoSchema`.
 */
export const useListExecutedFacilities = () =>
  useQuery<ExecutedFacilityInfo[], ApiError>({
    queryKey: ["frontend", "executed-facilities"],
    queryFn: fetchExecutedFacilities,
  });
