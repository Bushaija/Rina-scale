import React from 'react';
import { StatusIndicator } from './status-indicator';

export const Header: React.FC = () => {
  return (
    <div className="text-center text-white mb-12 animate-fadeInDown">
      <h1 className="text-3xl font-bold mb-2 text-shadow-lg">
        Admin CLI commands
      </h1>
      <p className="text-md opacity-90">
        Interactive command explorer for your database operations
        <StatusIndicator />
      </p>
    </div>
  );
};