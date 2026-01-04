// Types for the Processos & Operação module

export type DepartmentColor = 
  | '#3B82F6' // Vendas - Blue
  | '#10B981' // Marketing - Green
  | '#F59E0B' // Operação - Amber
  | '#EF4444' // Atendimento - Red
  | '#8B5CF6' // Tecnologia - Purple
  | '#F97316' // Financeiro - Orange
  | '#78350F' // Expansão - Brown
  | '#1F2937' // IA & Automação - Gray Dark
  | '#6B7280'; // Administrativo - Gray

export type ProcessStatus = 'ativo' | 'em_revisao' | 'obsoleto';

export type NodeType = 'start' | 'end' | 'step' | 'decision' | 'status' | 'subprocess';

export type ExecutionStatus = 'em_andamento' | 'concluido' | 'cancelado' | 'pausado';

export type StepStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'pulado';

export interface Department {
  id: string;
  name: string;
  color: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  process_count?: number;
}

export interface Process {
  id: string;
  department_id: string;
  code: string;
  name: string;
  description: string | null;
  status: ProcessStatus;
  current_version: number;
  owner_id: string | null;
  secondary_owners: string[];
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined
  department?: Department;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ProcessVersion {
  id: string;
  process_id: string;
  version: number;
  nodes_data: ProcessNode[];
  edges_data: ProcessEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  changelog: string | null;
  created_at: string;
  created_by: string | null;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  textColor?: string;
  icon?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ExternalLink {
  id: string;
  label: string;
  url: string;
  icon?: string;
}

export interface InternalLink {
  id: string;
  label: string;
  route: string;
  icon?: string;
}

export interface ProcessNode {
  id: string;
  process_id: string;
  version: number;
  node_id: string;
  node_type: NodeType;
  position: NodePosition;
  title: string;
  description: string | null;
  script: string | null;
  checklist: ChecklistItem[];
  strategic_notes: string | null;
  alerts: string | null;
  best_practices: string | null;
  common_errors: string | null;
  file_urls: string[];
  audio_urls: string[];
  external_links: ExternalLink[];
  internal_links: InternalLink[];
  style: NodeStyle;
  created_at: string;
  updated_at: string;
}

export interface EdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface ProcessEdge {
  id: string;
  process_id: string;
  version: number;
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  label: string | null;
  edge_type: string;
  style: EdgeStyle;
  animated: boolean;
}

export interface ProcessExecution {
  id: string;
  process_id: string;
  process_version: number;
  user_id: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, any>;
  notes: string | null;
  // Joined
  process?: Process;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  steps?: ExecutionStep[];
}

export interface ExecutionStep {
  id: string;
  execution_id: string;
  node_id: string;
  status: StepStatus;
  notes: string | null;
  audio_url: string | null;
  started_at: string | null;
  completed_at: string | null;
  decision_taken: string | null;
}

// ReactFlow compatible node/edge types
export interface FlowNode {
  id: string;
  type: NodeType;
  position: NodePosition;
  data: {
    label: string;
    description?: string;
    nodeData: Partial<ProcessNode>;
  };
  style?: React.CSSProperties;
  selected?: boolean;
  dragging?: boolean;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  data?: {
    edgeData: Partial<ProcessEdge>;
  };
}

// Initial departments configuration
export const INITIAL_DEPARTMENTS: Omit<Department, 'id' | 'created_at' | 'updated_at'>[] = [
  { name: 'Vendas', color: '#3B82F6', icon: 'TrendingUp', display_order: 0, is_active: true },
  { name: 'Marketing', color: '#10B981', icon: 'Megaphone', display_order: 1, is_active: true },
  { name: 'Operação', color: '#F59E0B', icon: 'Cog', display_order: 2, is_active: true },
  { name: 'Atendimento', color: '#EF4444', icon: 'Headphones', display_order: 3, is_active: true },
  { name: 'Tecnologia', color: '#8B5CF6', icon: 'Code', display_order: 4, is_active: true },
  { name: 'Financeiro', color: '#F97316', icon: 'DollarSign', display_order: 5, is_active: true },
  { name: 'Expansão', color: '#78350F', icon: 'Globe', display_order: 6, is_active: true },
  { name: 'IA & Automação', color: '#1F2937', icon: 'Bot', display_order: 7, is_active: true },
  { name: 'Administrativo', color: '#6B7280', icon: 'Building', display_order: 8, is_active: true },
];

// Department code prefixes
export const DEPARTMENT_CODE_PREFIXES: Record<string, string> = {
  'Vendas': 'VEN',
  'Marketing': 'MKT',
  'Operação': 'OPE',
  'Atendimento': 'ATE',
  'Tecnologia': 'TEC',
  'Financeiro': 'FIN',
  'Expansão': 'EXP',
  'IA & Automação': 'IAA',
  'Administrativo': 'ADM',
};
