
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BuildingIcon,
  ShoppingBag, 
  Users, 
  FileText, 
  BarChart, 
  Settings,
  Menu,
  ChevronDown,
  Image,
  Package,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MenuItem {
  title: string;
  icon: React.ElementType;
  href: string;
  submenu?: MenuItem[];
}

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  
  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin'
    },
    {
      title: 'Gerenciamento de Pedidos',
      icon: ShoppingBag,
      href: '/admin/pedidos',
      submenu: [
        { title: 'Todos os Pedidos', icon: ShoppingBag, href: '/admin/pedidos' },
        { title: 'Aprovações Pendentes', icon: FileText, href: '/admin/pedidos/pendentes' },
        { title: 'Pagamentos', icon: ShoppingBag, href: '/admin/pedidos/pagamentos' }
      ]
    },
    {
      title: 'Gestão de Prédios',
      icon: BuildingIcon,
      href: '/admin/predios',
      submenu: [
        { title: 'Lista de Prédios', icon: BuildingIcon, href: '/admin/predios' },
        { title: 'Painéis', icon: Image, href: '/admin/paineis' },
        { title: 'Mapa de Localização', icon: FileText, href: '/admin/predios/mapa' }
      ]
    },
    {
      title: 'Gestão de Usuários',
      icon: Users,
      href: '/admin/usuarios',
      submenu: [
        { title: 'Administradores', icon: Users, href: '/admin/usuarios/admin' },
        { title: 'Clientes', icon: Users, href: '/admin/usuarios/clientes' },
        { title: 'Síndicos', icon: Users, href: '/admin/usuarios/sindicos' }
      ]
    },
    {
      title: 'Gerenciamento de Conteúdo',
      icon: FileText,
      href: '/admin/conteudo',
      submenu: [
        { title: 'Aprovações', icon: FileText, href: '/admin/conteudo/aprovacoes' },
        { title: 'Biblioteca', icon: FileText, href: '/admin/conteudo/biblioteca' }
      ]
    },
    {
      title: 'Campanhas',
      icon: Package,
      href: '/admin/campanhas'
    },
    {
      title: 'Relatórios',
      icon: BarChart,
      href: '/admin/relatorios'
    },
    {
      title: 'Suporte',
      icon: HelpCircle,
      href: '/admin/suporte'
    },
    {
      title: 'Configurações',
      icon: Settings,
      href: '/admin/configuracoes'
    }
  ];
  
  const toggleMenu = (title: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };
  
  const isLinkActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };
  
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 flex items-center justify-between">
        <Link to="/admin" className="flex items-center space-x-2">
          {!isCollapsed && (
            <span className="text-xl font-bold text-indexa-purple">INDEXA</span>
          )}
          {isCollapsed && (
            <span className="text-xl font-bold text-indexa-purple">IX</span>
          )}
        </Link>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(100vh-70px)] pb-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = isLinkActive(item.href);
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus[item.title];
            
            return (
              <div key={item.title}>
                {hasSubmenu ? (
                  <div>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between",
                        isActive ? "bg-gray-100 dark:bg-gray-700" : ""
                      )}
                      onClick={() => toggleMenu(item.title)}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-4 w-4 mr-2" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </div>
                      {!isCollapsed && hasSubmenu && (
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          isExpanded ? "transform rotate-180" : ""
                        )} />
                      )}
                    </Button>
                    
                    {!isCollapsed && isExpanded && item.submenu && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subitem) => (
                          <Link
                            key={subitem.title}
                            to={subitem.href}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm rounded-md",
                              isLinkActive(subitem.href)
                                ? "bg-indexa-purple/10 text-indexa-purple font-medium"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                          >
                            <subitem.icon className="h-4 w-4 mr-2" />
                            <span>{subitem.title}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center px-4 py-2 text-sm rounded-md",
                      isActive
                        ? "bg-indexa-purple/10 text-indexa-purple font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
};

export default AdminSidebar;
