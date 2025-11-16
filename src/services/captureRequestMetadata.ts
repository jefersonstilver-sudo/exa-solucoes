/**
 * Captura metadados da requisição (IP e User Agent) para logging de eventos
 */

let cachedIP: string | null = null;

/**
 * Obtém o IP real do usuário tentando múltiplas fontes
 */
export const getRealIP = async (): Promise<string> => {
  // Retornar IP cacheado se disponível (válido por 5 minutos)
  if (cachedIP) return cachedIP;

  try {
    // Tentar obter IP via ipapi.co
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ip) {
        cachedIP = data.ip;
        // Limpar cache após 5 minutos
        setTimeout(() => { cachedIP = null; }, 5 * 60 * 1000);
        return data.ip;
      }
    }
  } catch (error) {
    console.warn('Falha ao obter IP via ipapi.co:', error);
  }

  try {
    // Fallback: tentar via ip-api.com
    const response = await fetch('https://ip-api.com/json/', {
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.query) {
        cachedIP = data.query;
        setTimeout(() => { cachedIP = null; }, 5 * 60 * 1000);
        return data.query;
      }
    }
  } catch (error) {
    console.warn('Falha ao obter IP via ip-api.com:', error);
  }

  // Último recurso: retornar 'unknown'
  return 'unknown';
};

/**
 * Captura metadados completos da requisição
 */
export const captureRequestMetadata = async () => {
  const ip = await getRealIP();
  const userAgent = navigator.userAgent;
  
  // ✅ NOVO: Capturar geolocalização do IP
  let geoData = null;
  try {
    if (ip !== 'unknown') {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`);
      if (geoResponse.ok) {
        geoData = await geoResponse.json();
      }
    }
  } catch (error) {
    console.warn('Falha ao obter geolocalização:', error);
  }
  
  return {
    ip,
    user_agent: userAgent,
    timestamp: new Date().toISOString(),
    // ✅ NOVO: Dados de geolocalização
    geo: geoData ? {
      city: geoData.city,
      region: geoData.region,
      country: geoData.country_name,
      country_code: geoData.country_code,
      postal: geoData.postal,
      latitude: geoData.latitude,
      longitude: geoData.longitude,
      timezone: geoData.timezone,
      org: geoData.org,
      asn: geoData.asn
    } : null
  };
};

/**
 * Limpa o cache de IP (útil para testes ou quando necessário forçar nova consulta)
 */
export const clearIPCache = () => {
  cachedIP = null;
};
