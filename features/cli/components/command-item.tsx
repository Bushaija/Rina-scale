import React from 'react';
import { CommandItem as CommandItemType } from '../types/cli';
import { CategoryBadge } from './category-badge';

interface CommandItemProps {
  command: CommandItemType;
  onClick: (example: string) => void;
}

export const CommandItem: React.FC<CommandItemProps> = ({ command, onClick }) => {
  return (
    <div
      className="rounded-md mb-3 border-l-4 border-transparent cursor-pointer"
      onClick={() => onClick(command.example)}
    >
      <CategoryBadge category={command.category} />
      <div className="font-mono text-sm font-semibold text-slate-800 mb-1 group-hover:text-indigo-700">
        {command.name}
      </div>
      <div className="text-sm text-slate-600 mb-2">
        {command.description}
      </div>
      <div className="font-mono text-xs bg-slate-800 text-slate-300 p-4 rounded-md overflow-x-auto">
        {command.example}
      </div>
    </div>
  );
};