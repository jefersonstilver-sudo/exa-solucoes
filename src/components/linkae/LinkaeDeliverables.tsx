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
    <section className="bg-background section-bg-soft-linkae">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <header className="text-center mb-8 md:mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight gradient-text-linkae">
            O que a Linkaê entrega
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Conteúdo com intenção, campanhas que fazem sentido e uma presença online que se impõe.
          </p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {items.map(({ icon: Icon, title, desc, highlight }, index) => (
            <Card
              key={title}
              className={`group border-border/60 bg-card/70 backdrop-blur-sm hover-scale animate-fade-in transition-all duration-300 hover:shadow-card-hover hover:border-linkae-primary/40 hover:bg-card hover:scale-[1.02] ${
                highlight ? "ring-1 ring-linkae-accent/30 glow-linkae" : ""
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-md bg-linkae-primary/10 text-linkae-primary group-hover:bg-linkae-primary/20 group-hover:scale-110 transition-all duration-200`}> 
                  <Icon className="h-5 w-5 group-hover:animate-pulse" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base md:text-lg text-foreground group-hover:text-linkae-primary transition-colors">
                    {title}
                  </CardTitle>
                  {highlight && (
                    <span className="mt-1 inline-flex text-[10px] uppercase tracking-wide text-linkae-accent animate-pulse">
                      ✨ Destaque
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LinkaeDeliverables;
