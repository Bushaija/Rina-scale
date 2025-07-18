// Existing utility functions
export function generateQuarterLabels() {
  // TODO: Implement quarter label generation
  return [
    { line1: "Q1", line2: "2024" },
    { line1: "Q2", line2: "2024" },
    { line1: "Q3", line2: "2024" },
    { line1: "Q4", line2: "2024" }
  ];
}

export function getCurrentFiscalYear() {
  return new Date().getFullYear();
}

// New planning totals integration
export interface PlanningQuarterlyTotals {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  total: number;
}

/**
 * Calculate quarterly totals from planning data
 * Used to auto-fill "Transfers from SPIU/RBC" field in execution form
 */
export function calculatePlanningQuarterlyTotals(planningData: any[]): PlanningQuarterlyTotals {
  if (!planningData || planningData.length === 0) {
    return { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 };
  }

  let q1Total = 0;
  let q2Total = 0;
  let q3Total = 0;
  let q4Total = 0;

  planningData.forEach((item) => {
    q1Total += parseFloat(item.amountQ1) || 0;
    q2Total += parseFloat(item.amountQ2) || 0;
    q3Total += parseFloat(item.amountQ3) || 0;
    q4Total += parseFloat(item.amountQ4) || 0;
  });

  return {
    q1: q1Total,
    q2: q2Total,
    q3: q3Total,
    q4: q4Total,
    total: q1Total + q2Total + q3Total + q4Total
  };
}

/**
 * Apply planning totals to execution form data
 * Auto-fills the "Transfers from SPIU/RBC" field with planning quarterly totals
 */
export function applyPlanningTotalsToExecutionData(
  executionData: any[], 
  planningTotals: PlanningQuarterlyTotals
): any[] {
  return executionData.map((row) => {
    // Find the "Transfers from SPIU/RBC" field (id: 2 based on API response)
    if (row.id === 2 || row.id === "a2" || row.id === "A2") {
      return {
        ...row,
        q1: planningTotals.q1,
        q2: planningTotals.q2,
        q3: planningTotals.q3,
        q4: planningTotals.q4,
        cumulativeBalance: planningTotals.total,
        isEditable: false, // Make it read-only since it's auto-calculated
        isCalculated: true, // Mark as calculated field
        comments: "Auto-filled from planning data totals"
      };
    }
    
    // Recursively apply to children if they exist
    if (row.children && row.children.length > 0) {
      return {
        ...row,
        children: applyPlanningTotalsToExecutionData(row.children, planningTotals)
      };
    }
    
    return row;
  });
}

// Export balance validation utilities
export * from './balance-validation';

// Export quarter management utilities
export * from './quarter-management'; 