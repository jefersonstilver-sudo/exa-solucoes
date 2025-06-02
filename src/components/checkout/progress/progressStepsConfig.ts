
import { Calendar, Tag, CreditCard, Upload, ShoppingCart } from 'lucide-react';

export interface ProgressStep {
  name: string;
  shortName: string;
  mobileShort: string;
  icon: any;
  description: string;
  motivationalText: string;
}

export const PROGRESS_STEPS: ProgressStep[] = [
  { 
    name: 'Plano', 
    shortName: 'Plano',
    mobileShort: 'Plano',
    icon: Calendar,
    description: 'Período',
    motivationalText: 'Escolha seu período ideal!'
  },
  { 
    name: 'Cupom', 
    shortName: 'Cupom',
    mobileShort: 'Cupom',
    icon: Tag,
    description: 'Desconto',
    motivationalText: 'Economize ainda mais!'
  },
  { 
    name: 'Resumo', 
    shortName: 'Resumo',
    mobileShort: 'Resumo',
    icon: ShoppingCart,
    description: 'Revisão',
    motivationalText: 'Quase lá!'
  },
  { 
    name: 'Pagamento', 
    shortName: 'Pag.',
    mobileShort: 'Pag.',
    icon: CreditCard,
    description: 'Finalizar',
    motivationalText: 'Último passo!'
  },
  { 
    name: 'Upload', 
    shortName: 'Upload',
    mobileShort: 'Upload',
    icon: Upload,
    description: 'Material',
    motivationalText: 'Sua campanha começa aqui!'
  }
];
