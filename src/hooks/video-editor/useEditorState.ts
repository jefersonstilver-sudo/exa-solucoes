import { create } from 'zustand';
import { TimelineLayer, VideoEditorProject } from '@/types/videoEditor';

export type FitMode = 'fit' | 'fill' | 'stretch' | 'original';

interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color?: string;
}

interface EditorState {
  // Project
  currentProject: VideoEditorProject | null;
  setCurrentProject: (project: VideoEditorProject | null) => void;
  
  // Selection
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  
  // Playback
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  
  // Timeline
  timelineZoom: number;
  setTimelineZoom: (zoom: number) => void;
  
  // Canvas
  canvasZoom: number;
  setCanvasZoom: (zoom: number) => void;
  fitMode: FitMode;
  setFitMode: (mode: FitMode) => void;
  
  // Timeline Markers
  markers: TimelineMarker[];
  addMarker: (marker: TimelineMarker) => void;
  updateMarker: (id: string, updates: Partial<TimelineMarker>) => void;
  removeMarker: (id: string) => void;
  
  // Snap Settings
  snapEnabled: boolean;
  setSnapEnabled: (enabled: boolean) => void;
  snapTolerance: number;
  setSnapTolerance: (tolerance: number) => void;
  
  // Layers
  layers: TimelineLayer[];
  addLayer: (layer: TimelineLayer) => void;
  splitLayer: (id: string, splitTime: number) => void;
  updateLayer: (id: string, updates: Partial<TimelineLayer>) => void;
  removeLayer: (id: string) => void;
  setLayers: (layers: TimelineLayer[]) => void;
  
  // Undo/Redo
  history: TimelineLayer[][];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useEditorState = create<EditorState>((set, get) => ({
  // Project
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  
  // Selection
  selectedLayerId: null,
  setSelectedLayerId: (id) => set({ selectedLayerId: id }),
  
  // Playback
  isPlaying: false,
  currentTime: 0,
  duration: 15, // 15 seconds default
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  
  // Timeline
  timelineZoom: 1,
  setTimelineZoom: (zoom) => set({ timelineZoom: Math.max(0.5, Math.min(3, zoom)) }),
  
  // Canvas
  canvasZoom: 1,
  setCanvasZoom: (zoom) => set({ canvasZoom: Math.max(0.1, Math.min(5, zoom)) }),
  fitMode: 'fit',
  setFitMode: (mode) => set({ fitMode: mode }),
  
  // Timeline Markers
  markers: [],
  addMarker: (marker) => set((state) => ({ markers: [...state.markers, marker] })),
  updateMarker: (id, updates) => set((state) => ({
    markers: state.markers.map(m => m.id === id ? { ...m, ...updates } : m)
  })),
  removeMarker: (id) => set((state) => ({
    markers: state.markers.filter(m => m.id !== id)
  })),
  
  // Snap Settings
  snapEnabled: true,
  setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
  snapTolerance: 0.1,
  setSnapTolerance: (tolerance) => set({ snapTolerance: tolerance }),
  
  // Layers
  layers: [],
  addLayer: (layer) => {
    set((state) => ({
      layers: [...state.layers, layer],
    }));
    get().pushHistory();
  },
  splitLayer: (id: string, splitTime: number) => {
    const state = get();
    const layer = state.layers.find(l => l.id === id);
    if (!layer || splitTime <= layer.start_time || splitTime >= layer.end_time) return;
    
    const leftPart: TimelineLayer = {
      ...layer,
      id: `${layer.id}-${Date.now()}-left`,
      end_time: splitTime,
      duration: splitTime - layer.start_time
    };
    
    const rightPart: TimelineLayer = {
      ...layer,
      id: `${layer.id}-${Date.now()}-right`,
      start_time: splitTime,
      duration: layer.end_time - splitTime
    };
    
    set((state) => ({
      layers: [
        ...state.layers.filter(l => l.id !== id),
        leftPart,
        rightPart
      ]
    }));
    get().pushHistory();
  },
  updateLayer: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, ...updates } : layer
      ),
    }));
    get().pushHistory();
  },
  removeLayer: (id) => {
    set((state) => ({
      layers: state.layers.filter((layer) => layer.id !== id),
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    }));
    get().pushHistory();
  },
  setLayers: (layers) => set({ layers }),
  
  // Undo/Redo
  history: [[]],
  historyIndex: 0,
  pushHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(state.layers)));
    set({
      history: newHistory.slice(-50), // Keep last 50 states
      historyIndex: Math.min(newHistory.length - 1, 49),
    });
  },
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({
        layers: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
      });
    }
  },
  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({
        layers: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
      });
    }
  },
  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,
}));
