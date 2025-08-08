import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  storage: boolean;
  database: boolean;
  auth: boolean;
  overall: boolean;
  latency: number;
}

interface PerformanceMetrics {
  uploadSpeed: number; // MB/s
  dbLatency: number; // ms
  storageLatency: number; // ms
  errorRate: number; // percentage
}

// Cache para URLs já validadas (evita validações repetidas)
const urlValidationCache = new Map<string, { valid: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const testSystemHealth = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  let authHealth = false;
  let dbHealth = false;
  let storageHealth = false;

  try {
    // Test auth com timeout de 3s
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Auth timeout')), 3000)
    );
    
    const { data: { user } } = await Promise.race([authPromise, timeoutPromise]) as any;
    authHealth = !!user;
    console.log('🔐 Auth check:', authHealth ? 'OK' : 'FAIL');
  } catch (error) {
    console.error('❌ Auth health check failed:', error);
  }

  try {
    // Test database com timeout de 3s  
    const dbPromise = supabase
      .from('videos')
      .select('id')
      .limit(1);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DB timeout')), 3000)
    );
    
    const { data } = await Promise.race([dbPromise, timeoutPromise]) as any;
    dbHealth = Array.isArray(data);
    console.log('🗄️ DB check:', dbHealth ? 'OK' : 'FAIL');
  } catch (error) {
    console.error('❌ DB health check failed:', error);
  }

  try {
    // Test storage com timeout de 2s
    const storagePromise = supabase.storage.listBuckets();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Storage timeout')), 2000)
    );
    
    const { data } = await Promise.race([storagePromise, timeoutPromise]) as any;
    storageHealth = Array.isArray(data);
    console.log('📦 Storage check:', storageHealth ? 'OK' : 'FAIL');
  } catch (error) {
    console.error('❌ Storage health check failed:', error);
  }

  const endTime = Date.now();
  const latency = endTime - startTime;
  const overall = authHealth && dbHealth && storageHealth;

  console.log(`🏥 [HEALTH] Resultado completo:`, {
    auth: authHealth,
    database: dbHealth, 
    storage: storageHealth,
    overall,
    latency: `${latency}ms`
  });

  return {
    auth: authHealth,
    database: dbHealth,
    storage: storageHealth,
    overall,
    latency
  };
};

export const validateUrlWithCache = (url: string): boolean => {
  // Verificar cache primeiro
  const cached = urlValidationCache.get(url);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.valid;
  }

  // Validação simplificada (mais permissiva)
  let isValid = false;
  try {
    const urlObj = new URL(url);
    isValid = urlObj.protocol === 'https:' && 
             (urlObj.hostname.includes('supabase.co') || urlObj.hostname.includes('amazonaws.com'));
  } catch {
    isValid = url.includes('supabase.co') || url.includes('amazonaws.com');
  }

  // Armazenar no cache
  urlValidationCache.set(url, { valid: isValid, timestamp: Date.now() });
  
  // Limpar cache antigo periodicamente
  if (urlValidationCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of urlValidationCache.entries()) {
      if ((now - value.timestamp) > CACHE_DURATION) {
        urlValidationCache.delete(key);
      }
    }
  }

  return isValid;
};

export const trackPerformanceMetrics = (() => {
  let metrics: PerformanceMetrics = {
    uploadSpeed: 0,
    dbLatency: 0,
    storageLatency: 0,
    errorRate: 0
  };
  
  let uploadSamples: number[] = [];
  let dbSamples: number[] = [];
  let storageSamples: number[] = [];
  let errorCount = 0;
  let totalOperations = 0;

  return {
    recordUploadSpeed: (mbPerSecond: number) => {
      uploadSamples.push(mbPerSecond);
      if (uploadSamples.length > 10) uploadSamples.shift();
      metrics.uploadSpeed = uploadSamples.reduce((a, b) => a + b, 0) / uploadSamples.length;
    },
    
    recordDbLatency: (ms: number) => {
      dbSamples.push(ms);
      if (dbSamples.length > 20) dbSamples.shift();
      metrics.dbLatency = dbSamples.reduce((a, b) => a + b, 0) / dbSamples.length;
    },
    
    recordStorageLatency: (ms: number) => {
      storageSamples.push(ms);
      if (storageSamples.length > 20) storageSamples.shift();
      metrics.storageLatency = storageSamples.reduce((a, b) => a + b, 0) / storageSamples.length;
    },
    
    recordError: () => {
      errorCount++;
      totalOperations++;
      metrics.errorRate = (errorCount / totalOperations) * 100;
    },
    
    recordSuccess: () => {
      totalOperations++;
      metrics.errorRate = (errorCount / totalOperations) * 100;
    },
    
    getMetrics: (): PerformanceMetrics => ({ ...metrics }),
    
    shouldRetry: (): boolean => {
      // Lógica inteligente: retry se error rate < 50% e latência não for muito alta
      return metrics.errorRate < 50 && metrics.dbLatency < 5000;
    }
  };
})();

// Sistema de alertas automáticos
export const monitorSystemHealth = () => {
  let lastHealthCheck = 0;
  const HEALTH_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutos

  return {
    checkIfNeeded: async (): Promise<boolean> => {
      const now = Date.now();
      if ((now - lastHealthCheck) > HEALTH_CHECK_INTERVAL) {
        lastHealthCheck = now;
        const health = await testSystemHealth();
        
        if (!health.overall) {
          console.warn('🚨 [MONITOR] Sistema com problemas:', health);
          return false;
        }
        
        if (health.latency > 3000) {
          console.warn('🐌 [MONITOR] Sistema lento:', health.latency + 'ms');
        }
        
        return health.overall;
      }
      return true; // Assumir OK se não chegou na hora de verificar
    }
  };
};