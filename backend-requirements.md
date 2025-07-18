# Backend Requirements from Frontend Analysis

This document outlines the backend requirements derived from the frontend application analysis.

## 1. Data Models

Based on the components and data used in the frontend, we have identified the following necessary data models:

### 1.1. Plan

Represents a single planning record.

- `id`: string (Unique identifier)
- `facilityName`: string
- `district`: string
- `lastModified`: Date

### 1.2. Facility

Represents a health facility.

- `id`: string (Unique identifier)
- `name`: string
- `type`: string (e.g., "hospital", "health_center")

### 1.3. FacilityType

Represents a type of facility.

- `id`: string
- `label`: string

## 2. API Endpoints

The following API endpoints are required to support the frontend functionality:

### 2.1. Plans

- **`GET /api/plans`**
  - **Description:** Fetches a list of all planning records.
  - **Used in:** `PlanListingTable` on the main planning page.

- **`POST /api/plans`**
  - **Description:** Creates a new planning record.
  - **Used in:** `NewPlanDialog` to initiate the creation of a new plan.

- **`GET /api/plans/{id}`**
  - **Description:** Fetches the details of a specific planning record.
  - **Used in:** The `handleView` function to show plan details.

- **`PUT /api/plans/{id}`** or **`PATCH /api/plans/{id}`**
  - **Description:** Updates an existing planning record.
  - **Used in:** The `handleUpdate` function.

- **`GET /api/plans/{id}/export`**
  - **Description:** Exports the data of a specific planning record.
  - **Used in:** The `handleExport` function.

### 2.2. Executions

- **`GET /api/executions`**
  - **Description:** Fetches a list of all execution records.
  - **Used in:** `ExecutionListingTable` on the main execution page.

- **`POST /api/executions`**
  - **Description:** Creates a new execution record.
  - **Used in:** `NewExecutionDialog` to initiate the creation of a new execution.

- **`GET /api/executions/{id}`**
  - **Description:** Fetches the details of a specific execution record.
  - **Used in:** The `handleView` function to show execution details.

- **`PUT /api/executions/{id}`** or **`PATCH /api/executions/{id}`**
  - **Description:** Updates an existing execution record.
  - **Used in:** The `handleUpdate` function.

- **`GET /api/executions/{id}/export`**
  - **Description:** Exports the data of a specific execution record.
  - **Used in:** The `handleExport` function.

### 2.3. Facilities

- **`GET /api/facilities`**
  - **Description:** Fetches a list of all facilities.
  - **Used in:** `NewPlanDialog` to populate the facility selection.

### 2.4. Facility Types

- **`GET /api/facility-types`**
  - **Description:** Fetches a list of all facility types.
  - **Used in:** `NewPlanDialog` to populate the facility type selection.

### 2.5. Reports

#### 2.5.1. Budget vs Actual

- **`GET /api/reports/budget-vs-actual`**
  - **Description:** Fetches data for the Budget vs Actual report.
  - **Response Data Structure:**
    ```typescript
    type BudgetVsActualRowData = {
      category: 'RECEIPTS' | 'EXPENDITURES' | 'NON-FINANCIAL ASSETS';
      description: string;
      note?: number;
      originalBudget: number;
      revisedBudget: number;
      actual: number;
    };
    ```

#### 2.5.2. Changes in Net Assets

- **`GET /api/reports/changes-in-assets`**
  - **Description:** Fetches data for the Changes in Net Assets report.
  - **Response Data Structure:**
    ```typescript
    type ChangesInNetAssetsRowData = {
      period: string;
      description: string;
      accumulatedSurplus: number;
      adjustments: number;
      total: number;
    };
    ```

#### 2.5.3. Revenues and Expenditures

- **`GET /api/reports/revenue-expenditure`**
  - **Description:** Fetches data for the Revenues and Expenditures report.
  - **Response Data Structure:**
    ```typescript
    type ReportRowData = {
      description: string;
      note?: number | null;
      currentPeriodAmount?: number | null;
      previousPeriodAmount?: number | null;
      isCategory?: boolean;
      isTotal?: boolean;
      isSubtotal?: boolean;
      children?: ReportRowData[];
    };
    ```

#### 2.5.4. Cash Flow

- **`GET /api/reports/cash-flow`**
  - **Description:** Fetches data for the Cash Flow Statement.
  - **Response Data Structure:**
    ```typescript
    type CashFlowRowData = {
      section: 'Operating Activities' | 'Investing Activities' | 'Financing Activities' | 'Summary';
      category?: string;
      description: string;
      note?: number | null;
      currentPeriodAmount?: number | null;
      previousPeriodAmount?: number | null;
    };
    ```

#### 2.5.5. Balance Sheet

- **`GET /api/reports/balance-sheet`**
  - **Description:** Fetches data for the Balance Sheet.
  - **Response Data Structure:**
    ```typescript
    type BalanceSheetRowData = {
      section: 'Assets' | 'Liabilities' | 'Net Assets';
      type: string;
      description: string;
      note?: number | null;
      currentPeriodAmount?: number | null;
      previousPeriodAmount?: number | null;
    };
    ```

### 2.6. Compiled Reports

- **`GET /api/compiled-report`**
  - **Description:** Fetches data for the compiled report, which aggregates data from multiple facilities.
  - **Response Data Structure:**
    ```typescript
    type CompiledReport = {
      facilities: {
        facilityName: string;
        data: FinancialRow[];
      }[];
      fiscalYear: string;
      reportingPeriod: string;
      project: string;
    };

    type FinancialRow = {
      id: string;
      title: string;
      q1?: number;
      q2?: number;
      q3?: number;
      q4?: number;
      cumulativeBalance?: number;
      comments?: string;
      isCategory?: boolean;
      children?: FinancialRow[];
      isEditable?: boolean;
    };
    ``` 