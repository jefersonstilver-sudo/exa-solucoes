import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, 
  Package, 
  Bot, 
  MessageCircle, 
  UserPlus, 
  FileText, 
  FileCheck, 
  Upload, 
  Calendar, 
  Users, 
  Search, 
  Instagram, 
  MapPin, 
  Footprints, 
  Globe, 
  Phone, 
  Mail, 
  MoreHorizontal 
} from 'lucide-react';
import type { OrigemContato } from '@/types/contatos';
import { ORIGEM_CONFIG } from '@/types/contatos';

interface OrigemBadgeProps {
  origem: OrigemContato;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  ShoppingCart: <ShoppingCart className="w-3 h-3" />,
  Package: <Package className="w-3 h-3" />,
  Bot: <Bot className="w-3 h-3" />,
  MessageCircle: <MessageCircle className="w-3 h-3" />,
  UserPlus: <UserPlus className="w-3 h-3" />,
  FileText: <FileText className="w-3 h-3" />,
  FileCheck: <FileCheck className="w-3 h-3" />,
  Upload: <Upload className="w-3 h-3" />,
  Calendar: <Calendar className="w-3 h-3" />,
  Users: <Users className="w-3 h-3" />,
  Search: <Search className="w-3 h-3" />,
  Instagram: <Instagram className="w-3 h-3" />,
  MapPin: <MapPin className="w-3 h-3" />,
  Footprints: <Footprints className="w-3 h-3" />,
  Globe: <Globe className="w-3 h-3" />,
  Phone: <Phone className="w-3 h-3" />,
  Mail: <Mail className="w-3 h-3" />,
  MoreHorizontal: <MoreHorizontal className="w-3 h-3" />
};

export const OrigemBadge: React.FC<OrigemBadgeProps> = ({
  origem,
  size = 'sm',
  showIcon = true
}) => {
  const config = ORIGEM_CONFIG[origem] || ORIGEM_CONFIG.outros;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-normal border-muted-foreground/20',
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
        config.color
      )}
    >
      {showIcon && (
        <span className="mr-1">
          {iconMap[config.icon]}
        </span>
      )}
      {config.label}
    </Badge>
  );
};

export default OrigemBadge;
