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
  // Menu enxuto (Jeferson, 07/11/2026): só o que a EXA usa. Benefícios saiu; Telas fica dentro de Painéis EXA;
  // Aprovações fica dentro de Pedidos; CRM Evolution virou "Equipe"; Financeiro volta junto com a nota fiscal.
  {
    label: 'Minha manhã',
    icon: Sunrise,
    items: [
      { title: 'Agenda', path: 'tarefas', icon: Sunrise, moduleKey: MODULE_KEYS.minha_manha },
      { title: 'Dashboard', path: '', icon: LayoutDashboard, moduleKey: MODULE_KEYS.dashboard },
    ],
  },
  {
    label: 'Relacionamento',
    icon: Users,
    items: [
      { title: 'Equipe', path: 'crm-evolution', icon: MessageCircle, moduleKey: MODULE_KEYS.crm_evolution },
      { title: 'Contatos', path: 'contatos', icon: Contact, moduleKey: MODULE_KEYS.contatos },
    ],
  },
  {
    label: 'Comercial',
    icon: TrendingUp,
    items: [
      { title: 'Pedidos', path: 'pedidos', icon: ShoppingBag, moduleKey: MODULE_KEYS.pedidos, badge: 'aprovacoes', badgeTooltip: 'Vídeos aguardando aprovação' },
      { title: 'Propostas', path: 'propostas', icon: FileText, moduleKey: MODULE_KEYS.propostas, badge: 'propostas', badgeTooltip: 'Propostas aguardando resposta' },
      { title: 'Contratos', path: 'juridico', icon: Scale, moduleKey: MODULE_KEYS.juridico, badge: 'contratos', badgeTooltip: 'Contratos aguardando assinatura' },
      { title: 'Produtos', path: 'produtos', icon: MonitorPlay, moduleKey: MODULE_KEYS.produtos },
      { title: 'Cupons', path: 'cupons', icon: Ticket, moduleKey: MODULE_KEYS.cupons },
      { title: 'QRs dos vídeos', path: 'qr-videos', icon: QrCode, moduleKey: MODULE_KEYS.pedidos },
    ],
  },
  {
    label: 'Operação',
    icon: Cog,
    items: [
      { title: 'Prédios', path: 'predios', icon: Building2, moduleKey: MODULE_KEYS.predios },
      { title: 'Síndicos', path: 'sindicos-interessados', icon: ClipboardList, moduleKey: MODULE_KEYS.sindicos, badge: 'sindicosNovos', badgeTooltip: 'Novos leads de síndicos' },
      { title: 'Painéis EXA', path: 'paineis-exa', icon: Tv, moduleKey: MODULE_KEYS.paineis, badge: 'offline', badgeTooltip: 'Painéis sem sinal' },
    ],
  },
  {
    label: 'Gestão',
    icon: Shield,
    items: [
      { title: 'Financeiro', path: 'financeiro', icon: Landmark, moduleKey: MODULE_KEYS.financeiro },
      { title: 'E-mails', path: 'comunicacoes', icon: Mail, moduleKey: MODULE_KEYS.emails },
      { title: 'Usuários', path: 'usuarios', icon: Users, moduleKey: MODULE_KEYS.usuarios },
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

/** Páginas antigas: saíram do menu de vez (Jeferson, 07/11/2026). As rotas ainda respondem até a limpeza do código. */
export const PAGINAS_OCULTAS_ATE = '2026-11-07';
export const PAGINAS_OCULTAS: AdminMenuItem[] = [];
export function paginasOcultasAtivas(): boolean { return false; }
