import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "554591071566"; // +55 45 9107-1566
const WA_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

interface LinkaeFinalCTAProps {
  className?: string;
}

const LinkaeFinalCTA: React.FC<LinkaeFinalCTAProps> = ({ className = "" }) => {
  return (
    <aside className={`bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 relative overflow-hidden ${className}`}>
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-20%,hsl(var(--linkae-accent))_0%,transparent_50%)] opacity-30"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,hsl(var(--linkae-cyan))_0deg,transparent_120deg,hsl(var(--linkae-accent))_240deg,transparent_360deg)] opacity-25 animate-pulse-soft"></div>
      
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-20 text-center relative z-10">
        <div className="backdrop-blur-sm bg-white/10 rounded-3xl p-8 md:p-12 border border-white/20 hover:bg-white/15 transition-all duration-500 glow-linkae">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-linkae-accent via-white to-linkae-cyan bg-clip-text text-transparent font-orbitron mb-6">
            Vamos fazer sua marca avançar?
          </h2>
          <p className="text-slate-300 text-lg md:text-xl mt-4 font-exo-2 leading-relaxed">
            Fale com a Linkaê agora mesmo pelo WhatsApp.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-6 text-xl rounded-full shadow-2xl hover:scale-110 transition-all duration-500 animate-linkae-glow border border-white/20 backdrop-blur-sm">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Falar com a Linkaê pelo WhatsApp"
                className="flex items-center space-x-3"
              >
                <MessageCircle className="h-6 w-6" />
                <span className="font-montserrat">Chamar no WhatsApp</span>
              </a>
            </Button>
          </div>
          <p className="text-sm text-slate-400 mt-4 select-all font-space-mono">
            +55 45 9107-1566
          </p>
        </div>
      </div>
    </aside>
  );
};

export default LinkaeFinalCTA;
