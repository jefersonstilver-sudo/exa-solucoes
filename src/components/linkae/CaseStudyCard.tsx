
import React from 'react';
import { TrendingUp, Users, DollarSign, Clock, Award, Quote, AlertTriangle } from 'lucide-react';

interface CaseStudyData {
  id: number;
  client: {
    name: string;
    industry: string;
    location: string;
    avatar: string;
  };
  period: string;
  challenge: string;
  taccohStrategy: string[];
  results: {
    roi: string;
    conversion: string;
    revenue: string;
    timeline: string;
  };
  testimonial: {
    text: string;
    author: string;
    position: string;
  };
  metrics: {
    before: string;
    after: string;
    growth: string;
  };
  color: string;
}

interface CaseStudyCardProps {
  caseData: CaseStudyData;
  isActive?: boolean;
  onClick?: () => void;
  getIconComponent: (iconName: string) => React.ComponentType<any>;
}

const CaseStudyCard: React.FC<CaseStudyCardProps> = ({ caseData, isActive, onClick, getIconComponent }) => {
  const IconComponent = getIconComponent(caseData.client.avatar);

  return (
    <div 
      className={`relative bg-white rounded-3xl shadow-lg border-2 transition-all duration-500 cursor-pointer group hover:shadow-2xl hover:scale-105 ${
        isActive ? 'ring-4 ring-linkae-bright-blue/30 border-linkae-bright-blue' : 'border-gray-200 hover:border-linkae-cyan-light'
      }`}
      onClick={onClick}
    >
      {/* Header com Cliente - Usando gradiente neutro */}
      <div className="bg-gradient-to-r from-linkae-dark-blue to-linkae-royal-blue p-6 rounded-t-3xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <IconComponent className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{caseData.client.name}</h3>
              <p className="text-sm opacity-90">{caseData.client.industry} • {caseData.client.location}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">{caseData.period}</span>
          </div>
          
          <div className="flex gap-2">
            {caseData.taccohStrategy.map((strategy, index) => (
              <span key={index} className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                {strategy}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6">
        {/* Desafio */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-red-600 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Desafio
          </h4>
          <p className="text-gray-700 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
            {caseData.challenge}
          </p>
        </div>

        {/* Métricas Before/After */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-900 mb-3">Transformação</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">ANTES</div>
              <div className="text-lg font-bold text-gray-600">{caseData.metrics.before}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-linkae-orange mb-1">CRESCIMENTO</div>
              <div className="text-lg font-bold text-linkae-orange">{caseData.metrics.growth}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-green-600 mb-1">DEPOIS</div>
              <div className="text-lg font-bold text-green-600">{caseData.metrics.after}</div>
            </div>
          </div>
        </div>

        {/* Resultados em Grid - Cores neutras */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">ROI</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{caseData.results.roi}</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-700">Conversão</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{caseData.results.conversion}</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-700">Receita</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{caseData.results.revenue}</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-gray-700">Prazo</span>
            </div>
            <div className="text-xl font-bold text-gray-900">{caseData.results.timeline}</div>
          </div>
        </div>

        {/* Depoimento */}
        <div className="bg-gradient-to-r from-linkae-dark-blue/5 to-linkae-royal-blue/10 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Quote className="h-4 w-4 text-linkae-bright-blue" />
            <span className="text-xs font-semibold text-linkae-dark-blue">Depoimento</span>
          </div>
          <blockquote className="text-sm text-gray-700 italic mb-2">
            "{caseData.testimonial.text}"
          </blockquote>
          <cite className="text-xs text-gray-600 font-medium">
            — {caseData.testimonial.author}, {caseData.testimonial.position}
          </cite>
        </div>
      </div>

      {/* Selo de Verificação */}
      <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
        <Award className="h-3 w-3" />
        Verificado
      </div>
    </div>
  );
};

export default CaseStudyCard;
