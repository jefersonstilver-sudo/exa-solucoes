
import React from 'react';
import { ArrowRight, TrendingUp, Clock, Target, Users } from 'lucide-react';

interface PostCardProps {
  title: string;
  beforeText: string;
  afterText: string;
  category: string;
  isActive?: boolean;
  metrics?: {
    roi: string;
    engagement: string;
    timeframe: string;
  };
  icon?: React.ReactNode;
}

const PostCard: React.FC<PostCardProps> = ({ 
  title, 
  beforeText, 
  afterText, 
  category,
  isActive = false,
  metrics,
  icon
}) => {
  return (
    <div className={`relative bg-white rounded-xl p-8 shadow-lg transition-all duration-500 transform group hover:scale-[1.02] hover:shadow-xl border ${
      isActive ? 'ring-2 ring-linkae-royal-blue border-linkae-royal-blue/20' : 'border-gray-200'
    }`}>
      {/* Header com categoria e ícone */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 bg-gradient-to-br from-linkae-royal-blue/10 to-linkae-bright-blue/10 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="inline-flex items-center bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
            {category}
          </div>
        </div>
        <div className="text-2xl font-bold text-linkae-royal-blue opacity-20">
          {isActive ? '●' : '○'}
        </div>
      </div>
      
      {/* Título */}
      <h3 className="text-2xl font-bold text-linkae-dark-blue mb-6 group-hover:text-linkae-royal-blue transition-colors">
        {title}
      </h3>
      
      {/* Métricas visuais */}
      {metrics && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <TrendingUp className="w-5 h-5 text-linkae-bright-blue mx-auto mb-1" />
            <div className="text-sm font-bold text-linkae-dark-blue">{metrics.roi}</div>
            <div className="text-xs text-gray-500">ROI</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Users className="w-5 h-5 text-linkae-cyan-light mx-auto mb-1" />
            <div className="text-sm font-bold text-linkae-dark-blue">{metrics.engagement}</div>
            <div className="text-xs text-gray-500">Engajamento</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Clock className="w-5 h-5 text-linkae-orange mx-auto mb-1" />
            <div className="text-sm font-bold text-linkae-dark-blue">{metrics.timeframe}</div>
            <div className="text-xs text-gray-500">Prazo</div>
          </div>
        </div>
      )}
      
      {/* Antes e Depois estruturado */}
      <div className="space-y-6">
        {/* Antes */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            <div className="text-sm text-red-600 font-semibold uppercase tracking-wide">Antes</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-200">
            <p className="text-sm text-gray-700 leading-relaxed">{beforeText}</p>
          </div>
        </div>
        
        {/* Seta de transformação */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-r from-linkae-royal-blue to-linkae-bright-blue rounded-full p-3 group-hover:scale-110 transition-transform">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>
        
        {/* Depois */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-sm text-green-600 font-semibold uppercase tracking-wide">Depois</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-linkae-bright-blue/5 rounded-lg p-4 border-l-4 border-green-200">
            <p className="text-sm text-linkae-dark-blue leading-relaxed font-medium">{afterText}</p>
          </div>
        </div>
      </div>
      
      {/* Resultado destacado */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-linkae-bright-blue" />
            <span className="text-sm font-medium text-linkae-dark-blue">Resultado</span>
          </div>
          <div className="text-lg font-bold bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light bg-clip-text text-transparent">
            {metrics?.roi || 'Transformação'}
          </div>
        </div>
      </div>
      
      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-linkae-royal-blue/5 to-linkae-bright-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default PostCard;
