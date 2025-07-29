import React, { useState } from 'react';
import { TrendingUp, Users, ShoppingCart, Utensils, Calendar, Dumbbell, Store, ChevronLeft, ChevronRight } from 'lucide-react';

const LinkaeExamples: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const examples = [
    {
      business: "Loja de Roupas",
      location: "Foz do Iguaçu",
      before: "Posts sem criatividade",
      after: "850+ curtidas e 45 vendas/mês",
      metrics: "↗️ 340% aumento em vendas online",
      icon: Store,
      color: "text-[#F57C00]"
    },
    {
      business: "Clínica Médica", 
      location: "Centro de Foz",
      before: "Dúvidas não respondidas",
      after: "420+ curtidas e 35 consultas/mês",
      metrics: "↗️ 280% aumento em agendamentos",
      icon: Users,
      color: "text-[#FF8A80]"
    },
    {
      business: "Restaurante",
      location: "Ciudad del Este",
      before: "Sem fome emocional",
      after: "950+ curtidas e reservas lotadas",
      metrics: "↗️ 450% aumento em reservas",
      icon: Utensils,
      color: "text-[#F57C00]"
    },
    {
      business: "Evento/Festa",
      location: "Paraguai",
      before: "Sem buzz ou expectativa", 
      after: "1.2k+ curtidas e 95% ocupação",
      metrics: "↗️ 600% aumento em vendas de ingresso",
      icon: Calendar,
      color: "text-[#FF8A80]"
    },
    {
      business: "Academia Fitness",
      location: "Foz do Iguaçu",
      before: "Posts genéricos de exercício",
      after: "1.5k+ curtidas e 60 matrículas/mês",
      metrics: "↗️ 520% aumento em matrículas",
      icon: Dumbbell,
      color: "text-[#F57C00]"
    },
    {
      business: "Loja Online",
      location: "Região Trinacional",
      before: "Tráfego baixo e sem conversões",
      after: "2.3k+ curtidas e R$ 85k/mês",
      metrics: "↗️ 780% aumento em faturamento",
      icon: ShoppingCart,
      color: "text-[#FF8A80]"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(examples.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(examples.length / 3)) % Math.ceil(examples.length / 3));
  };

  return (
    <section className="h-[60vh] flex items-center justify-center bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            Transformações <span className="text-[#FF8A80]">Reais</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Veja como nossos clientes saíram de "não sei o que postar" para resultados mensuráveis
          </p>
        </div>

        {/* Desktop View */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {examples.slice(currentSlide * 3, (currentSlide * 3) + 3).map((example, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-center">
                <example.icon className={`w-12 h-12 mx-auto mb-4 ${example.color}`} />
                <h3 className="font-bold text-lg text-gray-900 mb-2">{example.business}</h3>
                <p className="text-sm text-gray-500 mb-4">{example.location}</p>
                
                <div className="space-y-4">
                  <div className="bg-red-50 p-3 rounded-lg text-left">
                    <p className="text-sm text-red-700 font-medium">
                      <strong>Antes:</strong> {example.before}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg text-left">
                    <p className="text-sm text-green-700 font-semibold">
                      <strong>Depois:</strong> {example.after}
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg text-left">
                    <p className="text-sm text-blue-700 font-bold">
                      {example.metrics}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="text-center">
              {React.createElement(examples[currentSlide * 3].icon, {
                className: `w-12 h-12 mx-auto mb-4 ${examples[currentSlide * 3].color}`
              })}
              <h3 className="font-bold text-lg text-gray-900 mb-2">{examples[currentSlide * 3].business}</h3>
              <p className="text-sm text-gray-500 mb-4">{examples[currentSlide * 3].location}</p>
              
              <div className="space-y-4">
                <div className="bg-red-50 p-3 rounded-lg text-left">
                  <p className="text-sm text-red-700 font-medium">
                    <strong>Antes:</strong> {examples[currentSlide * 3].before}
                  </p>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg text-left">
                  <p className="text-sm text-green-700 font-semibold">
                    <strong>Depois:</strong> {examples[currentSlide * 3].after}
                  </p>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg text-left">
                  <p className="text-sm text-blue-700 font-bold">
                    {examples[currentSlide * 3].metrics}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-center items-center mt-6 space-x-4">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex space-x-2">
            {Array.from({ length: Math.ceil(examples.length / 3) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  currentSlide === index ? 'bg-[#FF8A80]' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default LinkaeExamples;