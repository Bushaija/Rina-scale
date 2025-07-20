import React from 'react';
import { quickActions } from '../data/commands';

interface QuickActionsProps {
  onActionClick: (command: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 animate-slideUp animation-delay-200">
      <h3 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center">
        <span className="text-3xl mr-2">⚡</span>
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => onActionClick(action.command)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-none rounded-xl px-6 py-4 text-sm font-semibold cursor-pointer transition-all duration-300 text-center hover:transform hover:translate-y-1 hover:shadow-lg hover:shadow-indigo-500/30 active:translate-y-0"
          >
            {action.name}
          </button>
        ))}
      </div>
    </div>
  );
};