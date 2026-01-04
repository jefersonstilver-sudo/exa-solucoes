// Tipos do módulo Contatos & Inteligência Comercial

export type CategoriaContato = 
  | 'lead'
  | 'anunciante'
  | 'sindico_exa'
  | 'sindico_lead'
  | 'parceiro_exa'
  | 'parceiro_lead'
  | 'prestador_elevador'
  | 'eletricista'
  | 'provedor'
  | 'equipe_exa'
  | 'outros';

export type TemperaturaContato = 'quente' | 'morno' | 'frio';

export type StatusContato = 'ativo' | 'arquivado' | 'duplicado';

export type OrigemContato = 
  | 'checkout_site'
  | 'pedido_criado'
  | 'conversa_whatsapp_sofia'
  | 'conversa_whatsapp_vendedor'
  | 'cadastro_manual'
  | 'proposta'
  | 'contrato'
  | 'importacao'
  | 'agenda'
  | 'indicacao'
  | 'google'
  | 'instagram'
  | 'maps'
  | 'rua'
  | 'site'
  | 'telefone'
  | 'email'
  | 'outros';

export type TipoInteracao = 
  | 'whatsapp_enviado'
  | 'whatsapp_recebido'
  | 'ligacao_realizada'
  | 'ligacao_recebida'
  | 'email_enviado'
  | 'email_recebido'
  | 'reuniao'
  | 'visita'
  | 'proposta_enviada'
  | 'anotacao'
  | 'status_alterado';

export interface Contact {
  id: string;
  nome: string;
  sobrenome?: string;
  empresa?: string;
  telefone: string;
  email?: string;
  website?: string;
  cnpj?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  categoria: CategoriaContato;
  temperatura?: TemperaturaContato;
  pontuacao_atual?: number;
  pontuacao_calculada_em?: string;
  onde_anuncia_hoje?: string[];
  publico_alvo?: string;
  dores_identificadas?: string;
  observacoes_estrategicas?: string;
  tomador_decisao?: string;
  cargo_tomador?: string;
  tipo_negocio?: string;
  bloqueado: boolean;
  motivo_bloqueio?: string;
  status: StatusContato;
  responsavel_id?: string;
  origem?: OrigemContato;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_contact_at?: string;
  last_action?: string;
  // Novos campos
  conversation_id?: string;
  instagram?: string;
  ticket_estimado?: number;
  satisfacao?: number;
  logo_url?: string;
  total_investido?: number;
  dias_sem_contato?: number;
}

export interface ContactScoringRule {
  id: string;
  campo: string;
  label: string;
  pontos: number;
  categoria?: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactScoringConfig {
  id: string;
  categoria: CategoriaContato;
  pontuacao_minima: number;
  pontuacao_ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactInteraction {
  id: string;
  contact_id: string;
  tipo: TipoInteracao;
  descricao?: string;
  metadata?: Record<string, any>;
  usuario_id?: string;
  created_at: string;
}

export interface ContactAuditLog {
  id: string;
  contact_id: string;
  action: 'created' | 'updated' | 'deleted' | 'merged' | 'blocked' | 'unblocked';
  changed_fields?: string[];
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id?: string;
  user_email?: string;
  created_at: string;
}

export interface ContactFile {
  id: string;
  contact_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  category: 'proposta' | 'contrato' | 'documento' | 'imagem' | 'outros';
  uploaded_by?: string;
  created_at: string;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  content: string;
  is_important: boolean;
  created_by?: string;
  created_by_email?: string;
  created_at: string;
  updated_at: string;
}

// Configuração das categorias
export const CATEGORIAS_CONFIG: Record<CategoriaContato, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  hasPontuacao: boolean;
  description: string;
}> = {
  lead: { 
    label: 'Lead', 
    color: 'text-green-700', 
    bgColor: 'bg-green-500', 
    icon: 'Target',
    hasPontuacao: true,
    description: 'Potencial cliente comercial'
  },
  anunciante: { 
    label: 'Anunciante', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-500', 
    icon: 'CheckCircle',
    hasPontuacao: false,
    description: 'Cliente ativo com contrato'
  },
  sindico_exa: { 
    label: 'Síndico EXA', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-600', 
    icon: 'Building',
    hasPontuacao: false,
    description: 'Síndico de prédio ativo na rede EXA'
  },
  sindico_lead: { 
    label: 'Síndico Lead', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-400', 
    icon: 'UserCheck',
    hasPontuacao: true,
    description: 'Síndico potencial para expansão'
  },
  parceiro_exa: { 
    label: 'Parceiro EXA', 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-200', 
    icon: 'Handshake',
    hasPontuacao: false,
    description: 'Parceiro ativo sem troca financeira'
  },
  parceiro_lead: { 
    label: 'Parceiro Lead', 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-400', 
    icon: 'Sprout',
    hasPontuacao: false,
    description: 'Potencial parceria estratégica'
  },
  prestador_elevador: { 
    label: 'Prestador Elevador', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-400', 
    icon: 'Building2',
    hasPontuacao: false,
    description: 'Empresa de manutenção de elevadores'
  },
  eletricista: { 
    label: 'Eletricista', 
    color: 'text-gray-100', 
    bgColor: 'bg-gray-700', 
    icon: 'Zap',
    hasPontuacao: false,
    description: 'Prestador de serviços elétricos'
  },
  provedor: { 
    label: 'Provedor', 
    color: 'text-purple-100', 
    bgColor: 'bg-purple-500', 
    icon: 'Wifi',
    hasPontuacao: false,
    description: 'Fornecedor de tecnologia/serviços'
  },
  equipe_exa: { 
    label: 'Equipe EXA', 
    color: 'text-indigo-100', 
    bgColor: 'bg-indigo-500', 
    icon: 'Users',
    hasPontuacao: false,
    description: 'Funcionário ou colaborador interno'
  },
  outros: { 
    label: 'Outros', 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-200', 
    icon: 'MoreHorizontal',
    hasPontuacao: false,
    description: 'Outros tipos de contato'
  }
};

export const CATEGORIAS_ORDER: CategoriaContato[] = [
  'lead',
  'anunciante',
  'sindico_exa',
  'sindico_lead',
  'parceiro_exa',
  'parceiro_lead',
  'prestador_elevador',
  'eletricista',
  'provedor',
  'equipe_exa',
  'outros'
];

export const TEMPERATURA_CONFIG: Record<TemperaturaContato, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  quente: { label: 'Quente', color: 'text-green-700', bgColor: 'bg-green-100', icon: 'Flame' },
  morno: { label: 'Morno', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: 'Sun' },
  frio: { label: 'Frio', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: 'Snowflake' }
};

