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
  // Hide all POIs (businesses, parks, etc.)
  { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.school", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "off" }] },
  { featureType: "poi.government", stylers: [{ visibility: "off" }] },
  // Hide transit labels
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  // Simplify road labels
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
];