
export interface VideoSlot {
  id?: string;
  slot_position: number;
  video_id?: string;
  is_active: boolean;
  selected_for_display: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  video_data?: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
    tem_audio: boolean;
    tamanho_arquivo?: number;
    formato?: string;
  };
  rejection_reason?: string;
}

export interface VideoManagementState {
  videoSlots: VideoSlot[];
  loading: boolean;
  uploading: boolean;
  uploadProgress: { [key: number]: number };
}

export interface VideoManagementActions {
  selectVideoForDisplay: (slotId: string) => Promise<void>;
  activateVideo: (slotId: string) => Promise<void>;
  removeVideo: (slotId: string) => Promise<void>;
  uploadVideo: (slotPosition: number, file: File, userId: string, videoTitle?: string, scheduleRules?: any[], priority?: number) => Promise<void>;
  refreshSlots: () => Promise<void>;
}
