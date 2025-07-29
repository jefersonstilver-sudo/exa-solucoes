import React from 'react';

const ExaFinalCTASection: React.FC = () => {
  return (
    <section className="min-h-[60vh] bg-muted/50 flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-6">
          Agende uma Reunião Gratuita
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground mb-8">
          Descubra como a EXA pode revolucionar sua estratégia de marketing para empresários de todos os portes
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button className="bg-primary text-primary-foreground font-medium px-8 py-3 rounded-md transition-colors hover:bg-primary/90">
            Agendar Reunião Gratuita
          </button>
          <button className="border border-border text-foreground font-medium px-8 py-3 rounded-md transition-colors hover:bg-muted">
            Ver Localizações Disponíveis
          </button>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Sem taxas ocultas • Analytics inclusos • Suporte dedicado
          </p>
        </div>
      </div>
    </section>
  );
};

export default ExaFinalCTASection;