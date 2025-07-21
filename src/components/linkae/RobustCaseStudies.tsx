
import React, { useState } from 'react';
import { Filter, TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react';
import CaseStudyCard from './CaseStudyCard';

const RobustCaseStudies: React.FC = () => {
  const [activeCase, setActiveCase] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const caseStudies = [
    {
      id: 1,
      client: {
        name: 'Boutique Elegance',
        industry: 'E-commerce Moda',
        location: 'São Paulo',
        avatar: '👗'
      },
      period: 'Mar - Jun 2024',
      challenge: 'Concorrência acirrada com grandes marketplaces e baixa conversão orgânica',
      taccohStrategy: ['C', 'O', 'H'],
      results: {
        roi: '480%',
        conversion: '12.3%',
        revenue: 'R$ 180k/mês',
        timeline: '4 meses'
      },
      testimonial: {
        text: 'Em 4 meses saímos de R$ 15k para R$ 180k mensais. O T.A.C.C.O.H. revolucionou nossa estratégia.',
        author: 'Marina Silva',
        position: 'CEO & Fundadora'
      },
      metrics: {
        before: 'R$ 15k',
        after: 'R$ 180k',
        growth: '+1.100%'
      },
      color: 'from-pink-500 to-rose-600'
    },
    {
      id: 2,
      client: {
        name: 'Clínica Renova',
        industry: 'Estética & Saúde',
        location: 'Rio de Janeiro',
        avatar: '✨'
      },
      period: 'Jan - Abr 2024',
      challenge: 'Baixa credibilidade online e dificuldade em justificar preços premium',
      taccohStrategy: ['T', 'A', 'C'],
      results: {
        roi: '320%',
        conversion: '18.7%',
        revenue: 'R$ 95k/mês',
        timeline: '3 meses'
      },
      testimonial: {
        text: 'Agora temos lista de espera de 3 meses. A autoridade construída nos posicionou como referência.',
        author: 'Dr. Carlos Mendes',
        position: 'Diretor Médico'
      },
      metrics: {
        before: '23 pac.',
        after: '156 pac.',
        growth: '+578%'
      },
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 3,
      client: {
        name: 'Osteria Famiglia',
        industry: 'Gastronomia',
        location: 'Curitiba',
        avatar: '🍝'
      },
      period: 'Fev - Mai 2024',
      challenge: 'Restaurante familiar competindo com grandes redes e franquias',
      taccohStrategy: ['C', 'H', 'O'],
      results: {
        roi: '275%',
        conversion: '34.2%',
        revenue: 'R$ 68k/mês',
        timeline: '3 meses'
      },
      testimonial: {
        text: 'Fins de semana com lotação 300%. Nossa história familiar conquistou corações e paladares.',
        author: 'Giovanni Rossi',
        position: 'Chef & Proprietário'
      },
      metrics: {
        before: '40%',
        after: '95%',
        growth: '+138%'
      },
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 4,
      client: {
        name: 'InnovaConsult',
        industry: 'Consultoria B2B',
        location: 'Porto Alegre',
        avatar: '💼'
      },
      period: 'Out 2023 - Fev 2024',
      challenge: 'Dificuldade em comunicar valor e fechar contratos de alto ticket',
      taccohStrategy: ['T', 'A', 'O'],
      results: {
        roi: '890%',
        conversion: '28.5%',
        revenue: 'R$ 2.1M',
        timeline: '5 meses'
      },
      testimonial: {
        text: 'R$ 2.1M em novos contratos. O storytelling técnico nos diferenciou completamente no mercado.',
        author: 'Ana Beatriz',
        position: 'Sócia-Diretora'
      },
      metrics: {
        before: 'R$ 45k',
        after: 'R$ 420k',
        growth: '+833%'
      },
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 5,
      client: {
        name: 'TechSummit 2024',
        industry: 'Eventos',
        location: 'Belo Horizonte',
        avatar: '🎪'
      },
      period: 'Dez 2023 - Mar 2024',
      challenge: 'Vender 8.500 ingressos para evento de nicho em mercado saturado',
      taccohStrategy: ['H', 'C', 'O'],
      results: {
        roi: '450%',
        conversion: '23.8%',
        revenue: 'R$ 1.7M',
        timeline: '4 meses'
      },
      testimonial: {
        text: 'Sold out em 48h após o buzz viral. O hype estratégico superou todas as expectativas.',
        author: 'Pedro Santos',
        position: 'Organizador Geral'
      },
      metrics: {
        before: '0 vendas',
        after: '8.500 vendas',
        growth: '+∞'
      },
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 6,
      client: {
        name: 'CloudFlow SaaS',
        industry: 'Software B2B',
        location: 'Florianópolis',
        avatar: '☁️'
      },
      period: 'Nov 2023 - Abr 2024',
      challenge: 'Explicar produto complexo e construir pipeline de vendas qualificado',
      taccohStrategy: ['T', 'A', 'C'],
      results: {
        roi: '650%',
        conversion: '31.2%',
        revenue: 'R$ 5.2M',
        timeline: '6 meses'
      },
      testimonial: {
        text: 'Pipeline de R$ 5.2M construído com conteúdo técnico que educa e converte simultaneamente.',
        author: 'Lucas Ferreira',
        position: 'VP de Marketing'
      },
      metrics: {
        before: 'R$ 180k',
        after: 'R$ 867k',
        growth: '+381%'
      },
      color: 'from-cyan-500 to-blue-600'
    }
  ];

  const industries = [
    { id: 'all', name: 'Todos os Setores', count: caseStudies.length },
    { id: 'ecommerce', name: 'E-commerce', count: 1 },
    { id: 'saude', name: 'Saúde', count: 1 },
    { id: 'gastronomia', name: 'Gastronomia', count: 1 },
    { id: 'consultoria', name: 'Consultoria', count: 1 },
    { id: 'eventos', name: 'Eventos', count: 1 },
    { id: 'saas', name: 'SaaS', count: 1 }
  ];

  const filteredCases = selectedFilter === 'all' 
    ? caseStudies 
    : caseStudies.filter(study => 
        study.client.industry.toLowerCase().includes(selectedFilter.toLowerCase())
      );

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-linkae-dark-blue">
            Casos <span className="bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light bg-clip-text text-transparent">Reais</span> de Sucesso
          </h2>
          <p className="text-lg md:text-xl text-linkae-dark-blue/70 max-w-4xl mx-auto mb-8">
            Resultados verificados e auditados de clientes reais que transformaram seus negócios com nossa metodologia T.A.C.C.O.H.
          </p>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedFilter(industry.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                  selectedFilter === industry.id
                    ? 'bg-linkae-bright-blue text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-linkae-bright-blue hover:text-linkae-bright-blue'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>{industry.name}</span>
                <span className="bg-black/10 px-2 py-0.5 rounded-full text-xs">
                  {industry.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredCases.map((caseStudy, index) => (
            <div key={caseStudy.id} className="min-h-[600px]">
              <CaseStudyCard
                caseData={caseStudy}
                isActive={activeCase === index}
                onClick={() => setActiveCase(index)}
              />
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="h-8 w-8 text-linkae-bright-blue" />
              </div>
              <div className="text-3xl font-bold text-linkae-dark-blue mb-2">+468%</div>
              <div className="text-sm text-gray-600">ROI Médio</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-center mb-3">
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-3xl font-bold text-linkae-dark-blue mb-2">24.8%</div>
              <div className="text-sm text-gray-600">Conversão Média</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-center mb-3">
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-3xl font-bold text-linkae-dark-blue mb-2">R$ 9.8M</div>
              <div className="text-sm text-gray-600">Receita Gerada</div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-center mb-3">
                <span className="text-2xl">🏆</span>
              </div>
              <div className="text-3xl font-bold text-linkae-dark-blue mb-2">100%</div>
              <div className="text-sm text-gray-600">Taxa de Sucesso</div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-linkae-dark-blue to-linkae-royal-blue p-8 md:p-12 rounded-3xl text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Seu negócio pode ser o próximo case de sucesso
            </h3>
            <p className="text-lg mb-8 opacity-90 max-w-3xl mx-auto">
              Cada um desses resultados começou com uma conversa. Descubra como nossa metodologia T.A.C.C.O.H. pode transformar sua estratégia de conteúdo em resultados mensuráveis.
            </p>
            <button className="bg-linkae-cyan-light text-linkae-dark-blue px-8 py-4 rounded-2xl font-bold hover:shadow-lg hover:bg-linkae-bright-blue hover:text-white transition-all inline-flex items-center gap-3 group">
              <span>Criar meu próximo case de sucesso</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RobustCaseStudies;
