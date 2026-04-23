import React from 'react';
import Reveal from './Reveal';
import LazyVideoPlayer from './LazyVideoPlayer';
import DividerGlow from './DividerGlow';

const VIDEO_1 = 'https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/videos/sou-sindico/principal/1761169798896.mp4';

const ProblemaSection: React.FC = () => {
  return (
    <section id="problema" className="section-glow py-16 md:py-20 lg:py-28 px-5 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto">
        <Reveal>
          <div className="section-label mb-6">01 · O Problema</div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)] gap-10 lg:gap-16 items-center">
          <Reveal delay={0.1} className="order-1 lg:order-2">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight tracking-tight mb-5">
                Síndico: você está cansado de <span className="gradient-text">papel caindo do mural?</span>
              </h2>

              <p className="text-base md:text-lg lg:text-xl text-white/70 leading-relaxed max-w-2xl">
                Avisos amassados, datas vencidas, comunicados que ninguém lê. O elevador é o único lugar onde 100% dos moradores passam todos os dias — mas continua sendo usado como mural de cortiça.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.3} className="order-2 lg:order-1">
            <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto lg:mx-0">
              <LazyVideoPlayer src={VIDEO_1} variant="horizontal" label="Veja a diferença" />
            </div>
          </Reveal>
        </div>

        <DividerGlow className="mt-20" />
      </div>
    </section>
  );
};

export default ProblemaSection;
