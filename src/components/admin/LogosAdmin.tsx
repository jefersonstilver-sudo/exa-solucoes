import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Upload, Eye, GripVertical, Plus, AlertCircle, Edit2, Check, X, ExternalLink, Image as ImageIcon, FileImage, Loader2, Link as LinkIcon, Palette, RotateCcw, Save, Minus } from 'lucide-react';
import { useLogosAdmin, Logo } from '@/hooks/useLogos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import LogoTicker from '@/components/exa/LogoTicker';
import LogoImage from '@/components/admin/LogoImage';
interface EditingLogo {
  id: string;
  name: string;
  link_url: string;
  color_variant: 'white' | 'dark' | 'colored';
}
const LogosAdmin: React.FC = () => {
  const {
    logos,
    loading,
    refreshLogos,
    toggleLogoActive,
    updateLogo,
    bulkUploadLogos
  } = useLogosAdmin();
  const [uploading, setUploading] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [editingLogo, setEditingLogo] = useState<EditingLogo | null>(null);
  const [deletingLogos, setDeletingLogos] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sanitizeFilename = (filename: string): string => {
    return filename.toLowerCase().replace(/[^a-z0-9._-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  };
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    const uploadPromises: Promise<void>[] = [];
    const logosToInsert: any[] = [];
    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const fileId = `${i}_${file.name}`;

        // Validações aprimoradas
        if (!file.type.includes('png')) {
          toast.error(`${file.name}: Apenas arquivos PNG são aceitos`);
          continue;
        }
        if (file.size > 1024 * 1024) {
          // 1MB
          toast.error(`${file.name}: Arquivo muito grande (máx. 1MB)`);
          continue;
        }

        // Sanitizar nome do arquivo
        const sanitizedName = sanitizeFilename(file.name);
        const fileName = `logo_${Date.now()}_${i}_${sanitizedName}`;
        const storageKey = `PAGINA PRINCIPAL LOGOS/${fileName}`;
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: 0
        }));
        const uploadPromise = (async () => {
          try {
            // Upload para Storage com progresso
            const {
              data: uploadData,
              error: uploadError
            } = await supabase.storage.from('arquivos').upload(storageKey, file, {
              cacheControl: '3600',
              upsert: false
            });
            if (uploadError) {
              console.error('❌ Upload error:', uploadError);
              toast.error(`Erro no upload: ${file.name}`);
              return;
            }
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: 100
            }));

            // Preparar dados da logo com informações de storage
            const logoName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
            const {
              data: {
                publicUrl
              }
            } = supabase.storage.from('arquivos').getPublicUrl(storageKey);
            logosToInsert.push({
              name: logoName,
              file_url: publicUrl,
              storage_bucket: 'arquivos',
              storage_key: storageKey,
              color_variant: 'white',
              link_url: null,
              is_active: true,
              sort_order: logos.length + i
            });
          } catch (error) {
            console.error('❌ Upload process error:', error);
            toast.error(`Erro no upload: ${file.name}`);
          }
        })();
        uploadPromises.push(uploadPromise);
      }

      // Aguardar todos os uploads
      await Promise.allSettled(uploadPromises);
      if (logosToInsert.length === 0) {
        toast.error('Nenhum arquivo foi uploadado com sucesso');
        return;
      }

      // Inserir logos no banco
      await bulkUploadLogos(logosToInsert);
      toast.success(`${logosToInsert.length} logo(s) adicionada(s) com sucesso!`);

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('❌ Error uploading logos:', error);
      toast.error('Erro ao fazer upload das logos');
    } finally {
      setUploading(false);
      setUploadProgress({});
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
  const handleStartEdit = (logo: Logo) => {
    setEditingLogo({
      id: logo.id,
      name: logo.name,
      link_url: logo.link_url || '',
      color_variant: logo.color_variant
    });
  };
  const handleSaveEdit = async () => {
    if (!editingLogo) return;
    try {
      await updateLogo(editingLogo.id, {
        name: editingLogo.name,
        link_url: editingLogo.link_url || null,
        color_variant: editingLogo.color_variant
      });
      toast.success('Logo atualizada com sucesso!');
      setEditingLogo(null);
    } catch (error) {
      toast.error('Erro ao atualizar logo');
    }
  };
  const handleCancelEdit = () => {
    setEditingLogo(null);
  };
  const handleDeleteLogo = async (logoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta logo?')) return;
    setDeletingLogos(prev => new Set([...prev, logoId]));
    try {
      const logo = logos.find(l => l.id === logoId);

      // Deletar do Storage se tiver informações de storage
      if (logo?.storage_bucket && logo?.storage_key) {
        await supabase.storage.from(logo.storage_bucket).remove([logo.storage_key]);
      }

      // Deletar do banco
      const {
        error
      } = await supabase.from('logos').delete().eq('id', logoId);
      if (error) throw error;
      toast.success('Logo excluída com sucesso!');
      refreshLogos();
    } catch (error) {
      console.error('❌ Error deleting logo:', error);
      toast.error('Erro ao excluir logo');
    } finally {
      setDeletingLogos(prev => {
        const newSet = new Set(prev);
        newSet.delete(logoId);
        return newSet;
      });
    }
  };

  const handleScaleUp = async (logoId: string) => {
    const logo = logos.find(l => l.id === logoId);
    if (!logo) return;
    
    const currentScale = logo.scale_factor || 1;
    const newScale = Math.min(currentScale + 0.3, 3.0);
    
    try {
      await updateLogo(logoId, { scale_factor: newScale });
      toast.success(`Tamanho aumentado para ${Math.round(newScale * 100)}%`);
    } catch (error) {
      toast.error('Erro ao alterar tamanho da logo');
    }
  };

  const handleScaleDown = async (logoId: string) => {
    const logo = logos.find(l => l.id === logoId);
    if (!logo) return;
    
    const currentScale = logo.scale_factor || 1;
    const newScale = Math.max(currentScale - 0.3, 0.5);
    
    try {
      await updateLogo(logoId, { scale_factor: newScale });
      toast.success(`Tamanho reduzido para ${Math.round(newScale * 100)}%`);
    } catch (error) {
      toast.error('Erro ao alterar tamanho da logo');
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

      // Atualizar sort_order de ambas as logos
      await Promise.all([updateLogo(draggedItem, {
        sort_order: targetLogo.sort_order
      }), updateLogo(targetLogoId, {
        sort_order: draggedLogo.sort_order
      })]);
      toast.success('Ordem alterada com sucesso!');
    } catch (error) {
      toast.error('Erro ao reordenar logos');
    } finally {
      setDraggedItem(null);
    }
  };

  // Drag and drop para arquivos
  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  }, []);
  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(false);
    }
  }, []);
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.includes('png'));
    if (files.length > 0) {
      handleFileUpload(files);
    } else {
      toast.error('Apenas arquivos PNG são aceitos');
    }
  }, []);
  if (loading) {
    return <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto mb-4" />
            <p>Carregando logos...</p>
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
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
          <div className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${isDraggingFile ? 'border-primary bg-primary/10 scale-105' : 'border-muted hover:border-muted-foreground/50 hover:bg-muted/50'}
            `} onDragOver={handleFileDragOver} onDragLeave={handleFileDragLeave} onDrop={handleFileDrop}>
            <input ref={fileInputRef} type="file" multiple accept=".png" onChange={e => handleFileUpload(e.target.files || [])} className="hidden" disabled={uploading} />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <FileImage className="h-8 w-8 text-muted-foreground" />}
              </div>
              
              <div>
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} size="lg" className="mb-2">
                  <Plus className="h-4 w-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Selecionar PNGs'}
                </Button>
                
                <p className="text-sm text-muted-foreground">
                  Ou arraste os arquivos PNG aqui
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Apenas PNG
                </div>
                <div className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  Fundo transparente
                </div>
                <div className="flex items-center gap-1">
                  <FileImage className="h-3 w-3" />
                  Máx. 1MB por arquivo
                </div>
              </div>
            </div>

            {/* Progress indicators */}
            {Object.keys(uploadProgress).length > 0 && <div className="mt-4 space-y-2">
                {Object.entries(uploadProgress).map(([fileId, progress]) => <div key={fileId} className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{
                width: `${progress}%`
              }} />
                  </div>)}
              </div>}
          </div>
        </CardContent>
      </Card>

      {/* Gerenciamento de Logos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5" />
              Gerenciar Logos ({logos.length})
            </div>
            <Badge variant="secondary">
              {logos.filter(l => l.is_active).length} ativas
            </Badge>
          </CardTitle>
          
        </CardHeader>
        <CardContent>
          {logos.length === 0 ? <div className="text-center py-12">
              <FileImage className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma logo cadastrada
              </h3>
              <p className="text-sm text-muted-foreground">
                Faça upload de algumas logos PNG para começar.
              </p>
            </div> : <div className="space-y-3">
              {logos.sort((a, b) => a.sort_order - b.sort_order).map(logo => <div key={logo.id} className={`
                    group relative border rounded-lg transition-all duration-200 hover:shadow-md
                    ${draggedItem === logo.id ? 'opacity-50 scale-95' : ''}
                    ${!logo.is_active ? 'bg-muted/50 opacity-60' : 'bg-background'}
                  `}>
                  {editingLogo?.id === logo.id ?
            // Modo de Edição
            <div className="p-4 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 flex-shrink-0 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                          <img src={logo.file_url} alt={logo.name} className="h-full w-full object-contain" />
                        </div>

                        <div className="flex-1 space-y-3">
                          <div>
                            <Label htmlFor="edit-name" className="text-sm font-medium">Nome</Label>
                            <Input id="edit-name" value={editingLogo.name} onChange={e => setEditingLogo(prev => prev ? {
                      ...prev,
                      name: e.target.value
                    } : null)} className="mt-1" />
                          </div>

                          

                          
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button size="sm" onClick={handleSaveEdit} className="w-full">
                            <Check className="h-4 w-4 mr-2" />
                            Salvar
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit} className="w-full">
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div> :
            // Modo de Visualização
            <div draggable onDragStart={() => handleDragStart(logo.id)} onDragOver={handleDragOver} onDrop={e => handleDrop(e, logo.id)} className="flex items-center gap-4 p-4 cursor-move hover:bg-muted/50 transition-colors">
                      <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      
                      <LogoImage 
                        logo={{ 
                          ...logo,
                          scale_factor: logo.scale_factor 
                        }}
                        size="md" 
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{logo.name}</h4>
                          {logo.link_url && <a href={logo.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors" onClick={e => e.stopPropagation()}>
                              <ExternalLink className="h-3 w-3" />
                            </a>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Ordem: {logo.sort_order}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round((logo.scale_factor || 1) * 100)}%
                          </Badge>
                          <Badge variant={logo.color_variant === 'white' ? 'secondary' : 'outline'} className="text-xs">
                            <Palette className="h-3 w-3 mr-1" />
                            {logo.color_variant}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScaleDown(logo.id);
                          }}
                          disabled={((logo.scale_factor || 1) <= 0.5)}
                          className="h-8 w-8 p-0"
                          title="Diminuir tamanho"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScaleUp(logo.id);
                          }}
                          disabled={((logo.scale_factor || 1) >= 3.0)}
                          className="h-8 w-8 p-0"
                          title="Aumentar tamanho"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={e => {
                  e.stopPropagation();
                  handleStartEdit(logo);
                }} className="h-8 w-8 p-0">
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button size="sm" variant="ghost" onClick={e => {
                  e.stopPropagation();
                  handleDeleteLogo(logo.id);
                }} disabled={deletingLogos.has(logo.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                          {deletingLogos.has(logo.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2 pl-2 border-l">
                        <Switch checked={logo.is_active} onCheckedChange={checked => handleToggleActive(logo.id, checked)} />
                        <Label className="text-sm cursor-pointer">
                          {logo.is_active ? 'Ativa' : 'Inativa'}
                        </Label>
                      </div>
                    </div>}
                </div>)}
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default LogosAdmin;