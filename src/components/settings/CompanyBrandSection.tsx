import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Building2, FileText, Info, MapPin, Upload, X, Image as ImageIcon, CheckCircle, AlertTriangle, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CompanyTermsCheckbox } from './CompanyTermsCheckbox';
import { validateCompanyDocument, formatCompanyDocument } from '@/utils/inputValidation';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { BusinessSegmentSelector } from '@/components/ui/business-segment-selector';
import { cn } from '@/lib/utils';
import { useLogoImageUrl } from '@/hooks/useLogoImageUrl';
import { ClientLogoUploadModal } from '@/components/admin/proposals/ClientLogoUploadModal';
import { useAuth } from '@/hooks/useAuth';
import { useCNPJConsult } from '@/hooks/useCNPJConsult';

interface CompanyBrandSectionProps {
  isEditing?: boolean;
  onLogoScaleChange?: (scale: number) => void;
}

export const CompanyBrandSection: React.FC<CompanyBrandSectionProps> = ({ isEditing = false, onLogoScaleChange }) => {
  const { refreshUserProfile } = useAuth();
  const { consultCNPJ, isLoading: isLoadingCNPJ } = useCNPJConsult();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyCountry, setCompanyCountry] = useState<'BR' | 'AR' | 'PY' | ''>('');
  const [companyDocument, setCompanyDocument] = useState('');
  const [businessSegment, setBusinessSegment] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCoordinates, setCompanyCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsAcceptedDate, setTermsAcceptedDate] = useState<string | null>(null);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoStorageBucket, setLogoStorageBucket] = useState<string | null>(null);
  const [logoStorageKey, setLogoStorageKey] = useState<string | null>(null);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [logoScale, setLogoScale] = useState(1);

  const { imageUrl: signedLogoUrl, loading: logoLoading } = useLogoImageUrl(
    logoUrl ? { file_url: logoUrl, storage_bucket: logoStorageBucket || undefined, storage_key: logoStorageKey || undefined } : null
  );

  const disabledFieldClass = "bg-gray-50 border-transparent shadow-none cursor-not-allowed";

  const hasInstitutionalData = !!(companyName && companyDocument && (signedLogoUrl || logoUrl));

  React.useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async (skipScaleReload = false) => {
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
        const { data: logoData } = await supabase.from('users').select('*').eq('id', user.id).single();
        const userLogoUrl = logoData?.avatar_url;
        if (userLogoUrl) {
          setLogoUrl(userLogoUrl);
          if (userLogoUrl.includes('/storage/') && userLogoUrl.includes('arquivos')) {
            setLogoStorageBucket('arquivos');
            const keyMatch = userLogoUrl.match(/arquivos\/(.+?)(\?|#|$)/);
            if (keyMatch) setLogoStorageKey(keyMatch[1]);
          }
        }
      }
      // Load logo scale from user_metadata
      if (!skipScaleReload) {
        const scale = user.user_metadata?.logo_scale;
        if (typeof scale === 'number') setLogoScale(scale);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };

  const handleLogoProcessed = async (url: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { error: updateError } = await supabase.from('users').update({ avatar_url: url }).eq('id', user.id);
      if (updateError) throw updateError;
      setLogoUrl(url);
      if (url.includes('/storage/') && url.includes('arquivos')) {
        setLogoStorageBucket('arquivos');
        const keyMatch = url.match(/arquivos\/(.+?)(\?|#|$)/);
        if (keyMatch) setLogoStorageKey(keyMatch[1]);
      }
      toast.success('Logo aplicada com sucesso!');
      await refreshUserProfile();
    } catch (error: any) {
      console.error('Erro ao salvar logo:', error);
      toast.error('Erro ao salvar logo: ' + (error.message || 'Tente novamente'));
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('users').update({ avatar_url: null }).eq('id', user.id);
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

  const handleConsultCNPJ = async () => {
    const data = await consultCNPJ(companyDocument);
    if (data) {
      if (data.nomeFantasia) setCompanyName(data.nomeFantasia);
      else if (data.razaoSocial) setCompanyName(data.razaoSocial);
      if (data.endereco) setCompanyAddress(data.endereco);
      if (data.segmento) setBusinessSegment(data.segmento);
    }
  };

  const handleLogoScaleChange = async (values: number[]) => {
    const newScale = values[0];
    setLogoScale(newScale);
    onLogoScaleChange?.(newScale);
  };

  const handleLogoScaleSave = async () => {
    try {
      await supabase.auth.updateUser({ data: { logo_scale: logoScale } });
      toast.success('Tamanho da logo salvo!');
    } catch (error) {
      console.error('Erro ao salvar tamanho da logo:', error);
    }
  };

  // Confirmação isolada do Termo (quando empresa já está cadastrada e só falta assinar)
  const handleConfirmTermOnly = async () => {
    try {
      if (!termsAccepted) {
        toast.error('Marque a caixa do termo de responsabilidade para confirmar');
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const { error } = await supabase
        .from('users')
        .update({
          empresa_aceite_termo: true,
          empresa_aceite_termo_data: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      await loadCompanyData(true);
      await refreshUserProfile();
      toast.success('Termo de responsabilidade confirmado!');
    } catch (error: any) {
      console.error('Erro ao confirmar termo:', error);
      toast.error('Erro ao confirmar termo: ' + (error.message || 'Tente novamente'));
    } finally {
      setLoading(false);
    }
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
        empresa_aceite_termo: termsAccepted,
      };
      if (termsAccepted && !termsAcceptedDate) {
        updateData.empresa_aceite_termo_data = new Date().toISOString();
      }

      const { error } = await supabase.from('users').update(updateData).eq('id', user.id);
      if (error) throw error;

      // Save logo scale to user_metadata
      await supabase.auth.updateUser({ data: { logo_scale: logoScale } });

      await loadCompanyData(true);
      toast.success('Informações da empresa salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar informações da empresa:', error);
      toast.error('Erro ao salvar informações da empresa');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentLabel = () => {
    switch (companyCountry) { case 'BR': return 'CNPJ'; case 'AR': return 'CUIT'; case 'PY': return 'RUC'; default: return 'Documento'; }
  };
  const getDocumentPlaceholder = () => {
    switch (companyCountry) { case 'BR': return '00.000.000/0000-00'; case 'AR': return '20-12345678-3'; case 'PY': return '80012345-6'; default: return 'Selecione o país primeiro'; }
  };
  const getDocumentHelp = () => {
    switch (companyCountry) { case 'BR': return 'Emitido pela Receita Federal do Brasil'; case 'AR': return 'CUIT emitido pela AFIP'; case 'PY': return 'RUC emitido pela SET'; default: return ''; }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Building2 className="h-5 w-5 mr-2 text-exa-red" />
          Empresa ou Marca
        </CardTitle>
        <div className="flex items-start space-x-2 mt-3 p-3 bg-stone-50 border border-stone-200 rounded-lg">
          <Info className="h-4 w-4 text-stone-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-stone-700">
            Informações opcionais, mas <strong>obrigatórias</strong> para fazer upload de vídeos
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/*
          Modo "Só Termo": empresa já cadastrada (CNPJ/documento preenchido)
          mas o termo de responsabilidade ainda não foi assinado.
          Não duplicamos o cadastro — pedimos apenas a confirmação do termo.
        */}
        {(() => {
          const termOnlyMode = !!companyDocument && !termsAccepted && isEditing;
          if (!termOnlyMode) return null;
          return (
            <>
              {hasInstitutionalData && (
                <div className="rounded-xl border bg-gray-50/50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[#4a0f0f] via-[#6B1515] to-[#7D1818] flex items-center justify-center p-2.5 flex-shrink-0 shadow overflow-hidden">
                      {(signedLogoUrl || logoUrl) ? (
                        <img
                          src={signedLogoUrl || logoUrl || ''}
                          alt="Logo"
                          className={cn(
                            "max-w-full max-h-full object-contain rounded transition-transform",
                            !logoUrl?.includes('#original') && "brightness-0 invert"
                          )}
                          style={{ transform: `scale(${logoScale})` }}
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-white/80" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-base font-semibold text-foreground truncate">{companyName || '—'}</p>
                      <p className="text-sm text-muted-foreground">{getDocumentLabel()}: {companyDocument}</p>
                      {businessSegment && <p className="text-xs text-muted-foreground">{businessSegment}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 space-y-1">
                  <p className="font-semibold">Seus dados de empresa já estão cadastrados.</p>
                  <p>
                    Para liberar o upload de vídeos, falta apenas <strong>confirmar o Termo
                    de Responsabilidade</strong> abaixo, declarando que você é o representante
                    legal desta empresa.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <CompanyTermsCheckbox
                  accepted={termsAccepted}
                  onAcceptedChange={setTermsAccepted}
                  disabled={false}
                  acceptedDate={termsAcceptedDate}
                />
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  onClick={handleConfirmTermOnly}
                  disabled={loading || !termsAccepted}
                  size="lg"
                  className="bg-[#9C1E1E] hover:bg-[#7A1818] text-white px-12 min-h-[48px] text-base font-semibold shadow-lg"
                >
                  {loading ? "Confirmando..." : "Confirmar Termo"}
                </Button>
              </div>
            </>
          );
        })()}

        {/* Form completo: oculto quando estamos no modo "Só Termo" */}
        {!(!!companyDocument && !termsAccepted && isEditing) && (
        <>
        {/* Institutional Summary Card */}
        {hasInstitutionalData && (
          <div className="rounded-xl border bg-gray-50/50 p-5">
            <div className="flex items-start gap-4">
              <div
                className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-[#4a0f0f] via-[#6B1515] to-[#7D1818] flex items-center justify-center p-2.5 flex-shrink-0 shadow overflow-hidden"
              >
                <img
                  src={signedLogoUrl || logoUrl || ''}
                  alt="Logo"
                  className={cn(
                    "max-w-full max-h-full object-contain rounded transition-transform",
                    !logoUrl?.includes('#original') && "brightness-0 invert"
                  )}
                  style={{ transform: `scale(${logoScale})` }}
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-base font-semibold text-foreground truncate">{companyName}</p>
                <p className="text-sm text-muted-foreground">{getDocumentLabel()}: {companyDocument}</p>
                {businessSegment && <p className="text-xs text-muted-foreground">{businessSegment}</p>}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[11px]">
                    <CheckCircle className="h-3 w-3 mr-1" /> Logo carregada
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[11px]">
                    <CheckCircle className="h-3 w-3 mr-1" /> Documento validado
                  </Badge>
                  {termsAccepted ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[11px]">
                      <CheckCircle className="h-3 w-3 mr-1" /> Termo confirmado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Termo pendente
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Logo Upload */}
        <div className="space-y-3">
          <Label className="flex items-center text-sm font-semibold">
            <ImageIcon className="h-4 w-4 mr-2" />
            Logo da Empresa
          </Label>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex flex-col items-center gap-2">
              {signedLogoUrl || logoUrl ? (
                <div className="relative">
                  <div 
                    className="rounded-2xl bg-gradient-to-br from-[#4a0f0f] via-[#6B1515] to-[#7D1818] w-20 h-20 p-2.5 flex items-center justify-center shadow-lg overflow-visible transition-all duration-200"
                  >
                    <img
                      src={signedLogoUrl || logoUrl || ''}
                      alt="Logo da empresa"
                      className={cn("max-w-full max-h-full object-contain rounded transition-transform duration-200", !logoUrl?.includes('#original') && "brightness-0 invert")}
                      style={{ transform: `scale(${logoScale})` }}
                    />
                  </div>
                  {isEditing && (
                    <button onClick={handleRemoveLogo} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => isEditing && setShowLogoModal(true)}
                  className={cn(
                    "w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center transition-all",
                    isEditing ? "cursor-pointer hover:border-exa-red/50 hover:bg-gray-50" : "cursor-not-allowed opacity-60"
                  )}
                >
                  <Upload className="h-5 w-5 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Upload</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              {isEditing && (
                <Button type="button" variant="outline" onClick={() => setShowLogoModal(true)} className="w-full sm:w-auto min-h-[44px]">
                  <Upload className="h-4 w-4 mr-2" /> {logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG ou WebP • Máximo 5MB</p>
            </div>
          </div>

          {/* Logo Scale Slider */}
          {(signedLogoUrl || logoUrl) && isEditing && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Tamanho da Logo</Label>
                <span className="text-xs text-muted-foreground font-mono">{Math.round(logoScale * 100)}%</span>
              </div>
              <Slider
                value={[logoScale]}
                onValueChange={handleLogoScaleChange}
                min={0.5}
                max={3}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>50%</span>
                <span>150%</span>
                <span>300%</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogoScaleSave}
                className="mt-1"
              >
                Salvar tamanho
              </Button>
            </div>
          )}

          <ClientLogoUploadModal isOpen={showLogoModal} onClose={() => setShowLogoModal(false)} onLogoProcessed={handleLogoProcessed} />
        </div>

        {/* Fields */}
        <div className="space-y-1.5">
          <Label htmlFor="companyName" className="text-sm">Nome da Empresa/Marca <span className="text-red-500">*</span></Label>
          <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Nome completo da empresa ou marca" disabled={!isEditing} className={cn("min-h-[44px]", !isEditing && disabledFieldClass)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyCountry" className="text-sm">País da Empresa <span className="text-red-500">*</span></Label>
          <Select value={companyCountry} onValueChange={value => setCompanyCountry(value as 'BR' | 'AR' | 'PY')} disabled={!isEditing}>
            <SelectTrigger className={cn("min-h-[44px]", !isEditing && disabledFieldClass)}>
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
          <div className="space-y-1.5">
            <Label htmlFor="companyDocument" className="flex items-center text-sm">
              <FileText className="h-4 w-4 mr-2" />
              {getDocumentLabel()} <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="companyDocument"
                value={companyDocument}
                onChange={handleDocumentChange}
                placeholder={getDocumentPlaceholder()}
                disabled={!isEditing}
                className={cn("min-h-[44px] flex-1", !isEditing && disabledFieldClass)}
              />
              {isEditing && companyCountry === 'BR' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConsultCNPJ}
                  disabled={isLoadingCNPJ || companyDocument.replace(/\D/g, '').length !== 14}
                  className="min-h-[44px] flex-shrink-0"
                >
                  {isLoadingCNPJ ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Search className="h-4 w-4 mr-1" />}
                  Consultar
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{getDocumentHelp()}</p>
          </div>
        )}

        <div className={cn(!isEditing && "pointer-events-none opacity-70")}>
          <BusinessSegmentSelector
            value={businessSegment}
            onChange={setBusinessSegment}
            showLabel={true}
            label="Segmento de Negócio"
            placeholder="Selecione o segmento"
            required={true}
            allowCreate={true}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="companyAddress" className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2" />
            Endereço Completo
          </Label>
          {companyCountry === 'BR' ? (
            <AddressAutocomplete
              value={companyAddress}
              onChange={setCompanyAddress}
              onPlaceSelect={(place) => { setCompanyAddress(place.address); setCompanyCoordinates(place.coordinates); }}
              placeholder="Digite o endereço da empresa..."
              className={cn("h-11", !isEditing && disabledFieldClass)}
              disabled={!isEditing}
            />
          ) : (
            <Input
              id="companyAddress"
              value={companyAddress}
              onChange={e => { setCompanyAddress(e.target.value); setCompanyCoordinates(null); }}
              placeholder="Rua, número, bairro, cidade"
              disabled={!isEditing}
              className={cn("min-h-[44px]", !isEditing && disabledFieldClass)}
            />
          )}
        </div>

        {/* Terms */}
        <div className="pt-4 border-t">
          <CompanyTermsCheckbox accepted={termsAccepted} onAcceptedChange={setTermsAccepted} disabled={termsAccepted} acceptedDate={termsAcceptedDate} />
        </div>

        {/* Save button - only in edit mode */}
        {isEditing && (
          <div className="flex justify-center pt-4">
            <Button onClick={handleSave} disabled={loading} size="lg" className="bg-[#9C1E1E] hover:bg-[#7A1818] text-white px-12 min-h-[48px] text-base font-semibold shadow-lg">
              {loading ? "Salvando..." : "Salvar Empresa"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
