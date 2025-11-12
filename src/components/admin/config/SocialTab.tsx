import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Save, Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { AdditionalConfiguration } from '@/hooks/useAdditionalConfigurations';

interface SocialTabProps {
  config: AdditionalConfiguration | null;
  updateConfig: (updates: Partial<AdditionalConfiguration>) => Promise<boolean>;
}

export const SocialTab: React.FC<SocialTabProps> = ({ config, updateConfig }) => {
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
      {/* Redes Sociais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Redes Sociais
          </CardTitle>
          <CardDescription>
            Links para os perfis da empresa nas redes sociais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="social_facebook" className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-blue-600" />
              Facebook
            </Label>
            <Input
              id="social_facebook"
              type="url"
              value={localConfig.social_facebook || ''}
              onChange={(e) => handleChange('social_facebook', e.target.value)}
              placeholder="https://facebook.com/indexa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-600" />
              Instagram
            </Label>
            <Input
              id="social_instagram"
              type="url"
              value={localConfig.social_instagram || ''}
              onChange={(e) => handleChange('social_instagram', e.target.value)}
              placeholder="https://instagram.com/indexa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_linkedin" className="flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-blue-700" />
              LinkedIn
            </Label>
            <Input
              id="social_linkedin"
              type="url"
              value={localConfig.social_linkedin || ''}
              onChange={(e) => handleChange('social_linkedin', e.target.value)}
              placeholder="https://linkedin.com/company/indexa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_twitter" className="flex items-center gap-2">
              <Twitter className="w-4 h-4 text-sky-500" />
              Twitter / X
            </Label>
            <Input
              id="social_twitter"
              type="url"
              value={localConfig.social_twitter || ''}
              onChange={(e) => handleChange('social_twitter', e.target.value)}
              placeholder="https://twitter.com/indexa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="social_youtube" className="flex items-center gap-2">
              <Youtube className="w-4 h-4 text-red-600" />
              YouTube
            </Label>
            <Input
              id="social_youtube"
              type="url"
              value={localConfig.social_youtube || ''}
              onChange={(e) => handleChange('social_youtube', e.target.value)}
              placeholder="https://youtube.com/@indexa"
            />
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
