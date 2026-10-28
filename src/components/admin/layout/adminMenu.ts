import {
  LayoutDashboard, ShoppingBag, Building2, MonitorPlay, Settings, Users, Ticket, Mail,
  Gift, Tv, Brain, MessageCircle, FileText, Landmark, Contact, Sunrise, Cog, Lock,
  User as UserIcon, CheckSquare, Images, TrendingUp, Shield, Archive, AlertTriangle,
  UsersRound, LayoutGrid, QrCode, CreditCard, BarChart3, Calendar, Video, Network,
  Timer, Film, Clapperboard, Bot, FileBarChart, Bell, ShieldCheck, Scale, ClipboardList,
} from 'lucide-react';
import type { ElementType } from 'react';
import { MODULE_KEYS } from '@/hooks/useDynamicModulePermissions';

/**
 * Fonte única do menu do painel administrativo (sidebar do computador e "Mais" do celular).
 * `path` é relativo ao basePath (/super_admin ou /admin); '' = início.
 * `badge` aponta para um contador calculado no componente.
 */
export type MenuBadgeKey =
  | 'offline' | 'propostas' | 'pedidosSemVideo' | 'contratos'
  | 'beneficios' | 'aprovacoes' | 'sindicosNovos';

export interface AdminMenuItem {
  title: string;
  path: string;
  icon: ElementType;
  moduleKey: string;
  badge?: MenuBadgeKey;
  badgeTooltip?: string;
  superAdminOnly?: boolean;
  absolute?: boolean; // path já é absoluto
}

export interface AdminMenuGroup {
  label: string;
  icon: ElementType;
  items: AdminMenuItem[];
}

export const ALWAYS = '__always_visible__';

export const ADMIN_MENU: AdminMenuGroup[] = [
  {
    label: 'Minha manhã',
    icon: Sunrise,
    items: [
      { title: 'Agenda', path: 'tarefas', icon: Sunrise, moduleKey: MODULE_KEYS.minha_manha },
      { title: 'Dashboard', path: '', icon: LayoutDashboard, moduleKey: MODULE_KEYS.dashboard },
      { title: 'Alertas', path: 'exa-alerts', icon: Brain, moduleKey: MODULE_KEYS.exa_alerts },
    ],
  },
  {
    label: 'Relacionamento',
    icon: Users,
    items: [
      { title: 'CRM Evolution', path: 'crm-evolution', icon: MessageCircle, moduleKey: MODULE_KEYS.crm_evolution },
      { title: 'Contatos', path: 'contatos', icon: Contact, moduleKey: MODULE_KEYS.contatos },
    ],
  },
  {
    label: 'Comercial',
    icon: TrendingUp,
    items: [
      { title: 'Pedidos e vendas', path: 'pedidos', icon: ShoppingBag, moduleKey: MODULE_KEYS.pedidos, badge: 'pedidosSemVideo', badgeTooltip: 'Pedidos aguardando vídeo' },
      { title: 'Propostas', path: 'propostas', icon: FileText, moduleKey: MODULE_KEYS.propostas, badge: 'propostas', badgeTooltip: 'Propostas aguardando resposta' },
      { title: 'Contratos', path: 'juridico', icon: Scale, moduleKey: MODULE_KEYS.juridico, badge: 'contratos', badgeTooltip: 'Contratos aguardando assinatura' },
      { title: 'Produtos', path: 'produtos', icon: MonitorPlay, moduleKey: MODULE_KEYS.produtos },
      { title: 'Cupons', path: 'cupons', icon: Ticket, moduleKey: MODULE_KEYS.cupons },
    ],
  },
  {
    label: 'Operação',
    icon: Cog,
    items: [
      { title: 'Prédios', path: 'predios', icon: Building2, moduleKey: MODULE_KEYS.predios },
      { title: 'Síndicos', path: 'sindicos-interessados', icon: ClipboardList, moduleKey: MODULE_KEYS.sindicos, badge: 'sindicosNovos', badgeTooltip: 'Novos cadastros de síndicos' },
      { title: 'Painéis EXA', path: 'paineis-exa', icon: Tv, moduleKey: MODULE_KEYS.paineis, badge: 'offline', badgeTooltip: 'Painéis sem sinal' },
      { title: 'Aprovações', path: 'aprovacoes', icon: CheckSquare, moduleKey: MODULE_KEYS.aprovacoes, badge: 'aprovacoes', badgeTooltip: 'Vídeos aguardando aprovação' },
      { title: 'Benefícios', path: 'beneficio-prestadores', icon: Gift, moduleKey: MODULE_KEYS.beneficios, badge: 'beneficios', badgeTooltip: 'Benefícios com ação necessária' },
    ],
  },
  {
    label: 'Comunicação',
    icon: Mail,
    items: [
      { title: 'E-mails', path: 'comunicacoes', icon: Mail, moduleKey: MODULE_KEYS.emails },
      { title: 'Logos (ticker)', path: 'ticker', icon: Images, moduleKey: MODULE_KEYS.ticker },
    ],
  },
  {
    label: 'Gestão',
    icon: Shield,
    items: [
      { title: 'Financeiro', path: 'financeiro', icon: Landmark, moduleKey: MODULE_KEYS.financeiro },
      { title: 'Usuários e permissões', path: 'usuarios', icon: Users, moduleKey: MODULE_KEYS.usuarios },
      { title: 'Segurança', path: 'seguranca', icon: Lock, moduleKey: MODULE_KEYS.seguranca },
      { title: 'Configurações', path: 'configuracoes', icon: Settings, moduleKey: MODULE_KEYS.configuracoes },
    ],
  },
  {
    label: 'Conta',
    icon: UserIcon,
    items: [
      { title: 'Meu perfil', path: 'meu-perfil', icon: UserIcon, moduleKey: ALWAYS },
    ],
  },
];

