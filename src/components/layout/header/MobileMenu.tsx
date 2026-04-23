
import React from 'react';
import { Link } from 'react-router-dom';
import { X, LayoutDashboard, Package, Building, Monitor, CheckCircle, ShieldCheck, Gift } from 'lucide-react';
import { useUserSession } from '@/hooks/useUserSession';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { user, isLoggedIn } = useUserSession();
  
  if (!isOpen) return null;

  // Verificar roles do usuário
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin';
  const isAdminFinanceiro = user?.role === 'admin_financeiro';
  const isAdminMarketing = user?.role === 'admin_marketing';
  const isAnyAdmin = isSuperAdmin || isAdmin || isAdminFinanceiro || isAdminMarketing;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-72 bg-indexa-purple shadow-xl overflow-y-auto">
        <div className="flex justify-end p-4">
          <button onClick={onClose} className="text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="px-4 space-y-2 pb-6">
          {/* Links públicos */}
          <Link 
            to="/" 
            className="block text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat py-3 border-b border-white/10"
            onClick={onClose}
          >
            EXA
          </Link>
          <Link 
            to="/loja" 
            className="block text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat py-3 border-b border-white/10"
            onClick={onClose}
          >
            Loja Online
          </Link>
          <Link 
            to="/sou-sindico" 
            className="block text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat py-3 border-b border-white/10"
            onClick={onClose}
          >
            Sou Síndico
          </Link>
          <Link 
            to="/quem-somos" 
            className="block text-white hover:text-exa-yellow transition-colors duration-200 font-medium font-montserrat py-3 border-b border-white/10"
            onClick={onClose}
          >
            Quem Somos
          </Link>

          {/* SEÇÃO ADMINISTRATIVA - Aparece apenas para usuários admin */}
          {isLoggedIn && isAnyAdmin && (
            <>
              <div className="pt-4 pb-2 border-t-2 border-exa-yellow/30 mt-4">
                <div className="flex items-center gap-2 text-exa-yellow font-bold text-sm uppercase tracking-wider mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Área Administrativa</span>
                </div>
              </div>

              {/* Super Admin */}
              {isSuperAdmin && (
                <>
                  <Link 
                    to="/super_admin" 
                    className="flex items-center gap-3 text-white hover:text-exa-yellow hover:bg-white/10 transition-all duration-200 font-semibold font-montserrat py-4 px-4 rounded-lg border-b border-white/10"
                    onClick={onClose}
                  >
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="text-base">Master Control Panel</span>
                  </Link>
                </>
              )}

              {/* Admin Regular ou Financeiro ou Marketing */}
              {(isAdmin || isAdminFinanceiro || isAdminMarketing) && (
                <>
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-3 text-white hover:text-exa-yellow hover:bg-white/10 transition-all duration-200 font-semibold font-montserrat py-4 px-4 rounded-lg border-b border-white/10"
                    onClick={onClose}
                  >
                    <LayoutDashboard className="h-6 w-6" />
                    <span className="text-base">
                      {isAdminFinanceiro ? 'Painel Financeiro' : 
                       isAdminMarketing ? 'Painel Marketing' : 
                       'Dashboard Admin'}
                    </span>
                  </Link>
                </>
              )}

              {/* Pedidos - Para Admin e Admin Financeiro */}
              {(isAdmin || isAdminFinanceiro || isSuperAdmin) && (
                <Link 
                  to="/admin/pedidos" 
                  className="flex items-center gap-3 text-white hover:text-exa-yellow hover:bg-white/10 transition-all duration-200 font-semibold font-montserrat py-4 px-4 rounded-lg border-b border-white/10"
                  onClick={onClose}
                >
                  <Package className="h-6 w-6" />
                  <span className="text-base">Gerenciar Pedidos</span>
                </Link>
              )}

              {/* Benefícios Prestadores - Para Admin Financeiro */}
              {(isAdmin || isAdminFinanceiro || isSuperAdmin) && (
                <Link 
                  to="/admin/beneficio-prestadores" 
                  className="flex items-center gap-3 text-white hover:text-exa-yellow hover:bg-white/10 transition-all duration-200 font-semibold font-montserrat py-4 px-4 rounded-lg border-b border-white/10"
                  onClick={onClose}
                >
                  <Gift className="h-6 w-6" />
                  <span className="text-base">Benefícios Prestadores</span>
                </Link>
              )}

              {/* Relatórios Financeiros - Para Admin Financeiro */}
              {(isAdmin || isAdminFinanceiro || isSuperAdmin) && (
                <Link 
                  to="/admin/relatorios-financeiros" 
                  className="flex items-center gap-3 text-white hover:text-exa-yellow hover:bg-white/10 transition-all duration-200 font-semibold font-montserrat py-4 px-4 rounded-lg border-b border-white/10"
                  onClick={onClose}
                >
                  <LayoutDashboard className="h-6 w-6" />
                  <span className="text-base">Relatórios Financeiros</span>
                </Link>
              )}

              {/* Prédios - Para Admin e Admin Marketing */}
              {(isAdmin || isAdminMarketing || isSuperAdmin) && (
                <Link 
                  to="/admin/predios" 
                  className="flex items-center gap-3 text-white hover:text-exa-yellow hover:bg-white/10 transition-all duration-200 font-semibold font-montserrat py-4 px-4 rounded-lg border-b border-white/10"
                  onClick={onClose}
                >
                  <Building className="h-6 w-6" />
                  <span className="text-base">Gerenciar Prédios</span>
                </Link>
              )}

              {/* Painéis - Para Admin e Admin Marketing */}
              {(isAdmin || isAdminMarketing || isSuperAdmin) && (
                <Link 
                  to="/admin/paineis" 
                  className="flex items-center gap-3 text-white hover:text-exa-yellow hover:bg-white/10 transition-all duration-200 font-semibold font-montserrat py-4 px-4 rounded-lg border-b border-white/10"
                  onClick={onClose}
                >
                  <Monitor className="h-6 w-6" />
                  <span className="text-base">Gerenciar Painéis</span>
                </Link>
              )}

              {/* Aprovações - Para admin e super_admin apenas */}
              {(isAdmin || isSuperAdmin) && (
                <Link 
                  to="/admin/aprovacoes" 
                  className="flex items-center gap-3 text-white hover:text-exa-yellow hover:bg-white/10 transition-all duration-200 font-semibold font-montserrat py-4 px-4 rounded-lg border-b border-white/10"
                  onClick={onClose}
                >
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-base">Aprovações</span>
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
