import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, 
  LogOut, 
  Bell,
  Shield,
  Users,
  Ticket,
  Video,
  Film,
  Images,
  ShoppingBag,
  Gift,
  FileBarChart,
  Building2,
  Tv,
  Calendar,
  CreditCard,
  Scale,
  FileText,
  Zap,
  UserCheck,
  LayoutGrid,
  MessageSquare,
  Bot,
  Mail,
  Clapperboard,
  CheckSquare,
  Network,
  Landmark,
  Brain,
  AlertTriangle,
  Lock,
  BarChart3,
  MonitorPlay,
  CalendarDays,
  Contact
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDynamicModulePermissions, MODULE_KEYS } from '@/hooks/useDynamicModulePermissions';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface MobileMoreMenuProps {
  trigger: React.ReactNode;
}

export const MobileMoreMenu: React.FC<MobileMoreMenuProps> = ({ trigger }) => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isSuperAdmin } = useAuth();
  const { buildPath } = useAdminBasePath();
  const { hasModuleAccess, isMasterAccount } = useDynamicModulePermissions();

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao realizar logout');
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  // FASE 1: Menu organizado por processo de negócio (mesmo do sidebar)
  const menuSections = [
    {
      section: 'Minha Manhã',
      items: [
        { icon: Brain, label: 'EXA Alerts', path: buildPath('exa-alerts'), moduleKey: MODULE_KEYS.exa_alerts },
        { icon: AlertTriangle, label: 'Escalações', path: buildPath('escalacoes'), moduleKey: MODULE_KEYS.escalacoes },
      ]
    },
    {
      section: 'Relacionamento',
      items: [
        { icon: Contact, label: 'Contatos', path: buildPath('contatos'), moduleKey: MODULE_KEYS.contatos },
        { icon: LayoutGrid, label: 'Kanban', path: buildPath('contatos-kanban'), moduleKey: MODULE_KEYS.contatos_kanban },
        { icon: MessageSquare, label: 'CRM Chat', path: buildPath('crm-chat'), moduleKey: MODULE_KEYS.crm_chat },
        { icon: Users, label: 'CRM Site', path: buildPath('crm'), moduleKey: MODULE_KEYS.crm_site },
        { icon: Zap, label: 'Leads EXA', path: buildPath('leads-exa'), moduleKey: MODULE_KEYS.leads },
        { icon: UserCheck, label: 'Síndicos', path: buildPath('sindicos-interessados'), moduleKey: MODULE_KEYS.sindicos },
      ]
    },
    {
      section: 'Vendas',
      items: [
        { icon: FileText, label: 'Propostas', path: buildPath('propostas'), moduleKey: MODULE_KEYS.propostas },
        { icon: ShoppingBag, label: 'Pedidos', path: buildPath('pedidos'), moduleKey: MODULE_KEYS.pedidos },
        { icon: Scale, label: 'Jurídico', path: buildPath('juridico'), moduleKey: MODULE_KEYS.juridico },
        { icon: CreditCard, label: 'Assinaturas', path: buildPath('assinaturas'), moduleKey: MODULE_KEYS.assinaturas },
        { icon: BarChart3, label: 'Posições', path: buildPath('posicoes'), moduleKey: MODULE_KEYS.posicoes },
        { icon: MonitorPlay, label: 'Produtos', path: buildPath('produtos'), moduleKey: MODULE_KEYS.produtos },
        { icon: Ticket, label: 'Cupons', path: buildPath('cupons'), moduleKey: MODULE_KEYS.cupons },
      ]
    },
    {
      section: 'Operação',
      items: [
        { icon: Building2, label: 'Prédios', path: buildPath('predios'), moduleKey: MODULE_KEYS.predios },
        { icon: Tv, label: 'Painéis EXA', path: buildPath('paineis-exa'), moduleKey: MODULE_KEYS.paineis },
        { icon: Calendar, label: 'Agenda Técnica', path: buildPath('sync-notion'), moduleKey: MODULE_KEYS.sync_notion },
        { icon: CalendarDays, label: 'Agenda', path: buildPath('agenda'), moduleKey: MODULE_KEYS.agenda },
        { icon: Video, label: 'Vídeos Anunciantes', path: buildPath('videos'), moduleKey: MODULE_KEYS.videos_anunciantes },
        { icon: CheckSquare, label: 'Aprovações', path: buildPath('aprovacoes'), moduleKey: MODULE_KEYS.aprovacoes },
        { icon: Gift, label: 'Benefícios Prestadores', path: buildPath('beneficio-prestadores'), moduleKey: MODULE_KEYS.beneficios },
        { icon: Network, label: 'Processos', path: buildPath('processos'), moduleKey: MODULE_KEYS.processos },
      ]
    },
    {
      section: 'Comunicação',
      items: [
        { icon: Mail, label: 'Emails', path: buildPath('comunicacoes'), moduleKey: MODULE_KEYS.emails },
        { icon: Images, label: 'Ticker', path: buildPath('ticker'), moduleKey: MODULE_KEYS.ticker },
        { icon: Film, label: 'Vídeos Site EXA', path: buildPath('videos-site'), moduleKey: MODULE_KEYS.videos_site },
        { icon: Clapperboard, label: 'Editor de Vídeos', path: buildPath('editor-video-controle'), moduleKey: MODULE_KEYS.editor_videos },
        { icon: Bot, label: 'Agentes Sofia', path: buildPath('agentes-sofia'), moduleKey: MODULE_KEYS.agentes_sofia },
      ]
    },
    {
      section: 'Governança',
      items: [
        { icon: Landmark, label: 'Financeiro', path: buildPath('financeiro'), moduleKey: MODULE_KEYS.financeiro },
        { icon: FileBarChart, label: 'Relatórios', path: buildPath('relatorios-financeiros'), moduleKey: MODULE_KEYS.relatorios },
        { icon: Users, label: 'Usuários', path: buildPath('usuarios'), moduleKey: MODULE_KEYS.usuarios },
        { icon: Bell, label: 'Notificações', path: buildPath('notificacoes'), moduleKey: MODULE_KEYS.notificacoes },
        { icon: Lock, label: 'Segurança', path: buildPath('seguranca'), moduleKey: MODULE_KEYS.seguranca },
        { icon: Settings, label: 'Configurações', path: buildPath('configuracoes'), moduleKey: MODULE_KEYS.configuracoes },
      ]
    }
  ].map(section => ({
    ...section,
    items: section.items.filter(item => isMasterAccount || hasModuleAccess(item.moduleKey))
  })).filter(section => section.items.length > 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] bg-white rounded-t-3xl"
      >
        <SheetHeader className="border-b border-gray-200 pb-4">
          <SheetTitle className="text-left text-gray-900 text-xl font-bold">
            Menu Completo
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(85vh-140px)] py-4">
          {menuSections.map((section, idx) => (
            <div key={section.section} className="mb-6">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 px-4">
                {section.section}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 transition-colors touch-target",
                        active 
                          ? "bg-red-50 text-[#9C1E1E] border-l-[3px] border-[#9C1E1E]"
                          : "hover:bg-gray-100 active:bg-gray-200"
                      )}
                    >
                      <Icon className={cn(
                        "h-5 w-5 flex-shrink-0",
                        active ? "text-[#9C1E1E]" : "text-gray-500"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        active ? "text-[#9C1E1E] font-semibold" : "text-gray-900"
                      )}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {idx < menuSections.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}

          {/* Logout separado */}
          <Separator className="my-4" />
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 active:bg-red-100 transition-colors touch-target"
          >
            <LogOut className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-red-600">
              Sair
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMoreMenu;