/**
 * Páginas que saíram do menu em 28/10/2026. As rotas continuam funcionando até a data abaixo
 * (só o CEO vê esta lista, recolhida no fim do menu). Depois disso o código pode ser removido.
 */
export const PAGINAS_OCULTAS_ATE = '2026-11-27';

export const PAGINAS_OCULTAS: AdminMenuItem[] = [
  { title: 'Vendas (antiga)', path: 'vendas', icon: TrendingUp, moduleKey: MODULE_KEYS.pedidos },
  { title: 'Formulários síndicos', path: 'formularios-sindicos', icon: Building2, moduleKey: MODULE_KEYS.formularios_sindicos },
  { title: 'Escalações', path: 'escalacoes', icon: AlertTriangle, moduleKey: MODULE_KEYS.escalacoes },
  { title: 'CRM Hub', path: 'crm-hub', icon: UsersRound, moduleKey: MODULE_KEYS.crm_hub },
  { title: 'Kanban', path: 'contatos-kanban', icon: LayoutGrid, moduleKey: MODULE_KEYS.contatos_kanban },
  { title: 'Scans QR Code', path: 'qr-scans', icon: QrCode, moduleKey: MODULE_KEYS.pedidos },
  { title: 'Assinaturas', path: 'assinaturas', icon: CreditCard, moduleKey: MODULE_KEYS.assinaturas },
  { title: 'Posições', path: 'posicoes', icon: BarChart3, moduleKey: MODULE_KEYS.posicoes },
  { title: 'Entrega nas telas', path: 'entrega-telas', icon: Tv, moduleKey: MODULE_KEYS.paineis },
  { title: 'Agenda técnica', path: 'sync-notion', icon: Calendar, moduleKey: MODULE_KEYS.sync_notion },
  { title: 'Vídeos anunciantes', path: 'videos', icon: Video, moduleKey: MODULE_KEYS.videos_anunciantes },
  { title: 'Processos', path: 'processos', icon: Network, moduleKey: MODULE_KEYS.processos },
  { title: 'Gestão de tempo', path: 'gestao-tempo', icon: Timer, moduleKey: MODULE_KEYS.gestao_tempo },
  { title: 'Vídeos site EXA', path: 'videos-site', icon: Film, moduleKey: MODULE_KEYS.videos_site },
  { title: 'Editor de vídeos', path: 'editor-video-controle', icon: Clapperboard, moduleKey: MODULE_KEYS.editor_videos },
  { title: 'Agentes Sofia', path: 'agentes-sofia', icon: Bot, moduleKey: MODULE_KEYS.agentes_sofia },
  { title: 'Relatórios', path: 'relatorios-financeiros', icon: FileBarChart, moduleKey: MODULE_KEYS.relatorios },
  { title: 'Consolidação', path: 'consolidacao', icon: UsersRound, moduleKey: MODULE_KEYS.usuarios },
  { title: 'Notificações', path: 'notificacoes', icon: Bell, moduleKey: MODULE_KEYS.notificacoes },
  { title: 'Admin Master Vídeo', path: '/super_admin/admin-master-video', icon: ShieldCheck, moduleKey: ALWAYS, absolute: true, superAdminOnly: true },
  { title: 'Auditoria impersonação', path: '/super_admin/auditoria-impersonacao', icon: Archive, moduleKey: ALWAYS, absolute: true, superAdminOnly: true },
];

export function paginasOcultasAtivas(agora = new Date()): boolean {
  return agora < new Date(PAGINAS_OCULTAS_ATE + 'T23:59:59-03:00');
}
