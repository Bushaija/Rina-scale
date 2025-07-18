export type TemplateLine = {
    lineItem: string;
    eventCodes: string[];
    displayOrder: number;
    isTotalLine?: boolean;
    isSubtotalLine?: boolean;
  };
  
  export const revenueExpenditureTemplates: TemplateLine[] = [
      // revenues
      { lineItem: '1. REVENUES', eventCodes: [], displayOrder: 1, isSubtotalLine: false },
      { lineItem: '1.1 Revenue from non-exchange', eventCodes: [], displayOrder: 2, isSubtotalLine: false },
      { lineItem: 'Tax revenue', eventCodes: ['TAX_REVENUE'], displayOrder: 3 },
      { lineItem: 'Grants', eventCodes: ['GRANTS'], displayOrder: 4 },
      { lineItem: 'Transfers from central treasury', eventCodes: ['TRANSFERS_CENTRAL_TREASURY'], displayOrder: 5 },
      { lineItem: 'Transfers from public entities', eventCodes: ['TRANSFERS_PUBLIC_ENTITIES'], displayOrder: 6 },
      { lineItem: 'Fines, penalties and licences', eventCodes: ['FINES_PENALTIES_LICENSES'], displayOrder: 7 },
  
      { lineItem: '1.2 Revenue from exchange transactions', eventCodes: [], displayOrder: 8, isSubtotalLine: false },
      { lineItem: 'Property income', eventCodes: ['PROPERTY_INCOME'], displayOrder: 9 },
      { lineItem: 'Sales of goods and services', eventCodes: ['SALES_GOODS_SERVICES'], displayOrder: 10 },
      { lineItem: 'Proceeds from sale of capital items', eventCodes: ['PROCEEDS_SALE_CAPITAL'], displayOrder: 11 },
      { lineItem: 'Other revenue', eventCodes: ['OTHER_REVENUE'], displayOrder: 12 },
  
      { lineItem: '1.3 Borrowings', eventCodes: [], displayOrder: 13, isSubtotalLine: false },
      { lineItem: 'Domestic borrowings', eventCodes: ['DOMESTIC_BORROWINGS'], displayOrder: 14 },
      { lineItem: 'External borrowings', eventCodes: ['EXTERNAL_BORROWINGS'], displayOrder: 15 },
  
      { lineItem: 'TOTAL REVENUE', eventCodes: [], displayOrder: 16, isTotalLine: true },
  
      // expenses
      { lineItem: '2. EXPENSES', eventCodes: [], displayOrder: 17, isSubtotalLine: false },
      { lineItem: 'Compensation of employees', eventCodes: ['COMPENSATION_EMPLOYEES'], displayOrder: 18 },
      { lineItem: 'Goods and services', eventCodes: ['GOODS_SERVICES'], displayOrder: 19 },
      { lineItem: 'Grants and other transfers', eventCodes: ['GRANTS_TRANSFERS'], displayOrder: 20 },
      { lineItem: 'Subsidies', eventCodes: ['SUBSIDIES'], displayOrder: 21 },
      { lineItem: 'Social assistance', eventCodes: ['SOCIAL_ASSISTANCE'], displayOrder: 22 },
      { lineItem: 'Finance costs', eventCodes: ['FINANCE_COSTS'], displayOrder: 23 },
      { lineItem: 'Acquisition of fixed assets', eventCodes: ['ACQUISITION_FIXED_ASSETS'], displayOrder: 24 },
      { lineItem: 'Repayment of borrowings', eventCodes: ['REPAYMENT_BORROWINGS'], displayOrder: 25 },
      { lineItem: 'Other expenses', eventCodes: ['OTHER_EXPENSES'], displayOrder: 26 },
      { lineItem: 'TOTAL EXPENSES', eventCodes: [], displayOrder: 27, isTotalLine: true },
  
      // surplus/deficit
      { lineItem: '3. SURPLUS / (DEFICIT) FOR THE PERIOD', eventCodes: [], displayOrder: 28, isTotalLine: true },
  ];
  
  export const assetsAndLiabilitiesTemplates: TemplateLine[] = [
      // assets
      { lineItem: '1. ASSETS', eventCodes: [], displayOrder: 1, isSubtotalLine: true },
      { lineItem: '1.1 Current assets', eventCodes: [], displayOrder: 2, isSubtotalLine: true },
      { lineItem: 'Cash and cash equivalents', eventCodes: ['CASH_EQUIVALENTS_BEGIN', 'CASH_EQUIVALENTS_END'], displayOrder: 3 },
      { lineItem: 'Receivables from exchange transactions', eventCodes: ['RECEIVABLES_EXCHANGE', 'RECEIVABLES_NON_EXCHANGE'], displayOrder: 4 },
      { lineItem: 'Advance payments', eventCodes: ['ADVANCE_PAYMENTS'], displayOrder: 5 },
      { lineItem: 'Total current assets', eventCodes: [], displayOrder: 6, isTotalLine: true },
  
      { lineItem: '1.2 Non-current assets', eventCodes: [], displayOrder: 7, isSubtotalLine: true },
      { lineItem: 'Direct investments', eventCodes: ['DIRECT_INVESTMENTS'], displayOrder: 8 },
      { lineItem: 'Total non-current assets', eventCodes: [], displayOrder: 9, isTotalLine: true },
  
      { lineItem: 'Total assets (A)', eventCodes: [], displayOrder: 10, isTotalLine: true },
  
      // liabilities
      { lineItem: '2. LIABILITIES', eventCodes: [], displayOrder: 11, isSubtotalLine: true },
      { lineItem: '2.1 Current liabilities', eventCodes: [], displayOrder: 12, isSubtotalLine: true },
      { lineItem: 'Payables', eventCodes: ['PAYABLES'], displayOrder: 13 },
      { lineItem: 'Payments received in advance', eventCodes: ['PAYMENTS_RECEIVED_ADVANCE'], displayOrder: 14 },
      { lineItem: 'Retained performance securities', eventCodes: ['RETAINED_PERFORMANCE_SECURITIES'], displayOrder: 15 },
      { lineItem: 'Total current liabilities', eventCodes: [], displayOrder: 16, isTotalLine: true },
  
      { lineItem: '2.2 Non-current liabilities', eventCodes: [], displayOrder: 17, isSubtotalLine: true },
      { lineItem: 'Direct borrowings', eventCodes: ['DIRECT_BORROWINGS'], displayOrder: 18 },
      { lineItem: 'Total non-current liabilities', eventCodes: [], displayOrder: 19, isTotalLine: true },
  
      { lineItem: 'Total liabilities (B)', eventCodes: [], displayOrder: 20, isTotalLine: true },
  
      // net assets
      { lineItem: 'Net assets C = A - B', eventCodes: [], displayOrder: 21, isTotalLine: true },
  
      // equity
      { lineItem: '3. REPRESENTED BY', eventCodes: [], displayOrder: 22, isSubtotalLine: true },  
      { lineItem: 'Accumulated surplus/(deficits)', eventCodes: ['ACCUMULATED_SURPLUS_DEFICITS'], displayOrder: 23 },
      { lineItem: 'Prior year adjustments', eventCodes: ['PRIOR_YEAR_ADJUSTMENTS'], displayOrder: 24 },
      { lineItem: 'Surplus/deficits of the period', eventCodes: [], displayOrder: 25 },
      { lineItem: 'Total Net Assets', eventCodes: [], displayOrder: 26, isTotalLine: true },
  ];
  
  export const cashFlowTemplates: TemplateLine[] = [
      // operating activities
      { lineItem: 'CASH FLOW FROM OPERATING ACTIVITIES', eventCodes: [], displayOrder: 1, isSubtotalLine: true },
      
      // revenue
      { lineItem: '1. REVENUE', eventCodes: [], displayOrder: 2, isSubtotalLine: false },
      { lineItem: '1.1 Revenue from non-exchange transactions', eventCodes: [], displayOrder: 3, isSubtotalLine: false },
      { lineItem: 'Tax revenue', eventCodes: ['TAX_REVENUE'], displayOrder: 4 },
      { lineItem: 'Grants', eventCodes: ['GRANTS'], displayOrder: 5 },
      { lineItem: 'Transfers from central treasury', eventCodes: ['TRANSFERS_CENTRAL_TREASURY'], displayOrder: 6 },
      { lineItem: 'Transfers from public entities', eventCodes: ['TRANSFERS_PUBLIC_ENTITIES'], displayOrder: 7 },
      { lineItem: 'Fines, penalties, and licenses', eventCodes: ['FINES_PENALTIES_LICENSES'], displayOrder: 8 },
  
      { lineItem: '1.2 Revenue from exchange transactions', eventCodes: [], displayOrder: 9, isSubtotalLine: false },
      { lineItem: 'Property income', eventCodes: ['PROPERTY_INCOME'], displayOrder: 10 },
      { lineItem: 'Sales of goods and services', eventCodes: ['SALES_GOODS_SERVICES'], displayOrder: 11 },
      { lineItem: 'Other revenue', eventCodes: ['OTHER_REVENUE'], displayOrder: 13 },
  
      // expenses
      { lineItem: '2. EXPENSES', eventCodes: [], displayOrder: 14, isSubtotalLine: false },
      { lineItem: 'Compensation of employees', eventCodes: ['COMPENSATION_EMPLOYEES'], displayOrder: 15 },
      { lineItem: 'Goods and services', eventCodes: ['GOODS_SERVICES'], displayOrder: 16 },
      { lineItem: 'Grants and transfers', eventCodes: ['GRANTS_TRANSFERS'], displayOrder: 17 },
      { lineItem: 'Subsidies', eventCodes: ['SUBSIDIES'], displayOrder: 18 },
      { lineItem: 'Social assistance', eventCodes: ['SOCIAL_ASSISTANCE'], displayOrder: 19 },
      { lineItem: 'Finance costs', eventCodes: ['FINANCE_COSTS'], displayOrder: 20 },
      { lineItem: 'Other expenses', eventCodes: ['OTHER_EXPENSES'], displayOrder: 21 },
  
      // adjustments
      { lineItem: 'Adjusted for:', eventCodes: [], displayOrder: 22, isSubtotalLine: false },
      { lineItem: 'Changes in receivables', eventCodes: [], displayOrder: 23 },
      { lineItem: 'Changes in payables', eventCodes: [], displayOrder: 24 },
      { lineItem: 'Prior year adjustments', eventCodes: ['PRIOR_YEAR_ADJUSTMENTS'], displayOrder: 25 },
      { lineItem: 'Net cash flows from operating activities', eventCodes: [], displayOrder: 26, isTotalLine: true },
  
      // investing activities
      { lineItem: 'CASH FLOW FROM INVESTING ACTIVITIES', eventCodes: [], displayOrder: 27, isSubtotalLine: false },
      { lineItem: 'Acquisition of fixed assets', eventCodes: ['ACQUISITION_FIXED_ASSETS'], displayOrder: 28 },
      { lineItem: 'Proceeds from sale of capital items', eventCodes: ['PROCEEDS_SALE_CAPITAL'], displayOrder: 29 }, // TODO: check if this is correct
      { lineItem: 'Purchase shares', eventCodes: [], displayOrder: 30 },
      { lineItem: 'Net cash flows from investing activities', eventCodes: [], displayOrder: 31, isTotalLine: true },
  
      // financing activities
      { lineItem: 'CASH FLOW FROM FINANCING ACTIVITIES', eventCodes: [], displayOrder: 32, isSubtotalLine: false },
      { lineItem: 'Proceeds from borrowings', eventCodes: ['DOMESTIC_BORROWINGS', 'EXTERNAL_BORROWINGS'], displayOrder: 33 },
      { lineItem: 'Repayment of borrowings', eventCodes: ['REPAYMENT_BORROWINGS'], displayOrder: 34 },
      { lineItem: 'Net cash flows from financing activities', eventCodes: [], displayOrder: 35, isTotalLine: true },
  
      // net change and reconciliation
      { lineItem: 'Net increase/decrease in cash and cash equivalents', eventCodes: [], displayOrder: 36, isTotalLine: true },
      { lineItem: 'Cash and cash equivalents at beginning of period', eventCodes: ['CASH_EQUIVALENTS_BEGIN'], displayOrder: 37 },
      { lineItem: 'Cash and cash equivalents at end of period', eventCodes: ['CASH_EQUIVALENTS_END'], displayOrder: 38 },
  ];
  
  export const changeInNetAssetsTemplate: TemplateLine[] = [
      // Opening balances
      { lineItem: 'Balances as at 30th June 2023', eventCodes: [], displayOrder: 1, isSubtotalLine: true },
      
      // Prior year adjustments (2023-2024)
      { lineItem: 'Prior year adjustments (2023-2024):', eventCodes: [], displayOrder: 2, isSubtotalLine: true },
      { lineItem: 'Cash and cash equivalent (2023-2024)', eventCodes: ['CASH_EQUIVALENTS_BEGIN'], displayOrder: 3 },
      { lineItem: 'Receivables and other financial assets (2023-2024)', eventCodes: ['RECEIVABLES_EXCHANGE', 'RECEIVABLES_NON_EXCHANGE'], displayOrder: 4 },
      { lineItem: 'Investments (2023-2024)', eventCodes: ['DIRECT_INVESTMENTS'], displayOrder: 5 },
      { lineItem: 'Payables and other liabilities (2023-2024)', eventCodes: ['PAYABLES'], displayOrder: 6 },
      { lineItem: 'Borrowing (2023-2024)', eventCodes: ['DIRECT_BORROWINGS'], displayOrder: 7 },
      { lineItem: 'Net surplus/(Deficit) for the financial year (2023-2024)', eventCodes: [], displayOrder: 8 },
      { lineItem: 'Balance as at 30th June 2024', eventCodes: [], displayOrder: 9, isTotalLine: true },
  
      // Beginning of new period
      { lineItem: 'Balance as at 01st July 2024', eventCodes: [], displayOrder: 10, isSubtotalLine: true },
      
      // Current period adjustments (2024-2025)
      { lineItem: 'Prior year adjustments (2024-2025):', eventCodes: [], displayOrder: 11, isSubtotalLine: true },
      { lineItem: 'Cash and cash equivalent (2024-2025)', eventCodes: ['CASH_EQUIVALENTS_BEGIN'], displayOrder: 12 },
      { lineItem: 'Receivables and other financial assets (2024-2025)', eventCodes: ['RECEIVABLES_EXCHANGE', 'RECEIVABLES_NON_EXCHANGE'], displayOrder: 13 },
      { lineItem: 'Investments (2024-2025)', eventCodes: ['DIRECT_INVESTMENTS'], displayOrder: 14 },
      { lineItem: 'Payables and other liabilities (2024-2025)', eventCodes: ['PAYABLES'], displayOrder: 15 },
      { lineItem: 'Borrowing (2024-2025)', eventCodes: ['DIRECT_BORROWINGS'], displayOrder: 16 },
      { lineItem: 'Net surplus/(Deficit) for the financial year (2024-2025)', eventCodes: [], displayOrder: 17 },
      
      // Closing balances
      { lineItem: 'Balance as at 30th March 2025', eventCodes: [], displayOrder: 18, isTotalLine: true },
  ];
   
  export const budgetVsActualAmountsTemplate: TemplateLine[] = [
      { lineItem: '1. RECEIPTS', eventCodes: [], displayOrder: 1, isSubtotalLine: true },
      { lineItem: 'Tax revenue', eventCodes: ['TAX_REVENUE'], displayOrder: 2 },
      { lineItem: 'Grants and transfers', eventCodes: ['GRANTS'], displayOrder: 3 },
      { lineItem: 'Other revenue', eventCodes: ['OTHER_REVENUE'], displayOrder: 4 },
      { lineItem: 'Transfers from public entities', eventCodes: ['TRANSFERS_PUBLIC_ENTITIES'], displayOrder: 5 },
      { lineItem: 'Total Receipts', eventCodes: ['TOTAL_RECEIPTS'], displayOrder: 6, isTotalLine: true },
  
      { lineItem: '2. EXPENDITURES', eventCodes: [], displayOrder: 7, isSubtotalLine: true },
      { lineItem: 'Compensation of employees', eventCodes: ['COMPENSATION_EMPLOYEES'], displayOrder: 8 },
      { lineItem: 'Goods and services', eventCodes: ['GOODS_SERVICES_PLANNING'], displayOrder: 9 },
      { lineItem: 'Finance cost', eventCodes: ['FINANCE_COSTS'], displayOrder: 10 },
      { lineItem: 'Subsidies', eventCodes: ['SUBSIDIES'], displayOrder: 11 },
      { lineItem: 'Grants and other transfers', eventCodes: ['GRANTS_TRANSFERS'], displayOrder: 12 },
      { lineItem: 'Social assistance', eventCodes: ['SOCIAL_ASSISTANCE'], displayOrder: 13 },
      { lineItem: 'Other expenses', eventCodes: ['OTHER_EXPENSES'], displayOrder: 14 },
      { lineItem: 'Total Expenditures', eventCodes: ['TOTAL_PAYMENTS'], displayOrder: 15, isTotalLine: true },
      { lineItem: 'Total non-financial assets', eventCodes: ['TOTAL_NON_FINANCIAL_ASSETS'], displayOrder: 16 },
      { lineItem: 'Net lending / borrowing', eventCodes: [], displayOrder: 17, isTotalLine: true },
      { lineItem: 'Total net incurrence of liabilities', eventCodes: ['TOTAL_NET_LIABILITY_INCURRANCE'], displayOrder: 18, isTotalLine: true },
  ];
  
  
   