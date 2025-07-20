import React from 'react';

interface CopyNotificationProps {
  show: boolean;
}

export const CopyNotification: React.FC<CopyNotificationProps> = ({ show }) => {
  return (
    <div className={`fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform transition-all duration-300 z-50 ${
      show ? 'translate-x-0 opacity-100' : 'translate-x-96 opacity-0'
    }`}>
      Command copied to clipboard! 📋
    </div>
  );
};