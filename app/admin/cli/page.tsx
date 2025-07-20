'use client';

import React from 'react';
import { commandSections } from '@/features/cli/data/commands';
import { useClipboard } from '@/features/cli/hooks/use-clip-board';
import { useKeyboardShortcuts } from '@/features/cli/hooks/use-keyboard-shortcuts';
import { Header } from '@/features/cli/components/header';
import { CommandSection } from '@/features/cli/components/command-section';
import { QuickActions } from '@/features/cli/components/quick-actions';
import { CopyNotification } from '@/features/cli/components/copy-notification';

export default function CLIDashboard() {
  const { copyToClipboard, copied } = useClipboard();
  
  useKeyboardShortcuts(copyToClipboard);

  return (
    <div className="min-h-screen bg-gray-900 text-slate-900 leading-relaxed">
      <div className="max-w-7xl mx-auto p-8">
        <Header />
        
        <div className="flex flex-col  gap-2 mb-8">
          {commandSections.map((section) => (
            <CommandSection
              key={section.id}
              section={section}
              onCommandClick={copyToClipboard}
            />
          ))}
        </div>

        <QuickActions onActionClick={copyToClipboard} />
      </div>

      <CopyNotification show={copied} />
    </div>
  );
}
