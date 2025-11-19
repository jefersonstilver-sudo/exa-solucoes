/**
 * Hook: useAnyDeskMetadata (PLACEHOLDER)
 * 
 * Futuro: conectar com String para buscar metadata real do AnyDesk
 * Por ora: retorna placeholders
 */

import { useState, useEffect } from 'react';

export interface AnyDeskMetadata {
  os_info?: string;
  ip_address?: string;
  temperature?: number;
  last_drop_at?: string;
  uptime?: number;
  last_seen?: string;
  [key: string]: any;
}

export function useAnyDeskMetadata(anydeskClientId: string) {
  const [metadata, setMetadata] = useState<AnyDeskMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // PLACEHOLDER: Simula fetch de metadata
    // TODO: Conectar com String/AnyDesk API quando token disponível
    
    setLoading(true);
    
    // Simula delay de rede
    setTimeout(() => {
      setMetadata({
        os_info: 'Windows 10 Pro (placeholder)',
        ip_address: '192.168.1.100',
        temperature: 42,
        uptime: 86400, // 1 dia em segundos
        last_seen: new Date().toISOString(),
      });
      setLoading(false);
    }, 500);
  }, [anydeskClientId]);

  return { metadata, loading };
}
