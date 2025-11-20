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
  tags?: ConversationTag[];
}
