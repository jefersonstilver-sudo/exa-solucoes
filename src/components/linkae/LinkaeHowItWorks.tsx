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
    <section className="bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <header className="text-center mb-8 md:mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-sky-300 to-blue-200 bg-clip-text text-transparent">
            Como funciona
          </h2>
          <p className="text-gray-300 mt-3 max-w-2xl mx-auto">
            Sem fórmulas prontas. Cada projeto é pensado do zero, do jeito certo.
          </p>
        </header>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {steps.map(({ icon: Icon, title, desc }, idx) => (
            <li 
              key={title} 
              className="group relative flex items-start gap-4 p-6 rounded-2xl border border-gray-700 bg-gray-800/70 backdrop-blur-sm animate-fade-in transition-all duration-300 hover:shadow-[0_10px_30px_rgba(56,189,248,0.3)] hover:border-sky-400/40 hover:bg-gray-800 hover:scale-[1.02]"
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-400/20 text-sky-300 shrink-0 group-hover:bg-sky-400/30 group-hover:scale-110 transition-all duration-200">
                <Icon className="h-6 w-6 group-hover:animate-pulse" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-semibold text-white group-hover:text-sky-300 transition-colors">
                  <span className="text-sky-400 font-bold">{idx + 1}.</span> {title}
                </h3>
                <p className="text-sm text-gray-300 mt-2 group-hover:text-white transition-colors">{desc}</p>
              </div>
              
              {/* Indicator line connecting steps */}
              {idx < steps.length - 1 && idx % 2 === 0 && (
                <div className="hidden md:block absolute -right-3 top-1/2 w-6 h-0.5 bg-gradient-to-r from-sky-400/30 to-transparent"></div>
              )}
            </li>
          ))}
        </ol>

        <div className="mt-8 md:mt-10 flex items-center justify-center gap-3 text-sm text-gray-300 bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-sky-400/20 animate-fade-in">
          <Wand2 className="h-5 w-5 text-sky-400 animate-pulse" aria-hidden="true" />
          <span className="font-medium text-white">Personalização total para o seu contexto</span>
        </div>
      </div>
    </section>
  );
};

export default LinkaeHowItWorks;
