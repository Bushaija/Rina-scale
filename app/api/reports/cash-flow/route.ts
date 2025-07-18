import { NextResponse } from 'next/server';
import { cashFlowData } from '@/features/reports/data/cash-flow-data';

export async function GET() {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    return NextResponse.json(cashFlowData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cash flow data' }, { status: 500 });
  }
} 