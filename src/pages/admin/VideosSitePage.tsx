import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Video, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

const VideosSitePage = () => {
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [homeVideoUrl, setHomeVideoUrl] = useState('');
  const [souSindicoMainUrl, setSouSindicoMainUrl] = useState('');
  const [souSindicoSecondaryUrl, setSouSindicoSecondaryUrl] = useState('');
  const [uploadingHome, setUploadingHome] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);

  // Carregar configurações existentes
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      const { data, error } = await supabase
        .from('configuracoes_sindico')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSouSindicoMainUrl(data.video_principal_url || '');
        setSouSindicoSecondaryUrl(data.video_secundario_url || '');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações dos vídeos');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleFileUpload = async (
    file: File, 
    bucket: string, 
    folder: string,
    setUploading: (value: boolean) => void,
    onSuccess: (url: string) => void
  ) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione apenas arquivos de vídeo');
      return;
    }

    // Validar tamanho (máximo 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('O vídeo não pode ter mais de 100MB');
      return;
    }

    try {
      setUploading(true);
      
      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${timestamp}.${fileExt}`;

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onSuccess(publicUrl);
      toast.success('Vídeo enviado com sucesso!');
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(`Erro ao fazer upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);

      // Verificar se já existe configuração
      const { data: existing } = await supabase
        .from('configuracoes_sindico')
        .select('id')
        .single();

      if (existing) {
        // Atualizar
        const { error } = await supabase
          .from('configuracoes_sindico')
          .update({
            video_principal_url: souSindicoMainUrl,
            video_secundario_url: souSindicoSecondaryUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar
        const { error } = await supabase
          .from('configuracoes_sindico')
          .insert({
            video_principal_url: souSindicoMainUrl,
            video_secundario_url: souSindicoSecondaryUrl
          });

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Vídeos do Site</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os vídeos da homepage e da página Sou Síndico
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Formatos aceitos: MP4, WebM, MOV. Tamanho máximo: 100MB por vídeo.
          Recomendamos vídeos verticais (9:16) para melhor visualização mobile.
        </AlertDescription>
      </Alert>

      {/* Vídeo da Homepage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Vídeo da Homepage (Vertical)
          </CardTitle>
          <CardDescription>
            Vídeo vertical exibido na página inicial do site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="home-video">URL do Vídeo Atual</Label>
            <Input
              id="home-video"
              placeholder="https://..."
              value={homeVideoUrl}
              onChange={(e) => setHomeVideoUrl(e.target.value)}
              disabled={uploadingHome}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="home-upload">Fazer Upload de Novo Vídeo</Label>
            <div className="flex items-center gap-2">
              <Input
                id="home-upload"
                type="file"
                accept="video/*"
                disabled={uploadingHome}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(
                      file,
                      'videos',
                      'homepage',
                      setUploadingHome,
                      setHomeVideoUrl
                    );
                  }
                }}
              />
              {uploadingHome && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
          </div>

          {homeVideoUrl && (
            <div className="rounded-lg overflow-hidden bg-black">
              <video
                src={homeVideoUrl}
                controls
                className="w-full max-h-96 object-contain"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vídeos Sou Síndico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Player Sou Síndico
          </CardTitle>
          <CardDescription>
            Configure os vídeos exibidos na página Sou Síndico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vídeo Principal */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <h3 className="font-semibold">Vídeo Principal</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sindico-main">URL do Vídeo</Label>
              <Input
                id="sindico-main"
                placeholder="https://..."
                value={souSindicoMainUrl}
                onChange={(e) => setSouSindicoMainUrl(e.target.value)}
                disabled={uploadingMain}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sindico-main-upload">Fazer Upload</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sindico-main-upload"
                  type="file"
                  accept="video/*"
                  disabled={uploadingMain}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(
                        file,
                        'videos',
                        'sou-sindico/principal',
                        setUploadingMain,
                        setSouSindicoMainUrl
                      );
                    }
                  }}
                />
                {uploadingMain && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </div>

            {souSindicoMainUrl && (
              <div className="rounded-lg overflow-hidden bg-black">
                <video
                  src={souSindicoMainUrl}
                  controls
                  className="w-full max-h-64 object-contain"
                />
              </div>
            )}
          </div>

          {/* Vídeo Secundário */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <h3 className="font-semibold">Vídeo Secundário</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sindico-secondary">URL do Vídeo</Label>
              <Input
                id="sindico-secondary"
                placeholder="https://..."
                value={souSindicoSecondaryUrl}
                onChange={(e) => setSouSindicoSecondaryUrl(e.target.value)}
                disabled={uploadingSecondary}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sindico-secondary-upload">Fazer Upload</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="sindico-secondary-upload"
                  type="file"
                  accept="video/*"
                  disabled={uploadingSecondary}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(
                        file,
                        'videos',
                        'sou-sindico/secundario',
                        setUploadingSecondary,
                        setSouSindicoSecondaryUrl
                      );
                    }
                  }}
                />
                {uploadingSecondary && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </div>
            </div>

            {souSindicoSecondaryUrl && (
              <div className="rounded-lg overflow-hidden bg-black">
                <video
                  src={souSindicoSecondaryUrl}
                  controls
                  className="w-full max-h-64 object-contain"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveConfig}
          disabled={loading || uploadingHome || uploadingMain || uploadingSecondary}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default VideosSitePage;
