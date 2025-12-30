import { supabase } from '@/integrations/supabase/client';

export interface Device {
  id: string;
  name: string;
  condominio_name: string;
  anydesk_client_id: string;
  status: 'online' | 'offline' | 'unknown';
  last_online_at: string | null;
  created_at: string;
  comments?: string;
  address?: string;
  provider?: string;
  tags?: string[] | any;
  total_events?: number;
  offline_count?: number;
  metadata?: {
    torre?: string;
    elevador?: string;
    last_drop_at?: string;
    uptime?: number;
    ip_address?: string;
    os_info?: string;
    temperature?: number;
    last_seen?: string;
    [key: string]: any;
  };
}

export interface DevicesFilters {
  status?: string[];
  condominio?: string;
  torre?: string;
  search?: string;
}

export interface DevicesSort {
  field: 'name' | 'condominio_name' | 'last_online_at' | 'status' | 'offline_count';
  order: 'asc' | 'desc';
}

/**
 * Busca lista paginada de devices do Supabase
 * TODO: String will populate metadata field with AnyDesk data:
 * - os_info, ip_address, temperature, last_drop_at, uptime, last_seen
 */
export async function fetchDevices(
  page: number = 0,
  pageSize: number = 30,
  filters?: DevicesFilters,
  sort?: DevicesSort
) {
  let query = supabase
    .from('devices')
    .select('*', { count: 'exact' })
    .or('is_deleted.is.null,is_deleted.eq.false'); // Excluir devices marcados como deletados

  // Filtros
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters?.condominio) {
    query = query.ilike('condominio_name', `%${filters.condominio}%`);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,condominio_name.ilike.%${filters.search}%,anydesk_client_id.ilike.%${filters.search}%`);
  }

  // Ordenação
  if (sort) {
    query = query.order(sort.field, { ascending: sort.order === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Paginação
  const from = page * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Erro ao buscar devices:', error);
    throw error;
  }

  return { devices: data as Device[], total: count || 0 };
}

/**
 * Busca um device específico por ID
 */
export async function fetchDeviceById(id: string) {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar device:', error);
    throw error;
  }

  return data as Device;
}

/**
 * Atualiza status de um device
 */
export async function updateDeviceStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('devices')
    .update({ status, last_online_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }

  return data as Device;
}

/**
 * Cria um novo device
 */
export async function createDevice(device: Partial<Device>) {
  // Validar anydesk_client_id único
  const { data: existing } = await supabase
    .from('devices')
    .select('id')
    .eq('anydesk_client_id', device.anydesk_client_id!)
    .single();

  if (existing) {
    throw new Error('AnyDesk Client ID já cadastrado');
  }

  const { data, error } = await supabase
    .from('devices')
    .insert([{
      name: device.name,
      condominio_name: device.condominio_name,
      anydesk_client_id: device.anydesk_client_id,
      status: device.status || 'unknown',
    }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar device:', error);
    throw error;
  }

  return data as Device;
}

/**
 * Atualiza um device existente
 */
export async function updateDevice(id: string, updates: Partial<Device>) {
  // Se estiver alterando anydesk_client_id, validar unicidade
  if (updates.anydesk_client_id) {
    const { data: existing } = await supabase
      .from('devices')
      .select('id')
      .eq('anydesk_client_id', updates.anydesk_client_id)
      .neq('id', id)
      .single();

    if (existing) {
      throw new Error('AnyDesk Client ID já cadastrado');
    }
  }

  const { data, error } = await supabase
    .from('devices')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar device:', error);
    throw error;
  }

  return data as Device;
}

/**
 * TODO: Endpoint para criar alerta manual
 * POST /api/device_alerts
 */
export async function createDeviceAlert(deviceId: string, alertData: {
  alert_type: string;
  severity: string;
  evidence?: any;
}) {
  const { data, error } = await supabase
    .from('device_alerts')
    .insert([{
      device_id: deviceId,
      alert_type: alertData.alert_type,
      severity: alertData.severity,
      status: 'open',
      evidence: alertData.evidence || {},
      opened_at: new Date().toISOString(),
    }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar alerta:', error);
    throw error;
  }

  return data;
}

/**
 * Busca histórico de alertas de um device
 */
export async function fetchDeviceAlerts(deviceId: string, limit: number = 10) {
  const { data, error } = await supabase
    .from('device_alerts')
    .select('*')
    .eq('device_id', deviceId)
    .order('opened_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erro ao buscar alertas:', error);
    throw error;
  }

  return data;
}

/**
 * Calcula estatísticas dos devices
 */
export function calculateDeviceStats(devices: Device[]) {
  const online = devices.filter(d => d.status === 'online').length;
  const offline = devices.filter(d => d.status === 'offline').length;
  const unknown = devices.filter(d => d.status === 'unknown').length;

  return { online, offline, unknown, total: devices.length };
}

/**
 * Formata uptime em formato legível
 */
export function formatUptime(seconds?: number): string {
  if (!seconds) return 'N/A';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Formata temperatura
 */
export function formatTemperature(temp?: number): string {
  if (!temp) return 'N/A';
  return `${temp}°C`;
}
