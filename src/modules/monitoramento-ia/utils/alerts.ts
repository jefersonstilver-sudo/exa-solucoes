import { supabase } from '@/integrations/supabase/client';

export interface DeviceAlert {
  id: string;
  device_id: string;
  alert_type: string;
  status: string;
  severity: string;
  opened_at: string;
  closed_at: string | null;
  evidence: any;
  created_at: string;
  provider?: string; // AnyDesk, String, etc.
  duration_seconds?: number;
  devices?: {
    id: string;
    name: string;
    condominio_name: string;
    status: string;
    anydesk_client_id?: string;
    last_online_at?: string;
    metadata?: any;
    comments?: string;
  };
}

export interface AlertStats {
  open: number;
  scheduled: number;
  resolved: number;
  ignored: number;
  critical: number;
}

export interface AlertFilters {
  search?: string;
  status?: string[];
  severity?: string[];
  condominio?: string;
  provider?: string;
  orderBy?: 'severity' | 'opened_at' | 'status' | 'name' | 'provider';
  startDate?: Date;
  endDate?: Date;
}

export async function fetchAlerts(filters?: AlertFilters) {
  let query = supabase
    .from('device_alerts')
    .select(`
      *,
      devices (
        id,
        name,
        condominio_name,
        status,
        anydesk_client_id,
        comments,
        metadata
      )
    `)
    .order('opened_at', { ascending: false });

  // Date range filter
  if (filters?.startDate) {
    query = query.gte('opened_at', filters.startDate.toISOString());
  }
  if (filters?.endDate) {
    query = query.lte('opened_at', filters.endDate.toISOString());
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.severity && filters.severity.length > 0) {
    query = query.in('severity', filters.severity);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }

  let filteredData = data || [];

  // Apply search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredData = filteredData.filter((alert: any) => 
      alert.devices?.name?.toLowerCase().includes(searchLower) ||
      alert.devices?.condominio_name?.toLowerCase().includes(searchLower) ||
      alert.alert_type?.toLowerCase().includes(searchLower)
    );
  }

  // Apply condominio filter
  if (filters?.condominio) {
    filteredData = filteredData.filter((alert: any) => 
      alert.devices?.condominio_name === filters.condominio
    );
  }

  // Apply provider filter
  if (filters?.provider) {
    filteredData = filteredData.filter((alert: any) => 
      (alert.provider || 'AnyDesk') === filters.provider
    );
  }

  // Add provider info if not present (default to AnyDesk)
  filteredData = filteredData.map((alert: any) => ({
    ...alert,
    provider: alert.provider || 'AnyDesk'
  }));

  // Apply ordering
  if (filters?.orderBy) {
    filteredData = filteredData.sort((a: any, b: any) => {
      switch (filters.orderBy) {
        case 'severity':
          const severityOrder = { high: 3, medium: 2, low: 1 };
          return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                 (severityOrder[a.severity as keyof typeof severityOrder] || 0);
        case 'name':
          return (a.devices?.name || '').localeCompare(b.devices?.name || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime();
      }
    });
  }

  // Always put critical alerts on top
  filteredData = filteredData.sort((a: any, b: any) => {
    if (a.severity === 'high' && b.severity !== 'high') return -1;
    if (a.severity !== 'high' && b.severity === 'high') return 1;
    return 0;
  });

  return filteredData as DeviceAlert[];
}

export async function fetchAlertById(id: string) {
  const { data, error } = await supabase
    .from('device_alerts')
    .select(`
      *,
      devices (
        id,
        name,
        condominio_name,
        status,
        anydesk_client_id,
        last_online_at
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching alert:', error);
    throw error;
  }

  return data as DeviceAlert;
}

export async function updateAlertStatus(
  id: string, 
  status: string, 
  additionalData?: { closed_at?: string; evidence?: any }
) {
  const updateData: any = { status };
  
  if (additionalData?.closed_at) {
    updateData.closed_at = additionalData.closed_at;
  }
  
  if (additionalData?.evidence) {
    updateData.evidence = additionalData.evidence;
  }

  const { data, error } = await supabase
    .from('device_alerts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating alert:', error);
    throw error;
  }

  return data;
}

export async function createManualAlert(alertData: {
  device_id: string;
  alert_type: string;
  severity: string;
  evidence?: any;
}) {
  const { data, error } = await supabase
    .from('device_alerts')
    .insert({
      ...alertData,
      status: 'open',
      opened_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating alert:', error);
    throw error;
  }

  return data;
}

export async function fetchDeviceAlerts(deviceId: string) {
  const { data, error } = await supabase
    .from('device_alerts')
    .select('*')
    .eq('device_id', deviceId)
    .order('opened_at', { ascending: false });

  if (error) {
    console.error('Error fetching device alerts:', error);
    throw error;
  }

  return data as DeviceAlert[];
}

export async function calculateAlertStats(): Promise<AlertStats> {
  const { data, error } = await supabase
    .from('device_alerts')
    .select('status, severity');

  if (error) {
    console.error('Error calculating stats:', error);
    return { open: 0, scheduled: 0, resolved: 0, ignored: 0, critical: 0 };
  }

  const stats: AlertStats = {
    open: 0,
    scheduled: 0,
    resolved: 0,
    ignored: 0,
    critical: 0
  };

  data?.forEach((alert: any) => {
    if (alert.status === 'open') stats.open++;
    if (alert.status === 'scheduled') stats.scheduled++;
    if (alert.status === 'resolved') stats.resolved++;
    if (alert.severity === 'high') stats.critical++;
  });

  return stats;
}

export async function getUniqueCondominios(): Promise<string[]> {
  const { data, error } = await supabase
    .from('device_alerts')
    .select(`
      devices (
        condominio_name
      )
    `);

  if (error) {
    console.error('Error fetching condominios:', error);
    return [];
  }

  const condominios = new Set<string>();
  data?.forEach((alert: any) => {
    if (alert.devices?.condominio_name) {
      condominios.add(alert.devices.condominio_name);
    }
  });

  return Array.from(condominios).sort();
}

// STUB – integração futura String/AnyDesk
export async function fetchAnyDeskMetadataStub(deviceId: string) {
  /* Futuro:
     - Receber STRING_API_KEY
     - Chamar API de status AnyDesk
     - Retornar {temperature, uptime, os_info, last_seen, ip_address}
     - Popular device.metadata
  */
  console.log('[STUB] fetchAnyDeskMetadataStub called for device:', deviceId);
  return null;
}

// STUB – webhook futuro de alertas da String
export async function processIncomingAlertStub(payload: any) {
  /* Futuro:
     - Interpretação do payload
     - Criação automática de alertas
     - Classificação por severidade
     - Validação de formato
     - Log de eventos
  */
  console.log('[STUB] processIncomingAlertStub called with payload:', payload);
  return true;
}
