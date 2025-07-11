import React from 'react';
import { Target } from 'lucide-react';

const LinkaeStrategy: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Target className="h-12 w-12 text-[#00FFAB] mr-4" />
            <h2 className="text-4xl md:text-5xl font-bold">
              Tudo começa com <span className="text-[#00B377]">estratégia social</span>
            </h2>
          </div>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Analisamos sua marca, concorrência e público para criar uma estratégia de conteúdo que ressoa com sua audiência e gera resultados reais nas redes sociais.
          </p>
          <p className="text-2xl text-[#00B377] font-bold mt-6">
            Essa é a base de todo conteúdo que engaja de verdade.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LinkaeStrategy;