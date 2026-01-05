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
  | 'outros'
  | 'ocultar';

export type TemperaturaContato = 'quente' | 'morno' | 'frio';

export type StatusContato = 'ativo' | 'arquivado' | 'duplicado';

export type OrigemContato = 
  | 'checkout_site'
  | 'pedido_criado'
  | 'conversa_whatsapp_sofia'
  | 'conversa_whatsapp_vendedor'
  | 'conversa_whatsapp_exa_alert'
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
  | 'site_crm'
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
  // Campos de unificação com conversations
  conversation_id?: string;
  whatsapp_external_id?: string;
  agent_sources?: string[];
  last_interaction_at?: string;
  ai_categoria_sugerida?: string;
  ai_categoria_confianca?: number;
  // Campos para detecção de duplicados
  is_potential_duplicate?: boolean;
  duplicate_group_id?: string;
  // Campos adicionais
  instagram?: string;
  ticket_estimado?: number;
  satisfacao?: number;
  logo_url?: string;
  total_investido?: number;
  dias_sem_contato?: number;
  // Completude calculada (não persiste no banco)
  completude?: number;
}

// Função utilitária para calcular completude de um contato
export const calcularCompletude = (contact: Partial<Contact>): number => {
  let pontos = 0;
  if (contact.nome) pontos += 15;
  if (contact.sobrenome) pontos += 5;
  if (contact.telefone) pontos += 15;
  if (contact.email) pontos += 10;
  if (contact.empresa) pontos += 10;
  if (contact.cnpj) pontos += 10;
  if (contact.cidade || contact.estado) pontos += 10;
  if (contact.origem) pontos += 5;
  if (contact.observacoes_estrategicas) pontos += 10;
  if (contact.tomador_decisao) pontos += 10;
  return pontos;
};

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

// Interface expandida para configuração de categorias com protocolo oficial
export interface CategoriaConfigCompleta {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  icon: string;
  hasPontuacao: boolean;
  description: string;
  // Campos do protocolo oficial
  definicao: string;
  criterios?: string[];
  exemplos?: string[];
  regras: string[];
  temperaturas?: boolean;
  alerta?: string;
}

