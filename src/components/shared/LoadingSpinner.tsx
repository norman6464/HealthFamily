'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = '読み込み中...' }) => {
  return (
    <div className="flex justify-center items-center py-8">
      <Loader2 size={20} className="animate-spin text-primary-500 mr-2" />
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
};
