/**
 * Component: RuleCard
 * Card para exibir regra de ação
 */

import { Zap, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RuleCardProps {
  name: string;
  trigger: string;
  action: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  active: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export const RuleCard = ({ 
  name, 
  trigger, 
  action, 
  priority, 
  active, 
  onEdit, 
  onToggle, 
  onDelete 
}: RuleCardProps) => {
  const priorityConfig = {
    LOW: { label: 'BAIXA', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    MEDIUM: { label: 'MÉDIA', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    HIGH: { label: 'ALTA', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    CRITICAL: { label: 'CRÍTICA', color: 'text-red-500', bg: 'bg-red-500/10' }
  };
  
  const config = priorityConfig[priority];
  
  return (
    <div className="bg-module-card border border-module rounded-lg p-4 hover:border-module-accent transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${active ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {active ? (
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            ) : (
              <div className="w-3 h-3 bg-red-500 rounded-full" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-module-primary font-semibold">
                {name}
              </h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${config.bg} ${config.color}`}>
                {config.label}
              </span>
            </div>
            
            <div className="space-y-1.5 text-sm">
              <p className="text-module-secondary">
                <span className="font-medium">Quando:</span> {trigger}
              </p>
              <p className="text-module-secondary">
                <span className="font-medium">Ação:</span> {action}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 pt-3 border-t border-module">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="text-xs"
        >
          <Edit2 className="w-3 h-3 mr-1" />
          Editar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="text-xs"
        >
          {active ? 'Desativar' : 'Ativar'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="text-xs text-red-500 hover:text-red-600 hover:border-red-500"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Excluir
        </Button>
      </div>
    </div>
  );
};
