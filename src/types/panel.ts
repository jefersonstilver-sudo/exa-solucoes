
export interface Panel {
  id: string;
  code: string;
  building_id: string;
  status: 'online' | 'offline' | 'maintenance' | 'installing';
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
  imageUrl?: string;
}

export interface PanelWithDistance extends Panel {
  distance?: number;
}

// Tipo para a resposta de get_panels_by_location RPC
export interface GetPanelsByLocationResponse {
  data: Panel[] | null;
  error: Error | null;
}
