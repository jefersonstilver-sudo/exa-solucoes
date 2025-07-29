import React from 'react';

const ExaAdvantagesSection: React.FC = () => {
  return (
    <section className="min-h-[60vh] bg-background flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-8">
            Benefícios Sensoriais EXA
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-lg p-6 text-center transition-colors hover:bg-muted/50">
            <h3 className="text-lg font-medium text-foreground mb-4">Impacto Imediato</h3>
            <p className="text-muted-foreground">
              Anuncie em locais estratégicos e sinta o impacto imediato
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-6 text-center transition-colors hover:bg-muted/50">
            <h3 className="text-lg font-medium text-foreground mb-4">Segmentação Inteligente</h3>
            <p className="text-muted-foreground">
              Programe conteúdos por dias para segmentos variados, como lanches ou serviços locais
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExaAdvantagesSection;