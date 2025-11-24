import React, { useState } from 'react';
import { Plus, MessageSquarePlus, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileQuickActionsProps {
  onNewConversation?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
}

export const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  onNewConversation,
  onSearch,
  onFilter
}) => {
  const [expanded, setExpanded] = useState(false);

  const actions = [
    {
      icon: MessageSquarePlus,
      label: 'Nova Conversa',
      onClick: onNewConversation,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      icon: Search,
      label: 'Buscar',
      onClick: onSearch,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      icon: Filter,
      label: 'Filtros',
      onClick: onFilter,
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const handleMainClick = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 pb-safe">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-col gap-3 mb-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 justify-end"
              >
                <span className="text-sm font-medium bg-background px-3 py-1 rounded-full shadow-lg border border-module-border">
                  {action.label}
                </span>
                <Button
                  onClick={() => {
                    action.onClick?.();
                    setExpanded(false);
                  }}
                  size="icon"
                  className={cn(
                    'h-12 w-12 rounded-full shadow-lg touch-manipulation',
                    action.color
                  )}
                >
                  <action.icon className="w-5 h-5 text-white" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.div
        animate={{ rotate: expanded ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          onClick={handleMainClick}
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl bg-[#25D366] hover:bg-[#20bd5a] touch-manipulation"
        >
          {expanded ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </Button>
      </motion.div>
    </div>
  );
};
