import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Video, Loader2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as tus from 'tus-js-client';

const VideosSitePage = () => {
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [homeVideoUrl, setHomeVideoUrl] = useState('');
  const [homeHorizontalUrl, setHomeHorizontalUrl] = useState('');
  const [souSindicoMainUrl, setSouSindicoMainUrl] = useState('');
  const [souSindicoSecondaryUrl, setSouSindicoSecondaryUrl] = useState('');
  const [uploadingHome, setUploadingHome] = useState(false);
  const [uploadingHomeHorizontal, setUploadingHomeHorizontal] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);
  const [uploadProgressHome, setUploadProgressHome] = useState(0);
  const [uploadProgressHomeHorizontal, setUploadProgressHomeHorizontal] = useState(0);
  const [uploadProgressMain, setUploadProgressMain] = useState(0);
  const [uploadProgressSecondary, setUploadProgressSecondary] = useState(0);

  // Carregar configurações existentes
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoadingConfig(true);
      console.log('[VideosSitePage] Carregando configurações...');
      
      const { data, error } = await supabase
        .from('configuracoes_sindico')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        console.log('[VideosSitePage] Config carregada:', data.id);
        setHomeVideoUrl(data.video_homepage_url || '');
        setHomeHorizontalUrl((data as any).video_homepage_horizontal_url || '');
        setSouSindicoMainUrl(data.video_principal_url || '');
        setSouSindicoSecondaryUrl(data.video_secundario_url || '');
        toast.success('Configurações carregadas');
      } else {
        console.log('[VideosSitePage] Nenhuma configuração encontrada');
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
    setProgress: (value: number) => void,
    onSuccess: (url: string) => void
  ) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione apenas arquivos de vídeo');
      return;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('O vídeo não pode ter mais de 100MB');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${timestamp}.${fileExt}`;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const projectId = 'aakenoljsycyrcrchgxj';

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000],
          headers: {
            authorization: `Bearer ${session.access_token}`,
            'x-upsert': 'true',
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: bucket,
            objectName: fileName,
            contentType: file.type,
            cacheControl: '3600',
          },
          chunkSize: 6 * 1024 * 1024,
          onError: (error) => {
            console.error('[TUS] Upload error:', error);
            reject(error);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const pct = Math.round((bytesUploaded / bytesTotal) * 100);
            setProgress(pct);
          },
          onSuccess: () => {
            resolve();
          },
        });

        upload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        });
      });

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onSuccess(publicUrl);
      toast.success('Upload concluído! Clique em "Salvar Configurações" para aplicar.');
      setProgress(100);
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(`Erro ao fazer upload: ${error.message || error}`);
      setProgress(0);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 1000);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      console.log('[VideosSitePage] Salvando configurações...');

      // Buscar o registro único
      const { data: existing, error: fetchError } = await supabase
        .from('configuracoes_sindico')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        console.log('[VideosSitePage] Atualizando registro:', existing.id);
        const { error } = await supabase
          .from('configuracoes_sindico')
          .update({
            video_homepage_url: homeVideoUrl,
            video_homepage_horizontal_url: homeHorizontalUrl,
            video_principal_url: souSindicoMainUrl,
            video_secundario_url: souSindicoSecondaryUrl,
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        console.log('[VideosSitePage] Criando novo registro');
        const { error } = await supabase
          .from('configuracoes_sindico')
          .insert({
            video_homepage_url: homeVideoUrl,
            video_homepage_horizontal_url: homeHorizontalUrl,
            video_principal_url: souSindicoMainUrl,
            video_secundario_url: souSindicoSecondaryUrl
          } as any);

        if (error) throw error;
      }

      toast.success('Configurações salvas com sucesso!');
      
      // Recarregar dados do banco
      await loadConfig();
      
    } catch (error: any) {
      console.error('[VideosSitePage] Erro ao salvar:', error);
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
            <div className="space-y-3">
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
                      setUploadProgressHome,
                      setHomeVideoUrl
                    );
                  }
                }}
              />
              {uploadingHome && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Enviando vídeo...</span>
                    <span className="font-medium">{uploadProgressHome}%</span>
                  </div>
                  <Progress value={uploadProgressHome} className="h-2" />
                </div>
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

      {/* Vídeo da Homepage Horizontal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Vídeo da Homepage (Horizontal)
          </CardTitle>
          <CardDescription>
            Vídeo horizontal (16:9) exibido na versão mobile da página inicial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="home-horizontal-video">URL do Vídeo Atual</Label>
            <Input
              id="home-horizontal-video"
              placeholder="https://..."
              value={homeHorizontalUrl}
              onChange={(e) => setHomeHorizontalUrl(e.target.value)}
              disabled={uploadingHomeHorizontal}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="home-horizontal-upload">Fazer Upload de Novo Vídeo</Label>
            <div className="space-y-3">
              <Input
                id="home-horizontal-upload"
                type="file"
                accept="video/*"
                disabled={uploadingHomeHorizontal}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(
                      file,
                      'videos',
                      'homepage-horizontal',
                      setUploadingHomeHorizontal,
                      setUploadProgressHomeHorizontal,
                      setHomeHorizontalUrl
                    );
                  }
                }}
              />
              {uploadingHomeHorizontal && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Enviando vídeo...</span>
                    <span className="font-medium">{uploadProgressHomeHorizontal}%</span>
                  </div>
                  <Progress value={uploadProgressHomeHorizontal} className="h-2" />
                </div>
              )}
            </div>
          </div>

          {homeHorizontalUrl && (
            <div className="rounded-lg overflow-hidden bg-black">
              <video
                src={homeHorizontalUrl}
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
              <div className="space-y-3">
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
                        setUploadProgressMain,
                        setSouSindicoMainUrl
                      );
                    }
                  }}
                />
                {uploadingMain && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Enviando vídeo...</span>
                      <span className="font-medium">{uploadProgressMain}%</span>
                    </div>
                    <Progress value={uploadProgressMain} className="h-2" />
                  </div>
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
              <h3 className="font-semibold">Vídeo Secundário (Painel "Elegância e integração visual")</h3>
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
              <div className="space-y-3">
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
                        setUploadProgressSecondary,
                        setSouSindicoSecondaryUrl
                      );
                    }
                  }}
                />
                {uploadingSecondary && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Enviando vídeo...</span>
                      <span className="font-medium">{uploadProgressSecondary}%</span>
                    </div>
                    <Progress value={uploadProgressSecondary} className="h-2" />
                  </div>
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
          disabled={loading || uploadingHome || uploadingHomeHorizontal || uploadingMain || uploadingSecondary}
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
