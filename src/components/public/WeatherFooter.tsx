import React, { useState, useEffect } from 'react';
import { useWeatherData } from '@/hooks/useWeatherData';
import WeatherIcon from './WeatherIcon';
import { Clock, MapPin, Loader2 } from 'lucide-react';

interface WeatherFooterProps {
  buildingName?: string;
}

const WeatherFooter: React.FC<WeatherFooterProps> = ({ buildingName }) => {
  const { weatherData, loading } = useWeatherData();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Atualizar relógio a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-zinc-900/95 to-transparent backdrop-blur-sm border-t border-white/5">
      <div className="container mx-auto px-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seção de Horário */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <div className="text-white/90 text-xs font-light uppercase tracking-wider mb-1">
                Horário Atual
              </div>
              <div className="text-white text-2xl font-bold tracking-wide font-mono">
                {formatTime(currentTime)}
              </div>
              <div className="text-white/60 text-xs capitalize mt-0.5">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>

          {/* Seção de Clima */}
          <div className="flex items-center gap-4">
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

                {/* Previsão próximos dias */}
                <div className="hidden lg:flex items-center gap-4 ml-auto">
                  {weatherData.forecast.slice(1, 3).map((day) => (
                    <div key={day.date} className="text-center">
                      <div className="text-white/60 text-xs mb-1 capitalize">
                        {day.dayName}
                      </div>
                      <WeatherIcon icon={day.icon} className="h-5 w-5 text-white/80 mx-auto mb-1" />
                      <div className="text-white text-xs font-semibold">
                        {day.maxTemp}° / {day.minTemp}°
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Indicador "Ao Vivo" */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-center">
            <p className="text-white/90 text-xs font-light tracking-wide">
              Exibição ao vivo da lista de programação em exibição {buildingName ? `do ${buildingName}` : ''}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-400 text-xs font-medium tracking-wider uppercase">
                Ao Vivo
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WeatherFooter;
