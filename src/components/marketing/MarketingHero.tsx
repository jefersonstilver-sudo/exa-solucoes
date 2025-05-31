
import React, { RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Coffee } from 'lucide-react';

interface MarketingHeroProps {
  onScrollToForm: () => void;
}

const MarketingHero: React.FC<MarketingHeroProps> = ({ onScrollToForm }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Vídeo de fundo */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover opacity-40"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tYSB2Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MTkxOH0.jZXItKJQsy0DLstm8TT6Ky_Y8Y4nZrJY3150yC9MwLo" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
      </div>

      <div className="relative z-10 text-center max-w-6xl mx-auto px-4">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="block mb-2">Estratégia, Criatividade e Resultados</span>
          <span className="block mb-2">em Campanhas de Marketing que</span>
          <span className="block bg-gradient-to-r from-[#00FFAB] to-white bg-clip-text text-transparent">
            Movimentam Empresas
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
          Nós planejamos, executamos e geramos impacto real.<br/>
          Sua empresa precisa de muito mais do que posts: ela precisa de posicionamento, presença e performance.
        </p>

        <Button
          onClick={onScrollToForm}
          size="lg"
          className="bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white font-bold py-4 px-8 rounded-full shadow-2xl hover:shadow-[#00FFAB]/50 transform transition-all duration-500 hover:scale-105 hover:-translate-y-1 text-lg"
        >
          <Coffee className="w-5 h-5 mr-2" />
          Agendar Conversa com Especialistas
        </Button>
      </div>
    </section>
  );
};

export default MarketingHero;
