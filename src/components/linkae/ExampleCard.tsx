
import React, { useState } from 'react';
import { TrendingUp, Users, Heart, Eye } from 'lucide-react';

interface ExampleData {
  id: number;
  type: string;
  location: string;
  icon: string;
  before: {
    title: string;
    metrics: {
      engagement: number;
      reach: number;
      conversion: number;
    };
  };
  after: {
    title: string;
    metrics: {
      engagement: number;
      reach: number;
      conversion: number;
    };
  };
  phrase: string;
  improvement: string;
  accentColor: string;
}

interface ExampleCardProps {
  example: ExampleData;
}

export const ExampleCard: React.FC<ExampleCardProps> = ({ example }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${example.accentColor} p-4 text-white`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">{example.icon}</div>
          <div>
            <h3 className="font-bold text-lg">{example.type}</h3>
            <p className="text-sm opacity-90">{example.location}</p>
          </div>
        </div>
      </div>

      {/* Before/After Comparison */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Before */}
          <div className="text-center">
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 mb-2">
              <div className="text-red-600 font-semibold text-xs mb-1">ANTES</div>
              <div className="text-xs text-red-700 mb-2">{example.before.title}</div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Heart className="h-3 w-3 text-red-400" />
                  <span className="text-red-600">{example.before.metrics.engagement}</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Eye className="h-3 w-3 text-red-400" />
                  <span className="text-red-600">{example.before.metrics.reach}</span>
                </div>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="text-center">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 mb-2">
              <div className="text-green-600 font-semibold text-xs mb-1">DEPOIS</div>
              <div className="text-xs text-green-700 mb-2">{example.after.title}</div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Heart className="h-3 w-3 text-green-500" />
                  <span className="text-green-600 font-semibold">{example.after.metrics.engagement}</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-xs">
                  <Eye className="h-3 w-3 text-green-500" />
                  <span className="text-green-600 font-semibold">{example.after.metrics.reach}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phrase */}
        <div className="text-center mb-3">
          <p className="text-sm font-medium text-gray-700 leading-tight">
            {example.phrase}
          </p>
        </div>

        {/* Improvement Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light px-4 py-2 rounded-full text-white">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-bold">{example.improvement}</span>
          </div>
        </div>

        {/* Hover Details */}
        {isHovered && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500">Engajamento</div>
                <div className="text-sm font-semibold text-gray-700">
                  +{((example.after.metrics.engagement - example.before.metrics.engagement) / example.before.metrics.engagement * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500">Alcance</div>
                <div className="text-sm font-semibold text-gray-700">
                  +{((example.after.metrics.reach - example.before.metrics.reach) / example.before.metrics.reach * 100).toFixed(0)}%
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="text-xs text-gray-500">Conversão</div>
                <div className="text-sm font-semibold text-gray-700">
                  +{((example.after.metrics.conversion - example.before.metrics.conversion) / example.before.metrics.conversion * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
