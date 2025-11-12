import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Save, MapPin } from 'lucide-react';
import { AdditionalConfiguration } from '@/hooks/useAdditionalConfigurations';

interface SiteInfoTabProps {
  config: AdditionalConfiguration | null;
  updateConfig: (updates: Partial<AdditionalConfiguration>) => Promise<boolean>;
}

export const SiteInfoTab: React.FC<SiteInfoTabProps> = ({ config, updateConfig }) => {
  const [localConfig, setLocalConfig] = useState(config || {} as any);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (config) setLocalConfig(config);
  }, [config]);

  const handleChange = (field: string, value: any) => {
    setLocalConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await updateConfig(localConfig);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Informações do Site
          </CardTitle>
          <CardDescription>
            Informações básicas da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_nome">Nome do Site</Label>
              <Input
                id="site_nome"
                value={localConfig.site_nome || ''}
                onChange={(e) => handleChange('site_nome', e.target.value)}
                placeholder="EXA Soluções Digitais LTDA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_slogan">Slogan</Label>
              <Input
                id="site_slogan"
                value={localConfig.site_slogan || ''}
                onChange={(e) => handleChange('site_slogan', e.target.value)}
                placeholder="Conectando sua mensagem ao mundo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_descricao">Descrição</Label>
            <Textarea
              id="site_descricao"
              value={localConfig.site_descricao || ''}
              onChange={(e) => handleChange('site_descricao', e.target.value)}
              placeholder="Plataforma de Painéis Digitais Inteligentes"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_logo_url">URL do Logo</Label>
              <Input
                id="site_logo_url"
                type="url"
                value={localConfig.site_logo_url || ''}
                onChange={(e) => handleChange('site_logo_url', e.target.value)}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_favicon_url">URL do Favicon</Label>
              <Input
                id="site_favicon_url"
                type="url"
                value={localConfig.site_favicon_url || ''}
                onChange={(e) => handleChange('site_favicon_url', e.target.value)}
                placeholder="https://exemplo.com/favicon.ico"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>
            Configurações de otimização para motores de busca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seo_keywords">Palavras-chave</Label>
            <Input
              id="seo_keywords"
              value={localConfig.seo_keywords || ''}
              onChange={(e) => handleChange('seo_keywords', e.target.value)}
              placeholder="painéis digitais, publicidade digital, mídia indoor"
            />
            <p className="text-xs text-muted-foreground">Separe por vírgulas</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo_description">Meta Description</Label>
            <Textarea
              id="seo_description"
              value={localConfig.seo_description || ''}
              onChange={(e) => handleChange('seo_description', e.target.value)}
              placeholder="Descrição para motores de busca"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">Máximo 160 caracteres</p>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Contato</CardTitle>
          <CardDescription>
            Canais de comunicação com clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contato_email">Email de Contato</Label>
              <Input
                id="contato_email"
                type="email"
                value={localConfig.contato_email || ''}
                onChange={(e) => handleChange('contato_email', e.target.value)}
                placeholder="contato@examidia.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suporte_email">Email de Suporte</Label>
              <Input
                id="suporte_email"
                type="email"
                value={localConfig.suporte_email || ''}
                onChange={(e) => handleChange('suporte_email', e.target.value)}
                placeholder="suporte@examidia.com.br"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contato_telefone">Telefone</Label>
              <Input
                id="contato_telefone"
                value={localConfig.contato_telefone || ''}
                onChange={(e) => handleChange('contato_telefone', e.target.value)}
                placeholder="+55 11 0000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contato_whatsapp">WhatsApp</Label>
              <Input
                id="contato_whatsapp"
                value={localConfig.contato_whatsapp || ''}
                onChange={(e) => handleChange('contato_whatsapp', e.target.value)}
                placeholder="+55 11 90000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suporte_horario">Horário de Suporte</Label>
              <Input
                id="suporte_horario"
                value={localConfig.suporte_horario || ''}
                onChange={(e) => handleChange('suporte_horario', e.target.value)}
                placeholder="Seg-Sex, 9h-18h"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço da Empresa
          </CardTitle>
          <CardDescription>
            Localização física da empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="endereco_rua">Rua/Avenida</Label>
              <Input
                id="endereco_rua"
                value={localConfig.endereco_rua || ''}
                onChange={(e) => handleChange('endereco_rua', e.target.value)}
                placeholder="Rua Exemplo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_numero">Número</Label>
              <Input
                id="endereco_numero"
                value={localConfig.endereco_numero || ''}
                onChange={(e) => handleChange('endereco_numero', e.target.value)}
                placeholder="123"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endereco_complemento">Complemento</Label>
              <Input
                id="endereco_complemento"
                value={localConfig.endereco_complemento || ''}
                onChange={(e) => handleChange('endereco_complemento', e.target.value)}
                placeholder="Sala 456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_bairro">Bairro</Label>
              <Input
                id="endereco_bairro"
                value={localConfig.endereco_bairro || ''}
                onChange={(e) => handleChange('endereco_bairro', e.target.value)}
                placeholder="Centro"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endereco_cidade">Cidade</Label>
              <Input
                id="endereco_cidade"
                value={localConfig.endereco_cidade || ''}
                onChange={(e) => handleChange('endereco_cidade', e.target.value)}
                placeholder="São Paulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_estado">Estado</Label>
              <Input
                id="endereco_estado"
                value={localConfig.endereco_estado || ''}
                onChange={(e) => handleChange('endereco_estado', e.target.value)}
                placeholder="SP"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_cep">CEP</Label>
              <Input
                id="endereco_cep"
                value={localConfig.endereco_cep || ''}
                onChange={(e) => handleChange('endereco_cep', e.target.value)}
                placeholder="00000-000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Save className="w-4 h-4 mr-2 animate-pulse" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
