import React from 'react';
import Reveal from './Reveal';
import { ArrowDown } from 'lucide-react';

const EXA_LOGO_URL = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/logo%20e%20icones/Exa%20sozinha.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV80MDI0MGY0My01YjczLTQ3NTItYTM2OS1hNzVjMmNiZGM0NzMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcy9sb2dvIGUgaWNvbmVzL0V4YSBzb3ppbmhhLnBuZyIsImlhdCI6MTc1NTE0NTE1MSwiZXhwIjozMTcwODM2MDkxNTF9.JhaWC_VG92biR2DeuV15km-YtulGoQ4xAgWKwgPuhS0';

const HeroSection: React.FC = () => {
  const handleScrollToNext = () => {
    document.getElementById('problema')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero-glow min-h-screen flex flex-col items-center justify-between relative px-5 md:px-8 lg:px-12 safe-top safe-bottom">
      <Reveal delay={0.05} className="pt-8 md:pt-12">
        <img
          src={EXA_LOGO_URL}
          alt="EXA Mídia"
          className="h-12 md:h-14 lg:h-16 w-auto filter brightness-0 invert drop-shadow-[0_0_24px_rgba(234,37,29,0.55)]"
        />
      </Reveal>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl lg:max-w-3xl mx-auto py-12">
        <Reveal delay={0.15}>
          <div className="tag-pill mb-8">
            <span className="pulse-dot" />
            Para Síndicos
          </div>
        </Reveal>

        <Reveal delay={0.25}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Seu prédio merece <br className="hidden sm:block" />
            <span className="gradient-text">mais que mural de papel.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.4}>
          <p className="text-base md:text-lg lg:text-xl text-white/70 max-w-xl mx-auto leading-relaxed mb-10">
            Painéis digitais EXA nos elevadores: comunicação oficial do condomínio, Wi-Fi grátis para os moradores e zero custo para o seu prédio.
          </p>
        </Reveal>

        <Reveal delay={0.55}>
          <button
            type="button"
            onClick={handleScrollToNext}
            className="cta-primary"
          >
            Ver como funciona
            <ArrowDown className="w-4 h-4" />
          </button>
        </Reveal>
      </div>

      <Reveal delay={0.8} className="pb-6 md:pb-10">
        <div className="scroll-indicator" aria-hidden="true" />
      </Reveal>
    </section>
  );
};

export default HeroSection;
