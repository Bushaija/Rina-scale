import { NextResponse } from 'next/server';
import { balanceSheetData } from '@/features/reports/data/balance-sheet-data';

export async function GET() {
  // In a real application, this data would come from a database.
  // We add a delay to simulate network latency.
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    return NextResponse.json(balanceSheetData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch balance sheet data' }, { status: 500 });
  }
} 