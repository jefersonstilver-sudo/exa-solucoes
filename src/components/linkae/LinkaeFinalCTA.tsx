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
    <aside className={`bg-background ${className}`}>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Vamos fazer sua marca avançar?
        </h2>
        <p className="text-muted-foreground mt-3">
          Fale com a Linkaê agora mesmo pelo WhatsApp.
        </p>
        <div className="mt-6">
          <Button asChild size="lg">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar com a Linkaê pelo WhatsApp"
            >
              <MessageCircle className="h-4 w-4" />
              Chamar no WhatsApp
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 select-all">
          +55 45 9107-1566
        </p>
      </div>
    </aside>
  );
};

export default LinkaeFinalCTA;
