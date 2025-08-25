import React from "react";
import { ShieldCheck, Rocket, Timer } from "lucide-react";

const bullets = [
  {
    title: "Porque a gente sabe o que está fazendo — e faz bem feito.",
  },
  {
    title: "Visão, agilidade e foco total no que importa.",
  },
  {
    title: "Sua marca avançando com consistência e clareza.",
  },
];

const LinkaeWhy: React.FC = () => {
  return (
    <section className="bg-background section-bg-soft-linkae">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <header className="text-center mb-8 md:mb-10 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight gradient-text-linkae">
            Por que a Linkaê?
          </h2>
        </header>

        <ul className="space-y-6">
          {bullets.map((b, index) => (
            <li 
              key={b.title} 
              className="group p-6 rounded-2xl border bg-card/70 backdrop-blur-sm animate-fade-in transition-all duration-300 hover:shadow-card-hover hover:border-linkae-primary/40 hover:bg-card hover:scale-[1.02] glow-linkae"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start space-x-4">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-linkae-primary to-linkae-accent mt-3 animate-pulse"></div>
                <p className="text-base md:text-lg text-foreground group-hover:text-linkae-primary transition-colors">
                  {b.title}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default LinkaeWhy;
