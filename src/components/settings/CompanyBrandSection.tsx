import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, FileText, Info, MapPin, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CompanyTermsCheckbox } from './CompanyTermsCheckbox';
import { validateCompanyDocument, formatCompanyDocument } from '@/utils/inputValidation';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { BusinessSegmentSelector } from '@/components/ui/business-segment-selector';
import { cn } from '@/lib/utils';
import { useLogoImageUrl } from '@/hooks/useLogoImageUrl';
import { ClientLogoUploadModal } from '@/components/admin/proposals/ClientLogoUploadModal';
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

  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoStorageBucket, setLogoStorageBucket] = useState<string | null>(null);
  const [logoStorageKey, setLogoStorageKey] = useState<string | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);

  const { imageUrl: signedLogoUrl, loading: logoLoading } = useLogoImageUrl(
    logoUrl ? { file_url: logoUrl, storage_bucket: logoStorageBucket || undefined, storage_key: logoStorageKey || undefined } : null
  );

  React.useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('users')
        .select('empresa_nome, empresa_pais, empresa_documento, empresa_segmento, empresa_endereco, empresa_latitude, empresa_longitude, empresa_aceite_termo, empresa_aceite_termo_data')
        .eq('id', user.id)
        .single();
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
        // Load logo separately
        const { data: logoData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        const userLogoUrl = (logoData as any)?.logo_url;
        if (userLogoUrl) {
          setLogoUrl(userLogoUrl);
          if (userLogoUrl.includes('/storage/') && userLogoUrl.includes('arquivos')) {
            setLogoStorageBucket('arquivos');
            const keyMatch = userLogoUrl.match(/arquivos\/(.+?)(\?|$)/);
            if (keyMatch) setLogoStorageKey(keyMatch[1]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };

  const handleLogoProcessed = async (url: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error: updateError } = await supabase
        .from('users')
        .update({ logo_url: url } as any)
        .eq('id', user.id);
      if (updateError) throw updateError;

      setLogoUrl(url);
      if (url.includes('/storage/') && url.includes('arquivos')) {
        setLogoStorageBucket('arquivos');
        const keyMatch = url.match(/arquivos\/(.+?)(\?|#|$)/);
        if (keyMatch) setLogoStorageKey(keyMatch[1]);
      }
      toast.success('Logo aplicada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar logo:', error);
      toast.error('Erro ao salvar logo: ' + (error.message || 'Tente novamente'));
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('users').update({ logo_url: null } as any).eq('id', user.id);
      setLogoUrl(null);
      setLogoStorageBucket(null);
      setLogoStorageKey(null);
      toast.success('Logo removida');
    } catch (error) {
      toast.error('Erro ao remover logo');
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!companyCountry) return;
    const formatted = formatCompanyDocument(e.target.value, companyCountry);
    setCompanyDocument(formatted);
  };

  const handleSave = async () => {
    try {
      if (!companyName.trim()) { toast.error('Informe o nome da empresa/marca'); return; }
      if (!companyCountry) { toast.error('Selecione o país da empresa'); return; }
      if (!companyDocument.trim()) { toast.error('Informe o documento da empresa'); return; }
      if (!validateCompanyDocument(companyDocument, companyCountry)) {
        const docType = companyCountry === 'BR' ? 'CNPJ' : companyCountry === 'AR' ? 'CUIT' : 'RUC';
        toast.error(`${docType} inválido`);
        return;
      }
      if (!businessSegment) { toast.error('Selecione o segmento de negócio'); return; }
      if (!termsAccepted) { toast.error('Você deve aceitar o termo de responsabilidade'); return; }

      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

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

      if (termsAccepted && !termsAcceptedDate) {
        updateData.empresa_aceite_termo_data = new Date().toISOString();
      }

      const { error } = await supabase.from('users').update(updateData).eq('id', user.id);
      if (error) throw error;

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
    <Card className="shadow-lg">
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
        {/* Logo Upload Section */}
        <div className="space-y-3">
          <Label className="flex items-center text-base font-semibold">
            <ImageIcon className="h-4 w-4 mr-2" />
            Logo da Empresa
          </Label>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Preview */}
            <div className="flex flex-col items-center gap-2">
             {signedLogoUrl || logoUrl ? (
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#4a0f0f] via-[#6B1515] to-[#7D1818] flex items-center justify-center p-3 shadow-lg">
                    <img
                      src={signedLogoUrl || logoUrl || ''}
                      alt="Logo da empresa"
                      className={cn(
                        "max-w-full max-h-full object-contain rounded",
                        !logoUrl?.includes('#original') && "brightness-0 invert"
                      )}
                    />
                  </div>
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => setShowLogoModal(true)}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-exa-red/50 hover:bg-gray-50 transition-all"
                >
                  <Upload className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload</span>
                </div>
              )}
            </div>

            {/* Upload button + Modal */}
            <div className="flex-1 space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLogoModal(true)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                <Upload className="h-4 w-4 mr-2" /> {logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
              </Button>
              <p className="text-xs text-gray-500">PNG, JPG ou WebP • Máximo 5MB • 3 variantes disponíveis</p>
            </div>
          </div>

          {/* ClientLogoUploadModal */}
          <ClientLogoUploadModal
            isOpen={showLogoModal}
            onClose={() => setShowLogoModal(false)}
            onLogoProcessed={handleLogoProcessed}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">
            Nome da Empresa/Marca <span className="text-red-500">*</span>
          </Label>
          <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nome completo da empresa ou marca" className="min-h-[44px]" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyCountry">
            País da Empresa <span className="text-red-500">*</span>
          </Label>
          <Select value={companyCountry} onValueChange={value => setCompanyCountry(value as 'BR' | 'AR' | 'PY')}>
            <SelectTrigger className="min-h-[44px]">
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
            <Input id="companyDocument" value={companyDocument} onChange={handleDocumentChange} placeholder={getDocumentPlaceholder()} className="min-h-[44px]" />
            <p className="text-xs text-gray-600">{getDocumentHelp()}</p>
          </div>
        )}

        <BusinessSegmentSelector
          value={businessSegment}
          onChange={setBusinessSegment}
          showLabel={true}
          label="Segmento de Negócio"
          placeholder="Selecione o segmento"
          required={true}
          allowCreate={true}
        />

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
              className="min-h-[44px]"
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
          <Button onClick={handleSave} disabled={loading} size="lg" className="bg-[#9C1E1E] hover:bg-[#7A1818] text-white px-12 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all min-h-[56px]">
            {loading ? "Salvando..." : "EU CONFIRMO"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};