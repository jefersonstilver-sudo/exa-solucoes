import React from 'react';
import {
  Megaphone,
  Building,
  User,
  Wrench,
  CheckCircle,
  Zap,
  Target,
  Phone,
  Mail,
  Calendar,
  Home,
  Briefcase,
  Settings,
  UserPlus,
  Shield
} from 'lucide-react';

// Mapeamento de nomes de ícones para componentes Lucide React
const iconMap: Record<string, React.ComponentType<any>> = {
  'megaphone': Megaphone,
  'building': Building,
  'user': User,
  'wrench': Wrench,
  'check-circle': CheckCircle,
  'zap': Zap,
  'target': Target,
  'phone': Phone,
  'mail': Mail,
  'calendar': Calendar,
  'home': Home,
  'briefcase': Briefcase,
  'settings': Settings,
  'user-plus': UserPlus,
  'shield': Shield
};

interface IconMapperProps {
  iconName: string;
  className?: string;
}

export const IconMapper: React.FC<IconMapperProps> = ({ iconName, className = "w-4 h-4" }) => {
  const IconComponent = iconMap[iconName.toLowerCase()];
  
  if (!IconComponent) {
    // Fallback: se o ícone não for encontrado, usa User
    return <User className={className} />;
  }
  
  return <IconComponent className={className} />;
};
