// ============================================
// VIDEO EDITOR TYPES
// ============================================

export type VideoEditorStatus = 'draft' | 'editing' | 'rendering' | 'completed' | 'failed';
export type AssetType = 'video' | 'image' | 'audio' | 'logo' | 'template';
export type ExportFormat = 'mp4' | 'webm' | 'gif';
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ExportResolution = '480p' | '720p' | '1080p' | '4k';
export type TemplateCategory = 'social' | 'promo' | 'tutorial' | 'general';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

// ============================================
// PROJECT TYPES
// ============================================

export interface VideoEditorProject {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  status: VideoEditorStatus;
  progress: number;
  project_data: ProjectData;
  export_format: ExportFormat;
  export_quality: ExportQuality;
  export_resolution: ExportResolution;
  version: number;
  parent_version_id?: string;
  duration_seconds?: number;
  file_size_mb?: number;
  output_url?: string;
  created_at: string;
  updated_at: string;
  last_edited_at: string;
  rendered_at?: string;
  deleted_at?: string;
}

export interface ProjectData {
  timeline: TimelineLayer[];
  canvas: CanvasSettings;
  effects?: Effect[];
  transitions?: Transition[];
  audio_tracks?: AudioTrack[];
}

export interface TimelineLayer {
  id: string;
  type: 'video' | 'image' | 'text' | 'shape';
  asset_id?: string;
  start_time: number;
  end_time: number;
  duration: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  z_index: number;
  effects?: string[];
  content?: string; // For text layers
  style?: Record<string, any>; // For text/shape styling
}

export interface CanvasSettings {
  width: number;
  height: number;
  background_color: string;
  aspect_ratio: AspectRatio;
}

export interface Effect {
  id: string;
  name: string;
  type: 'filter' | 'animation' | 'transition';
  settings: Record<string, any>;
}

export interface Transition {
  id: string;
  type: 'fade' | 'slide' | 'zoom' | 'wipe';
  duration: number;
  between_layers: [string, string];
}

export interface AudioTrack {
  id: string;
  asset_id: string;
  start_time: number;
  volume: number;
  fade_in: number;
  fade_out: number;
}

// ============================================
// ASSET TYPES
// ============================================

export interface VideoEditorAsset {
  id: string;
  user_id: string;
  project_id?: string;
  asset_type: AssetType;
  file_name: string;
  file_url: string;
  file_size_mb: number;
  mime_type: string;
  metadata: AssetMetadata;
  folder: string;
  tags: string[];
  is_template: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface AssetMetadata {
  duration?: number;
  width?: number;
  height?: number;
  codec?: string;
  bitrate?: number;
  fps?: number;
}

// ============================================
// TEMPLATE TYPES
// ============================================

export interface VideoEditorTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  thumbnail_url?: string;
  preview_url?: string;
  template_data: ProjectData;
  default_duration: number;
  aspect_ratio: AspectRatio;
  tags: string[];
  is_active: boolean;
  is_premium: boolean;
  sort_order: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// ACCESS LOG TYPES
// ============================================

export interface VideoEditorAccessLog {
  id: string;
  user_id: string;
  event_type: 'access' | 'create' | 'edit' | 'export' | 'delete' | 'share';
  project_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// ============================================
// EDITOR STATE TYPES
// ============================================

export interface EditorState {
  currentProject: VideoEditorProject | null;
  selectedLayer: TimelineLayer | null;
  playing: boolean;
  currentTime: number;
  zoom: number;
  snapping: boolean;
  grid: boolean;
}

// ============================================
// ACCESS CONTROL TYPES
// ============================================

export interface UserAccessInfo {
  id: string;
  email: string;
  nome?: string;
  can_use_video_editor: boolean;
  video_editor_enabled_at?: string;
  video_editor_enabled_by?: string;
  role: string;
}

export interface EditorStats {
  users_with_access: number;
  total_projects: number;
  exports_today: number;
  active_users_today: number;
}
