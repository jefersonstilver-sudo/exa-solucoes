// Map configuration constants for Foz do Iguaçu region

export const FOZ_DO_IGUACU_CENTER = {
  lat: -25.5163,
  lng: -54.5854
};

export const DEFAULT_MAP_CONFIG = {
  center: FOZ_DO_IGUACU_CENTER,
  zoom: 13,
  defaultZoom: 13,
  maxZoom: 18,
  minZoom: 10
};

export const MAP_STYLES = [
  {
    featureType: "poi",
    elementType: "labels", 
    stylers: [{ visibility: "off" }]
  }
];