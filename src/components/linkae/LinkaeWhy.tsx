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
    <section className="bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Enhanced background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_700px_at_70%_30%,hsl(var(--linkae-accent))_0%,transparent_50%)] opacity-25 animate-pulse-soft"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,hsl(var(--linkae-cyan))_0%,transparent_30%,transparent_70%,hsl(var(--linkae-primary))_100%)] opacity-20"></div>
      
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-20 relative z-10">
        <header className="text-center mb-12 md:mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-linkae-cyan to-linkae-accent bg-clip-text text-transparent font-orbitron mb-6">
            Por que a Linkaê?
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-linkae-accent to-linkae-cyan mx-auto mt-6 rounded-full"></div>
        </header>

        <ul className="space-y-6">
          {bullets.map((b, idx) => (
            <li key={b.title} className="p-8 rounded-2xl backdrop-blur-sm bg-gradient-to-r from-white/10 to-white/5 border border-white/20 animate-fade-in transition-all duration-500 hover:scale-105 hover:-translate-y-1 hover:bg-white/15 hover:border-linkae-accent/50 hover:glow-linkae group">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-linkae-accent to-linkae-cyan rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {idx + 1}
                </div>
                <p className="text-lg md:text-xl text-white font-montserrat font-semibold leading-relaxed">{b.title}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default LinkaeWhy;
