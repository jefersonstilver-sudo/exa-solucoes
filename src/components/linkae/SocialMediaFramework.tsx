import React from 'react';

const SocialMediaFramework: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Framework <span className="text-[#00B377]">CONNECT</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Nossa metodologia exclusiva para criação de conteúdo que conecta e converte.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "Conteúdo", description: "Planejamento estratégico de posts" },
            { title: "Objetivo", description: "Metas claras para cada publicação" },
            { title: "Narrativa", description: "Storytelling que engaja" },
            { title: "Engajamento", description: "Interação genuína com audiência" },
            { title: "Conversão", description: "Posts que geram resultados" },
            { title: "Timing", description: "Momento ideal para publicar" }
          ].map((item, index) => (
            <div key={index} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-[#00B377] mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialMediaFramework;