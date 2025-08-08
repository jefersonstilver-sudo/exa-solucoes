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
  const results = { storage: false, database: false, auth: false, overall: false, latency: 0 };

  try {
    // Teste paralelo de todos os componentes
    const [authCheck, dbCheck, storageCheck] = await Promise.allSettled([
      // Teste de autenticação
      supabase.auth.getSession(),
      
      // Teste de banco (query rápida)
      supabase.from('videos').select('id').limit(1),
      
      // Teste de storage (list buckets)
      supabase.storage.listBuckets()
    ]);

    results.auth = authCheck.status === 'fulfilled' && authCheck.value.data.session !== null;
    results.database = dbCheck.status === 'fulfilled' && !dbCheck.value.error;
    results.storage = storageCheck.status === 'fulfilled' && !storageCheck.value.error;
    
    results.overall = results.auth && results.database && results.storage;
    results.latency = Date.now() - startTime;

    console.log('🏥 [HEALTH] System check:', results);
    return results;
    
  } catch (error) {
    console.error('💔 [HEALTH] Health check failed:', error);
    results.latency = Date.now() - startTime;
    return results;
  }
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