import React from 'react';
import Reveal from './Reveal';
import LazyVideoPlayer from './LazyVideoPlayer';
import DividerGlow from './DividerGlow';

const VIDEO_2 = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/videos/sou-sindico/secundario/1761186591348.mp4';

const PILLS = [
  { icon: '📹', label: 'Câmeras ao vivo' },
  { icon: '☀️', label: 'Clima e tempo' },
  { icon: '📰', label: 'Notícias' },
  { icon: '🏢', label: 'Avisos do condomínio' },
  { icon: '💱', label: 'Cotações' },
  { icon: '🎬', label: 'Anúncios curados' },
];

const DemonstracaoSection: React.FC = () => {
  return (
    <section className="section-glow py-20 md:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="section-label mb-6">02 · Na Prática</div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-5">
            Veja o painel EXA <span className="gradient-text">funcionando em um prédio real.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-base md:text-lg text-white/70 leading-relaxed mb-12 max-w-2xl">
            A grade de exibição é mista: rotaciona câmeras ao vivo do prédio, clima, notícias, avisos do condomínio, cotações e anúncios curados. Tudo sincronizado, em alta resolução, dentro do elevador.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="flex justify-center">
            <div className="w-full max-w-[280px] aspect-[9/16]">
              <LazyVideoPlayer
                src={VIDEO_2}
                variant="vertical"
                autoPlay
                loop
                muted
                className="w-full h-full"
              />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.4}>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-10 max-w-2xl mx-auto">
            {PILLS.map((p) => (
              <span key={p.label} className="tag-pill text-xs md:text-sm">
                <span>{p.icon}</span>
                {p.label}
              </span>
            ))}
          </div>
        </Reveal>

        <DividerGlow className="mt-20" />
      </div>
    </section>
  );
};

export default DemonstracaoSection;
