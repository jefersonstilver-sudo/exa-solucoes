
import React, { RefObject } from 'react';
import { Coffee } from 'lucide-react';
import ResponsiveContainer from '@/components/responsive/ResponsiveContainer';
import ResponsiveTypography from '@/components/responsive/ResponsiveTypography';
import ResponsiveButton from '@/components/responsive/ResponsiveButton';
import { useAdvancedResponsive } from '@/hooks/useAdvancedResponsive';

interface MarketingHeroProps {
  onScrollToForm: () => void;
}

const MarketingHero: React.FC<MarketingHeroProps> = ({ onScrollToForm }) => {
  const { isPhone, isTablet } = useAdvancedResponsive();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Vídeo de fundo otimizado para mobile */}
      <div className="absolute inset-0 z-0">
        <video
          className={cn(
            "w-full h-full object-cover",
            isPhone ? "opacity-30" : "opacity-40"
          )}
          autoPlay
          loop
          muted
          playsInline
          preload={isPhone ? "metadata" : "auto"}
        >
          <source src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/sign/arquivos/videos%20produtora/reels%20conheca%20o%20estudio%20Chroma%20v2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzA1MTFkMDA5LWFkMDAtNGVlYi1hMjdiLWRhNGVhYTBjMmFmZCJ9.eyJ1cmwiOiJhcnF1aXZvcy92aWRlb3MgcHJvZHV0b3JhL3JlZWxzIGNvbmhlY2EgbyBlc3R1ZGlvIENocm9tYSB2Mi5tcDQiLCJpYXQiOjE3NDg3MDU5MTgsImV4cCI6MTc4MDI0MTkxOH0.jZXItKJQsy0DLstm8TT6Ky_Y8Y4nZrJY3150yC9MwLo" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
      </div>

      <ResponsiveContainer className="relative z-10" maxWidth="xxl">
        <div className="text-center">
          <ResponsiveTypography 
            variant="h1" 
            className="mb-4 sm:mb-6 lg:mb-8"
            align="center"
          >
            <span className="block mb-1 sm:mb-2">Marketing com estratégia, presença e impacto real.</span>
            <span className="block mb-1 sm:mb-2">Campanhas completas para marcas que querem crescer.</span>
            <span className="block bg-gradient-to-r from-[#00FFAB] to-white bg-clip-text text-transparent">
              Planejamento, execução e performance no mesmo lugar.
            </span>
          </ResponsiveTypography>

          <div className="mt-6 sm:mt-8 lg:mt-12">
            <ResponsiveButton
              onClick={onScrollToForm}
              size="lg"
              className="bg-gradient-to-r from-[#00FFAB] to-[#3C1361] text-white shadow-2xl hover:shadow-[#00FFAB]/50 transform hover:scale-105 hover:-translate-y-1"
              icon={Coffee}
              iconPosition="left"
              fullWidthOnMobile={isPhone}
              touchOptimized={true}
            >
              {isPhone ? "Agendar Conversa" : "Agendar Conversa com Especialistas"}
            </ResponsiveButton>
          </div>
        </div>
      </ResponsiveContainer>
    </section>
  );
};

export default MarketingHero;
