import React from 'react';
import { ArrowRight, CalendarCheck2, Lightbulb, Rocket } from 'lucide-react';

interface LinkaeHeroNewProps {
  onScrollToForm: () => void;
}

const LinkaeHeroNew: React.FC<LinkaeHeroNewProps> = ({ onScrollToForm }) => {
  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indexa-purple/20 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 pt-28 pb-16 md:pt-36 md:pb-24 relative z-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-sm text-indexa-purple/80 animate-fade-in">
            <Lightbulb className="h-4 w-4" /> Dor real, solução prática
          </span>
          <h1 className="mt-3 text-4xl md:text-6xl font-extrabold leading-tight bg-gradient-to-r from-indexa-purple to-indexa-mint bg-clip-text text-transparent animate-enter">
            Não sei o que postar?
          </h1>
          <p className="mt-4 md:mt-6 text-base md:text-lg text-gray-700 dark:text-gray-300 max-w-2xl animate-fade-in">
            A LinkAE transforma essa dúvida em um calendário inteligente de conteúdo. Toda semana, ideias estratégicas, artes e legendas prontas — do briefing à publicação.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in">
            <button
              onClick={onScrollToForm}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-indexa-purple text-white hover-scale focus:outline-none focus:ring-2 focus:ring-indexa-purple/40"
            >
              Quero ideias agora
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-indexa-purple/30 text-indexa-purple hover-scale story-link"
            >
              Ver como funciona
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-4">
              <div className="flex items-center gap-2 text-indexa-purple font-semibold"><Lightbulb className="h-4 w-4"/> Ideias estratégicas</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Não são só posts: é posicionamento.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-4">
              <div className="flex items-center gap-2 text-indexa-purple font-semibold"><CalendarCheck2 className="h-4 w-4"/> Calendário pronto</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Você aprova e publica sem fricção.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur p-4">
              <div className="flex items-center gap-2 text-indexa-purple font-semibold"><Rocket className="h-4 w-4"/> Crescimento real</div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Consistência que vira resultado.</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default LinkaeHeroNew;
