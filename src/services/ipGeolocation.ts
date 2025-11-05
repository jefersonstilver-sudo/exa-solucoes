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
}

class IPGeolocationService {
  async getIPLocation(ip: string): Promise<IPGeolocation | null> {
    try {
      if (ip === '::1' || ip === '127.0.0.1' || ip === 'unknown' || !ip) {
        return this.getDefaultLocation();
      }

      const response = await fetch(`https://ip-api.com/json/${ip}?lang=pt-BR&fields=status,country,countryCode,region,regionName,city,lat,lon,isp,proxy`);
      
      if (!response.ok) {
        console.warn('Failed to fetch IP location');
        return this.getDefaultLocation();
      }

      const data = await response.json();

      if (data.status === 'fail') {
        console.warn('IP geolocation failed:', data.message);
        return this.getDefaultLocation();
      }

      return {
        ip,
        country: data.country,
        country_code: data.countryCode,
        region: data.regionName,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
        isp: data.isp,
        is_vpn: data.proxy
      };
    } catch (error) {
      console.error('Error getting IP location:', error);
      return this.getDefaultLocation();
    }
  }

  private getDefaultLocation(): IPGeolocation {
    return {
      ip: 'unknown',
      country: 'Brasil',
      country_code: 'BR',
      region: 'São Paulo',
      city: 'São Paulo',
      latitude: -23.5505,
      longitude: -46.6333,
      is_vpn: false
    };
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
