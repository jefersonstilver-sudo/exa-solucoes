
import React from 'react';
import { Search } from 'lucide-react';

const MarketingPlanning: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Search className="h-12 w-12 text-[#3C1361] mr-4" />
            <h2 className="text-4xl md:text-5xl font-bold">
              Tudo começa com <span className="text-[#3C1361]">planejamento</span>
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Reunimos nossos especialistas em posicionamento, linguagem e estratégia para entender a fundo sua empresa, seus valores, seus diferenciais e seus objetivos. Nessa imersão criativa e analítica, desenhamos um plano robusto e sob medida que direciona toda a campanha.
          </p>
          <p className="text-2xl text-[#3C1361] font-bold mt-6">
            Essa é a base de toda campanha de verdade.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MarketingPlanning;
