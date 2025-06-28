
import React from 'react';
import { Coffee } from 'lucide-react';

interface MarketingHeroProps {
  onScrollToForm: () => void;
}

const MarketingHero: React.FC<MarketingHeroProps> = ({
  onScrollToForm
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Vídeo de fundo otimizado para mobile */}
      <div className="absolute inset-0 z-0">
        <video className="w-full h-full object-cover opacity-40" autoPlay loop muted playsInline preload="auto">
          <source src="https://aakenoljsycyrc rchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3QgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tc Yv Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MTkxOH0.jZXItKJQsy0DLstm8TT6Ky_Y8Y4nZrJY3150yC9MwLo" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/90" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        <div className="text-center">
          <h1 className="mb-4 sm:mb-6 lg:mb-8 text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-center">
            <span className="block mb-1 sm:mb-2 text-gray-900 text-4xl">Marketing com estratégia, presença e impacto real.</span>
            <span className="block mb-1 sm:mb-2 text-gray-900 text-4xl">Campanhas completas para marcas que querem crescer.</span>
            <span className="block bg-gradient-to-r from-[#00B377] to-[#3C1361] bg-clip-text text-transparent text-2xl">
              Planejamento, execução e performance no mesmo lugar.
            </span>
          </h1>

          <div className="mt-6 sm:mt-8 lg:mt-12">
            <button onClick={onScrollToForm} className="bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white shadow-2xl hover:shadow-[#00FFAB]/50 transform hover:scale-105 hover:-translate-y-1 h-14 px-6 text-base md:h-16 md:px-8 md:text-lg rounded-full font-medium transition-all duration-200 flex items-center space-x-2 mx-auto">
              <Coffee className="w-5 h-5 flex-shrink-0" />
              <span>Agendar Conversa com Especialistas</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketingHero;
