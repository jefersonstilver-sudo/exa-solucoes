import React from 'react';
import { useWeatherData } from '@/hooks/useWeatherData';
import WeatherIcon from './WeatherIcon';
import { MapPin, Loader2 } from 'lucide-react';

interface WeatherFooterProps {
  buildingName?: string;
}

const WeatherFooter: React.FC<WeatherFooterProps> = ({ buildingName }) => {
  const { weatherData, loading } = useWeatherData();

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl border border-white/5 h-full w-full overflow-hidden">
      <div className="h-full flex flex-col p-2 sm:p-3 md:p-4 lg:p-6">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              <span className="text-xs sm:text-sm">Carregando clima...</span>
            </div>
          </div>
        ) : weatherData ? (
          <>
            {/* Header com localização */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-white/50 flex-shrink-0" />
              <span className="text-white/70 text-[10px] sm:text-xs font-medium uppercase tracking-wide truncate">
                FOZ DO IGUAÇU, PR
              </span>
            </div>

            {/* Clima Atual - grid responsivo */}
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
              <WeatherIcon 
                icon={weatherData.current.icon} 
                className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16 text-yellow-400 flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-none mb-0.5 sm:mb-1">
                  {weatherData.current.temperature}°C
                </div>
                <div className="text-[10px] sm:text-xs md:text-sm text-white/70 capitalize truncate">
                  {weatherData.current.description}
                </div>
              </div>
            </div>

            {/* Previsão próximos dias - grid responsivo */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3 mb-2 sm:mb-3">
              {weatherData.forecast.slice(0, 3).map((day) => (
                <div 
                  key={day.date} 
                  className="text-center p-1.5 sm:p-2 md:p-3 bg-white/5 rounded-md sm:rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="text-white/80 text-[9px] sm:text-xs mb-0.5 sm:mb-1 font-medium capitalize truncate">
                    {day.dayName.substring(0, 3)}
                  </div>
                  <WeatherIcon 
                    icon={day.icon} 
                    className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white/80 mx-auto mb-0.5 sm:mb-1" 
                  />
                  <div className="text-white text-[10px] sm:text-xs md:text-sm font-semibold">
                    {day.maxTemp}°<span className="text-white/60">/{day.minTemp}°</span>
                  </div>
                  {day.rainChance !== undefined && day.rainChance > 0 && (
                    <div className="text-blue-400 text-[8px] sm:text-[10px] mt-0.5">
                      💧 {day.rainChance}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Indicador "Ao Vivo" */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs pt-1.5 sm:pt-2 border-t border-white/5 mt-auto">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
              <span className="text-white/70 font-medium truncate">
                Ao vivo {buildingName ? `• ${buildingName}` : ''}
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40 text-xs sm:text-sm">
            Clima indisponível
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherFooter;
