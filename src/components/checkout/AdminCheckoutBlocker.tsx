import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';
import { useDynamicPermissions } from '@/hooks/useDynamicPermissions';

interface AdminCheckoutBlockerProps {
  children: React.ReactNode;
}

/**
 * Componente que bloqueia acesso ao checkout para contas administrativas
 * Exibe mensagem informativa e opções de navegação
 */
const AdminCheckoutBlocker: React.FC<AdminCheckoutBlockerProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isAdminAccount, canMakeOrders, isLoading, userInfo } = useDynamicPermissions();

  // Enquanto carrega, mostrar loading
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="h-8 w-8 border-4 border-[#9C1E1E] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // Se pode fazer pedidos, renderizar conteúdo normal
  if (canMakeOrders && !isAdminAccount) {
    return <>{children}</>;
  }

  // Bloquear acesso para admins
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
        >
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
            <ShieldAlert className="h-8 w-8 text-amber-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Acesso Restrito
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Contas administrativas não podem realizar compras na plataforma. 
            Esta funcionalidade é exclusiva para contas de clientes.
          </p>

          {/* User Info Badge */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Você está logado como:</p>
            <div className="flex items-center justify-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#9C1E1E]/10 text-[#9C1E1E]">
                {userInfo.role?.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-sm text-gray-700">{userInfo.email}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/admin')}
              className="w-full bg-[#9C1E1E] hover:bg-[#7A1818]"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir para Painel Admin
            </Button>
            
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-400 mt-6">
            Para realizar compras, utilize uma conta de cliente ou entre em contato com o suporte.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AdminCheckoutBlocker;
