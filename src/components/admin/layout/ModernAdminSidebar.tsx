import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  CheckCircle, 
  Building2, 
  Monitor, 
  Users, 
  Video, 
  Target, 
  Tag, 
  Home, 
  Settings, 
  Play, 
  Bell,
  Wrench,
  CreditCard
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const ModernAdminSidebar = ({ isCollapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  
  const menuItems = [
    {
      title: "Gestão Principal",
      items: [
        { name: "Dashboard", path: "/admin", icon: LayoutDashboard, color: "text-blue-600" },
        { name: "Pedidos", path: "/admin/pedidos", icon: ShoppingCart, color: "text-green-600" },
        { name: "Aprovações", path: "/admin/aprovacoes", icon: CheckCircle, color: "text-orange-600" },
      ]
    },
    {
      title: "Ativos",
      items: [
        { name: "Prédios", path: "/admin/predios", icon: Building2, color: "text-purple-600" },
        { name: "Painéis", path: "/admin/paineis", icon: Monitor, color: "text-cyan-600" },
      ]
    },
    {
      title: "Leads & Clientes", 
      items: [
        { name: "Síndicos Interessados", path: "/admin/sindicos-interessados", icon: Users, color: "text-indigo-600" },
        { name: "Leads Produtora", path: "/admin/leads-produtora", icon: Video, color: "text-pink-600" },
        { name: "Leads Campanhas", path: "/admin/leads-campanhas", icon: Target, color: "text-red-600" },
      ]
    },
    {
      title: "Pagamentos",
      items: [
        { name: "Correção de Pagamentos", path: "/admin/payment-fixer", icon: Wrench, color: "text-orange-600" },
        { name: "Verificador MercadoPago", path: "/admin/payment-verifier", icon: CreditCard, color: "text-blue-600" },
      ]
    },
    {
      title: "Sistema",
      items: [
        { name: "Usuários", path: "/admin/usuarios", icon: Users, color: "text-gray-600" },
        { name: "Cupons", path: "/admin/cupons", icon: Tag, color: "text-yellow-600" },
        { name: "Homepage", path: "/admin/homepage-config", icon: Home, color: "text-emerald-600" },
        { name: "Configurações", path: "/admin/configuracoes", icon: Settings, color: "text-slate-600" },
      ]
    },
    {
      title: "Conteúdo",
      items: [
        { name: "Vídeos", path: "/admin/videos", icon: Play, color: "text-red-600" },
        { name: "Notificações", path: "/admin/notificacoes", icon: Bell, color: "text-amber-600" },
      ]
    }
  ];

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r shadow-sm",
      isCollapsed ? "w-16" : "w-60"
    )}>
      <div className="flex items-center justify-center py-4">
        <span className={cn("text-xl font-bold transition-all duration-300 ease-in-out", isCollapsed ? "scale-0" : "scale-100")}>
          INDEXA ADMIN
        </span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((section, index) => (
          <div key={index}>
            <div className={cn("text-xs font-semibold uppercase tracking-wider px-2 mt-2 text-gray-500 transition-all duration-300 ease-in-out", isCollapsed ? "opacity-0" : "opacity-100")}>
              {section.title}
            </div>
            {section.items.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors duration-200",
                  location.pathname === item.path ? "bg-gray-100 text-gray-900" : "text-gray-700"
                )}
              >
                <item.icon className={cn("h-4 w-4 mr-2", item.color)} />
                <span className={cn("transition-all duration-300 ease-in-out", isCollapsed ? "scale-0" : "scale-100")}>
                  {item.name}
                </span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="p-3">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
        >
          {isCollapsed ? (
            <span className="text-gray-700">Expandir</span>
          ) : (
            <span className="text-gray-700">Minimizar</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ModernAdminSidebar;
