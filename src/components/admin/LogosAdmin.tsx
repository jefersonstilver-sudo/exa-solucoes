
import React, { useState } from 'react';
import { useLogosAdmin } from '@/hooks/useLogos';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, Eye, EyeOff, GripVertical, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const LogosAdmin = () => {
  const { logos, loading, error, refreshLogos, updateLogo, toggleLogoActive, bulkUploadLogos } = useLogosAdmin();
  const [uploading, setUploading] = useState(false);
  const [normalizing, setNormalizing] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Upload de arquivo
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedLogos = [];

    try {
      for (const file of Array.from(files)) {
        // Validação
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} não é uma imagem válida`);
          continue;
        }

        if (file.size > 1024 * 1024) { // 1MB
          toast.error(`${file.name} é muito grande (máximo 1MB)`);
          continue;
        }

        // Upload para storage
        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
        const filePath = `PAGINA PRINCIPAL LOGOS/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('arquivos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Erro no upload:', uploadError);
          toast.error(`Erro ao fazer upload de ${file.name}`);
          continue;
        }

        // Criar URL pública
        const { data: publicData } = supabase.storage
          .from('arquivos')
          .getPublicUrl(filePath);

        uploadedLogos.push({
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extensão
          file_url: publicData.publicUrl,
          storage_bucket: 'arquivos',
          storage_key: filePath,
          color_variant: 'white' as const,
          sort_order: logos.length + uploadedLogos.length,
          is_active: true
        });
      }

      if (uploadedLogos.length > 0) {
        await bulkUploadLogos(uploadedLogos);
        toast.success(`${uploadedLogos.length} logo(s) enviada(s) com sucesso!`);
      }
    } catch (err) {
      console.error('Erro no processamento:', err);
      toast.error('Erro ao processar uploads');
    } finally {
      setUploading(false);
    }
  };

  // Deletar logo
  const handleDelete = async (logoId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta logo?')) return;

    try {
      const logo = logos.find(l => l.id === logoId);
      
      // Deletar do Storage se tiver informações de storage
      if (logo?.storage_bucket && logo?.storage_key) {
        await supabase.storage
          .from(logo.storage_bucket)
          .remove([logo.storage_key]);
      }

      // Deletar do banco
      const { error } = await supabase
        .from('logos')
        .delete()
        .eq('id', logoId);

      if (error) throw error;

      toast.success('Logo deletada com sucesso!');
      refreshLogos();
    } catch (err) {
      console.error('Erro ao deletar:', err);
      toast.error('Erro ao deletar logo');
    }
  };

  // Edição inline
  const handleInlineEdit = async (logoId: string, field: string, value: any) => {
    try {
      await updateLogo(logoId, { [field]: value });
      toast.success('Logo atualizada!');
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      toast.error('Erro ao atualizar logo');
    }
  };

  // Drag and Drop para reordenar
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
      const draggedLogo = logos.find(l => l.id === draggedItem);
      const targetLogo = logos.find(l => l.id === targetLogoId);
      
      if (!draggedLogo || !targetLogo) return;

      // Trocar sort_order
      await updateLogo(draggedItem, { sort_order: targetLogo.sort_order });
      await updateLogo(targetLogoId, { sort_order: draggedLogo.sort_order });
      
      toast.success('Ordem atualizada!');
    } catch (err) {
      console.error('Erro ao reordenar:', err);
      toast.error('Erro ao reordenar logos');
    } finally {
      setDraggedItem(null);
    }
  };

  // Normalizar URLs das logos
  const handleNormalizeLogos = async () => {
    setNormalizing(true);
    try {
      let normalizedCount = 0;
      
      for (const logo of logos) {
        // Skip logos that already have proper storage info
        if (logo.storage_bucket && logo.storage_key) continue;
        
        // Only normalize signed URLs (with token=)
        if (!logo.file_url?.includes('token=')) continue;
        
        try {
          // Extract path from signed URL
          const url = new URL(logo.file_url);
          const pathMatch = url.pathname.match(/\/storage\/v1\/object\/[^/]+\/([^/]+)\/(.+)$/);
          
          if (pathMatch) {
            const [, bucket, key] = pathMatch;
            const decodedKey = decodeURIComponent(key);
            
            console.log(`Normalizing logo "${logo.name}": ${bucket}/${decodedKey}`);
            
            // Update logo with storage info and clear old URL
            await updateLogo(logo.id, {
              storage_bucket: bucket,
              storage_key: decodedKey,
              file_url: '' // Clear the old signed URL
            });
            
            normalizedCount++;
          }
        } catch (err) {
          console.error(`Error normalizing logo "${logo.name}":`, err);
        }
      }
      
      if (normalizedCount > 0) {
        toast.success(`${normalizedCount} logo(s) normalizadas com sucesso!`);
        refreshLogos();
      } else {
        toast.info('Nenhuma logo precisava ser normalizada.');
      }
    } catch (err) {
      console.error('Error in normalization:', err);
      toast.error('Erro ao normalizar logos');
    } finally {
      setNormalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Carregando logos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertCircle className="h-6 w-6 mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Logos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-600 mb-2">
                Clique para selecionar logos
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, SVG até 1MB cada
              </p>
            </div>
            
            <input
              id="logo-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={uploading}
            />
            
            {uploading && (
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Fazendo upload...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diagnóstico e Normalização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Diagnóstico do Sistema
            </span>
            <Button 
              onClick={handleNormalizeLogos}
              variant="outline" 
              size="sm"
              disabled={normalizing}
            >
              {normalizing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Normalizar URLs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="font-medium text-green-800">Total de Logos</div>
              <div className="text-2xl font-bold text-green-600">{logos.length}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="font-medium text-blue-800">Logos Ativas</div>
              <div className="text-2xl font-bold text-blue-600">
                {logos.filter(l => l.is_active).length}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="font-medium text-purple-800">Com Storage Info</div>
              <div className="text-2xl font-bold text-purple-600">
                {logos.filter(l => l.storage_bucket && l.storage_key).length}
              </div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="font-medium text-orange-800">URLs Antigas</div>
              <div className="text-2xl font-bold text-orange-600">
                {logos.filter(l => !l.storage_bucket && l.file_url?.includes('token=')).length}
              </div>
            </div>
          </div>
          
          {logos.filter(l => !l.storage_bucket && l.file_url?.includes('token=')).length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-yellow-800 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">
                  {logos.filter(l => !l.storage_bucket && l.file_url?.includes('token=')).length} logo(s) 
                  usando URLs antigas que podem expirar. Use "Normalizar URLs" para corrigir.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Logos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Logos Cadastradas ({logos.length})</span>
            <Button onClick={refreshLogos} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                  draggedItem === logo.id ? 'opacity-50' : 'hover:shadow-md'
                }`}
                draggable
                onDragStart={() => handleDragStart(logo.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, logo.id)}
              >
                {/* Drag Handle */}
                <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />

                {/* Preview da Logo */}
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={logo.file_url}
                    alt={logo.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-logo.png';
                    }}
                  />
                </div>

                {/* Informações */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Input
                      value={logo.name}
                      onChange={(e) => handleInlineEdit(logo.id, 'name', e.target.value)}
                      className="font-medium text-sm"
                      placeholder="Nome da logo"
                    />
                    <Badge 
                      variant={logo.color_variant === 'white' ? 'default' : 
                               logo.color_variant === 'dark' ? 'secondary' : 'outline'}
                    >
                      {logo.color_variant}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Ordem: {logo.sort_order}</span>
                    {logo.storage_bucket && (
                      <Badge variant="outline" className="text-xs">
                        {logo.storage_bucket}/{logo.storage_key?.split('/').pop()}
                      </Badge>
                    )}
                  </div>

                  {/* Link URL */}
                  <Input
                    value={logo.link_url || ''}
                    onChange={(e) => handleInlineEdit(logo.id, 'link_url', e.target.value || null)}
                    placeholder="URL de destino (opcional)"
                    className="mt-2 text-xs"
                  />
                </div>

                {/* Controles */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={logo.is_active}
                      onCheckedChange={(checked) => toggleLogoActive(logo.id, checked)}
                      id={`active-${logo.id}`}
                    />
                    <Label htmlFor={`active-${logo.id}`} className="text-sm">
                      {logo.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Label>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(logo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {logos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                Nenhuma logo cadastrada ainda.
                <br />
                Faça upload da primeira logo acima.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogosAdmin;
