import React, { useState, useEffect } from 'react';
import { useBuildingNotices } from '@/hooks/useBuildingNotices';
import { Megaphone, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuildingNoticesCardProps {
  buildingId: string;
  className?: string;
}

export const BuildingNoticesCard: React.FC<BuildingNoticesCardProps> = ({ 
  buildingId,
  className 
}) => {
  const { notices, loading } = useBuildingNotices(buildingId);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Rotação automática se houver múltiplos avisos
  useEffect(() => {
    if (notices.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 5000); // Troca a cada 5 segundos

    return () => clearInterval(interval);
  }, [notices.length]);

  const currentNotice = notices[currentIndex];

  if (loading) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl p-6 shadow-lg",
        "flex items-center justify-center min-h-[200px]",
        className
      )}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
          <p className="text-sm">Carregando avisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "rounded-xl p-4 md:p-6 shadow-lg transition-all duration-300",
        "min-h-[200px] md:min-h-[400px] flex flex-col",
        className
      )}
      style={{
        background: currentNotice?.background_color || 'linear-gradient(135deg, #8B5CF6, #A78BFA)'
      }}
    >
      {/* Ícone animado */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-white/20 p-3 rounded-full animate-pulse">
          <Megaphone className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-white text-lg md:text-xl font-bold">
          Avisos do Condomínio
        </h3>
      </div>

      {/* Conteúdo */}
      {currentNotice ? (
        <div className="flex-1 flex flex-col justify-center">
          <h4 className="text-white text-base md:text-lg font-semibold mb-3">
            {currentNotice.title}
          </h4>
          <p 
            className="text-white/90 text-sm md:text-base leading-relaxed"
            style={{ color: currentNotice.text_color }}
          >
            {currentNotice.content}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-white/80">
          <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-center text-sm md:text-base">
            Nenhum aviso disponível no momento
          </p>
        </div>
      )}

      {/* Indicadores se múltiplos avisos */}
      {notices.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {notices.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "w-6 bg-white" 
                  : "w-2 bg-white/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
