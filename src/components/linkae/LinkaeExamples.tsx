import React, { useState } from 'react';
import { TrendingUp, Users, ShoppingCart, Play, ArrowRight } from 'lucide-react';

const LinkaeExamples: React.FC = () => {
  const examples = [
    {
      business: "Loja de Roupas",
      before: "Posts sem criatividade",
      after: "850+ curtidas e 45 vendas/mês",
      icon: "👗"
    },
    {
      business: "Clínica Médica", 
      before: "Dúvidas não respondidas",
      after: "420+ curtidas e 35 consultas/mês",
      icon: "🏥"
    },
    {
      business: "Restaurante",
      before: "Sem fome emocional",
      after: "950+ curtidas e reservas lotadas",
      icon: "🍽️"
    },
    {
      business: "Evento/Festa",
      before: "Sem buzz ou expectativa", 
      after: "1.2k+ curtidas e 95% ocupação",
      icon: "🎉"
    }
  ];

  return (
    <section className="h-[60vh] flex items-center justify-center bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Transformações <span className="text-[#FF8A80]">Reais</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Veja como nossos clientes saíram de "não sei o que postar" para resultados mensuráveis
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {examples.map((example, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-center">
                <div className="text-3xl mb-3">{example.icon}</div>
                <h3 className="font-bold text-lg text-gray-900 mb-4">{example.business}</h3>
                
                <div className="space-y-4">
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">
                      <strong>Antes:</strong> {example.before}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-700 font-semibold">
                      <strong>Depois:</strong> {example.after}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LinkaeExamples;