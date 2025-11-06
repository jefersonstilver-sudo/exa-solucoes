import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase } from 'lucide-react';

interface BusinessSegmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const businessSegments = [
  { value: 'hotel', label: 'Hotéis e Pousadas' },
  { value: 'restaurant', label: 'Restaurantes e Bares' },
  { value: 'electronics', label: 'Lojas de Eletrônicos' },
  { value: 'perfume', label: 'Perfumarias e Cosméticos' },
  { value: 'import', label: 'Lojas de Importados' },
  { value: 'clothing', label: 'Roupas e Acessórios' },
  { value: 'supermarket', label: 'Supermercados e Mercados' },
  { value: 'pharmacy', label: 'Farmácias e Drogarias' },
  { value: 'real_estate', label: 'Imobiliárias' },
  { value: 'vehicle', label: 'Veículos e Concessionárias' },
  { value: 'construction', label: 'Materiais de Construção' },
  { value: 'furniture', label: 'Móveis e Decoração' },
  { value: 'shopping', label: 'Shopping Centers' },
  { value: 'travel', label: 'Agências de Turismo' },
  { value: 'education', label: 'Educação e Cursos' },
  { value: 'health', label: 'Clínicas e Saúde' },
  { value: 'beauty', label: 'Salões de Beleza e Estética' },
  { value: 'gym', label: 'Academias e Fitness' },
  { value: 'entertainment', label: 'Entretenimento e Lazer' },
  { value: 'technology', label: 'Tecnologia e Informática' },
  { value: 'automotive', label: 'Autopeças e Serviços Automotivos' },
  { value: 'pet', label: 'Pet Shops e Veterinárias' },
  { value: 'jewelry', label: 'Joalherias e Relojoarias' },
  { value: 'optics', label: 'Óticas' },
  { value: 'bookstore', label: 'Livrarias e Papelarias' },
  { value: 'sporting_goods', label: 'Artigos Esportivos' },
  { value: 'toys', label: 'Brinquedos e Games' },
  { value: 'bakery', label: 'Padarias e Confeitarias' },
  { value: 'services', label: 'Serviços Profissionais' },
  { value: 'legal', label: 'Advocacia e Jurídico' },
  { value: 'accounting', label: 'Contabilidade' },
  { value: 'insurance', label: 'Seguros' },
  { value: 'financial', label: 'Serviços Financeiros' },
  { value: 'events', label: 'Eventos e Festas' },
  { value: 'photography', label: 'Fotografia e Filmagem' },
  { value: 'advertising', label: 'Publicidade e Marketing' },
  { value: 'cleaning', label: 'Limpeza e Conservação' },
  { value: 'security', label: 'Segurança' },
  { value: 'logistics', label: 'Logística e Transporte' },
  { value: 'agriculture', label: 'Agronegócio' },
  { value: 'industry', label: 'Indústria' },
  { value: 'other', label: 'Outros Segmentos' }
];

export const BusinessSegmentSelector: React.FC<BusinessSegmentSelectorProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="businessSegment" className="flex items-center text-sm font-medium text-gray-900">
        <Briefcase className="h-4 w-4 mr-2 text-exa-red" />
        Segmento de Negócio <span className="text-red-500 ml-1">*</span>
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 bg-white border-gray-300 focus:border-exa-red">
          <SelectValue placeholder="Selecione o segmento da sua empresa" />
        </SelectTrigger>
        <SelectContent className="bg-white z-50 max-h-[300px]">
          {businessSegments.map((segment) => (
            <SelectItem key={segment.value} value={segment.value}>
              {segment.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-600">
        Selecione o segmento que melhor descreve sua empresa para fins de CRM
      </p>
    </div>
  );
};
