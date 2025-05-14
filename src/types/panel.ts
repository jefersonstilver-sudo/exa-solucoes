
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
  basePrice?: number; // Added this property to fix TypeScript errors
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
}
