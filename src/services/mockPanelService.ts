
import { Panel, Building } from '@/types/panel';

// Mock buildings images (simulating generated images)
const buildingImages = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1465804575741-338df8554e02?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2073&q=80",
  "https://images.unsplash.com/photo-1554435493-93422e8d1a41?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1577760258779-e8b26808c42f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1613492636024-9430710a84f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80",
  "https://images.unsplash.com/photo-1510964430293-3e3096075e2c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1624025308270-9323bf9a175d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1698075357677-673b9011f3e3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
  "https://images.unsplash.com/photo-1427751840561-9852520f8ce8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2076&q=80",
  "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
];

// Mock panels data
const mockPanelsData = [
  {
    id: "1",
    code: "FOZ-VILA-A-01",
    building_id: "b1",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "4K",
    modo: "Interno",
    buildings: {
      id: "b1",
      nome: "Edifício Cataratas",
      endereco: "Av. Paraná, 1500",
      bairro: "Vila A",
      latitude: -25.5046,
      longitude: -54.5784,
      status: "ativo",
    }
  },
  {
    id: "2",
    code: "FOZ-CENTRO-01",
    building_id: "b2",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "1080p",
    modo: "Externo",
    buildings: {
      id: "b2",
      nome: "Shopping Cataratas",
      endereco: "Av. Costa e Silva, 185",
      bairro: "Centro",
      latitude: -25.516,
      longitude: -54.5784,
      status: "ativo"
    }
  },
  {
    id: "3", 
    code: "FOZ-JD-FLORES-01",
    building_id: "b3",
    status: "installing",
    ultima_sync: new Date().toISOString(),
    resolucao: "1080p",
    modo: "Interno",
    buildings: {
      id: "b3",
      nome: "Condomínio Flor do Iguaçu",
      endereco: "Rua das Orquídeas, 350",
      bairro: "Jardim das Flores",
      latitude: -25.5258,
      longitude: -54.5754,
      status: "ativo"
    }
  },
  {
    id: "4",
    code: "FOZ-MORFAN-01",
    building_id: "b4",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "4K",
    modo: "Interno",
    buildings: {
      id: "b4",
      nome: "Morfan Tower",
      endereco: "Av. Jorge Schimmelpfeng, 500",
      bairro: "Centro",
      latitude: -25.5196,
      longitude: -54.5864,
      status: "ativo"
    }
  },
  {
    id: "5",
    code: "FOZ-VILAB-01",
    building_id: "b5",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "1080p",
    modo: "Interno",
    buildings: {
      id: "b5",
      nome: "Residencial Iguaçu",
      endereco: "Rua Rio de Janeiro, 720",
      bairro: "Vila B",
      latitude: -25.5086,
      longitude: -54.5684,
      status: "ativo"
    }
  },
  {
    id: "6",
    code: "FOZ-MORUMBI-01",
    building_id: "b6",
    status: "installing",
    ultima_sync: new Date().toISOString(),
    resolucao: "4K",
    modo: "Externo",
    buildings: {
      id: "b6",
      nome: "Shopping Catuaí Palladium",
      endereco: "Av. Presidente Tancredo Neves, 8000",
      bairro: "Morumbi",
      latitude: -25.5416,
      longitude: -54.5384,
      status: "ativo"
    }
  },
  {
    id: "7",
    code: "FOZ-KLP-01",
    building_id: "b7",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "1080p",
    modo: "Interno",
    buildings: {
      id: "b7",
      nome: "Edifício Itaipu",
      endereco: "Rua Maringá, 300",
      bairro: "KLP",
      latitude: -25.5327,
      longitude: -54.5594,
      status: "ativo"
    }
  },
  {
    id: "8",
    code: "FOZ-CENTRO-02",
    building_id: "b8",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "4K",
    modo: "Interno",
    buildings: {
      id: "b8",
      nome: "Hotel Bourbon Cataratas",
      endereco: "Av. das Cataratas, 2345",
      bairro: "Centro",
      latitude: -25.5139,
      longitude: -54.5927,
      status: "ativo"
    }
  },
  {
    id: "9",
    code: "FOZ-TRESLAGOAS-01",
    building_id: "b9",
    status: "online",
    ultima_sync: new Date().toISOString(),
    resolucao: "1080p",
    modo: "Externo",
    buildings: {
      id: "b9",
      nome: "Shopping Três Lagoas",
      endereco: "Av. Silvio Américo Sasdelli, 1500",
      bairro: "Três Lagoas",
      latitude: -25.4846,
      longitude: -54.5684,
      status: "ativo"
    }
  },
  {
    id: "10",
    code: "FOZ-PORTOMEIRA-01",
    building_id: "b10",
    status: "installing",
    ultima_sync: new Date().toISOString(),
    resolucao: "4K",
    modo: "Interno",
    buildings: {
      id: "b10",
      nome: "Complexo Marco das Três Fronteiras",
      endereco: "Rua Edmundo de Barros, 1000",
      bairro: "Porto Meira",
      latitude: -25.5477,
      longitude: -54.5880,
      status: "ativo"
    }
  }
];

export const getMockPanels = (): Panel[] => {
  // Add images to the mock panels
  return mockPanelsData.map((panel, index) => ({
    ...panel,
    buildings: {
      ...(panel.buildings as Building),
      imageUrl: buildingImages[index % buildingImages.length]
    }
  })) as Panel[];
};

export const filterPanelsByLocation = (
  panels: Panel[], 
  selectedLocation: {lat: number, lng: number} | null,
  radius: number
): Panel[] => {
  if (!selectedLocation) return panels;
  
  return panels.map(panel => {
    if (panel.buildings?.latitude && panel.buildings?.longitude) {
      const distance = Math.sqrt(
        Math.pow(panel.buildings.latitude - selectedLocation.lat, 2) + 
        Math.pow(panel.buildings.longitude - selectedLocation.lng, 2)
      ) * 111000; // Rough conversion to meters
      
      return { ...panel, distance };
    }
    return panel;
  }).filter(panel => (panel as any).distance <= radius);
};

export const filterPanelsByStatus = (panels: Panel[], statusFilters: string[]): Panel[] => {
  if (!statusFilters.length) return panels;
  
  return panels.filter(panel => 
    statusFilters.includes(panel.status === 'installing' ? 'installing' : 'online')
  );
};

export const filterPanelsByNeighborhood = (panels: Panel[], neighborhood: string): Panel[] => {
  if (!neighborhood || neighborhood === 'all') return panels;
  
  return panels.filter(panel => 
    panel.buildings?.bairro === neighborhood
  );
};
