// Coordenadas de Foz do Iguaçu, PR, Brasil
const FOZ_DO_IGUACU_LAT = -25.5469;
const FOZ_DO_IGUACU_LON = -54.5882;

export interface CurrentWeather {
  temperature: number;
  weatherCode: number;
  description: string;
  icon: string;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  maxTemp: number;
  minTemp: number;
  weatherCode: number;
  icon: string;
  description: string;
  rainChance?: number;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: DailyForecast[];
  lastUpdate: Date;
}

// Mapeamento de Weather Codes da Open-Meteo
const getWeatherInfo = (code: number): { description: string; icon: string } => {
  if (code === 0) return { description: 'Céu limpo', icon: 'clear' };
  if (code >= 1 && code <= 3) return { description: 'Parcialmente nublado', icon: 'partly-cloudy' };
  if (code >= 45 && code <= 48) return { description: 'Neblina', icon: 'fog' };
  if (code >= 51 && code <= 67) return { description: 'Chuva', icon: 'rain' };
  if (code >= 71 && code <= 77) return { description: 'Neve', icon: 'snow' };
  if (code >= 80 && code <= 99) return { description: 'Tempestade', icon: 'storm' };
  return { description: 'Desconhecido', icon: 'clear' };
};

const getDayName = (dateStr: string, index: number): string => {
  // Usar índice diretamente para garantir precisão
  if (index === 0) return 'Hoje';
  if (index === 1) return 'Amanhã';
  if (index === 2) return 'Depois de Amanhã';
  
  // Fallback para outros dias (não usado no contexto atual)
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
};

export const fetchWeatherData = async (): Promise<WeatherData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${FOZ_DO_IGUACU_LAT}&longitude=${FOZ_DO_IGUACU_LON}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=America/Sao_Paulo&forecast_days=3`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Current weather
    const currentWeatherInfo = getWeatherInfo(data.current.weather_code);
    const current: CurrentWeather = {
      temperature: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
      description: currentWeatherInfo.description,
      icon: currentWeatherInfo.icon,
    };

    // Daily forecast
    const forecast: DailyForecast[] = data.daily.time.map((date: string, index: number) => {
      const weatherInfo = getWeatherInfo(data.daily.weather_code[index]);
      return {
        date,
        dayName: getDayName(date, index),
        maxTemp: Math.round(data.daily.temperature_2m_max[index]),
        minTemp: Math.round(data.daily.temperature_2m_min[index]),
        weatherCode: data.daily.weather_code[index],
        icon: weatherInfo.icon,
        description: weatherInfo.description,
        rainChance: data.daily.precipitation_probability_max?.[index] || 0,
      };
    });

    return {
      current,
      forecast,
      lastUpdate: new Date(),
    };
  } catch (error) {
    console.error('Erro ao buscar dados meteorológicos:', error);
    throw error;
  }
};
