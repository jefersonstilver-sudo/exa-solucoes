
import React from 'react';

const MinimalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#3C1361] rounded-full animate-spin"></div>
    </div>
  );
};

export default MinimalLoader;
