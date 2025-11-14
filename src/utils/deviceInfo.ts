/**
 * Captura informações do dispositivo e navegador para auditoria
 */
export const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  const viewport = `${window.innerWidth}x${window.innerHeight}`;
  const colorDepth = window.screen.colorDepth;
  const pixelRatio = window.devicePixelRatio;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Firefox/')) browser = 'Firefox';
  else if (userAgent.includes('Chrome/')) browser = 'Chrome';
  else if (userAgent.includes('Safari/')) browser = 'Safari';
  else if (userAgent.includes('Edge/')) browser = 'Edge';
  else if (userAgent.includes('Opera/')) browser = 'Opera';
  
  // Detect OS
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  
  // Detect device type
  let deviceType = 'Desktop';
  if (/Mobi|Android/i.test(userAgent)) deviceType = 'Mobile';
  else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';

  return {
    userAgent,
    platform,
    browser,
    os,
    deviceType,
    language,
    screenResolution,
    viewport,
    colorDepth,
    pixelRatio,
    timezone,
    timestamp: new Date().toISOString()
  };
};

/**
 * Captura o IP do usuário usando um serviço externo
 */
export const getUserIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.error('[DEVICE-INFO] Erro ao capturar IP:', error);
    return null;
  }
};

/**
 * Captura informações completas para auditoria (IP + Device)
 */
export const getAuditInfo = async () => {
  const deviceInfo = getDeviceInfo();
  const ipOrigem = await getUserIP();
  
  return {
    ipOrigem,
    deviceInfo
  };
};
