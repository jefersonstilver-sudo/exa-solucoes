import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, FileText, Building2, ShoppingCart, Video, User, MessageCircle, LayoutDashboard } from 'lucide-react';
import { useSofiaClient } from '@/contexts/SofiaClientContext';
import { cn } from '@/lib/utils';

const pageIcons: Record<string, React.ReactNode> = {
  meus_pedidos: <FileText className="w-5 h-5" />,
  ver_predios: <Building2 className="w-5 h-5" />,
  carrinho: <ShoppingCart className="w-5 h-5" />,
  enviar_video: <Video className="w-5 h-5" />,
  perfil: <User className="w-5 h-5" />,
  suporte: <MessageCircle className="w-5 h-5" />,
  dashboard: <LayoutDashboard className="w-5 h-5" />,
};

export const SofiaNavigationPopup: React.FC = () => {
  const navigate = useNavigate();
  const { currentAction, clearAction } = useSofiaClient();

  // Only show for navigation actions
  if (!currentAction || currentAction.type !== 'navigate') {
    return null;
  }

  const action = currentAction;
  const icon = pageIcons[action.page] || <ArrowRight className="w-5 h-5" />;

  const handleNavigate = () => {
    navigate(action.path);
    clearAction();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={clearAction}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{action.label}</h3>
                {action.description && (
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                )}
              </div>
            </div>
            <button
              onClick={clearAction}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Sofia message */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-4">
            <p className="text-sm text-foreground">
              Posso te levar até a página <strong>{action.label}</strong>. Quer ir agora?
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={clearAction}
              className="flex-1 py-2.5 px-4 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Agora não
            </button>
            <button
              onClick={handleNavigate}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "flex items-center justify-center gap-2 transition-colors"
              )}
            >
              Ir para lá
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SofiaNavigationPopup;
