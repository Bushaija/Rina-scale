import { NextResponse } from 'next/server';
import { changesInNetAssetsData } from '@/features/reports/data/changes-in-net-assets-data';

export async function GET() {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    return NextResponse.json(changesInNetAssetsData);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch changes in net assets data' }, { status: 500 });
  }
} 