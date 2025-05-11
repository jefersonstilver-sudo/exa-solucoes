
/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
    mapsApiLoaded: boolean;
    googleMapsCallback?: () => void;
  }
}

// Make sure we have the basic map style types defined
declare namespace google.maps {
  interface MapTypeStyle {
    featureType?: string;
    elementType?: string;
    stylers?: Array<{ [key: string]: any }>;
  }
}

export {};
