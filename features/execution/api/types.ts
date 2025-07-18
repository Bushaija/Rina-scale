export interface Category {
    id: number;
    code: string;
    name: string;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
};

export interface SubCategory {
    id: number;
    categoryId: number;
    code: string;
    name: string;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
    category: Category | null;
};

export interface Activity {
    id: number;
    categoryId: number;
    subCategoryId: number;
    name: string;
    displayOrder: number;
    isTotalRow: boolean | null;
    createdAt: string | null;
    updatedAt: string | null;
    category: Category | null;
    subCategory: SubCategory | null;
};

export interface HierarchicalData {
    categories: Array<{
        id: number;
        code: string;
        name: string;
        displayOrder: number;
        subCategories: Array<{
            id: number;
            categoryId: number;
            code: string;
            name: string;
            displayOrder: number;
            activities: Array<{
                id: number;
                categoryId: number;
                subCategoryId: number;
                name: string;
                displayOrder: number;
                isTotalRow: boolean | null;
            }>;
        }>;
    }>;
    directActivities: Array<{
        id: number;
        name: string;
        displayOrder: number;
        isTotalRow: boolean | null;
    }>;
};

export interface ReportingPeriod {
    id: number;
    year: number;
    periodType: string | null;
    startDate: string;
    endDate: string;
    status: string | null;
    createdAt: string;
    updatedAt: string;
};

export interface Project {
    id: number;
    name: string;
    status: string | null;
    facilityId: number | null;
    reportingPeriodId: number | null;
    userId: number | null;
    createdAt: string | null;
    updatedAt: string | null;
    facility: {
        id: number;
        name: string;
        facilityType: string;
    } | null;
    reportingPeriod: {
        id: number;
        year: number;
        periodType: string | null;
    } | null;
    user: {
        id: number;
        name: string;
    } | null;
};

export interface CreateProject {
    name: string;
    facilityId: number;
    reportingPeriodId: number;
    userId: number;
    status?: "ACTIVE" | "INACTIVE" | "COMPLETED";
};

export interface CreateReportingPeriod {
    year: number;
    periodType?: "ANNUAL" | "QUARTERLY" | "MONTHLY";
    startDate: string;
    endDate: string;
    status?: "ACTIVE" | "INACTIVE" | "CLOSED";
};

export interface FinancialReport {
    reportingPeriod: {
        id: number;
        year: number;
        periodType: string;
        startDate: string;
        endDate: string;
    };
    facility?: {
        id: number;
        name: string;
        facilityType: string;
    };
    categories: Array<{
        categoryCode: string;
        categoryName: string;
        subCategories: Array<{
            code: string;
            name: string;
            activities: Array<{
                id: number;
                name: string;
                isTotalRow: boolean | null;
                q1Amount: string;
                q2Amount: string;
                q3Amount: string;
                q4Amount: string;
                cumulativeBalance: string;
            }>;
        }>;
        directActivities: Array<{
            id: number;
            name: string;
            isTotalRow: boolean | null;
            q1Amount: string;
            q2Amount: string;
            q3Amount: string;
            q4Amount: string;
            cumulativeBalance: string;
        }>;
    }>;
    totals: {
        q1Total: string;
        q2Total: string;
        q3Total: string;
        q4Total: string;
        cumulativeBalance: string;
    };
    generatedAt: string;
};

// Query parameters
export interface MasterDataFilters {
    categoryId?: number;
    subCategoryId?: number;
    excludeTotalRows?: boolean;
};

export interface ProjectFilters  {
    facilityId?: number;
    status?: "ACTIVE" | "INACTIVE" | "COMPLETED";
};

export interface ReportFilters {
    reportingPeriodId: number;
    facilityId?: number;
    categoryCode?: string;
};

export interface CreateExecutionData {
    reportingPeriodId: number;
    activityId: number;
    projectId: number;
    q1Amount?: string;
    q2Amount?: string;
    q3Amount?: string;
    q4Amount?: string;
    comment?: string;
}

export interface ExecutionData {
    id: number;
    reportingPeriodId: number | null;
    activityId: number | null;
    projectId: number | null;
    q1Amount: string | null;
    q2Amount: string | null;
    q3Amount: string | null;
    q4Amount: string | null;
    cumulativeBalance: string | null;
    comment: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    createdBy: string | null;
    updatedBy: string | null;
}

