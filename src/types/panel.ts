
export interface Panel {
  id: string;
  code: string;
  building_id: string;
  status: 'online' | 'offline' | 'maintenance' | 'installing';
  ultima_sync: string;
  resolucao?: string;
  modo?: string;
  buildings?: Building;
  distance?: number; // Distance from the search location in meters
  // Additional fields (some will be mocked in the UI)
  installDate?: Date;
  lastMaintenance?: Date;
  lastVideoDisplayed?: string;
  syncStatus?: string;
  connectivityType?: string;
  installationType?: string;
  videoSpecs?: string;
  uuid?: string;
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
  condominiumProfile?: 'residential' | 'commercial' | 'mixed';
  city?: string;
  comodities?: string[];
  towers?: number;
  apartments?: number;
  buildingAge?: number;
}

export interface PanelWithDistance extends Panel {
  distance?: number;
}

// Tipo para a resposta de get_panels_by_location RPC
export interface GetPanelsByLocationResponse {
  data: Panel[] | null;
  error: Error | null;
}
