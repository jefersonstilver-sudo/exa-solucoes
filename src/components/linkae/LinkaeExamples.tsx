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
            return (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-full bg-gray-100">
                    <IconComponent className="w-6 h-6 text-[#FF8A80]" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-gray-900">{example.business}</h3>
                    <p className="text-sm text-gray-500">{example.location}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                      <span className="text-sm font-semibold text-gray-600">ANTES</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed pl-5">
                      {example.before}
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                      <span className="text-sm font-semibold text-gray-600">DEPOIS</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed pl-5">
                      {example.after}
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-[#F57C00] mr-2" />
                      <span className="text-sm font-bold text-[#F57C00]">
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