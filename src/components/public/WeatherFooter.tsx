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
    <footer className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/5 p-4 h-full flex flex-col justify-between">
      <div className="space-y-3 flex-1">
        {/* Seção de Clima */}
        <div className="flex flex-col gap-2">
            {loading ? (
              <div className="flex items-center gap-3 text-white/60">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Carregando clima...</span>
              </div>
            ) : weatherData ? (
              <>
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-white/50" />
                  <span className="text-white/70 text-xs font-medium uppercase tracking-wide">
                    FOZ DO IGUAÇU, PR
                  </span>
                </div>

                {/* Clima Atual */}
                <div className="flex items-center gap-3 mb-2">
                  <WeatherIcon icon={weatherData.current.icon} className="h-12 w-12 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-4xl font-bold text-white leading-none mb-1">
                      {weatherData.current.temperature}°C
                    </div>
                    <div className="text-sm text-white/70 capitalize">
                      {weatherData.current.description}
                    </div>
                  </div>
                </div>

                {/* Previsão próximos dias */}
                <div className="flex items-center justify-between gap-2">
                  {weatherData.forecast.slice(0, 3).map((day) => (
                    <div key={day.date} className="text-center flex-1 p-2 bg-white/5 rounded-lg">
                      <div className="text-white/80 text-xs mb-1 font-medium capitalize">
                        {day.dayName}
                      </div>
                      <WeatherIcon icon={day.icon} className="h-5 w-5 text-white/80 mx-auto mb-1" />
                      <div className="text-white text-xs font-semibold">
                        {day.maxTemp}°/{day.minTemp}°
                      </div>
                      {day.rainChance !== undefined && day.rainChance > 0 && (
                        <div className="text-blue-400 text-[10px] mt-0.5">
                          💧 {day.rainChance}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
        </div>

        {/* Indicador "Ao Vivo" */}
        <div className="flex items-center justify-center gap-2 text-xs pt-2 border-t border-white/5 mt-auto">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white/70 font-medium">
            Ao vivo {buildingName ? `• ${buildingName}` : ''}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default WeatherFooter;
