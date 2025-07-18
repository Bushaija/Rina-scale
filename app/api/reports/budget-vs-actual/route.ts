import { NextResponse } from 'next/server';
import { budgetVsActualData } from '@/features/reports/data/budget-vs-actual-data';

export async function GET() {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    return NextResponse.json(budgetVsActualData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch budget vs actual data' }, { status: 500 });
  }
} 