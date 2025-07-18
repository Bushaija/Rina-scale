import { honoClient, handleHonoResponse, ApiError } from '@/lib/hono';
import { 
  Category, 
  SubCategory, 
  Activity, 
  HierarchicalData, 
  ReportingPeriod, 
  CreateReportingPeriod, 
  Project, 
  CreateProject, 
  FinancialReport, 
  MasterDataFilters, 
  ProjectFilters, 
  ReportFilters,
  CreateExecutionData,
  ExecutionData
} from './types';

// Execution-specific API client using the base Hono client
export const executionApiClient = {
  // Master Data
  getCategories: () => 
    handleHonoResponse<{ data: Category[] }>(
      honoClient.api.categories.$get()
    ),
  
  getSubCategories: (filters?: { categoryId?: number }) => {
    const query = filters?.categoryId ? { categoryId: filters.categoryId.toString() } : {};
    return handleHonoResponse<{ data: SubCategory[] }>(
      honoClient.api["sub-categories"].$get({ query })
    );
  },
  
  getActivities: (filters?: MasterDataFilters) => {
    const query: Record<string, string> = {};
    if (filters?.categoryId) query.categoryId = filters.categoryId.toString();
    if (filters?.subCategoryId) query.subCategoryId = filters.subCategoryId.toString();
    if (filters?.excludeTotalRows) query.excludeTotalRows = 'true';
    
    return handleHonoResponse<{ data: Activity[] }>(
      honoClient.api.activities.$get({ query })
    );
  },
  
  getHierarchicalData: () => 
    handleHonoResponse<HierarchicalData>(
      honoClient.api.hierarchical.$get()
    ),

  // Reporting Periods
  getReportingPeriods: () => 
    handleHonoResponse<{ data: ReportingPeriod[] }>(
      honoClient.api["reporting-periods"].$get()
    ),
  
  createReportingPeriod: (data: CreateReportingPeriod) =>
    handleHonoResponse<ReportingPeriod>(
      honoClient.api["reporting-periods"].$post({ json: data })
    ),

  // Projects
  getProjects: (filters?: ProjectFilters) => {
    const query: Record<string, string> = {};
    if (filters?.facilityId) query.facilityId = filters.facilityId.toString();
    if (filters?.status) query.status = filters.status;
    
    return handleHonoResponse<{ data: Project[] }>(
      honoClient.api.projects.$get({ query })
    );
  },
  
  createProject: (data: CreateProject) =>
    handleHonoResponse<Project>(
      honoClient.api.projects.$post({ json: data })
    ),

  // Reports
  getFinancialSummary: (filters: ReportFilters) => {
    const query: { reportingPeriodId: string; facilityId?: string; categoryCode?: string } = {
      reportingPeriodId: filters.reportingPeriodId.toString(),
    };
    if (filters.facilityId) query.facilityId = filters.facilityId.toString();
    if (filters.categoryCode) query.categoryCode = filters.categoryCode;
    
    return handleHonoResponse<FinancialReport>(
      honoClient.api.reports["financial-summary"].$get({ query })
    );
  },
  
  getVarianceAnalysis: (filters: ReportFilters & { budgetPeriodId: number }) => {
    const query: { reportingPeriodId: string; budgetPeriodId: string; facilityId?: string; categoryCode?: string } = {
      reportingPeriodId: filters.reportingPeriodId.toString(),
      budgetPeriodId: filters.budgetPeriodId.toString(),
    };
    if (filters.facilityId) query.facilityId = filters.facilityId.toString();
    if (filters.categoryCode) query.categoryCode = filters.categoryCode;
    
    return handleHonoResponse<any>(
      honoClient.api.reports["variance-analysis"].$get({ query })
    );
  },
  
  getFacilityComparison: (filters: {
    reportingPeriodId: number;
    facilityIds: number[];
    categoryCode?: string;
  }) => {
    const query: { reportingPeriodId: string; facilityIds: string; categoryCode?: string } = {
      reportingPeriodId: filters.reportingPeriodId.toString(),
      facilityIds: filters.facilityIds.join(','),
    };
    if (filters.categoryCode) query.categoryCode = filters.categoryCode;
    
    return handleHonoResponse<any>(
      honoClient.api.reports["facility-comparison"].$get({ query })
    );
  },

  /**
   * The backend /execution-data endpoint currently accepts **one** execution
   * object per request. This helper handles multiple rows by performing the
   * calls sequentially and returning the created items.
   */
  createExecutionData: async (data: CreateExecutionData[]): Promise<ExecutionData[]> => {
    const results: ExecutionData[] = [];
    for (const row of data) {
      const res = await handleHonoResponse<ExecutionData>(
        honoClient.api["execution-data"].$post({ json: row })
      );
      results.push(res);
    }
    return results;
  },
};