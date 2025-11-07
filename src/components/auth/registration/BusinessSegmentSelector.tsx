import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Briefcase, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusinessSegmentSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const businessSegments = [
  // Alimentação e Bebidas
  { value: 'restaurant', label: 'Restaurantes' },
  { value: 'bar', label: 'Bares e Pubs' },
  { value: 'bakery', label: 'Padarias e Confeitarias' },
  { value: 'coffee', label: 'Cafeterias e Coffee Shops' },
  { value: 'fastfood', label: 'Fast Food e Lanchonetes' },
  { value: 'catering', label: 'Buffets e Catering' },
  { value: 'food_delivery', label: 'Delivery de Comida' },
  
  // Hospedagem e Turismo
  { value: 'hotel', label: 'Hotéis' },
  { value: 'pousada', label: 'Pousadas' },
  { value: 'hostel', label: 'Hostels e Albergues' },
  { value: 'travel', label: 'Agências de Turismo' },
  { value: 'tourism', label: 'Operadoras de Turismo' },
  
  // Varejo e Comércio
  { value: 'supermarket', label: 'Supermercados' },
  { value: 'minimarket', label: 'Mercados e Minimercados' },
  { value: 'pharmacy', label: 'Farmácias e Drogarias' },
  { value: 'clothing', label: 'Roupas e Moda' },
  { value: 'shoes', label: 'Calçados' },
  { value: 'accessories', label: 'Acessórios e Bijuterias' },
  { value: 'jewelry', label: 'Joalherias e Relojoarias' },
  { value: 'perfume', label: 'Perfumarias e Cosméticos' },
  { value: 'electronics', label: 'Eletrônicos e Eletrodomésticos' },
  { value: 'technology', label: 'Lojas de Tecnologia' },
  { value: 'cellphone', label: 'Celulares e Acessórios' },
  { value: 'furniture', label: 'Móveis e Decoração' },
  { value: 'construction', label: 'Materiais de Construção' },
  { value: 'hardware', label: 'Ferragens e Ferramentas' },
  { value: 'import', label: 'Lojas de Importados' },
  { value: 'bookstore', label: 'Livrarias e Papelarias' },
  { value: 'toys', label: 'Brinquedos e Games' },
  { value: 'sporting_goods', label: 'Artigos Esportivos' },
  { value: 'optics', label: 'Óticas' },
  { value: 'shopping', label: 'Shopping Centers' },
  
  // Saúde e Bem-Estar
  { value: 'health', label: 'Clínicas Médicas' },
  { value: 'dental', label: 'Clínicas Odontológicas' },
  { value: 'physiotherapy', label: 'Fisioterapia' },
  { value: 'psychology', label: 'Psicologia' },
  { value: 'nutrition', label: 'Nutrição' },
  { value: 'laboratory', label: 'Laboratórios de Análises' },
  { value: 'hospital', label: 'Hospitais' },
  
  // Beleza e Estética
  { value: 'beauty', label: 'Salões de Beleza' },
  { value: 'barbershop', label: 'Barbearias' },
  { value: 'aesthetics', label: 'Clínicas de Estética' },
  { value: 'spa', label: 'Spas' },
  { value: 'nails', label: 'Manicure e Pedicure' },
  { value: 'massage', label: 'Massoterapia' },
  
  // Fitness e Esportes
  { value: 'gym', label: 'Academias' },
  { value: 'crossfit', label: 'CrossFit' },
  { value: 'yoga', label: 'Yoga e Pilates' },
  { value: 'martial_arts', label: 'Artes Marciais' },
  { value: 'dance', label: 'Escolas de Dança' },
  { value: 'personal_trainer', label: 'Personal Trainer' },
  
  // Educação
  { value: 'education', label: 'Escolas' },
  { value: 'university', label: 'Faculdades e Universidades' },
  { value: 'course', label: 'Cursos e Treinamentos' },
  { value: 'language', label: 'Escolas de Idiomas' },
  { value: 'music', label: 'Escolas de Música' },
  { value: 'prep_course', label: 'Cursos Preparatórios' },
  
  // Automotivo
  { value: 'vehicle', label: 'Concessionárias' },
  { value: 'automotive', label: 'Autopeças' },
  { value: 'mechanic', label: 'Oficinas Mecânicas' },
  { value: 'car_wash', label: 'Lava-Jatos' },
  { value: 'auto_detailing', label: 'Estética Automotiva' },
  { value: 'tire', label: 'Borracharias' },
  
  // Imobiliário e Construção
  { value: 'real_estate', label: 'Imobiliárias' },
  { value: 'architecture', label: 'Arquitetura' },
  { value: 'engineering', label: 'Engenharia' },
  { value: 'construction_company', label: 'Construtoras' },
  
  // Serviços Profissionais
  { value: 'legal', label: 'Advocacia' },
  { value: 'accounting', label: 'Contabilidade' },
  { value: 'consulting', label: 'Consultoria' },
  { value: 'auditing', label: 'Auditoria' },
  { value: 'tax', label: 'Assessoria Tributária' },
  
  // Serviços Financeiros
  { value: 'financial', label: 'Serviços Financeiros' },
  { value: 'insurance', label: 'Seguros' },
  { value: 'investment', label: 'Investimentos' },
  { value: 'bank', label: 'Bancos e Cooperativas' },
  
  // Tecnologia e Digital
  { value: 'software', label: 'Desenvolvimento de Software' },
  { value: 'web_design', label: 'Web Design' },
  { value: 'it_services', label: 'Serviços de TI' },
  { value: 'digital_marketing', label: 'Marketing Digital' },
  { value: 'social_media', label: 'Gestão de Redes Sociais' },
  
  // Marketing e Comunicação
  { value: 'advertising', label: 'Publicidade e Propaganda' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'graphic_design', label: 'Design Gráfico' },
  { value: 'printing', label: 'Gráficas' },
  
  // Eventos e Entretenimento
  { value: 'events', label: 'Eventos e Festas' },
  { value: 'photography', label: 'Fotografia' },
  { value: 'videography', label: 'Filmagem e Vídeo' },
  { value: 'entertainment', label: 'Entretenimento' },
  { value: 'cinema', label: 'Cinemas' },
  { value: 'theater', label: 'Teatros' },
  { value: 'music_band', label: 'Bandas e Músicos' },
  
  // Serviços Domésticos
  { value: 'cleaning', label: 'Limpeza e Conservação' },
  { value: 'home_cleaning', label: 'Limpeza Residencial' },
  { value: 'gardening', label: 'Jardinagem' },
  { value: 'pest_control', label: 'Dedetização' },
  { value: 'locksmith', label: 'Chaveiro' },
  { value: 'electrician', label: 'Eletricista' },
  { value: 'plumber', label: 'Encanador' },
  { value: 'painter', label: 'Pintor' },
  { value: 'handyman', label: 'Reparos e Manutenção' },
  
  // Segurança
  { value: 'security', label: 'Segurança Patrimonial' },
  { value: 'private_security', label: 'Segurança Privada' },
  { value: 'surveillance', label: 'Monitoramento e CFTV' },
  
  // Logística e Transporte
  { value: 'logistics', label: 'Logística' },
  { value: 'transport', label: 'Transportes' },
  { value: 'moving', label: 'Mudanças' },
  { value: 'courier', label: 'Courier e Entregas' },
  
  // Pet
  { value: 'pet', label: 'Pet Shops' },
  { value: 'veterinary', label: 'Veterinárias' },
  { value: 'pet_grooming', label: 'Banho e Tosa' },
  { value: 'pet_hotel', label: 'Hotel para Pets' },
  
  // Indústria e Agronegócio
  { value: 'industry', label: 'Indústria' },
  { value: 'agriculture', label: 'Agronegócio' },
  { value: 'livestock', label: 'Pecuária' },
  
  // Outros
  { value: 'laundry', label: 'Lavanderias' },
  { value: 'funeral', label: 'Funerárias' },
  { value: 'religious', label: 'Instituições Religiosas' },
  { value: 'ngo', label: 'ONGs e Associações' },
  { value: 'other', label: 'Outros Segmentos' }
];

export const BusinessSegmentSelector: React.FC<BusinessSegmentSelectorProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  
  const selectedSegment = businessSegments.find(segment => segment.value === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="businessSegment" className="flex items-center text-sm font-medium text-gray-900">
        <Briefcase className="h-4 w-4 mr-2 text-exa-red" />
        Segmento de Negócio <span className="text-red-500 ml-1">*</span>
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-11 bg-white border-gray-300 hover:bg-gray-50 focus:border-exa-red"
          >
            {selectedSegment ? selectedSegment.label : "Selecione o segmento da sua empresa"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white z-50" align="start">
          <Command className="bg-white">
            <CommandInput 
              placeholder="Digite para buscar..." 
              className="h-11"
            />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>Nenhum segmento encontrado.</CommandEmpty>
              <CommandGroup>
                {businessSegments.map((segment) => (
                  <CommandItem
                    key={segment.value}
                    value={segment.label}
                    onSelect={() => {
                      onChange(segment.value);
                      setOpen(false);
                    }}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === segment.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {segment.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-gray-600">
        Digite para buscar o segmento que melhor descreve sua empresa
      </p>
    </div>
  );
};
