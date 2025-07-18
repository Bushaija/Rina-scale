import { NextResponse } from 'next/server';
import { revenueExpenditureData } from '@/features/reports/data/revenue-expenditure-data';

export async function GET() {
  // In a real application, you would fetch this data from a database
  // or another backend service.
  // We'll add a short delay to simulate network latency.
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Return the mock data
    return NextResponse.json(revenueExpenditureData);
  } catch (error) {
    // Handle potential errors
    return NextResponse.json({ error: 'Failed to fetch revenue and expenditure data' }, { status: 500 });
  }
} 