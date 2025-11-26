export interface ConversationNote {
  id: string;
  phone_number: string;
  agent_key: string;
  note_text: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  users?: {
    email: string;
  };
}

export interface ConversationTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ConversationTagAssignment {
  id: string;
  phone_number: string;
  agent_key: string;
  tag_id: string;
  created_at: string;
  conversation_tags?: ConversationTag;
}

export interface CRMFilters {
  agentKey?: string;
  unreadOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  tags?: string[];
  archived?: boolean;
}

export interface CRMMetrics {
  total: number;
  unread: number;
  today: number;
  responseRate: number;
  avgResponseTime: number;
}

export interface ZAPILog {
  id: string;
  agent_key: string;
  phone_number: string;
  message_text: string;
  direction: 'inbound' | 'outbound';
  status: string;
  created_at: string;
  is_read?: boolean;
  read_at?: string | null;
  metadata?: any;
}

export interface ConversationGroup {
  phone_number: string;
  agent_key: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  total_messages: number;
  contact_name?: string;
  is_group?: boolean;
  tags?: ConversationTag[];
}

export interface ContactType {
  id: string;
  name: string;
  label: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadDetails {
  id: string;
  contact_name: string | null;
  contact_phone: string;
  contact_type: string | null;
  contact_type_source: 'ai' | 'manual' | 'unknown';
  contact_type_updated_by: string | null;
  contact_type_updated_at: string | null;
  agent_key: string;
  is_sindico: boolean;
  is_hot_lead: boolean;
  is_critical: boolean;
  lead_score: number | null;
  mood_score: number | null;
  urgency_level: number | null;
  sentiment: string | null;
  first_message_at: string | null;
  last_message_at: string | null;
  avg_response_time: string | null;
  awaiting_response: boolean;
  escalated_to_eduardo: boolean;
  escalated_at: string | null;
  metadata?: {
    building_name?: string;
    last_sender_name?: string;
  } | null;
}

export interface ConversationReport {
  id: string;
  conversation_id: string;
  agent_key: string;
  report_data: any;
  summary: string | null;
  contact_profile: any;
  interests: any;
  conversation_stage: string | null;
  recommendations: any;
  generated_at: string;
  generated_by: string | null;
  created_at: string;
}

export interface LeadMetrics {
  totalMessages: number;
  avgResponseTimeFormatted: string;
  firstContactFormatted: string;
  lastContactFormatted: string;
  daysSinceLastContact: number;
  firstContact?: string;
  lastContact?: string;
}
