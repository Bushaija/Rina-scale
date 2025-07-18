"use client";

import React from 'react';
import { formatCurrency } from '@/features/planning/utils';

export type NetAssetRow = {
  description: string;
  note: number | null;
  current: number | null;
  previous: number | null;
  isTotal: boolean;
  isSubtotal: boolean;
};

interface Props {
  initialData: NetAssetRow[];
  currentPeriodLabel?: string;
  previousPeriodLabel?: string;
}

export function ChangesInNetAssetsStatement({ initialData, currentPeriodLabel = '', previousPeriodLabel = '' }: Props) {
  if (!initialData) return null;

  const renderRow = (row: NetAssetRow, idx: number) => {
    const rowClass = `${row.isSubtotal ? 'font-semibold' : ''} ${row.isTotal ? 'font-bold border-t-2' : ''}`;
    return (
      <tr key={idx} className={rowClass}>
        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-700 w-2/5">{row.description}</td>
        <td className="px-6 py-2 text-center text-sm text-gray-700">{row.note ?? ''}</td>
        <td className="px-6 py-2 text-right text-sm text-gray-900">{row.current !== null ? formatCurrency(row.current) : ''}</td>
        <td className="px-6 py-2 text-right text-sm text-gray-900">{row.previous !== null ? formatCurrency(row.previous) : ''}</td>
      </tr>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Description</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{currentPeriodLabel}</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{previousPeriodLabel}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {initialData.map(renderRow)}
        </tbody>
      </table>
    </div>
  );
} 