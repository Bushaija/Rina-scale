import React from 'react';
import { CommandItem } from '../types/cli';

interface CategoryBadgeProps {
  category: CommandItem['category'];
}

const categoryColors: Record<CommandItem['category'], string> = {
  Create: 'bg-gradient-to-r from-green-500 to-emerald-500',
  Query: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  Report: 'bg-gradient-to-r from-purple-500 to-violet-500',
  Bulk: 'bg-gradient-to-r from-orange-500 to-amber-500',
  Validate: 'bg-gradient-to-r from-red-500 to-rose-500',
  Cleanup: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  Info: 'bg-gradient-to-r from-indigo-500 to-blue-500',
  Demo: 'bg-gradient-to-r from-pink-500 to-rose-500',
  Help: 'bg-gradient-to-r from-gray-500 to-slate-500',
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  return (
    <span className={`inline-block text-white text-xs font-semibold px-2 py-1 rounded-md mb-2 uppercase tracking-wider ${categoryColors[category]}`}>
      {category}
    </span>
  );
};