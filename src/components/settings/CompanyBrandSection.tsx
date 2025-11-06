import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, FileText, Briefcase, Save, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CompanyTermsCheckbox } from './CompanyTermsCheckbox';
import { validateCompanyDocument, formatCompanyDocument } from '@/utils/inputValidation';

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
  { value: 'other', label: 'Outros Segmentos' }
];

export const CompanyBrandSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyCountry, setCompanyCountry] = useState<'BR' | 'AR' | 'PY' | ''>('');
  const [companyDocument, setCompanyDocument] = useState('');
  const [businessSegment, setBusinessSegment] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  React.useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('empresa_nome, empresa_pais, empresa_documento, empresa_segmento, empresa_aceite_termo')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCompanyName(data.empresa_nome || '');
        setCompanyCountry((data.empresa_pais as 'BR' | 'AR' | 'PY') || '');
        setCompanyDocument(data.empresa_documento || '');
        setBusinessSegment(data.empresa_segmento || '');
        setTermsAccepted(data.empresa_aceite_termo || false);
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('users')
        .update({
          empresa_nome: companyName,
          empresa_pais: companyCountry,
          empresa_documento: companyDocument,
          empresa_segmento: businessSegment,
          empresa_aceite_termo: termsAccepted,
          empresa_aceite_data: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

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
      case 'BR': return 'CNPJ';
      case 'AR': return 'CUIT';
      case 'PY': return 'RUC';
      default: return 'Documento';
    }
  };

  const getDocumentPlaceholder = () => {
    switch (companyCountry) {
      case 'BR': return '00.000.000/0000-00';
      case 'AR': return '20-12345678-3';
      case 'PY': return '80012345-6';
      default: return 'Selecione o país primeiro';
    }
  };

  const getDocumentHelp = () => {
    switch (companyCountry) {
      case 'BR': return 'Emitido pela Receita Federal do Brasil';
      case 'AR': return 'CUIT emitido pela AFIP - formatação automática';
      case 'PY': return 'RUC emitido pela SET - formatação automática';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building2 className="h-5 w-5 mr-2" />
          Empresa ou Marca que Você Representa
        </CardTitle>
        <div className="flex items-start space-x-2 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-900">
            Informações opcionais, mas <strong>OBRIGATÓRIAS</strong> para fazer upload de vídeos
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="companyName">
            Nome da Empresa/Marca <span className="text-red-500">*</span>
          </Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Nome completo da empresa ou marca"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyCountry">
            País da Empresa <span className="text-red-500">*</span>
          </Label>
          <Select value={companyCountry} onValueChange={(value) => setCompanyCountry(value as 'BR' | 'AR' | 'PY')}>
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

        {companyCountry && (
          <div className="space-y-2">
            <Label htmlFor="companyDocument" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              {getDocumentLabel()} <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="companyDocument"
              value={companyDocument}
              onChange={handleDocumentChange}
              placeholder={getDocumentPlaceholder()}
            />
            <p className="text-xs text-gray-600">{getDocumentHelp()}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="businessSegment" className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            Segmento de Negócio <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select value={businessSegment} onValueChange={setBusinessSegment}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o segmento" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {businessSegments.map((segment) => (
                <SelectItem key={segment.value} value={segment.value}>
                  {segment.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-4 border-t">
          <CompanyTermsCheckbox 
            accepted={termsAccepted}
            onAcceptedChange={setTermsAccepted}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-indexa-purple hover:bg-indexa-purple/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Informações da Empresa
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
