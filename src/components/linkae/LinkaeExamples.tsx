import React from 'react';
import { Store, Users, Utensils, BarChart3 } from 'lucide-react';

const examples = [
  {
    business: "Loja de Roupas",
    location: "Centro de Foz",
    before: "Posts sem criatividade que ninguém comentava",
    after: "Conteúdo que gera conexão emocional e vendas diretas",
    metrics: "850+ curtidas | 45 vendas/mês",
    icon: Store
  },
  {
    business: "Clínica Médica", 
    location: "Vila Portes",
    before: "Dúvidas dos pacientes não eram respondidas online",
    after: "Educação em saúde que gera confiança e autoridade",
    metrics: "420+ curtidas | 35 consultas/mês",
    icon: Users
  },
  {
    business: "Restaurante",
    location: "Jardim São Paulo", 
    before: "Fotos de comida que não despertavam fome emocional",
    after: "Storytelling gastronômico que faz o cliente salivar",
    metrics: "950+ curtidas | Reservas lotadas",
    icon: Utensils
  }
];

const LinkaeExamples: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Transformações Reais
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Veja como nossos clientes saíram de <span className="text-[#FF8A80] font-semibold">"não sei o que postar"</span> para 
            <span className="text-[#F57C00] font-semibold"> resultados mensuráveis</span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {examples.map((example, index) => {
            const IconComponent = example.icon;
            const cardColors = [
              'bg-gradient-to-br from-[#FF8A80]/30 to-[#FF8A80]/20 border-[#FF8A80]/50',
              'bg-gradient-to-br from-[#F57C00]/30 to-[#F57C00]/20 border-[#F57C00]/50',
              'bg-gradient-to-br from-[#FF8A80]/30 to-[#FF8A80]/20 border-[#FF8A80]/50'
            ];
            const iconColors = ['text-[#FF8A80]', 'text-[#F57C00]', 'text-[#FF8A80]'];
            const iconBgs = ['bg-[#FF8A80]/20', 'bg-[#F57C00]/20', 'bg-[#FF8A80]/20'];
            
            return (
              <div key={index} className={`${cardColors[index]} border-2 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                <div className="flex items-center mb-6">
                  <div className={`p-3 rounded-full ${iconBgs[index]}`}>
                    <IconComponent className={`w-6 h-6 ${iconColors[index]}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900">{example.business}</h3>
                    <p className="text-sm text-gray-500 font-medium">{example.location}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm font-bold text-red-700">ANTES</span>
                    </div>
                    <p className="text-gray-800 text-sm leading-relaxed font-medium pl-5">
                      {example.before}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm font-bold text-green-700">DEPOIS</span>
                    </div>
                    <p className="text-gray-800 text-sm leading-relaxed font-medium pl-5">
                      {example.after}
                    </p>
                  </div>
                  
                  <div className={`pt-4 pb-2 px-4 rounded-lg ${iconBgs[index]} border border-current/20`}>
                    <div className="flex items-center justify-center">
                      <BarChart3 className={`w-5 h-5 ${iconColors[index]} mr-2`} />
                      <span className={`text-sm font-bold ${iconColors[index]}`}>
                        {example.metrics}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LinkaeExamples;