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
    <footer className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/10 p-4 md:p-6">
      <div className="space-y-3 md:space-y-4">
        {/* Seção de Clima */}
        <div className="flex items-center gap-4 md:gap-6 justify-between flex-wrap">
            {loading ? (
              <div className="flex items-center gap-3 text-white/60">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Carregando clima...</span>
              </div>
            ) : weatherData ? (
              <>
                <div className="flex-shrink-0">
                  <WeatherIcon icon={weatherData.current.icon} className="h-8 w-8 md:h-10 md:w-10 text-yellow-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-3 w-3 md:h-4 md:w-4 text-white/60" />
                    <span className="text-white/90 text-xs md:text-sm font-light uppercase tracking-wider">
                      Foz do Iguaçu, PR
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-2xl md:text-3xl font-bold">
                      {weatherData.current.temperature}°C
                    </span>
                    <span className="text-white/70 text-sm md:text-base">
                      {weatherData.current.description}
                    </span>
                  </div>
                </div>

                {/* Previsão próximos dias com nome do dia */}
                <div className="flex items-center gap-3 md:gap-4 ml-auto flex-wrap">
                  {weatherData.forecast.slice(0, 3).map((day) => (
                    <div key={day.date} className="text-center p-2 md:p-3 bg-white/5 rounded-xl min-w-[85px] md:min-w-[100px]">
                      <div className="text-white/90 text-xs md:text-sm mb-1 font-semibold">
                        {day.dayName}
                      </div>
                      <WeatherIcon icon={day.icon} className="h-5 w-5 md:h-6 md:w-6 text-white/90 mx-auto mb-1" />
                      <div className="text-white text-xs md:text-sm font-semibold">
                        {day.maxTemp}° / {day.minTemp}°
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
        <div className="flex items-center justify-center gap-2 text-xs md:text-sm">
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
