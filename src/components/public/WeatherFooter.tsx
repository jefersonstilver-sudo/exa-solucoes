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
    <footer className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/5 p-6 h-full flex flex-col justify-between">
      <div className="space-y-4 flex-1">{/* Clima Atual */}
        {/* Seção de Clima */}
        <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex items-center gap-3 text-white/60">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Carregando clima...</span>
              </div>
            ) : weatherData ? (
              <>
                {/* Clima Atual */}
                <div className="flex items-center gap-4">
                  <WeatherIcon icon={weatherData.current.icon} className="h-10 w-10 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-4 w-4 text-white/50" />
                      <span className="text-white/70 text-xs md:text-sm font-light uppercase tracking-wide">
                        FOZ DO IGUAÇU, PR
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white text-3xl md:text-4xl font-bold leading-none">
                        {weatherData.current.temperature}°C
                      </span>
                      <span className="text-white/70 text-sm md:text-base capitalize">
                        {weatherData.current.description}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Previsão próximos dias */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                  {weatherData.forecast.slice(0, 3).map((day) => (
                    <div key={day.date} className="text-center flex-1 p-3 bg-white/5 rounded-xl">
                      <div className="text-white/80 text-xs md:text-sm mb-2 font-medium capitalize">
                        {day.dayName}
                      </div>
                      <WeatherIcon icon={day.icon} className="h-6 w-6 text-white/80 mx-auto mb-2" />
                      <div className="text-white text-sm md:text-base font-semibold">
                        {day.maxTemp}°/{day.minTemp}°
                      </div>
                      {day.rainChance !== undefined && day.rainChance > 0 && (
                        <div className="text-blue-400 text-xs mt-1">
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
        <div className="flex items-center justify-center gap-2 text-xs md:text-sm pt-3 border-t border-white/5 mt-auto">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white/70 font-medium">
            Ao vivo {buildingName ? `• ${buildingName}` : ''}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default WeatherFooter;
