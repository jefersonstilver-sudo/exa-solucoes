
export interface Building {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  basePrice?: number;
  
  // Updated condominiumProfile to be either an object or a string
  condominiumProfile?: string | {
    type: string;
    standard: string;
  };
  audience_profile?: string[] | {
    income: string;
    age: string;
  };
  tags?: string[];
  towers?: number;
  apartments?: number;
  status?: string;
}

export interface Panel {
  id: string;
  code: string;
  building_id?: string;
  status?: string;
  ultima_sync?: string;
  resolucao?: string;
  modo?: string;
  buildings?: Building;
  distance?: number;
}

export interface GetPanelsByLocationResponse {
  panels: Panel[];
}

export interface PanelWithDistance extends Panel {
  distance: number;
}
