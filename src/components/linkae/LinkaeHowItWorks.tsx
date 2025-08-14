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
    <section className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_30%_70%,hsl(var(--linkae-primary))_0%,transparent_50%)] opacity-30 animate-float"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,hsl(var(--linkae-cyan))_0deg,transparent_120deg,hsl(var(--linkae-accent))_240deg,transparent_360deg)] opacity-25"></div>
      
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-20 relative z-10">
        <header className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-linkae-cyan via-white to-linkae-accent bg-clip-text text-transparent font-orbitron mb-6">
            Como funciona
          </h2>
          <p className="text-slate-300 text-lg md:text-xl mt-4 max-w-3xl mx-auto leading-relaxed font-exo-2">
            Sem fórmulas prontas. Cada projeto é pensado do zero, do jeito certo.
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-linkae-cyan to-linkae-accent mx-auto mt-6 rounded-full"></div>
        </header>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {steps.map(({ icon: Icon, title, desc }, idx) => (
            <li key={title} className="relative flex items-start gap-6 p-6 md:p-8 rounded-2xl backdrop-blur-sm bg-white/10 border border-white/20 animate-fade-in transition-all duration-500 hover:scale-105 hover:-translate-y-1 hover:bg-white/15 hover:border-linkae-accent/50 hover:glow-linkae group">
              {/* Step number with gradient */}
              <div className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-linkae-accent to-linkae-cyan rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg">
                {idx + 1}
              </div>
              
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-linkae-cyan to-linkae-accent text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white font-montserrat mb-2">{title}</h3>
                <p className="text-base text-slate-300 leading-relaxed font-exo-2">{desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 md:mt-12 flex items-center justify-center gap-3 text-lg text-slate-300 backdrop-blur-sm bg-white/5 rounded-full px-6 py-3 border border-white/20">
          <Wand2 className="h-6 w-6 text-linkae-accent" aria-hidden="true" />
          <span className="font-exo-2 font-semibold">Personalização total para o seu contexto.</span>
        </div>
      </div>
    </section>
  );
};

export default LinkaeHowItWorks;
