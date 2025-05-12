
import React from 'react';

const DatePicker: React.FC = () => {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-700 font-medium">Data de início</label>
      <input
        type="date"
        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none shadow-sm transition-all duration-200"
      />
    </div>
  );
};

export default DatePicker;
