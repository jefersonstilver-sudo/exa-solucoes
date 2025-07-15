import React from 'react';

const LinkaeMission: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-white to-linkae-dark-blue/5">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-linkae-dark-blue">
          Por Que a <span className="text-linkae-bright-blue">LINKAÊ</span> Existe?
        </h2>
        <div className="max-w-4xl mx-auto text-lg md:text-xl text-linkae-dark-blue/80 leading-relaxed space-y-6">
          <p>
            Nascemos da frustração de ver negócios incríveis perdendo oportunidades por não saberem se comunicar nas redes sociais. Não é sobre postar mais. É sobre postar melhor. É sobre transformar cada publicação em uma oportunidade de conexão, crescimento e conversão.
          </p>
          <p className="text-2xl text-linkae-dark-blue font-semibold">
            Antes de criar posts, criamos conexões genuínas.
          </p>
          <p>
            Desenvolvemos estratégias completas para redes sociais que incluem: <strong className="text-linkae-bright-blue">planejamento estratégico + identidade visual + copywriting + produção de conteúdo + gestão de comunidade + análise de resultados.</strong>
          </p>
        </div>
      </div>
    </section>
  );
};

export default LinkaeMission;