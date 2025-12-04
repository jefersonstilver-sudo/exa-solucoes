import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Building2, FileText, Briefcase, Save, Loader2, Info, Check, ChevronsUpDown, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CompanyTermsCheckbox } from './CompanyTermsCheckbox';
import { validateCompanyDocument, formatCompanyDocument } from '@/utils/inputValidation';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { cn } from '@/lib/utils';
const businessSegments = [
// Turismo e Atrações (Foz do Iguaçu - Tríplice Fronteira)
{
  value: 'tourist_attraction',
  label: 'Atrações Turísticas'
}, {
  value: 'tour_guide',
  label: 'Guias Turísticos'
}, {
  value: 'travel_agency',
  label: 'Agências de Turismo'
}, {
  value: 'adventure_tourism',
  label: 'Turismo de Aventura'
}, {
  value: 'ecological_tourism',
  label: 'Turismo Ecológico'
}, {
  value: 'souvenirs',
  label: 'Lojas de Souvenirs'
}, {
  value: 'duty_free',
  label: 'Duty Free / Free Shop'
}, {
  value: 'cambio',
  label: 'Casas de Câmbio'
},
// Lojas de Departamento e Varejo
{
  value: 'department_store',
  label: 'Lojas de Departamento'
}, {
  value: 'shopping',
  label: 'Shopping Centers'
}, {
  value: 'outlet',
  label: 'Outlets'
}, {
  value: 'wholesale',
  label: 'Atacado e Distribuição'
},
// Eletrônicos e Tecnologia
{
  value: 'electronics',
  label: 'Lojas de Eletrônicos'
}, {
  value: 'electronics_import',
  label: 'Eletrônicos Importados'
}, {
  value: 'cellphone',
  label: 'Celulares e Acessórios'
}, {
  value: 'computers',
  label: 'Informática e Computadores'
}, {
  value: 'technology',
  label: 'Tecnologia'
}, {
  value: 'games',
  label: 'Games e Consoles'
},
// Alimentação e Bebidas
{
  value: 'restaurant',
  label: 'Restaurantes'
}, {
  value: 'bar',
  label: 'Bares e Pubs'
}, {
  value: 'bakery',
  label: 'Padarias e Confeitarias'
}, {
  value: 'coffee',
  label: 'Cafeterias e Coffee Shops'
}, {
  value: 'fastfood',
  label: 'Fast Food e Lanchonetes'
}, {
  value: 'catering',
  label: 'Buffets e Catering'
}, {
  value: 'food_delivery',
  label: 'Delivery de Comida'
},
// Hospedagem e Turismo
{
  value: 'hotel',
  label: 'Hotéis'
}, {
  value: 'pousada',
  label: 'Pousadas'
}, {
  value: 'hostel',
  label: 'Hostels e Albergues'
}, {
  value: 'travel',
  label: 'Agências de Turismo'
}, {
  value: 'tourism',
  label: 'Operadoras de Turismo'
},
// Varejo e Comércio
{
  value: 'supermarket',
  label: 'Supermercados'
}, {
  value: 'minimarket',
  label: 'Mercados e Minimercados'
}, {
  value: 'pharmacy',
  label: 'Farmácias e Drogarias'
}, {
  value: 'clothing',
  label: 'Roupas e Moda'
}, {
  value: 'shoes',
  label: 'Calçados'
}, {
  value: 'accessories',
  label: 'Acessórios e Bijuterias'
}, {
  value: 'jewelry',
  label: 'Joalherias e Relojoarias'
}, {
  value: 'perfume',
  label: 'Perfumarias e Cosméticos'
}, {
  value: 'electronics',
  label: 'Eletrônicos e Eletrodomésticos'
}, {
  value: 'technology',
  label: 'Lojas de Tecnologia'
}, {
  value: 'cellphone',
  label: 'Celulares e Acessórios'
}, {
  value: 'furniture',
  label: 'Móveis e Decoração'
}, {
  value: 'construction',
  label: 'Materiais de Construção'
}, {
  value: 'hardware',
  label: 'Ferragens e Ferramentas'
}, {
  value: 'import',
  label: 'Lojas de Importados'
}, {
  value: 'bookstore',
  label: 'Livrarias e Papelarias'
}, {
  value: 'toys',
  label: 'Brinquedos e Games'
}, {
  value: 'sporting_goods',
  label: 'Artigos Esportivos'
}, {
  value: 'optics',
  label: 'Óticas'
}, {
  value: 'shopping',
  label: 'Shopping Centers'
},
// Saúde e Bem-Estar
{
  value: 'health',
  label: 'Clínicas Médicas'
}, {
  value: 'dental',
  label: 'Clínicas Odontológicas'
}, {
  value: 'physiotherapy',
  label: 'Fisioterapia'
}, {
  value: 'psychology',
  label: 'Psicologia'
}, {
  value: 'nutrition',
  label: 'Nutrição'
}, {
  value: 'laboratory',
  label: 'Laboratórios de Análises'
}, {
  value: 'hospital',
  label: 'Hospitais'
},
// Beleza e Estética
{
  value: 'beauty',
  label: 'Salões de Beleza'
}, {
  value: 'barbershop',
  label: 'Barbearias'
}, {
  value: 'aesthetics',
  label: 'Clínicas de Estética'
}, {
  value: 'spa',
  label: 'Spas'
}, {
  value: 'nails',
  label: 'Manicure e Pedicure'
}, {
  value: 'massage',
  label: 'Massoterapia'
},
// Fitness e Esportes
{
  value: 'gym',
  label: 'Academias'
}, {
  value: 'crossfit',
  label: 'CrossFit'
}, {
  value: 'yoga',
  label: 'Yoga e Pilates'
}, {
  value: 'martial_arts',
  label: 'Artes Marciais'
}, {
  value: 'dance',
  label: 'Escolas de Dança'
}, {
  value: 'personal_trainer',
  label: 'Personal Trainer'
},
// Educação
{
  value: 'education',
  label: 'Escolas'
}, {
  value: 'university',
  label: 'Faculdades e Universidades'
}, {
  value: 'course',
  label: 'Cursos e Treinamentos'
}, {
  value: 'language',
  label: 'Escolas de Idiomas'
}, {
  value: 'music',
  label: 'Escolas de Música'
}, {
  value: 'prep_course',
  label: 'Cursos Preparatórios'
},
// Automotivo
{
  value: 'vehicle',
  label: 'Concessionárias'
}, {
  value: 'automotive',
  label: 'Autopeças'
}, {
  value: 'mechanic',
  label: 'Oficinas Mecânicas'
}, {
  value: 'car_wash',
  label: 'Lava-Jatos'
}, {
  value: 'auto_detailing',
  label: 'Estética Automotiva'
}, {
  value: 'tire',
  label: 'Borracharias'
},
// Imobiliário e Construção
{
  value: 'real_estate',
  label: 'Imobiliárias'
}, {
  value: 'architecture',
  label: 'Arquitetura'
}, {
  value: 'engineering',
  label: 'Engenharia'
}, {
  value: 'construction_company',
  label: 'Construtoras'
},
// Serviços Profissionais
{
  value: 'legal',
  label: 'Advocacia'
}, {
  value: 'accounting',
  label: 'Contabilidade'
}, {
  value: 'consulting',
  label: 'Consultoria'
}, {
  value: 'auditing',
  label: 'Auditoria'
}, {
  value: 'tax',
  label: 'Assessoria Tributária'
},
// Serviços Financeiros
{
  value: 'financial',
  label: 'Serviços Financeiros'
}, {
  value: 'insurance',
  label: 'Seguros'
}, {
  value: 'investment',
  label: 'Investimentos'
}, {
  value: 'bank',
  label: 'Bancos e Cooperativas'
},
// Tecnologia e Digital
{
  value: 'software',
  label: 'Desenvolvimento de Software'
}, {
  value: 'web_design',
  label: 'Web Design'
}, {
  value: 'it_services',
  label: 'Serviços de TI'
}, {
  value: 'digital_marketing',
  label: 'Marketing Digital'
}, {
  value: 'social_media',
  label: 'Gestão de Redes Sociais'
},
// Marketing e Comunicação
{
  value: 'advertising',
  label: 'Publicidade e Propaganda'
}, {
  value: 'marketing',
  label: 'Marketing'
}, {
  value: 'graphic_design',
  label: 'Design Gráfico'
}, {
  value: 'printing',
  label: 'Gráficas'
},
// Eventos e Entretenimento
{
  value: 'events',
  label: 'Eventos e Festas'
}, {
  value: 'photography',
  label: 'Fotografia'
}, {
  value: 'videography',
  label: 'Filmagem e Vídeo'
}, {
  value: 'entertainment',
  label: 'Entretenimento'
}, {
  value: 'cinema',
  label: 'Cinemas'
}, {
  value: 'theater',
  label: 'Teatros'
}, {
  value: 'music_band',
  label: 'Bandas e Músicos'
},
// Serviços Domésticos
{
  value: 'cleaning',
  label: 'Limpeza e Conservação'
}, {
  value: 'home_cleaning',
  label: 'Limpeza Residencial'
}, {
  value: 'gardening',
  label: 'Jardinagem'
}, {
  value: 'pest_control',
  label: 'Dedetização'
}, {
  value: 'locksmith',
  label: 'Chaveiro'
}, {
  value: 'electrician',
  label: 'Eletricista'
}, {
  value: 'plumber',
  label: 'Encanador'
}, {
  value: 'painter',
  label: 'Pintor'
}, {
  value: 'handyman',
  label: 'Reparos e Manutenção'
},
// Segurança
{
  value: 'security',
  label: 'Segurança Patrimonial'
}, {
  value: 'private_security',
  label: 'Segurança Privada'
}, {
  value: 'surveillance',
  label: 'Monitoramento e CFTV'
},
// Logística e Transporte
{
  value: 'logistics',
  label: 'Logística'
}, {
  value: 'transport',
  label: 'Transportes'
}, {
  value: 'moving',
  label: 'Mudanças'
}, {
  value: 'courier',
  label: 'Courier e Entregas'
},
// Pet
{
  value: 'pet',
  label: 'Pet Shops'
}, {
  value: 'veterinary',
  label: 'Veterinárias'
}, {
  value: 'pet_grooming',
  label: 'Banho e Tosa'
}, {
  value: 'pet_hotel',
  label: 'Hotel para Pets'
},
// Indústria e Agronegócio
{
  value: 'industry',
  label: 'Indústria'
}, {
  value: 'agriculture',
  label: 'Agronegócio'
}, {
  value: 'livestock',
  label: 'Pecuária'
},
// Outros
{
  value: 'laundry',
  label: 'Lavanderias'
}, {
  value: 'funeral',
  label: 'Funerárias'
}, {
  value: 'religious',
  label: 'Instituições Religiosas'
}, {
  value: 'ngo',
  label: 'ONGs e Associações'
}, {
  value: 'other',
  label: 'Outros Segmentos'
}];
export const CompanyBrandSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyCountry, setCompanyCountry] = useState<'BR' | 'AR' | 'PY' | ''>('');
  const [companyDocument, setCompanyDocument] = useState('');
  const [businessSegment, setBusinessSegment] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCoordinates, setCompanyCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsAcceptedDate, setTermsAcceptedDate] = useState<string | null>(null);
  const [segmentPopoverOpen, setSegmentPopoverOpen] = useState(false);
  React.useEffect(() => {
    loadCompanyData();
  }, []);
  const loadCompanyData = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('users').select('empresa_nome, empresa_pais, empresa_documento, empresa_segmento, empresa_endereco, empresa_latitude, empresa_longitude, empresa_aceite_termo, empresa_aceite_termo_data').eq('id', user.id).single();
      if (error) throw error;
      if (data) {
        setCompanyName(data.empresa_nome || '');
        setCompanyCountry(data.empresa_pais as 'BR' | 'AR' | 'PY' || '');
        setCompanyDocument(data.empresa_documento || '');
        setBusinessSegment(data.empresa_segmento || '');
        setCompanyAddress(data.empresa_endereco || '');
        if (data.empresa_latitude && data.empresa_longitude) {
          setCompanyCoordinates({ lat: data.empresa_latitude, lng: data.empresa_longitude });
        }
        setTermsAccepted(data.empresa_aceite_termo || false);
        setTermsAcceptedDate(data.empresa_aceite_termo_data || null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!companyCountry) return;
    const formatted = formatCompanyDocument(e.target.value, companyCountry);
    setCompanyDocument(formatted);
  };
  const handleSave = async () => {
    try {
      // Validations
      if (!companyName.trim()) {
        toast.error('Informe o nome da empresa/marca');
        return;
      }
      if (!companyCountry) {
        toast.error('Selecione o país da empresa');
        return;
      }
      if (!companyDocument.trim()) {
        toast.error('Informe o documento da empresa');
        return;
      }
      if (!validateCompanyDocument(companyDocument, companyCountry)) {
        const docType = companyCountry === 'BR' ? 'CNPJ' : companyCountry === 'AR' ? 'CUIT' : 'RUC';
        toast.error(`${docType} inválido`);
        return;
      }
      if (!businessSegment) {
        toast.error('Selecione o segmento de negócio');
        return;
      }
      if (!termsAccepted) {
        toast.error('Você deve aceitar o termo de responsabilidade');
        return;
      }
      setLoading(true);
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Se está aceitando o termo pela primeira vez, salva a data
      const updateData: any = {
        empresa_nome: companyName,
        empresa_pais: companyCountry,
        empresa_documento: companyDocument,
        empresa_segmento: businessSegment,
        empresa_endereco: companyAddress,
        empresa_latitude: companyCoordinates?.lat || null,
        empresa_longitude: companyCoordinates?.lng || null,
        empresa_aceite_termo: termsAccepted
      };

      // Se está aceitando agora e não tinha data, adiciona a data atual
      if (termsAccepted && !termsAcceptedDate) {
        updateData.empresa_aceite_termo_data = new Date().toISOString();
      }
      const {
        error
      } = await supabase.from('users').update(updateData).eq('id', user.id);
      if (error) throw error;

      // Recarrega os dados para atualizar a data no estado
      await loadCompanyData();
      toast.success('Informações da empresa salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar informações da empresa:', error);
      toast.error('Erro ao salvar informações da empresa');
    } finally {
      setLoading(false);
    }
  };
  const getDocumentLabel = () => {
    switch (companyCountry) {
      case 'BR':
        return 'CNPJ';
      case 'AR':
        return 'CUIT';
      case 'PY':
        return 'RUC';
      default:
        return 'Documento';
    }
  };
  const getDocumentPlaceholder = () => {
    switch (companyCountry) {
      case 'BR':
        return '00.000.000/0000-00';
      case 'AR':
        return '20-12345678-3';
      case 'PY':
        return '80012345-6';
      default:
        return 'Selecione o país primeiro';
    }
  };
  const getDocumentHelp = () => {
    switch (companyCountry) {
      case 'BR':
        return 'Emitido pela Receita Federal do Brasil';
      case 'AR':
        return 'CUIT emitido pela AFIP - formatação automática';
      case 'PY':
        return 'RUC emitido pela SET - formatação automática';
      default:
        return '';
    }
  };
  return <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-exa-red/5 to-transparent">
        <CardTitle className="flex items-center text-xl">
          <Building2 className="h-5 w-5 mr-2 text-exa-red" />
          Empresa ou Marca que Você Representa
        </CardTitle>
        <div className="flex items-start space-x-2 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-900">
            Informações opcionais, mas <strong>OBRIGATÓRIAS</strong> para fazer upload de vídeos
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-2">
          <Label htmlFor="companyName">
            Nome da Empresa/Marca <span className="text-red-500">*</span>
          </Label>
          <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nome completo da empresa ou marca" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyCountry">
            País da Empresa <span className="text-red-500">*</span>
          </Label>
          <Select value={companyCountry} onValueChange={value => setCompanyCountry(value as 'BR' | 'AR' | 'PY')}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o país" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BR">🇧🇷 Brasil - CNPJ</SelectItem>
              <SelectItem value="AR">🇦🇷 Argentina - CUIT</SelectItem>
              <SelectItem value="PY">🇵🇾 Paraguai - RUC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {companyCountry && <div className="space-y-2">
            <Label htmlFor="companyDocument" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              {getDocumentLabel()} <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input id="companyDocument" value={companyDocument} onChange={handleDocumentChange} placeholder={getDocumentPlaceholder()} />
            <p className="text-xs text-gray-600">{getDocumentHelp()}</p>
          </div>}

        <div className="space-y-2">
          <Label htmlFor="businessSegment" className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            Segmento de Negócio <span className="text-red-500 ml-1">*</span>
          </Label>
          <Popover open={segmentPopoverOpen} onOpenChange={setSegmentPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" aria-expanded={segmentPopoverOpen} className="w-full justify-between h-11 bg-white border-gray-300 hover:bg-gray-50">
                {businessSegment ? businessSegments.find(segment => segment.value === businessSegment)?.label : "Selecione o segmento"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-white z-50" align="start" side="bottom" sideOffset={4}>
              <Command className="bg-white">
                <CommandInput placeholder="Digite para buscar..." className="h-11 border-none focus:ring-0" />
                <CommandList className="max-h-[300px] overflow-y-auto">
                  <CommandEmpty>Nenhum segmento encontrado.</CommandEmpty>
                  <CommandGroup>
                    {businessSegments.map(segment => <CommandItem key={segment.value} value={segment.label} onSelect={() => {
                    setBusinessSegment(segment.value);
                    setSegmentPopoverOpen(false);
                  }} className="cursor-pointer hover:bg-gray-100">
                        <Check className={cn("mr-2 h-4 w-4", businessSegment === segment.value ? "opacity-100" : "opacity-0")} />
                        {segment.label}
                      </CommandItem>)}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <p className="text-xs text-gray-600">
            Digite para buscar o segmento que melhor descreve sua empresa
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyAddress" className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Endereço Completo
          </Label>
          {companyCountry === 'BR' ? (
            <AddressAutocomplete
              value={companyAddress}
              onChange={setCompanyAddress}
              onPlaceSelect={(place) => {
                setCompanyAddress(place.address);
                setCompanyCoordinates(place.coordinates);
              }}
              placeholder="Digite o endereço da empresa..."
              className="h-11"
            />
          ) : (
            <Input 
              id="companyAddress" 
              value={companyAddress} 
              onChange={e => {
                setCompanyAddress(e.target.value);
                setCompanyCoordinates(null);
              }} 
              placeholder="Rua, número, bairro, cidade" 
            />
          )}
          <p className="text-xs text-gray-600">
            {companyCountry === 'BR' 
              ? 'Endereço com geolocalização automática para contratos'
              : 'Endereço que aparecerá nos contratos'
            }
          </p>
        </div>

        <div className="pt-4 border-t">
          <CompanyTermsCheckbox accepted={termsAccepted} onAcceptedChange={setTermsAccepted} disabled={termsAccepted} acceptedDate={termsAcceptedDate} />
        </div>

        <div className="flex justify-center pt-6">
          <Button onClick={handleSave} disabled={loading} size="lg" className="bg-exa-red hover:bg-exa-red/90 text-white px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
            {loading ? "Salvando..." : "EU CONFIRMO"}
          </Button>
        </div>
      </CardContent>
    </Card>;
};