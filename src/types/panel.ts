

export interface Panel {
  id: string;
  code: string;
  building_id: string;
  status: 'online' | 'offline' | 'maintenance';
  ultima_sync: string;
  resolucao?: string;
  modo?: string;
  buildings?: Building;
}

export interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface PanelWithDistance extends Panel {
  distance?: number;
}

// Type for the response from get_panels_by_location RPC
export interface GetPanelsByLocationResponse {
  data: Panel[] | null;
  error: Error | null;
}

