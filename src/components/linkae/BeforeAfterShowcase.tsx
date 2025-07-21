
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ExampleCard } from './ExampleCard';

const BeforeAfterShowcase: React.FC = () => {
  const examples = [
    {
      id: 1,
      type: 'Loja de Moda',
      category: 'Varejo',
      location: 'Foz do Iguaçu',
      icon: 'Store',
      phrase: 'Conexão local que converte',
      growth: '+240% Vendas',
      metrics: {
        primary: {
          label: 'ROI',
          value: '3.2x'
        },
        secondary: {
          label: 'Timeline',
          value: '3 meses'
        }
      }
    },
    {
      id: 2,
      type: 'Clínica Odontológica',
      category: 'Saúde',
      location: 'Especializada',
      icon: 'Stethoscope',
      phrase: 'Autoridade que gera confiança',
      growth: '+180% Consultas',
      metrics: {
        primary: {
          label: 'Leads',
          value: '156/mês'
        },
        secondary: {
          label: 'Conversão',
          value: '28%'
        }
      }
    },
    {
      id: 3,
      type: 'Festival Cultural',
      category: 'Evento',
      location: 'Paraguai',
      icon: 'Calendar',
      phrase: 'Buzz que antecipa resultados',
      growth: '+320% Ingressos',
      metrics: {
        primary: {
          label: 'Vendas',
          value: 'R$ 85k'
        },
        secondary: {
          label: 'Alcance',
          value: '45k'
        }
      }
    },
    {
      id: 4,
      type: 'Bistrô Gourmet',
      category: 'Gastronomia',
      location: 'Centro',
      icon: 'ChefHat',
      phrase: 'Narrativa que desperta desejo',
      growth: '+150% Reservas',
      metrics: {
        primary: {
          label: 'Bookings',
          value: '89/sem'
        },
        secondary: {
          label: 'Ticket Médio',
          value: 'R$ 78'
        }
      }
    },
    {
      id: 5,
      type: 'Studio Pilates',
      category: 'Fitness',
      location: 'Zona Sul',
      icon: 'Dumbbell',
      phrase: 'Motivação que supera barreiras',
      growth: '+200% Alunos',
      metrics: {
        primary: {
          label: 'Matrículas',
          value: '124/mês'
        },
        secondary: {
          label: 'Retenção',
          value: '87%'
        }
      }
    },
    {
      id: 6,
      type: 'Loja Decoração',
      category: 'E-commerce',
      location: 'Online',
      icon: 'ShoppingBag',
      phrase: 'Visual que inspira compra',
      growth: '+190% Pedidos',
      metrics: {
        primary: {
          label: 'Vendas',
          value: 'R$ 52k'
        },
        secondary: {
          label: 'CAC',
          value: 'R$ 23'
        }
      }
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Casos <span className="bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light bg-clip-text text-transparent">Reais</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transformações comprovadas em diferentes setores com estratégias específicas
          </p>
        </div>

        {/* Grid of Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-h-[60vh] overflow-y-auto pr-2">
          {examples.map((example) => (
            <ExampleCard key={example.id} example={example} />
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-linkae-bright-blue to-linkae-cyan-light px-8 py-4 rounded-full text-white shadow-lg">
            <TrendingUp className="h-6 w-6" />
            <span className="text-lg font-semibold">6 setores</span>
            <span className="text-2xl font-bold">+215%</span>
            <span className="text-lg font-semibold">crescimento médio</span>
          </div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mt-6">
            Cada setor tem suas particularidades. Nossas estratégias são <strong className="text-linkae-bright-blue">personalizadas</strong> para resultados específicos.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterShowcase;
