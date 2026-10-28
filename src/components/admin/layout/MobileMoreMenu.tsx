import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDynamicModulePermissions } from '@/hooks/useDynamicModulePermissions';
import { ADMIN_MENU, ALWAYS } from './adminMenu';
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
  const { logout } = useAuth();
  const { basePath, buildPath } = useAdminBasePath();
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

  // Mesmo menu do computador (adminMenu.ts)
  const menuSections = ADMIN_MENU.map(group => ({
    section: group.label,
    items: group.items.map(item => ({
      icon: item.icon,
      label: item.title,
      path: item.absolute ? item.path : (item.path ? buildPath(item.path) : basePath),
      moduleKey: item.moduleKey,
    })),
  })).map(section => ({
    ...section,
    items: section.items.filter(item => item.moduleKey === ALWAYS || isMasterAccount || hasModuleAccess(item.moduleKey))
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
            Menu
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
