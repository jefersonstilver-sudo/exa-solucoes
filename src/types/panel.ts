
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
  preco_base?: number; // Add this property for database compatibility
  venue_type: string; // Campo correto usado no banco
  
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
  
  // Novos campos técnicos
  polegada?: string;
  orientacao?: 'horizontal' | 'vertical';
  sistema_operacional?: 'windows' | 'linux' | 'android';
  codigo_anydesk?: string;
  senha_anydesk?: string;
  modelo?: string;
  versao_firmware?: string;
  ip_interno?: string;
  mac_address?: string;
  observacoes?: string;
  localizacao?: string;
  
  buildings?: Building;
  distance?: number;
}

export interface GetPanelsByLocationResponse {
  panels: Panel[];
}

export interface PanelWithDistance extends Panel {
  distance: number;
}
