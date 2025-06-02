
import { Calendar, Tag, ShoppingCart, CreditCard, Upload } from 'lucide-react';

export const PROGRESS_STEPS = [
  { 
    name: 'Plano', 
    shortName: 'Plano',
    mobileShort: 'Plano',
    icon: Calendar,
    description: 'Período de veiculação',
    motivationalText: 'Escolha seu período ideal!'
  },
  { 
    name: 'Cupom', 
    shortName: 'Cupom',
    mobileShort: 'Cupom',
    icon: Tag,
    description: 'Código de desconto',
    motivationalText: 'Economize ainda mais!'
  },
  { 
    name: 'Resumo', 
    shortName: 'Resumo',
    mobileShort: 'Resumo',
    icon: ShoppingCart,
    description: 'Revisão do pedido',
    motivationalText: 'Quase lá!'
  },
  { 
    name: 'Pagamento', 
    shortName: 'Pagamento',
    mobileShort: 'Pagamento',
    icon: CreditCard,
    description: 'Finalizar compra',
    motivationalText: 'Último passo!'
  },
  { 
    name: 'Upload', 
    shortName: 'Upload',
    mobileShort: 'Upload',
    icon: Upload,
    description: 'Enviar material',
    motivationalText: 'Sua campanha começa aqui!'
  }
];
