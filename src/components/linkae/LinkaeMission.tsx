import React from 'react';

const LinkaeMission: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8">
          <span className="text-linkae-pink">Resultados reais</span> que transformam seu negócio
        </h2>
        <div className="max-w-4xl mx-auto text-lg md:text-xl text-gray-600 leading-relaxed space-y-6">
          <p>
            Em apenas 90 dias, nossos clientes veem crescimento de 300% no engajamento, 150% no tráfego do site e 200% nas vendas vindas das redes sociais.
          </p>
          <p className="text-2xl text-gray-900 font-semibold">
            Não somos uma agência comum. Somos especialistas em converter seguidores em clientes.
          </p>
          <p>
            Nossa metodologia proprietária combina <strong className="text-linkae-green">estratégia baseada em dados + criatividade autêntica + gestão ativa da comunidade + otimização constante de resultados.</strong>
          </p>
        </div>
      </div>
    </section>
  );
};

export default LinkaeMission;