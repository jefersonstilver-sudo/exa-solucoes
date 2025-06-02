
import { Calendar, Tag, ShoppingCart, CreditCard, Upload } from 'lucide-react';

export const PROGRESS_STEPS = [
  { 
    name: 'Plano', 
    icon: Calendar,
    description: 'Período de veiculação',
    motivationalText: 'Escolha seu período ideal!'
  },
  { 
    name: 'Cupom', 
    icon: Tag,
    description: 'Código de desconto',
    motivationalText: 'Economize ainda mais!'
  },
  { 
    name: 'Resumo', 
    icon: ShoppingCart,
    description: 'Revisão do pedido',
    motivationalText: 'Quase lá!'
  },
  { 
    name: 'Pagamento', 
    icon: CreditCard,
    description: 'Finalizar compra',
    motivationalText: 'Último passo!'
  },
  { 
    name: 'Upload', 
    icon: Upload,
    description: 'Enviar material',
    motivationalText: 'Sua campanha começa aqui!'
  }
];
