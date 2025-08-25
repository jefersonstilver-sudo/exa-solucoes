import React from 'react';

const LinkaeStorytelling: React.FC = () => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-background/30 section-bg-soft-linkae">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground leading-tight">
            A Dor de Todo Empresário: <br />
            <span className="gradient-text-linkae inline-block">"Não Sei o Que Postar"</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-linkae-primary to-linkae-accent mx-auto rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default LinkaeStorytelling;
