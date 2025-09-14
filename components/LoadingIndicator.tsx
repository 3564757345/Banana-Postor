
import React from 'react';

interface LoadingIndicatorProps {
  step: string;
  progress: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ step, progress }) => {
  return (
    <div className="mt-8 w-full max-w-2xl mx-auto bg-gray-900 border border-brand-pink/30 rounded-xl p-6 shadow-lg text-center">
      <h3 className="text-xl font-semibold text-gray-200 mb-4">Creation in Progress...</h3>
      <div className="relative pt-1">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-brand-pink/20">
          <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-pink transition-all duration-500"></div>
        </div>
      </div>
      <p className="text-gray-400">{step}</p>
    </div>
  );
};

export default LoadingIndicator;