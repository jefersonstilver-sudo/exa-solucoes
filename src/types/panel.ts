
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
  codigo_predio?: string; // ADICIONADO: Código único de 3 dígitos
  imageUrl?: string;
  basePrice?: number;
  preco_base?: number; // Add this property for database compatibility
  venue_type: string; // Campo correto usado no banco
  caracteristicas?: string[]; // ADICIONADO
  imagens?: string[]; // ADICIONADO
  
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
  quantidade_telas?: number; // ADICIONADO
  numero_elevadores?: number; // ADICIONADO - número real de telas/elevadores no prédio
  publico_estimado?: number; // ADICIONADO - pessoas impactadas mensalmente
  visualizacoes_mes?: number; // ADICIONADO - exibições por mês
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
