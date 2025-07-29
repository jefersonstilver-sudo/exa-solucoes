import React from 'react';

const ExaHeroSection: React.FC = () => {
  return (
    <section className="h-[80vh] bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-6">
          EXA
        </h1>
        
        <h2 className="text-xl sm:text-2xl font-medium text-muted-foreground mb-6">
          Publicidade Inteligente que Conecta
        </h2>
        
        <p className="text-base sm:text-lg text-foreground mb-6 leading-relaxed max-w-3xl mx-auto">
          <span className="block mb-4 font-medium">
            Imagine seu anúncio alcançando clientes reais na fronteira.
          </span>
          <span className="block mb-2">Painéis digitais em prédios estratégicos com programação flexível:</span>
          <span className="block text-muted-foreground">segunda-quarta para serviços, quinta-domingo para lazer</span>
        </p>
        
        <div className="bg-muted rounded-lg p-4 mb-8 max-w-2xl mx-auto">
          <p className="text-sm text-muted-foreground">
            Impacto comprovado em lanches residenciais com apenas 1-2 prédios
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-primary text-primary-foreground font-medium px-8 py-3 rounded-md transition-colors hover:bg-primary/90">
            Conhecer EXA
          </button>
          <button className="border border-border text-foreground font-medium px-8 py-3 rounded-md transition-colors hover:bg-muted">
            Ver Localização
          </button>
        </div>
      </div>
    </section>
  );
};

export default ExaHeroSection;