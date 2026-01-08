// =============================================
// TIPOS DO SISTEMA DE E-MAIL ZOHO
// =============================================

export type EmailDirection = 'inbound' | 'outbound';
export type EmailCategoria = 'comercial' | 'financeiro' | 'marketing' | 'suporte' | 'geral';
export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface EmailThread {
  id: string;
  zoho_thread_id: string | null;
  subject: string;
  client_id: string | null;
  participants: string[];
  last_message_at: string;
  message_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  client?: {
    id: string;
    nome: string;
    email: string;
  };
  emails?: Email[];
}

export interface Email {
  id: string;
  zoho_message_id: string | null;
  thread_id: string | null;
  from_email: string;
  from_name: string | null;
  to_email: string;
  to_name: string | null;
  cc: string[] | null;
  bcc: string[] | null;
  subject: string;
  body_preview: string | null;
  body_html: string | null;
  body_text: string | null;
  direction: EmailDirection;
  client_id: string | null;
  venda_id: string | null;
  campanha_id: string | null;
  usuario_origem_id: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  has_attachments: boolean;
  attachments: EmailAttachment[];
  labels: string[];
  categoria: EmailCategoria | null;
  received_at: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  client?: {
    id: string;
    nome: string;
    email: string;
  };
  thread?: EmailThread;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  url?: string;
}

export interface EmailSyncStatus {
  id: string;
  account_email: string;
  last_sync_at: string | null;
  last_message_id: string | null;
  sync_status: SyncStatus;
  error_message: string | null;
  messages_synced: number;
  created_at: string;
  updated_at: string;
}

export interface EmailFilters {
  direction?: EmailDirection;
  categoria?: EmailCategoria;
  clientId?: string;
  vendaId?: string;
  campanhaId?: string;
  isRead?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface EmailStats {
  total: number;
  unread: number;
  starred: number;
  inbound: number;
  outbound: number;
  byCategoria: Record<EmailCategoria, number>;
}

export interface ComposeEmail {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  categoria?: EmailCategoria;
  clientId?: string;
  vendaId?: string;
  campanhaId?: string;
  replyToId?: string;
}

// Níveis de acesso por hierarquia
export type EmailAccessLevel = 'own' | 'team' | 'area' | 'all' | 'none';

export interface EmailPermissions {
  accessLevel: EmailAccessLevel;
  canSend: boolean;
  canDelete: boolean;
  canArchive: boolean;
  canViewAttachments: boolean;
  allowedCategorias: EmailCategoria[];
}
