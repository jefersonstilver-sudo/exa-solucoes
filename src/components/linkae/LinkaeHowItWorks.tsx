import React from "react";
import { CheckCircle2, Search, LayoutList, CalendarCheck2, BarChart3, Wand2 } from "lucide-react";

const steps = [
  { icon: CheckCircle2, title: "A gente entende seu negócio", desc: "Imersão rápida para alinhar objetivos e contexto." },
  { icon: Search, title: "Pesquisa o mercado e o público", desc: "Mapeamos concorrência e oportunidades reais." },
  { icon: LayoutList, title: "Monta o plano de conteúdo", desc: "Pautas, formatos e calendário editorial." },
  { icon: CalendarCheck2, title: "Produz, agenda e publica", desc: "Execução com qualidade e constância." },
  { icon: BarChart3, title: "Acompanha os resultados de perto", desc: "Métricas claras para otimizar o que funciona." },
];

const LinkaeHowItWorks: React.FC = () => {
  return (
    <section className="bg-background section-bg-soft-linkae">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <header className="text-center mb-8 md:mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight gradient-text-linkae">
            Como funciona
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Sem fórmulas prontas. Cada projeto é pensado do zero, do jeito certo.
          </p>
        </header>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {steps.map(({ icon: Icon, title, desc }, idx) => (
            <li key={title} className="relative flex items-start gap-4 p-5 rounded-lg border bg-card animate-fade-in transition-shadow hover:shadow-card-hover hover:border-linkae-primary/30">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-linkae-accent/10 text-linkae-accent shrink-0">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground">{idx + 1}. {title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 md:mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Wand2 className="h-4 w-4" aria-hidden="true" />
          <span>Personalização total para o seu contexto.</span>
        </div>
      </div>
    </section>
  );
};

export default LinkaeHowItWorks;
