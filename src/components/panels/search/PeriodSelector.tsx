
import React from 'react';

const PeriodSelector: React.FC = () => {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-700 font-medium">Período</label>
      <select
        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indexa-purple focus:border-indexa-purple focus:outline-none appearance-none shadow-sm transition-all duration-200"
        defaultValue="30"
      >
        <option value="30">30 dias</option>
        <option value="60">60 dias</option>
        <option value="90">90 dias</option>
      </select>
    </div>
  );
};

export default PeriodSelector;