// Configuração das categorias com protocolo oficial completo
export const CATEGORIAS_CONFIG: Record<CategoriaContato, CategoriaConfigCompleta> = {
  lead: { 
    label: 'Lead (Anunciante)', 
    emoji: '🟢',
    color: 'text-green-700', 
    bgColor: 'bg-green-500', 
    icon: 'Target',
    hasPontuacao: true,
    description: 'Potencial cliente comercial',
    definicao: 'Empresas com potencial de se tornarem clientes pagantes da EXA Mídia.',
    criterios: [
      'Empresa ativa',
      'Capacidade financeira',
      'Interesse potencial em mídia',
      'Atuação local ou regional',
      'Enquadramento no ICP definido'
    ],
    exemplos: [
      'Clínicas',
      'Restaurantes',
      'Imobiliárias',
      'Construtoras',
      'Academias',
      'Empresas que já anunciam em mídia offline'
    ],
    regras: [
      'Obrigatório sistema de pontuação',
      'Contato bloqueado até atingir pontuação mínima',
      'Classificação obrigatória: Quente/Morno/Frio',
      'Apenas vendedores podem interagir'
    ],
    temperaturas: true
  },
  anunciante: { 
    label: 'Anunciante', 
    emoji: '🔵',
    color: 'text-blue-700', 
    bgColor: 'bg-blue-500', 
    icon: 'CheckCircle',
    hasPontuacao: true,
    description: 'Cliente ativo com contrato vigente',
    definicao: 'Empresas que já são clientes da EXA Mídia com contrato ativo e campanhas em veiculação.',
    criterios: [
      'Contrato vigente',
      'Pagamentos em dia',
      'Campanha ativa'
    ],
    exemplos: [
      'Empresas com anúncios ativos na rede',
      'Clientes renovados',
      'Clientes com múltiplas campanhas'
    ],
    regras: [
      'Acompanhamento de satisfação obrigatório',
      'Comunicação regular sobre performance',
      'Prioridade no atendimento',
      'Monitoramento de renovação'
    ]
  },
  sindico_exa: { 
    label: 'Síndico EXA', 
    emoji: '🟦',
    color: 'text-blue-700', 
    bgColor: 'bg-blue-600', 
    icon: 'Building',
    hasPontuacao: false,
    description: 'Síndico de prédio ativo na rede EXA',
    definicao: 'Síndicos de condomínios com painel EXA já instalado e contrato vigente.',
    criterios: [
      'Painel instalado no condomínio',
      'Contrato de parceria vigente'
    ],
    exemplos: [
      'Síndicos profissionais',
      'Síndicos moradores',
      'Administradoras parceiras'
    ],
    regras: [
      'Não é lead comercial',
      'Não entra em fluxo de vendas',
      'Comunicação recorrente permitida',
      'Foco em relacionamento e retenção'
    ]
  },
  sindico_lead: { 
    label: 'Síndico Lead', 
    emoji: '🟨',
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-400', 
    icon: 'UserCheck',
    hasPontuacao: true,
    description: 'Síndico potencial para expansão',
    definicao: 'Síndicos de condomínios sem painel instalado, mas com potencial de adesão.',
    criterios: [
      'Condomínio sem painel EXA',
      'Perfil compatível com a rede',
      'Localização estratégica'
    ],
    exemplos: [
      'Síndicos de prédios comerciais',
      'Síndicos de residenciais premium',
      'Administradoras em prospecção'
    ],
    regras: [
      'Não é anunciante comercial',
      'Fluxo específico de expansão',
      'Pode migrar para "Síndico EXA" após instalação',
      'Pontuação para priorização'
    ],
    temperaturas: true
  },
  parceiro_exa: { 
    label: 'Parceiro EXA', 
    emoji: '🤝',
    color: 'text-amber-700', 
    bgColor: 'bg-amber-200', 
    icon: 'Handshake',
    hasPontuacao: false,
    description: 'Parceiro ativo com acordo formal',
    definicao: 'Empresas com acordo formal de parceria, sem troca financeira direta.',
    criterios: [
      'Acordo ou contrato registrado',
      'Benefício mútuo identificado'
    ],
    exemplos: [
      'Permutas de serviços',
      'Co-marketing',
      'Acordos institucionais',
      'Parcerias de indicação'
    ],
    regras: [
      'Contrato ou acordo registrado',
      'Não é cliente pagante',
      'Não é lead comercial',
      'Relacionamento institucional'
    ]
  },
  parceiro_lead: { 
    label: 'Parceiro Lead', 
    emoji: '🌱',
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-400', 
    icon: 'Sprout',
    hasPontuacao: false,
    description: 'Potencial parceria em avaliação',
    definicao: 'Empresas com potencial de parceria futura em fase de avaliação.',
    criterios: [
      'Sinergia potencial identificada',
      'Interesse mútuo em parceria'
    ],
    exemplos: [
      'Empresas em conversas iniciais',
      'Potenciais co-marketings',
      'Indicações de parceiros'
    ],
    regras: [
      'Não gera faturamento',
      'Não entra em vendas comerciais',
      'Pode migrar para "Parceiro EXA" após acordo',
      'Análise estratégica contínua'
    ]
  },
  prestador_elevador: { 
    label: 'Prestador Elevador', 
    emoji: '🟧',
    color: 'text-orange-700', 
    bgColor: 'bg-orange-400', 
    icon: 'Building2',
    hasPontuacao: false,
    description: 'Empresa de manutenção de elevadores',
    definicao: 'Empresas e técnicos responsáveis por elevadores dos condomínios.',
    criterios: [
      'Empresa de manutenção cadastrada',
      'Técnicos identificados'
    ],
    exemplos: [
      'Atlas Schindler',
      'Thyssenkrupp',
      'Otis',
      'Técnicos autônomos especializados'
    ],
    regras: [
      'Contato estritamente operacional',
      'Nunca entra em fluxo de vendas',
      'Registro obrigatório de empresa e técnico',
      'Usado para agendamento de instalação'
    ]
  },
  eletricista: { 
    label: 'Eletricista', 
    emoji: '⚡',
    color: 'text-gray-100', 
    bgColor: 'bg-gray-700', 
    icon: 'Zap',
    hasPontuacao: false,
    description: 'Prestador de serviços elétricos',
    definicao: 'Eletricistas terceirizados acionados conforme demanda operacional.',
    criterios: [
      'Cadastro técnico atualizado',
      'Disponibilidade verificada'
    ],
    exemplos: [
      'Eletricistas autônomos',
      'Empresas de manutenção elétrica',
      'Técnicos de instalação'
    ],
    regras: [
      'EXA possui eletricista CLT (Daher)',
      'Terceiros são backup operacional',
      'Não é fornecedor fixo',
      'Registro técnico obrigatório'
    ]
  },
  provedor: { 
    label: 'Provedor', 
    emoji: '🟪',
    color: 'text-purple-100', 
    bgColor: 'bg-purple-500', 
    icon: 'Wifi',
    hasPontuacao: false,
    description: 'Fornecedor de infraestrutura',
    definicao: 'Empresas que fornecem serviços essenciais à operação da EXA.',
    criterios: [
      'Contrato de fornecimento ativo',
      'Serviço essencial à operação'
    ],
    exemplos: [
      'Internet (Vivo, Claro)',
      'Tecnologia (AWS, Google)',
      'Hardware (Dell, HP)',
      'Software (Adobe, Microsoft)',
      'Logística (Correios, transportadoras)'
    ],
    regras: [
      'Uso institucional apenas',
      'Sem abordagem comercial de vendas',
      'Registro administrativo obrigatório',
      'Gestão de contratos dedicada'
    ]
  },
  equipe_exa: { 
    label: 'Equipe EXA', 
    emoji: '👥',
    color: 'text-indigo-100', 
    bgColor: 'bg-indigo-500', 
    icon: 'Users',
    hasPontuacao: false,
    description: 'Funcionário ou colaborador interno',
    definicao: 'Pessoas que atuam direta ou indiretamente na EXA Mídia.',
    criterios: [
      'Vínculo com a empresa (CLT, PJ, ou prestador)',
      'Atuação recorrente'
    ],
    exemplos: [
      'Funcionários CLT',
      'Diretores e sócios',
      'Prestadores recorrentes',
      'Consultores externos'
    ],
    regras: [
      'Uso interno exclusivo',
      'Não é lead comercial',
      'Não entra em processos de vendas',
      'Gestão de RH aplicável'
    ]
  },
  outros: { 
    label: 'Outros', 
    emoji: '⚪',
    color: 'text-gray-700', 
    bgColor: 'bg-gray-200', 
    icon: 'MoreHorizontal',
    hasPontuacao: false,
    description: 'Contato temporário aguardando classificação',
    definicao: 'Contatos que não se enquadram em nenhuma categoria acima, mas precisam ser registrados.',
    criterios: [
      'Não se encaixa em outras categorias',
      'Necessita de revisão'
    ],
    exemplos: [
      'Contatos pontuais',
      'Instituições diversas',
      'Pessoas físicas sem relação clara',
      'Leads genéricos sem qualificação'
    ],
    regras: [
      'Categoria TEMPORÁRIA apenas',
      'Deve ser revisada periodicamente',
      'Não permite abordagem comercial',
      'Deve ser reclassificada assim que houver clareza'
    ],
    alerta: '"Outros" não é destino final. É estado provisório que deve ser reclassificado!'
  },
  ocultar: { 
    label: 'Ocultar', 
    emoji: '🚫',
    color: 'text-gray-400', 
    bgColor: 'bg-gray-300', 
    icon: 'EyeOff',
    hasPontuacao: false,
    description: 'Contato oculto do sistema (grupos, spam, irrelevante)',
    definicao: 'Contatos que devem ser removidos das listagens principais, como grupos de WhatsApp, spam ou contatos irrelevantes.',
    criterios: [
      'Grupos de WhatsApp',
      'Spam ou bots',
      'Contatos irrelevantes',
      'Números inválidos'
    ],
    exemplos: [
      'Grupos de WhatsApp',
      'Spam e bots',
      'Números inválidos',
      'Contatos descartados'
    ],
    regras: [
      'Não aparece na lista de contatos',
      'Não aparece nas conversas do CRM',
      'Pode ser visualizado via filtro especial',
      'Categoria permanente para exclusão visual'
    ],
    alerta: 'Contatos nesta categoria ficam invisíveis nas listagens normais do sistema'
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
  'outros',
  'ocultar'
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
  conversa_whatsapp_exa_alert: { label: 'EXA Alert', icon: 'Bot', color: 'text-orange-600' },
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
  site_crm: { label: 'Site CRM', icon: 'Globe', color: 'text-indigo-500' },
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
