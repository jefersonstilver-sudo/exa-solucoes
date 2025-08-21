import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Upload, Eye, GripVertical, Plus, AlertCircle } from 'lucide-react';
import { useLogosAdmin, Logo } from '@/hooks/useLogos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LogoTicker from '@/components/exa/LogoTicker';

const LogosAdmin: React.FC = () => {
  const { logos, loading, refreshLogos, toggleLogoActive, bulkUploadLogos } = useLogosAdmin();
  const [uploading, setUploading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = [];
    const logosToInsert = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validações
        if (!file.type.includes('png')) {
          toast.error(`${file.name}: Apenas arquivos PNG são aceitos`);
          continue;
        }
        
        if (file.size > 512 * 1024) {
          toast.error(`${file.name}: Arquivo muito grande (máx. 512KB)`);
          continue;
        }

        // Upload para Storage
        const fileName = `logo_${Date.now()}_${i}_${file.name}`;
        const uploadPromise = supabase.storage
          .from('arquivos')
          .upload(`PAGINA PRINCIPAL LOGOS/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });

        uploadPromises.push(uploadPromise);

        // Preparar dados da logo
        const logoName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
        logosToInsert.push({
          name: logoName,
          file_url: `https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/PAGINA PRINCIPAL LOGOS/${fileName}`,
          color_variant: 'white',
          is_active: true
        });
      }

      // Aguardar todos os uploads
      const uploadResults = await Promise.allSettled(uploadPromises);
      const successfulUploads = uploadResults.filter(
        (result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled' && !result.value.error
      );

      if (successfulUploads.length === 0) {
        toast.error('Nenhum arquivo foi uploadado com sucesso');
        return;
      }

      // Inserir logos válidas no banco
      const validLogos = logosToInsert.slice(0, successfulUploads.length);
      await bulkUploadLogos(validLogos);

      toast.success(`${successfulUploads.length} logo(s) adicionada(s) com sucesso!`);
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('❌ Error uploading logos:', error);
      toast.error('Erro ao fazer upload das logos');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (logoId: string, isActive: boolean) => {
    try {
      await toggleLogoActive(logoId, isActive);
      toast.success(isActive ? 'Logo ativada!' : 'Logo desativada!');
    } catch (error) {
      toast.error('Erro ao alterar status da logo');
    }
  };

  const handleDragStart = (logoId: string) => {
    setDraggedItem(logoId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetLogoId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetLogoId) {
      setDraggedItem(null);
      return;
    }

    try {
      const draggedLogo = logos.find(logo => logo.id === draggedItem);
      const targetLogo = logos.find(logo => logo.id === targetLogoId);
      
      if (!draggedLogo || !targetLogo) return;

      // Trocar as ordens
      const { data: response1 } = await supabase
        .from('logos')
        .update({ sort_order: targetLogo.sort_order })
        .eq('id', draggedItem);

      const { data: response2 } = await supabase
        .from('logos')
        .update({ sort_order: draggedLogo.sort_order })
        .eq('id', targetLogoId);

      toast.success('Ordem alterada com sucesso!');
      refreshLogos();
    } catch (error) {
      toast.error('Erro ao reordenar logos');
    } finally {
      setDraggedItem(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando logos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview do Ticker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview do Logo Ticker
          </CardTitle>
          <CardDescription>
            Visualização em tempo real de como as logos aparecerão na homepage
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-lg p-6">
          <LogoTicker speed={60} />
        </CardContent>
      </Card>

      {/* Upload de Logos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Logos
          </CardTitle>
          <CardDescription>
            Adicione múltiplas logos de uma vez. Apenas arquivos PNG com fundo transparente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".png"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mb-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              {uploading ? 'Enviando...' : 'Selecionar PNGs'}
            </Button>
            <p className="text-sm text-gray-600">
              Ou arraste os arquivos PNG aqui
            </p>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Apenas PNG • Fundo transparente • Máx. 512KB
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de Logos */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Logos ({logos.length})</CardTitle>
          <CardDescription>
            Arraste para reordenar, ative/desative ou remova logos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma logo cadastrada. Faça upload de algumas logos para começar.
            </div>
          ) : (
            <div className="space-y-2">
              {logos.map((logo) => (
                <div
                  key={logo.id}
                  draggable
                  onDragStart={() => handleDragStart(logo.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, logo.id)}
                  className={`
                    flex items-center gap-4 p-4 border rounded-lg cursor-move hover:bg-gray-50 transition-colors
                    ${draggedItem === logo.id ? 'opacity-50' : ''}
                    ${!logo.is_active ? 'bg-gray-100 opacity-60' : ''}
                  `}
                >
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  
                  <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={logo.file_url}
                      alt={logo.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{logo.name}</div>
                    <div className="text-xs text-gray-500">
                      Ordem: {logo.sort_order}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={logo.color_variant === 'white' ? 'secondary' : 'outline'}>
                      {logo.color_variant}
                    </Badge>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={logo.is_active}
                        onCheckedChange={(checked) => handleToggleActive(logo.id, checked)}
                      />
                      <Label className="text-sm">
                        {logo.is_active ? 'Ativa' : 'Inativa'}
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogosAdmin;