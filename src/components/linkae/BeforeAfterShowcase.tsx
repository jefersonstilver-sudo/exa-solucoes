
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ExampleCard } from './ExampleCard';

const BeforeAfterShowcase: React.FC = () => {
  const examples = [
    {
      id: 1,
      type: 'Loja Física',
      location: 'Foz do Iguaçu',
      icon: '🏪',
      before: {
        title: 'Posts genéricos sem personalidade',
        metrics: { engagement: 12, reach: 156, conversion: 0.5 }
      },
      after: {
        title: 'Conexões que vendem para a comunidade local',
        metrics: { engagement: 89, reach: 2890, conversion: 4.2 }
      },
      phrase: 'De posts sem criatividade para conexões que vendem',
      improvement: '+340%',
      accentColor: 'from-blue-500 to-cyan-500'
    },
    {
      id: 2,
      type: 'Clínica Médica',
      location: 'Especializada',
      icon: '⚕️',
      before: {
        title: 'Resultados sem explicação',
        metrics: { engagement: 23, reach: 234, conversion: 1.2 }
      },
      after: {
        title: 'Transparência que gera confiança',
        metrics: { engagement: 234, reach: 4567, conversion: 8.9 }
      },
      phrase: 'De desconfiança para autoridade reconhecida',
      improvement: '+520%',
      accentColor: 'from-green-500 to-emerald-500'
    },
    {
      id: 3,
      type: 'Evento',
      location: 'Paraguai',
      icon: '🎉',
      before: {
        title: 'Divulgação básica',
        metrics: { engagement: 34, reach: 189, conversion: 0.8 }
      },
      after: {
        title: 'Campanhas que geram buzz e antecipação',
        metrics: { engagement: 456, reach: 8934, conversion: 12.3 }
      },
      phrase: 'De divulgação comum para buzz viral',
      improvement: '+780%',
      accentColor: 'from-purple-500 to-pink-500'
    },
    {
      id: 4,
      type: 'Restaurante',
      location: 'Gourmet',
      icon: '🍽️',
      before: {
        title: 'Fotos simples da comida',
        metrics: { engagement: 45, reach: 345, conversion: 1.5 }
      },
      after: {
        title: 'Conteúdos que geram fome emocional',
        metrics: { engagement: 567, reach: 5678, conversion: 9.2 }
      },
      phrase: 'De fotos básicas para fome emocional',
      improvement: '+280%',
      accentColor: 'from-orange-500 to-red-500'
    },
    {
      id: 5,
      type: 'Academia',
      location: 'Personal Training',
      icon: '💪',
      before: {
        title: 'Exercícios sem contexto',
        metrics: { engagement: 28, reach: 278, conversion: 1.1 }
      },
      after: {
        title: 'Narrativas que superam inseguranças',
        metrics: { engagement: 389, reach: 4234, conversion: 7.8 }
      },
      phrase: 'De insegurança para motivação real',
      improvement: '+390%',
      accentColor: 'from-yellow-500 to-orange-500'
    },
    {
      id: 6,
      type: 'Loja Online',
      location: 'E-commerce',
      icon: '🛒',
      before: {
        title: 'Produtos sem contexto',
        metrics: { engagement: 19, reach: 156, conversion: 0.7 }
      },
      after: {
        title: 'Posts visuais que inspiram compras',
        metrics: { engagement: 298, reach: 3456, conversion: 6.4 }
      },
      phrase: 'De produtos esquecidos para compras inspiradas',
      improvement: '+190%',
      accentColor: 'from-indigo-500 to-blue-500'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Exemplos <span className="bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light bg-clip-text text-transparent">Reais</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Veja como transformamos diferentes tipos de negócios com estratégias específicas
          </p>
        </div>

        {/* Grid of Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-[60vh] overflow-y-auto">
          {examples.map((example) => (
            <ExampleCard key={example.id} example={example} />
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light px-8 py-4 rounded-full text-white">
            <TrendingUp className="h-6 w-6" />
            <span className="text-lg font-semibold">6 tipos de negócios</span>
            <span className="text-2xl font-bold">+400%</span>
            <span className="text-lg font-semibold">melhoria média</span>
          </div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mt-6">
            Cada negócio tem suas particularidades. Nossas estratégias são <strong className="text-linkae-bright-blue">personalizadas</strong> para seu setor específico.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterShowcase;
