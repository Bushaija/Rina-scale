import React from 'react';
import { CommandSection as CommandSectionType } from '../types/cli';
import { CommandItem } from './command-item';

interface CommandSectionProps {
  section: CommandSectionType;
  onCommandClick: (example: string) => void;
}

export const CommandSection: React.FC<CommandSectionProps> = ({ section, onCommandClick }) => {
  return (
    <div className="bg-gray-300 rounded-md p-4 shadow-2xl">
      <div className="flex items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-800">{section.title}</h2>
      </div>
      <div className="space-y-2">
        {section.commands.map((command, index) => (
          <CommandItem
            key={`${section.id}-${index}`}
            command={command}
            onClick={onCommandClick}
          />
        ))}
      </div>
    </div>
  );
};