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
    <footer className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/5 p-4">
      <div className="space-y-3">
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
                <div className="flex items-center gap-3">
                  <WeatherIcon icon={weatherData.current.icon} className="h-8 w-8 text-yellow-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <MapPin className="h-3 w-3 text-white/50" />
                      <span className="text-white/70 text-xs font-light uppercase tracking-wide">
                        Foz do Iguaçu, PR
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-2xl font-bold">
                        {weatherData.current.temperature}°C
                      </span>
                      <span className="text-white/60 text-sm">
                        {weatherData.current.description}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Previsão próximos dias */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                  {weatherData.forecast.slice(0, 3).map((day) => (
                    <div key={day.date} className="text-center flex-1 p-2 bg-white/5 rounded-lg">
                      <div className="text-white/80 text-xs mb-1 font-medium">
                        {day.dayName}
                      </div>
                      <WeatherIcon icon={day.icon} className="h-5 w-5 text-white/80 mx-auto mb-1" />
                      <div className="text-white text-xs font-semibold">
                        {day.maxTemp}°/{day.minTemp}°
                      </div>
                      {day.rainChance !== undefined && day.rainChance > 0 && (
                        <div className="text-blue-400 text-xs mt-0.5">
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
        <div className="flex items-center justify-center gap-2 text-xs pt-2 border-t border-white/5">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white/70">
            Ao vivo {buildingName ? `• ${buildingName}` : ''}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default WeatherFooter;
