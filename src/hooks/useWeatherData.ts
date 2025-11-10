import { useState, useEffect } from 'react';
import { fetchWeatherData, WeatherData } from '@/services/weatherService';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos

export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWeatherData();
      setWeatherData(data);
    } catch (err) {
      console.error('Erro ao carregar dados meteorológicos:', err);
      setError('Erro ao carregar dados do clima');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Carregar dados inicialmente
    loadWeatherData();

    // Atualizar a cada 30 minutos
    const interval = setInterval(loadWeatherData, CACHE_DURATION);

    return () => clearInterval(interval);
  }, []);

  return { weatherData, loading, error, refresh: loadWeatherData };
};
