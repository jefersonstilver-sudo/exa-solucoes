/**
 * Component: KnowledgeCard
 * Card para exibir documento/FAQ da base de conhecimento
 */

import { FileText, HelpCircle, Shield, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KnowledgeCardProps {
  title: string;
  type: 'document' | 'faq' | 'policy';
  updatedAt: string;
  tags: string[];
  onEdit: () => void;
  onDelete: () => void;
}

export const KnowledgeCard = ({ 
  title, 
  type, 
  updatedAt, 
  tags, 
  onEdit, 
  onDelete 
}: KnowledgeCardProps) => {
  const icons = {
    document: FileText,
    faq: HelpCircle,
    policy: Shield
  };
  
  const Icon = icons[type];
  
  const typeLabels = {
    document: 'Documento',
    faq: 'FAQ',
    policy: 'Política'
  };
  
  return (
    <div className="bg-module-card border border-module rounded-lg p-4 hover:border-module-accent transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-module-accent/10 rounded-lg">
            <Icon className="w-5 h-5 text-module-accent" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-module-primary font-semibold mb-1 truncate">
              {title}
            </h3>
            <p className="text-xs text-module-tertiary mb-2">
              {typeLabels[type]} • Atualizado em {new Date(updatedAt).toLocaleDateString('pt-BR')}
            </p>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-2 py-0.5 bg-module-input text-module-secondary text-xs rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="h-8 w-8 text-module-secondary hover:text-module-primary"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-module-secondary hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
