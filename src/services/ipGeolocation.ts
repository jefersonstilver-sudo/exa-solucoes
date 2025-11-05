export interface IPGeolocation {
  ip: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  isp?: string;
  is_vpn?: boolean;
  timezone?: string;
  asn?: string;
  org?: string;
  connection_type?: string;
}

class IPGeolocationService {
  // Tenta múltiplos serviços para obter o IP real do usuário
  async getRealIP(): Promise<string> {
    const services = [
      'https://api.ipify.org?format=json',
      'https://api64.ipify.org?format=json',
      'https://icanhazip.com',
      'https://api.my-ip.io/v2/ip.json'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        const text = await response.text();
        
        // Alguns serviços retornam JSON, outros texto puro
        let ip: string;
        try {
          const json = JSON.parse(text);
          ip = json.ip || json.ipAddress || text.trim();
        } catch {
          ip = text.trim();
        }

        // Valida se é um IP válido e não é um IP de CDN conhecido
        if (ip && !this.isCDNIP(ip)) {
          console.log('✅ IP real obtido de', service, ':', ip);
          return ip;
        }
      } catch (error) {
        console.warn('Falha ao obter IP de', service);
        continue;
      }
    }

    // Fallback: retorna último IP obtido
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip } = await response.json();
    return ip;
  }

  // Verifica se é um IP de CDN conhecido (Cloudflare, etc)
  private isCDNIP(ip: string): boolean {
    const cdnRanges = [
      /^104\.28\./,  // Cloudflare
      /^104\.18\./,  // Cloudflare
      /^172\.64\./,  // Cloudflare
      /^173\.245\./, // Cloudflare
    ];
    return cdnRanges.some(range => range.test(ip));
  }

  async getIPLocation(ip: string): Promise<IPGeolocation | null> {
    try {
      if (ip === '::1' || ip === '127.0.0.1' || ip === 'unknown' || !ip) {
        console.warn('⚠️ IP inválido, usando localização padrão');
        return null; // Retorna null em vez de localização padrão
      }

      // Tenta primeiro o ipapi.co (mais preciso e com detecção de VPN)
      try {
        console.log('🔵 Tentando ipapi.co para IP:', ip);
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.error) {
            console.warn('❌ ipapi.co erro:', data.reason);
          } else {
            console.log('✅ Geolocalização obtida de ipapi.co:', data);
            return {
              ip,
              country: data.country_name || 'Unknown',
              country_code: data.country_code || 'XX',
              region: data.region || 'Unknown',
              city: data.city || 'Unknown',
              latitude: data.latitude || 0,
              longitude: data.longitude || 0,
              isp: data.org || data.asn,
              timezone: data.timezone,
              asn: data.asn,
              org: data.org,
              is_vpn: data.threat?.is_proxy || data.threat?.is_tor || data.threat?.is_threat || false
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ Falha ao usar ipapi.co, tentando ip-api.com');
      }

      // Fallback: ip-api.com (gratuito, mas menos preciso)
      console.log('🔵 Tentando ip-api.com para IP:', ip);
      const response = await fetch(`https://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,proxy,hosting`);
      
      if (!response.ok) {
        console.error('❌ Falha ao buscar geolocalização');
        return null;
      }

      const data = await response.json();

      if (data.status === 'fail') {
        console.error('❌ Geolocalização falhou:', data.message);
        return null;
      }

      console.log('✅ Geolocalização obtida de ip-api.com:', data);

      return {
        ip,
        country: data.country,
        country_code: data.countryCode,
        region: data.regionName,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
        isp: data.isp,
        timezone: data.timezone,
        asn: data.as,
        org: data.org,
        is_vpn: data.proxy || data.hosting || false
      };
    } catch (error) {
      console.error('❌ Erro ao obter geolocalização:', error);
      return null;
    }
  }


  isSuspiciousLocation(location: IPGeolocation): boolean {
    const highRiskCountries = ['CN', 'RU', 'NG', 'VN', 'IN'];
    
    if (highRiskCountries.includes(location.country_code)) {
      return true;
    }

    if (location.is_vpn) {
      return true;
    }

    return false;
  }
}

export const ipGeolocationService = new IPGeolocationService();
