import React from 'react';
import { Camera } from 'lucide-react';

const CreativeStudio: React.FC = () => {
  const studioResources = [
    {
      name: "Studio de Fotografia",
      description: "Estúdio completo para shooting de produtos e pessoas"
    },
    {
      name: "Equipamentos 4K",
      description: "Câmeras profissionais para vídeos em alta qualidade"
    },
    {
      name: "Iluminação Profissional",
      description: "Setup de luz para diferentes tipos de conteúdo"
    },
    {
      name: "Drone para Aéreos",
      description: "Imagens aéreas impactantes para seus posts"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-[#00B377]">Studio Criativo</span> Completo
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-12">
            Produzimos todo o conteúdo visual em nosso estúdio próprio, garantindo qualidade profissional para suas redes sociais.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {studioResources.map((resource, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-xl hover:shadow-lg transition-shadow duration-300"
            >
              <Camera className="h-12 w-12 text-[#00B377] mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">{resource.name}</h3>
              <p className="text-gray-600">{resource.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-2xl text-[#00B377] font-bold">
            Conteúdo profissional que destaca sua marca nas redes sociais.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CreativeStudio;