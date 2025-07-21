
import React, { useState } from 'react';
import { TrendingUp, Store, Stethoscope, Calendar, ChefHat, Dumbbell, ShoppingBag } from 'lucide-react';

interface ExampleData {
  id: number;
  type: string;
  category: string;
  location: string;
  icon: string;
  phrase: string;
  growth: string;
  metrics: {
    primary: {
      label: string;
      value: string;
    };
    secondary: {
      label: string;
      value: string;
    };
  };
}

interface ExampleCardProps {
  example: ExampleData;
}

const iconMap = {
  Store,
  Stethoscope,
  Calendar,
  ChefHat,
  Dumbbell,
  ShoppingBag
};

export const ExampleCard: React.FC<ExampleCardProps> = ({ example }) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = iconMap[example.icon as keyof typeof iconMap] || Store;

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-linkae-bright-blue/20 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-linkae-bright-blue/10 to-linkae-cyan-light/10 rounded-lg flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-linkae-bright-blue" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{example.type}</h3>
            <p className="text-sm text-gray-500 font-medium">{example.category} • {example.location}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        {/* Phrase */}
        <div className="mb-6">
          <p className="text-base font-medium text-gray-700 leading-relaxed">
            {example.phrase}
          </p>
        </div>

        {/* Growth Badge */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light px-4 py-2 rounded-full text-white">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-bold">{example.growth}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">
              {example.metrics.primary.label}
            </div>
            <div className="text-lg font-bold text-gray-900">
              {example.metrics.primary.value}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">
              {example.metrics.secondary.label}
            </div>
            <div className="text-lg font-bold text-gray-900">
              {example.metrics.secondary.value}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect - Subtle Border Highlight */}
      <div className={`absolute inset-0 rounded-xl transition-all duration-300 pointer-events-none ${
        isHovered ? 'ring-2 ring-linkae-bright-blue/20' : ''
      }`} />
    </div>
  );
};
