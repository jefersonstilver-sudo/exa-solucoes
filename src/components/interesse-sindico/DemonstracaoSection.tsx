import React from 'react';
import Reveal from './Reveal';
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
    <section className="section-glow py-16 md:py-20 lg:py-28 px-5 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="section-label mb-6">02 · Na Prática</div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1.05fr)_360px] gap-10 lg:gap-16 items-center">
          <div>
            <Reveal delay={0.1}>
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight tracking-tight mb-5">
                Veja o painel EXA <span className="gradient-text">funcionando em um prédio real.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-base md:text-lg lg:text-xl text-white/70 leading-relaxed mb-10 max-w-2xl">
                A grade de exibição é mista: rotaciona câmeras ao vivo do prédio, clima, notícias, avisos do condomínio, cotações e anúncios curados. Tudo sincronizado, em alta resolução, dentro do elevador.
              </p>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="flex flex-wrap gap-2 md:gap-3 max-w-2xl">
                {PILLS.map((p) => (
                  <span key={p.label} className="tag-pill text-xs md:text-sm">
                    <span>{p.icon}</span>
                    {p.label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.3}>
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[260px] md:max-w-[300px] lg:max-w-[320px] xl:max-w-[360px] aspect-[9/16] rounded-2xl overflow-hidden bg-black/40 ring-1 ring-white/10 shadow-2xl">
                {/* Vídeo autoplay puro: sem controles, sem possibilidade de pausa — comportamento de GIF */}
                <video
                  src={VIDEO_2}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  controlsList="nodownload nofullscreen noremoteplayback"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  aria-label="Demonstração do painel EXA em loop"
                />
              </div>
            </div>
          </Reveal>
        </div>

        <DividerGlow className="mt-20" />
      </div>
    </section>
  );
};

export default DemonstracaoSection;
