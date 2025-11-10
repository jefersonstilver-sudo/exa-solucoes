import React, { useState, useEffect } from 'react';
import { useNewsRSSFeed } from '@/hooks/useNewsRSSFeed';
import { useQRCodeGenerator } from '@/hooks/useQRCodeGenerator';
import { generatePublicUrl } from '@/config/domain';
import { generatePanelPath } from '@/utils/buildingSlugUtils';
import { Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewsWithQRPanelProps {
  buildingId: string;
  buildingName: string;
  buildingCode: string;
  className?: string;
}

export const NewsWithQRPanel: React.FC<NewsWithQRPanelProps> = ({ 
  buildingId,
  buildingName,
  buildingCode,
  className 
}) => {
  const { news, loading } = useNewsRSSFeed();
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  
  const buildingUrl = generatePublicUrl(generatePanelPath(buildingName, buildingCode));
  const { qrCodeUrl } = useQRCodeGenerator(buildingUrl);

  // Rotação de notícias a cada 30 segundos
  useEffect(() => {
    if (news.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % news.length);
    }, 30000);

    return () => clearInterval(interval);
  }, [news.length]);

  const currentNews = news[currentNewsIndex];

  if (loading) {
    return (
      <div className={cn(
        "bg-black rounded-xl p-6 shadow-lg",
        "flex items-center justify-center min-h-[300px]",
        className
      )}>
        <div className="text-white text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Carregando notícias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-black rounded-xl overflow-hidden shadow-lg",
      "min-h-[300px] flex flex-col",
      className
    )}>
      {/* Seção de Notícias */}
      <div className="flex-1 p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-cyan-400" />
          <h3 className="text-cyan-400 text-lg font-bold uppercase tracking-wide">
            Mundo
          </h3>
        </div>

        {currentNews ? (
          <div className="space-y-3">
            {/* Imagem da notícia */}
            {currentNews.image && (
              <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden bg-gray-900">
                <img 
                  src={currentNews.image} 
                  alt={currentNews.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            )}

            {/* Título da notícia */}
            <h4 className="text-white text-base md:text-lg font-semibold leading-tight line-clamp-3">
              {currentNews.title}
            </h4>

            {/* Fonte */}
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <span className="font-medium">{currentNews.source}</span>
              <span>•</span>
              <span>{currentNews.pubDate.toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        ) : (
          <p className="text-white/60 text-sm">Nenhuma notícia disponível</p>
        )}
      </div>

      {/* Seção QR Code */}
      <div className="border-t border-white/10 p-4 md:p-6 bg-black/50">
        <div className="flex flex-col items-center gap-3">
          {qrCodeUrl ? (
            <>
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-white p-2 animate-pulse"
              />
              <p className="text-white/70 text-xs text-center">
                Escaneie para acessar
              </p>
            </>
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-lg animate-pulse" />
          )}
        </div>
      </div>

      {/* Indicadores de notícias */}
      {news.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-3">
          {news.slice(0, 5).map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 rounded-full transition-all",
                index === currentNewsIndex 
                  ? "w-4 bg-cyan-400" 
                  : "w-1 bg-white/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
