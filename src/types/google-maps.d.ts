/* eslint-disable @typescript-eslint/no-unused-vars */
// Global type declarations for Google Maps API
// Ensures the 'google' namespace is available throughout the project

declare namespace google {
  export namespace maps {
    function importLibrary(name: string): Promise<any>;

    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number | undefined;
      getCenter(): LatLng | undefined;
      panTo(latLng: LatLng | LatLngLiteral): void;
      fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      setOptions(options: MapOptions): void;
      getDiv(): Element;
    }

    class OverlayView {
      setMap(map: Map | null): void;
      getMap(): Map | null;
      getPanes(): MapPanes | null;
      getProjection(): MapCanvasProjection;
      onAdd?(): void;
      draw?(): void;
      onRemove?(): void;
    }

    interface MapPanes {
      floatPane: Element;
      mapPane: Element;
      markerLayer: Element;
      overlayLayer: Element;
      overlayMouseTarget: Element;
    }

    interface MapCanvasProjection {
      fromLatLngToDivPixel(latLng: LatLng | LatLngLiteral): Point | null;
      fromDivPixelToLatLng(pixel: Point): LatLng | null;
    }

    interface MapMouseEvent {
      latLng: LatLng | null;
      domEvent: MouseEvent | TouchEvent | PointerEvent | KeyboardEvent | Event;
      stop(): void;
    }

    type MapsLibrary = any;
    type PlacesLibrary = any;

    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(latlng: LatLng | LatLngLiteral): void;
      getPosition(): LatLng | null;
      setIcon(icon: string | Icon | Symbol): void;
      setTitle(title: string): void;
      setAnimation(animation: Animation | null): void;
      addListener(eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      setDraggable(draggable: boolean): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
      toJSON(): LatLngLiteral;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
      getCenter(): LatLng;
      contains(latLng: LatLng | LatLngLiteral): boolean;
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(opts?: InfoWindowOpenOptions | Map, anchor?: Marker): void;
      close(): void;
      setContent(content: string | Node): void;
    }

    class Geocoder {
      geocode(request: GeocoderRequest, callback?: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): Promise<GeocoderResponse>;
    }

    class Circle {
      constructor(opts?: CircleOptions);
      setMap(map: Map | null): void;
      setCenter(center: LatLng | LatLngLiteral): void;
      setRadius(radius: number): void;
      getBounds(): LatLngBounds | null;
    }

    namespace places {
      class AutocompleteService {
        getPlacePredictions(request: AutocompletionRequest, callback?: (predictions: AutocompletePrediction[] | null, status: PlacesServiceStatus) => void): void;
      }

      class PlacesService {
        constructor(attrContainer: HTMLDivElement | Map);
        getDetails(request: PlaceDetailsRequest, callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void): void;
      }

      interface AutocompletionRequest {
        input: string;
        componentRestrictions?: ComponentRestrictions;
        types?: string[];
        location?: LatLng;
        radius?: number;
        bounds?: LatLngBounds;
      }

      interface ComponentRestrictions {
        country?: string | string[];
      }

      interface AutocompletePrediction {
        place_id: string;
        description: string;
        structured_formatting: {
          main_text: string;
          secondary_text?: string;
        };
        types: string[];
      }

      interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
      }

      interface PlaceResult {
        formatted_address?: string;
        geometry?: {
          location?: LatLng;
          viewport?: LatLngBounds;
        };
        name?: string;
        types?: string[];
        address_components?: GeocoderAddressComponent[];
        place_id?: string;
      }

      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        ERROR = 'ERROR',
        INVALID_REQUEST = 'INVALID_REQUEST',
        NOT_FOUND = 'NOT_FOUND',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      }
    }

    namespace event {
      function addListener(instance: object, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      function addListenerOnce(instance: object, eventName: string, handler: (...args: any[]) => void): MapsEventListener;
      function removeListener(listener: MapsEventListener): void;
      function clearListeners(instance: object, eventName: string): void;
    }

    enum SymbolPath {
      CIRCLE = 0,
      FORWARD_CLOSED_ARROW = 1,
      FORWARD_OPEN_ARROW = 2,
      BACKWARD_CLOSED_ARROW = 3,
      BACKWARD_OPEN_ARROW = 4,
    }

    enum Animation {
      BOUNCE = 1,
      DROP = 2,
    }

    enum GeocoderStatus {
      OK = 'OK',
      ERROR = 'ERROR',
      INVALID_REQUEST = 'INVALID_REQUEST',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      ZERO_RESULTS = 'ZERO_RESULTS',
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      fullscreenControl?: boolean;
      streetViewControl?: boolean;
      zoomControl?: boolean;
      styles?: MapTypeStyle[];
      mapTypeId?: string;
      gestureHandling?: string;
      clickableIcons?: boolean;
      disableDefaultUI?: boolean;
      minZoom?: number;
      maxZoom?: number;
      draggable?: boolean;
      scrollwheel?: boolean;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      icon?: string | Icon | Symbol;
      animation?: Animation;
      draggable?: boolean;
      label?: string | MarkerLabel;
      zIndex?: number;
      clickable?: boolean;
      cursor?: string;
      optimized?: boolean;
    }

    interface MarkerLabel {
      text: string;
      color?: string;
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: string;
    }

    interface Icon {
      url: string;
      scaledSize?: Size;
      size?: Size;
      origin?: Point;
      anchor?: Point;
    }

    interface Symbol {
      path: SymbolPath | string;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
      scale?: number;
      rotation?: number;
      anchor?: Point;
    }

    interface InfoWindowOptions {
      content?: string | Node;
      position?: LatLng | LatLngLiteral;
      maxWidth?: number;
      disableAutoPan?: boolean;
    }

    interface InfoWindowOpenOptions {
      anchor?: Marker;
      map?: Map;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface Padding {
      top: number;
      right: number;
      bottom: number;
      left: number;
    }

    interface MapTypeStyle {
      elementType?: string;
      featureType?: string;
      stylers: object[];
    }

    interface MapsEventListener {
      remove(): void;
    }

    class Size {
      constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
      width: number;
      height: number;
      equals(other: Size): boolean;
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
      equals(other: Point): boolean;
    }

    interface CircleOptions {
      center?: LatLng | LatLngLiteral;
      radius?: number;
      map?: Map;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      fillColor?: string;
      fillOpacity?: number;
      clickable?: boolean;
      editable?: boolean;
      draggable?: boolean;
      visible?: boolean;
      zIndex?: number;
    }

    interface GeocoderRequest {
      address?: string;
      location?: LatLng | LatLngLiteral;
      placeId?: string;
      bounds?: LatLngBounds;
      componentRestrictions?: { country: string };
      region?: string;
    }

    interface GeocoderResult {
      address_components: GeocoderAddressComponent[];
      formatted_address: string;
      geometry: {
        location: LatLng;
        viewport: LatLngBounds;
        location_type?: string;
      };
      place_id: string;
      types: string[];
    }

    interface GeocoderResponse {
      results: GeocoderResult[];
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }
  }
}
