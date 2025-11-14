/**
 * Utilitários para gerar fingerprint único do dispositivo
 * Usado para identificar painéis e permitir reconexão automática
 */

interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  colorDepth: number;
  pixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory: number | undefined;
  timezone: string;
  language: string;
  vendor: string;
}

/**
 * Coleta informações detalhadas do dispositivo
 */
export const getDeviceInfo = (): DeviceInfo => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as any).deviceMemory,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    vendor: navigator.vendor || '',
  };
};

/**
 * Gera um fingerprint único baseado nas características do dispositivo
 * @returns Promise com o hash SHA-256 do fingerprint
 */
export const generateDeviceFingerprint = async (): Promise<string> => {
  const info = getDeviceInfo();
  
  // Combina todas as informações em uma string única
  const fingerprintString = [
    info.userAgent,
    info.platform,
    info.screenResolution,
    info.colorDepth,
    info.pixelRatio,
    info.hardwareConcurrency,
    info.deviceMemory,
    info.timezone,
    info.language,
    info.vendor,
  ].join('|');
  
  // Gera hash SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprintString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

/**
 * Recupera ou gera fingerprint do dispositivo
 * Armazena no localStorage para persistência
 */
export const getOrCreateFingerprint = async (): Promise<{ fingerprint: string; deviceInfo: DeviceInfo }> => {
  const storedFingerprint = localStorage.getItem('device_fingerprint');
  const storedDeviceInfo = localStorage.getItem('device_info');
  
  // Se já temos fingerprint armazenado, usar ele
  if (storedFingerprint && storedDeviceInfo) {
    try {
      const deviceInfo = JSON.parse(storedDeviceInfo);
      return { fingerprint: storedFingerprint, deviceInfo };
    } catch (error) {
      console.warn('[FINGERPRINT] Erro ao parsear device_info armazenado, regenerando...');
    }
  }
  
  // Gerar novo fingerprint
  const deviceInfo = getDeviceInfo();
  const fingerprint = await generateDeviceFingerprint();
  
  // Armazenar no localStorage
  localStorage.setItem('device_fingerprint', fingerprint);
  localStorage.setItem('device_info', JSON.stringify(deviceInfo));
  
  console.log('[FINGERPRINT] Novo fingerprint gerado:', fingerprint.substring(0, 16) + '...');
  
  return { fingerprint, deviceInfo };
};

/**
 * Limpa o fingerprint armazenado (usado ao desconectar)
 */
export const clearStoredFingerprint = (): void => {
  localStorage.removeItem('device_fingerprint');
  localStorage.removeItem('device_info');
  console.log('[FINGERPRINT] Fingerprint limpo do localStorage');
};
