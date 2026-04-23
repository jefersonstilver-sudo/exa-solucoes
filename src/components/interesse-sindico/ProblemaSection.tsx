import React from 'react';
import Reveal from './Reveal';
import LazyVideoPlayer from './LazyVideoPlayer';
import DividerGlow from './DividerGlow';

const VIDEO_1 = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/videos/sou-sindico/principal/1761169798896.mp4';

const ProblemaSection: React.FC = () => {
  return (
    <section id="problema" className="section-glow py-20 md:py-28 px-6">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="section-label mb-6">01 · O Problema</div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-5">
            Síndico: você está cansado de <span className="gradient-text">papel caindo do mural?</span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="text-base md:text-lg text-white/70 leading-relaxed mb-12 max-w-2xl">
            Avisos amassados, datas vencidas, comunicados que ninguém lê. O elevador é o único lugar onde 100% dos moradores passam todos os dias — mas continua sendo usado como mural de cortiça.
          </p>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="max-w-3xl mx-auto">
            <LazyVideoPlayer src={VIDEO_1} variant="horizontal" label="Veja a diferença" />
          </div>
        </Reveal>

        <DividerGlow className="mt-20" />
      </div>
    </section>
  );
};

export default ProblemaSection;
