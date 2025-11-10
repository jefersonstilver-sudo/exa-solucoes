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
    <footer className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 p-4">
      <div className="space-y-3">
        {/* Seção de Clima */}
        <div className="flex items-center gap-4 justify-between flex-wrap">
            {loading ? (
              <div className="flex items-center gap-3 text-white/60">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Carregando clima...</span>
              </div>
            ) : weatherData ? (
              <>
                <div className="flex-shrink-0">
                  <WeatherIcon icon={weatherData.current.icon} className="h-8 w-8 text-yellow-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3 w-3 text-white/60" />
                    <span className="text-white/90 text-xs font-light uppercase tracking-wider">
                      Foz do Iguaçu, PR
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-2xl font-bold">
                      {weatherData.current.temperature}°C
                    </span>
                    <span className="text-white/70 text-sm">
                      {weatherData.current.description}
                    </span>
                  </div>
                </div>

                {/* Previsão próximos dias - Hoje, Amanhã, Depois de Amanhã */}
                <div className="flex items-center gap-3 ml-auto flex-wrap">
                  {weatherData.forecast.slice(0, 3).map((day) => (
                    <div key={day.date} className="text-center p-2 bg-white/5 rounded-lg min-w-[80px]">
                      <div className="text-white/80 text-xs mb-1 capitalize font-medium">
                        {day.dayName}
                      </div>
                      <WeatherIcon icon={day.icon} className="h-5 w-5 text-white/90 mx-auto mb-1" />
                      <div className="text-white text-xs font-semibold">
                        {day.maxTemp}° / {day.minTemp}°
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
        <div className="flex items-center justify-center gap-2 text-xs">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white/90">
            Exibição ao vivo da lista de programação {buildingName ? `do ${buildingName}` : ''}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default WeatherFooter;
