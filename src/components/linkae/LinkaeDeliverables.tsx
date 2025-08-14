import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Megaphone, Film, Text, Palette, Globe, Sparkles } from "lucide-react";

const items = [
  {
    icon: Target,
    title: "Planejamento e gestão de redes sociais",
    desc: "Com visão de negócio para crescer de forma consistente.",
  },
  {
    icon: Megaphone,
    title: "Tráfego pago",
    desc: "Foco em alcance, engajamento e conversão.",
  },
  {
    icon: Film,
    title: "Produção de vídeos",
    desc: "Mobile e com câmera cinematográfica, no ritmo da sua marca.",
  },
  {
    icon: Text,
    title: "Storytelling",
    desc: "Alinhado ao que sua marca quer e precisa dizer.",
  },
  {
    icon: Target,
    title: "Estratégia de marca",
    desc: "Posicionamento claro para ser vista, lembrada e procurada.",
  },
  {
    icon: Globe,
    title: "Identidade visual e site",
    desc: "Criação com consistência estética e desempenho.",
  },
  {
    icon: Sparkles,
    title: "Storymaker",
    desc: "Séries e roteiros que transformam sua narrativa em formatos recorrentes e memoráveis.",
    highlight: true,
  },
];

const LinkaeDeliverables: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Enhanced background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_80%_20%,hsl(var(--linkae-accent))_0%,transparent_50%)] opacity-25"></div>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--linkae-cyan))_0%,transparent_25%,transparent_75%,hsl(var(--linkae-primary))_100%)] opacity-20"></div>
      
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-20 relative z-10">
        <header className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-linkae-accent via-linkae-cyan to-white bg-clip-text text-transparent font-orbitron mb-6">
            O que a Linkaê entrega
          </h2>
          <p className="text-slate-300 text-lg md:text-xl mt-4 max-w-3xl mx-auto leading-relaxed font-exo-2">
            Conteúdo com intenção, campanhas que fazem sentido e uma presença online que se impõe.
          </p>
          <div className="w-32 h-1 bg-gradient-to-r from-linkae-accent to-linkae-cyan mx-auto mt-6 rounded-full"></div>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map(({ icon: Icon, title, desc, highlight }) => (
            <Card
              key={title}
              className={`backdrop-blur-sm bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105 hover:-translate-y-2 animate-fade-in hover:shadow-2xl hover:border-linkae-accent/50 hover:glow-linkae ${
                highlight ? "ring-2 ring-linkae-accent/50 bg-gradient-to-br from-linkae-accent/20 to-linkae-cyan/20" : ""
              }`}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-linkae-accent to-linkae-cyan text-white shadow-lg`}> 
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg md:text-xl text-white font-montserrat font-bold">
                    {title}
                  </CardTitle>
                  {highlight && (
                    <span className="mt-2 inline-flex text-xs uppercase tracking-widest text-linkae-accent font-bold bg-linkae-accent/20 px-2 py-1 rounded-full">
                      ✨ Destaque
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-base text-slate-300 leading-relaxed font-exo-2">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LinkaeDeliverables;
