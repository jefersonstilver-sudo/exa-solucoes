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
    <section className="bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <header className="text-center mb-8 md:mb-10 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Por que a Linkaê?
          </h2>
        </header>

        <ul className="space-y-4">
          {bullets.map((b) => (
            <li key={b.title} className="p-5 rounded-lg border bg-card animate-fade-in">
              <p className="text-base md:text-lg text-foreground">{b.title}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default LinkaeWhy;
