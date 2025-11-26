import React from 'react';
import { useWeatherData } from '@/hooks/useWeatherData';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import WeatherIcon from './WeatherIcon';
import { MapPin, Loader2 } from 'lucide-react';

interface WeatherFooterProps {
  buildingName?: string;
}

const WeatherFooter: React.FC<WeatherFooterProps> = ({ buildingName }) => {
  const { weatherData, loading } = useWeatherData();
  const { screenSize, isMobile, isTablet } = useResponsiveLayout();

  // Cálculo dinâmico de tamanhos baseado na largura da tela - otimizado para mobile
  const scaleFactor = Math.min(screenSize.width / 1920, 1);
  const minScale = isMobile ? 0.65 : isTablet ? 0.75 : 0.85;
  const finalScale = Math.max(scaleFactor, minScale);

  // Tamanhos adaptativos - ajustados para caber melhor no mobile
  const sizes = {
    tempFontSize: isMobile ? `clamp(1.5rem, 5vw, 2.5rem)` : `clamp(2rem, ${finalScale * 3.5}rem, 4rem)`,
    iconSize: isMobile ? Math.max(32, Math.min(48, screenSize.width * 0.08)) : Math.max(40, Math.min(80, screenSize.width * 0.05)),
    smallIconSize: isMobile ? Math.max(20, Math.min(28, screenSize.width * 0.04)) : Math.max(24, Math.min(36, screenSize.width * 0.025)),
    padding: isMobile ? `clamp(0.5rem, 2vw, 1rem)` : `clamp(0.5rem, ${finalScale * 1.5}rem, 2rem)`,
    gap: isMobile ? `clamp(0.25rem, 1.5vw, 0.75rem)` : `clamp(0.5rem, ${finalScale * 1}rem, 1.5rem)`,
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border border-white/5 h-full w-full overflow-hidden">
      <div className="h-full flex flex-col justify-between" style={{ padding: sizes.padding }}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              <span className="text-xs sm:text-sm">Carregando...</span>
            </div>
          </div>
        ) : weatherData ? (
          <>
            {/* Header com localização - compacto no mobile */}
            <div className="flex items-center justify-center mb-1" style={{ gap: sizes.gap }}>
              <MapPin className="flex-shrink-0" style={{ width: sizes.smallIconSize * 0.7, height: sizes.smallIconSize * 0.7 }} />
              <span 
                className="text-white/70 font-medium uppercase tracking-wide truncate"
                style={{ fontSize: isMobile ? `clamp(0.625rem, 2.5vw, 0.875rem)` : `clamp(0.625rem, ${finalScale * 0.875}rem, 1rem)` }}
              >
                FOZ DO IGUAÇU, PR
              </span>
            </div>

            {/* Clima Atual - Centralizado e compacto no mobile */}
            <div className="flex items-center justify-center mb-1" style={{ gap: sizes.gap }}>
              <div style={{ width: sizes.iconSize, height: sizes.iconSize }} className="flex-shrink-0">
                <WeatherIcon 
                  icon={weatherData.current.icon} 
                  className="text-yellow-400 w-full h-full"
                />
              </div>
              <div className="flex flex-col items-center justify-center">
                <div 
                  className="font-bold text-white leading-none mb-0.5"
                  style={{ fontSize: sizes.tempFontSize }}
                >
                  {weatherData.current.temperature}°C
                </div>
                <div 
                  className="text-white/70 capitalize text-center"
                  style={{ fontSize: isMobile ? `clamp(0.625rem, 2.5vw, 0.875rem)` : `clamp(0.625rem, ${finalScale * 0.875}rem, 1rem)` }}
                >
                  {weatherData.current.description}
                </div>
              </div>
            </div>

            {/* Previsão próximos dias - compacto e responsivo */}
            <div className="grid grid-cols-3 mb-1" style={{ gap: sizes.gap }}>
              {weatherData.forecast.slice(0, 3).map((day) => (
                <div 
                  key={day.date} 
                  className="text-center bg-white/5 rounded-md hover:bg-white/10 transition-colors flex flex-col items-center justify-center"
                  style={{ padding: isMobile ? `clamp(0.25rem, 1.5vw, 0.5rem)` : `clamp(0.25rem, ${finalScale * 0.75}rem, 1rem)` }}
                >
                  <div 
                    className="text-white/80 font-medium capitalize truncate mb-0.5 w-full text-center"
                    style={{ fontSize: isMobile ? `clamp(0.5rem, 2vw, 0.75rem)` : `clamp(0.625rem, ${finalScale * 0.75}rem, 0.875rem)` }}
                  >
                    {day.dayName}
                  </div>
                  <div style={{ width: sizes.smallIconSize, height: sizes.smallIconSize }} className="mx-auto mb-0.5">
                    <WeatherIcon 
                      icon={day.icon} 
                      className="text-white/80 w-full h-full"
                    />
                  </div>
                  <div 
                    className="text-white font-semibold"
                    style={{ fontSize: isMobile ? `clamp(0.5rem, 2vw, 0.75rem)` : `clamp(0.625rem, ${finalScale * 0.75}rem, 0.875rem)` }}
                  >
                    {day.maxTemp}°<span className="text-white/60">/{day.minTemp}°</span>
                  </div>
                  {day.rainChance !== undefined && day.rainChance > 0 && (
                    <div 
                      className="text-blue-400 mt-0.5"
                      style={{ fontSize: isMobile ? `clamp(0.45rem, 1.75vw, 0.625rem)` : `clamp(0.5rem, ${finalScale * 0.625}rem, 0.75rem)` }}
                    >
                      💧 {day.rainChance}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Indicador "Ao Vivo" - compacto */}
            <div 
              className="flex items-center justify-center text-white/70 font-medium pt-1 border-t border-white/5"
              style={{ 
                gap: isMobile ? `clamp(0.25rem, 1vw, 0.5rem)` : `clamp(0.25rem, ${finalScale * 0.5}rem, 0.75rem)`, 
                fontSize: isMobile ? `clamp(0.5rem, 2vw, 0.75rem)` : `clamp(0.625rem, ${finalScale * 0.75}rem, 0.875rem)` 
              }}
            >
              <div className="bg-red-500 rounded-full animate-pulse flex-shrink-0" style={{ width: sizes.smallIconSize * 0.3, height: sizes.smallIconSize * 0.3 }} />
              <span className="truncate">
                Ao vivo {buildingName ? `• ${buildingName}` : ''}
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40" style={{ fontSize: `clamp(0.75rem, ${finalScale * 0.875}rem, 1rem)` }}>
            Clima indisponível
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherFooter;
