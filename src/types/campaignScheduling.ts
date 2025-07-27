export interface CampaignAdvanced {
  id: string;
  client_id: string;
  pedido_id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignVideoSchedule {
  id: string;
  campaign_id: string;
  video_id: string;
  slot_position: number;
  priority: number;
  created_at: string;
  updated_at: string;
  video_data?: {
    id: string;
    nome: string;
    url: string;
    duracao: number;
    orientacao: string;
  };
  schedule_rules: CampaignScheduleRule[];
}

export interface CampaignScheduleRule {
  id: string;
  campaign_video_schedule_id: string;
  days_of_week: number[]; // 0=Sunday, 1=Monday, etc.
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleRuleInput {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface VideoScheduleInput {
  video_id: string;
  slot_position: number;
  priority: number;
  schedule_rules: ScheduleRuleInput[];
}

export interface CampaignInput {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  video_schedules: VideoScheduleInput[];
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];