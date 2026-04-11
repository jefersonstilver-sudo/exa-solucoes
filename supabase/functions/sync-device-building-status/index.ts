import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Device {
  id: string;
  name: string | null;
  status: string | null;
  building_id: string | null;
  anydesk_client_id: string | null;
}

interface Building {
  id: string;
  nome: string;
  status: string;
  notion_status: string | null;
}

// Função para normalizar nomes para comparação
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/^(edificio|edifício|residencial|condomínio|condominio|cond\.?)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Função para calcular similaridade entre strings
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeName(str1);
  const norm2 = normalizeName(str2);
  
  // Exact match
  if (norm1 === norm2) return 1;
  
  // One contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const shorter = norm1.length < norm2.length ? norm1 : norm2;
    const longer = norm1.length < norm2.length ? norm2 : norm1;
    return shorter.length / longer.length;
  }
  
  // Remove trailing numbers (e.g., "Provence 2" -> "Provence")
  const base1 = norm1.replace(/\s*\d+$/, '');
  const base2 = norm2.replace(/\s*\d+$/, '');
  
  if (base1 === base2 || base1.includes(base2) || base2.includes(base1)) {
    return 0.9;
  }
  
  return 0;
}

// Encontra o building mais similar ao device
function findBestBuildingMatch(deviceName: string, buildings: Building[]): Building | null {
  if (!deviceName) return null;
  
  let bestMatch: Building | null = null;
  let bestScore = 0.5; // Mínimo de 50% de similaridade
  
  for (const building of buildings) {
    const score = calculateSimilarity(deviceName, building.nome);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = building;
    }
  }
  
  return bestMatch;
}

// Status do Notion que indicam que o prédio deveria ser atualizado para "Online" se o device estiver online
const TRANSITION_TO_ONLINE_STATUSES = [
  'instalacao',
  'instalação',
  'instalacao internet',
  'instalação internet',
  'subir nuc',
  'manutencao',
  'manutenção',
  'manut',
  'troca painel'
];

function shouldTransitionToOnline(notionStatus: string | null): boolean {
  if (!notionStatus) return false;
  const normalized = notionStatus.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return TRANSITION_TO_ONLINE_STATUSES.some(s => normalized.includes(s));
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[sync-device-building-status] Starting sync...');

    // 1. Fetch all devices
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id, name, status, building_id, anydesk_client_id')
      .eq('is_active', true);

    if (devicesError) {
      throw new Error(`Error fetching devices: ${devicesError.message}`);
    }

    // 2. Fetch all buildings
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('id, nome, status, notion_status');

    if (buildingsError) {
      throw new Error(`Error fetching buildings: ${buildingsError.message}`);
    }

    console.log(`[sync-device-building-status] Found ${devices?.length || 0} devices, ${buildings?.length || 0} buildings`);

    const stats = {
      devicesAssociated: 0,
      buildingsUpdatedToOnline: 0,
      buildingsIdentifiedOffline: 0,
      matchDetails: [] as { device: string; building: string; status: string }[]
    };

    // 3. Process each device
    for (const device of devices || []) {
      if (!device.name) continue;

      // Check if device needs building association
      if (!device.building_id) {
        const matchedBuilding = findBestBuildingMatch(device.name, buildings || []);
        if (matchedBuilding) {
          // Associate device to building
          const { error: updateError } = await supabase
            .from('devices')
            .update({ building_id: matchedBuilding.id })
            .eq('id', device.id);

          if (!updateError) {
            stats.devicesAssociated++;
            console.log(`[sync-device-building-status] Associated device "${device.name}" → building "${matchedBuilding.nome}"`);
            
            // Update device object for further processing
            device.building_id = matchedBuilding.id;
          }
        }
      }

      // 4. If device is ONLINE and has building_id, check if building should be updated
      if (device.status === 'online' && device.building_id) {
        const building = buildings?.find(b => b.id === device.building_id);
        
        if (building && shouldTransitionToOnline(building.notion_status)) {
          // Update building status to 'online' / 'Online'
          const { error: updateBuildingError } = await supabase
            .from('buildings')
            .update({ 
              status: 'online',
              notion_status: 'Online'
            })
            .eq('id', building.id);

          if (!updateBuildingError) {
            stats.buildingsUpdatedToOnline++;
            console.log(`[sync-device-building-status] Updated building "${building.nome}" to ONLINE (was: ${building.notion_status})`);
            
            stats.matchDetails.push({
              device: device.name,
              building: building.nome,
              status: 'updated_to_online'
            });
          }
        }
      }
    }

    // 5. Identify buildings with offline devices
    const buildingDeviceMap = new Map<string, { online: number; offline: number; deviceNames: string[] }>();
    
    for (const device of devices || []) {
      if (!device.building_id) continue;
      
      const current = buildingDeviceMap.get(device.building_id) || { online: 0, offline: 0, deviceNames: [] };
      if (device.status === 'online') {
        current.online++;
      } else {
        current.offline++;
      }
      if (device.name) {
        current.deviceNames.push(device.name);
      }
      buildingDeviceMap.set(device.building_id, current);
    }

    // Count buildings that are effectively offline (all devices offline)
    for (const [buildingId, counts] of buildingDeviceMap) {
      if (counts.online === 0 && counts.offline > 0) {
        stats.buildingsIdentifiedOffline++;
        const building = buildings?.find(b => b.id === buildingId);
        if (building) {
          stats.matchDetails.push({
            device: counts.deviceNames.join(', '),
            building: building.nome,
            status: 'offline'
          });
        }
      }
    }

    console.log('[sync-device-building-status] Sync completed:', stats);

    return new Response(JSON.stringify({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[sync-device-building-status] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