export const ORIGEM_CONFIG: Record<OrigemContato, {
  label: string;
  icon: string;
  color: string;
}> = {
  checkout_site: { label: 'Checkout Site', icon: 'ShoppingCart', color: 'text-green-600' },
  pedido_criado: { label: 'Pedido Criado', icon: 'Package', color: 'text-blue-600' },
  conversa_whatsapp_sofia: { label: 'WhatsApp (Sofia)', icon: 'Bot', color: 'text-purple-600' },
  conversa_whatsapp_vendedor: { label: 'WhatsApp (Vendedor)', icon: 'MessageCircle', color: 'text-green-600' },
  cadastro_manual: { label: 'Cadastro Manual', icon: 'UserPlus', color: 'text-gray-600' },
  proposta: { label: 'Proposta', icon: 'FileText', color: 'text-amber-600' },
  contrato: { label: 'Contrato', icon: 'FileCheck', color: 'text-blue-600' },
  importacao: { label: 'Importação', icon: 'Upload', color: 'text-indigo-600' },
  agenda: { label: 'Agenda', icon: 'Calendar', color: 'text-pink-600' },
  indicacao: { label: 'Indicação', icon: 'Users', color: 'text-emerald-600' },
  google: { label: 'Google', icon: 'Search', color: 'text-red-600' },
  instagram: { label: 'Instagram', icon: 'Instagram', color: 'text-pink-500' },
  maps: { label: 'Google Maps', icon: 'MapPin', color: 'text-green-600' },
  rua: { label: 'Prospecção Rua', icon: 'Footprints', color: 'text-orange-600' },
  site: { label: 'Site', icon: 'Globe', color: 'text-blue-500' },
  telefone: { label: 'Telefone', icon: 'Phone', color: 'text-gray-600' },
  email: { label: 'Email', icon: 'Mail', color: 'text-amber-500' },
  outros: { label: 'Outros', icon: 'MoreHorizontal', color: 'text-gray-400' }
};

// Tipo para filtros avançados
export interface ContatosFilters {
  categoria?: CategoriaContato;
  temperatura?: TemperaturaContato;
  status?: StatusContato;
  origem?: OrigemContato;
  bloqueado?: boolean;
  responsavel_id?: string;
  cidade?: string;
  bairro?: string;
  pontuacaoMin?: number;
  pontuacaoMax?: number;
  dataCriacaoInicio?: string;
  dataCriacaoFim?: string;
  ultimaInteracaoInicio?: string;
  ultimaInteracaoFim?: string;
  search?: string;
}

// Tipo para ordenação
export type ContatosOrderBy = 
  | 'nome'
  | 'empresa'
  | 'pontuacao_atual'
  | 'created_at'
  | 'updated_at'
  | 'last_contact_at';

export type ContatosOrderDirection = 'asc' | 'desc';
