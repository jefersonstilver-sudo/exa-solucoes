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
      <div className="h-full flex flex-col p-3 sm:p-4 md:p-5 lg:p-6">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white/60">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Carregando clima...</span>
            </div>
          </div>
        ) : weatherData ? (
          <div className="flex-1 flex flex-col">
            {/* Header com localização */}
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-white/50 flex-shrink-0" />
              <span className="text-white/70 text-xs sm:text-sm font-medium uppercase tracking-wide truncate">
                FOZ DO IGUAÇU, PR
              </span>
            </div>

            {/* Clima Atual - grid responsivo */}
            <div className="flex items-center gap-3 sm:gap-4 mb-4">
              <WeatherIcon 
                icon={weatherData.current.icon} 
                className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 text-yellow-400 flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-none mb-1">
                  {weatherData.current.temperature}°C
                </div>
                <div className="text-sm sm:text-base text-white/70 capitalize truncate">
                  {weatherData.current.description}
                </div>
              </div>
            </div>

            {/* Previsão próximos dias - grid responsivo */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
              {weatherData.forecast.slice(0, 3).map((day) => (
                <div 
                  key={day.date} 
                  className="text-center p-2 sm:p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="text-white/80 text-xs sm:text-sm mb-1 font-medium capitalize truncate">
                    {day.dayName}
                  </div>
                  <WeatherIcon 
                    icon={day.icon} 
                    className="h-6 w-6 sm:h-8 sm:w-8 text-white/80 mx-auto mb-1" 
                  />
                  <div className="text-white text-xs sm:text-sm font-semibold">
                    {day.maxTemp}°<span className="text-white/60">/{day.minTemp}°</span>
                  </div>
                  {day.rainChance !== undefined && day.rainChance > 0 && (
                    <div className="text-blue-400 text-[10px] sm:text-xs mt-0.5">
                      💧 {day.rainChance}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Indicador "Ao Vivo" */}
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm pt-2 border-t border-white/5 mt-auto">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
              <span className="text-white/70 font-medium truncate">
                Ao vivo {buildingName ? `• ${buildingName}` : ''}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/40 text-sm">
            Clima indisponível
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherFooter;
