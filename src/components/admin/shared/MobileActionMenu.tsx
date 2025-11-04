import React from 'react';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export interface MobileActionItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface MobileActionMenuProps {
  items: MobileActionItem[];
}

export const MobileActionMenu: React.FC<MobileActionMenuProps> = ({ items }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-white hover:bg-white/20"
        >
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {items.map((item, index) => (
          <DropdownMenuItem
            key={index}
            onClick={item.onClick}
            className={item.variant === 'destructive' ? 'text-destructive' : ''}
          >
            <div className="flex items-center gap-2">
              {item.icon}
              <span>{item.label}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
