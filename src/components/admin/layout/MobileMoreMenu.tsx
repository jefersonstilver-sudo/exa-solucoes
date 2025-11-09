import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  ScrollText,
  ShoppingBag,
  Gift,
  FileBarChart
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface MobileMoreMenuProps {
  trigger: React.ReactNode;
}

export const MobileMoreMenu: React.FC<MobileMoreMenuProps> = ({ trigger }) => {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { logout, isSuperAdmin } = useAuth();
  const { permissions } = useUserPermissions();
  const { buildPath } = useAdminBasePath();

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

  const menuItems = [
    // Gestão Principal (NOVO - para Admin Financeiro)
    {
      section: 'Gestão',
      items: [
        {
          icon: ShoppingBag,
          label: 'Pedidos',
          path: buildPath('pedidos'),
          show: permissions.canViewOrders
        },
        {
          icon: Gift,
          label: 'Benefício Prestadores',
          path: buildPath('beneficio-prestadores'),
          show: permissions.canManageProviderBenefits
        },
        {
          icon: FileBarChart,
          label: 'Relatórios Financeiros',
          path: buildPath('relatorios-financeiros'),
          show: permissions.canViewFinancialReports
        }
      ].filter(item => item.show)
    },
    // Sistema
    {
      section: 'Sistema',
      items: [
        {
          icon: Users,
          label: 'Usuários',
          path: buildPath('usuarios'),
          show: permissions.canManageUsers && isSuperAdmin
        },
        {
          icon: ScrollText,
          label: 'Auditoria',
          path: buildPath('auditoria'),
          show: permissions.canManageUsers && isSuperAdmin
        },
        {
          icon: Ticket,
          label: 'Cupons',
          path: buildPath('cupons'),
          show: permissions.canManageCoupons
        },
        {
          icon: Shield,
          label: 'Segurança',
          path: buildPath('seguranca'),
          show: permissions.canManageSystemSettings && isSuperAdmin
        },
        {
          icon: Settings,
          label: 'Configurações',
          path: buildPath('configuracoes'),
          show: permissions.canManageSystemSettings && isSuperAdmin
        }
      ].filter(item => item.show)
    },
    // Conteúdo
    {
      section: 'Conteúdo',
      items: [
        {
          icon: Video,
          label: 'Vídeos',
          path: buildPath('videos'),
          show: permissions.canManageVideos
        },
        {
          icon: Film,
          label: 'Vídeos do Site',
          path: buildPath('videos-site'),
          show: permissions.canManagePortfolio
        },
        {
          icon: Images,
          label: 'Logos EXA',
          path: buildPath('logos'),
          show: permissions.canManageHomepageConfig
        },
        {
          icon: Bell,
          label: 'Notificações',
          path: buildPath('notificacoes'),
          show: permissions.canManageNotifications
        }
      ].filter(item => item.show)
    }
  ].filter(section => section.items.length > 0);

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
            Mais Opções
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(85vh-140px)] py-4">
          {menuItems.map((section, idx) => (
            <div key={section.section} className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-4">
                {section.section}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-target"
                    >
                      <Icon className="h-6 w-6 text-[#9C1E1E] flex-shrink-0" />
                      <span className="text-base font-semibold text-gray-900">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {idx < menuItems.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}

          {/* Logout separado */}
          <Separator className="my-4" />
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 active:bg-red-100 transition-colors touch-target"
          >
            <LogOut className="h-6 w-6 text-red-600 flex-shrink-0" />
            <span className="text-base font-semibold text-red-600">
              Sair
            </span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMoreMenu;
