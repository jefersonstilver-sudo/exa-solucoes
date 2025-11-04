import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Settings, Eye, MoreVertical } from 'lucide-react';

interface BenefitMobileActionsProps {
  onNewBenefit: () => void;
  onManageBenefits: () => void;
  onPreviewEmail: () => void;
}

const BenefitMobileActions: React.FC<BenefitMobileActionsProps> = ({
  onNewBenefit,
  onManageBenefits,
  onPreviewEmail,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onNewBenefit}
        className="flex-1 h-12 bg-[#9C1E1E] hover:bg-[#7D1818] text-white font-medium"
      >
        <Plus className="w-5 h-5 mr-2" />
        Novo Benefício
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-12 w-12 p-0"
          >
            <MoreVertical className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onManageBenefits} className="py-3">
            <Settings className="w-5 h-5 mr-3" />
            <span className="text-base">Gerenciar Benefícios</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPreviewEmail} className="py-3">
            <Eye className="w-5 h-5 mr-3" />
            <span className="text-base">Preview de Email</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default BenefitMobileActions;
