import { FinancialRow } from "@/features/execution/schemas/execution-form-schema";
import { getActiveQuarters } from "./quarter-management";

export interface BalanceValidationResult {
  isBalanced: boolean;
  quarterErrors: {
    q1?: number;
    q2?: number;
    q3?: number;
    q4?: number;
  };
  message: string;
  checkedQuarters: (1 | 2 | 3 | 4)[];
}

/**
 * Validates that Net Financial Assets (F) equals Closing Balance (G) for active quarters only
 * This is a critical financial balancing condition that must be met before submission
 */
export function validateFinancialBalance(formData: FinancialRow[], currentDate: Date = new Date()): BalanceValidationResult {
  // Find Net Financial Assets (F) and Closing Balance (G) rows
  const netFinancialAssetsRow = formData.find(row => row.id === 'F');
  const closingBalanceRow = formData.find(row => row.id === 'G');

  if (!netFinancialAssetsRow || !closingBalanceRow) {
    return {
      isBalanced: false,
      quarterErrors: {},
      message: "Required financial sections (F. Net Financial Assets or G. Closing Balance) not found",
      checkedQuarters: []
    };
  }

  // Get active quarters - only validate these
  const { activeQuarters } = getActiveQuarters(currentDate);
  const quarterErrors: { q1?: number; q2?: number; q3?: number; q4?: number } = {};
  let hasErrors = false;

  // Check balance only for active quarters
  const quarterMap = { 1: 'q1', 2: 'q2', 3: 'q3', 4: 'q4' } as const;
  
  activeQuarters.forEach(quarterNum => {
    const quarter = quarterMap[quarterNum];
    const netAssets = netFinancialAssetsRow[quarter] || 0;
    const closingBalance = closingBalanceRow[quarter] || 0;
    const difference = netAssets - closingBalance;

    // Allow small rounding differences (within 0.01)
    if (Math.abs(difference) > 0.01) {
      quarterErrors[quarter] = difference;
      hasErrors = true;
    }
  });

  const isBalanced = !hasErrors;

  // Generate user-friendly message
  let message = "";
  if (isBalanced) {
    const quarterNames = activeQuarters.map(q => `Q${q}`).join(', ');
    message = `✅ Financial data is balanced! Net Financial Assets equals Closing Balance for active quarters (${quarterNames}).`;
  } else {
    const errorQuarters = Object.keys(quarterErrors);
    message = `❌ Financial data is not balanced for ${errorQuarters.join(', ').toUpperCase()}. Net Financial Assets must equal Closing Balance.`;
  }

  return {
    isBalanced,
    quarterErrors,
    message,
    checkedQuarters: activeQuarters
  };
}

/**
 * Format balance error details for user display
 */
export function formatBalanceErrors(validationResult: BalanceValidationResult): string[] {
  const { quarterErrors } = validationResult;
  const errors: string[] = [];

  Object.entries(quarterErrors).forEach(([quarter, difference]) => {
    if (difference !== undefined) {
      const quarterLabel = quarter.toUpperCase();
      const diffAmount = Math.abs(difference).toLocaleString();
      const direction = difference > 0 ? "higher" : "lower";
      
      errors.push(
        `${quarterLabel}: Net Financial Assets is ${diffAmount} ${direction} than Closing Balance`
      );
    }
  });

  return errors;
}

/**
 * Check if form data has sufficient data for balance validation (active quarters only)
 */
export function canValidateBalance(formData: FinancialRow[], currentDate: Date = new Date()): boolean {
  const netAssetsRow = formData.find(row => row.id === 'F');
  const closingBalanceRow = formData.find(row => row.id === 'G');
  
  if (!netAssetsRow || !closingBalanceRow) return false;

  // Get active quarters
  const { activeQuarters } = getActiveQuarters(currentDate);
  const quarterMap = { 1: 'q1', 2: 'q2', 3: 'q3', 4: 'q4' } as const;

  // Check if at least one active quarter has data in either section
  return activeQuarters.some(quarterNum => {
    const quarter = quarterMap[quarterNum];
    const hasNetAssets = (netAssetsRow[quarter] || 0) !== 0;
    const hasClosingBalance = (closingBalanceRow[quarter] || 0) !== 0;
    return hasNetAssets || hasClosingBalance;
  });
} 