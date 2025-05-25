import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Building2, Camera, Upload, Star, Image as ImageIcon, UserCircle, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BuildingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
  onSuccess: () => void;
}

const CARACTERISTICAS_OPTIONS = [
  'Piscina',
  'Academia',
  'Churrasqueira',
  'Playground',
  'Salão de festas',
  'Quadra poliesportiva',
  'Espaço gourmet',
  'Brinquedoteca',
  'Sala de jogos',
  'Espaço pet',
  'Coworking',
  'Cinema',
  'Spa / Sauna',
  'Área verde / jardim',
  'Deck com espreguiçadeiras'
];

const BuildingFormDialog: React.FC<BuildingFormDialogProps> = ({
  open,
  onOpenChange,
  building,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    bairro: '',
    numero_unidades: 0,
    preco_base: 0,
    padrao_publico: 'normal' as 'alto' | 'medio' | 'normal',
    status: 'ativo',
    venue_type: 'Residencial',
    location_type: 'residential',
    latitude: 0,
    longitude: 0,
    caracteristicas: [] as string[],
    monthly_traffic: 0,
    // Novos campos de contato
    nome_sindico: '',
    contato_sindico: '',
    nome_vice_sindico: '',
    contato_vice_sindico: '',
    nome_contato_predio: '',
    numero_contato_predio: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Construir array de imagens usando os campos individuais
  const imageSlots = Array.from({ length: 4 }, (_, index) => {
    let imageUrl = null;
    
    if (building) {
      if (index === 0 && building.imagem_principal) {
        imageUrl = building.imagem_principal;
      } else if (index === 1 && building.imagem_2) {
        imageUrl = building.imagem_2;
      } else if (index === 2 && building.imagem_3) {
        imageUrl = building.imagem_3;
      } else if (index === 3 && building.imagem_4) {
        imageUrl = building.imagem_4;
      } else if (building.image_urls && building.image_urls[index]) {
        imageUrl = building.image_urls[index];
      }
    }
    
    return {
      index,
      imageUrl: imageUrl ? getImageUrl(imageUrl) : null
    };
  });

  function getImageUrl(path: string) {
    if (path.startsWith('http')) return path;
    return `${supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl}`;
  }

  useEffect(() => {
    if (building) {
      setFormData({
        nome: building.nome || '',
        endereco: building.endereco || '',
        bairro: building.bairro || '',
        numero_unidades: building.numero_unidades || 0,
        preco_base: building.preco_base || 0,
        padrao_publico: building.padrao_publico || 'normal',
        status: building.status || 'ativo',
        venue_type: building.venue_type || 'Residencial',
        location_type: building.location_type || 'residential',
        latitude: building.latitude || 0,
        longitude: building.longitude || 0,
        caracteristicas: building.caracteristicas || building.amenities || [],
        monthly_traffic: building.monthly_traffic || 0,
        // Novos campos de contato
        nome_sindico: building.nome_sindico || '',
        contato_sindico: building.contato_sindico || '',
        nome_vice_sindico: building.nome_vice_sindico || '',
        contato_vice_sindico: building.contato_vice_sindico || '',
        nome_contato_predio: building.nome_contato_predio || '',
        numero_contato_predio: building.numero_contato_predio || ''
      });
    } else {
      setFormData({
        nome: '',
        endereco: '',
        bairro: '',
        numero_unidades: 0,
        preco_base: 0,
        padrao_publico: 'normal',
        status: 'ativo',
        venue_type: 'Residencial',
        location_type: 'residential',
        latitude: 0,
        longitude: 0,
        caracteristicas: [],
        monthly_traffic: 0,
        // Novos campos de contato
        nome_sindico: '',
        contato_sindico: '',
        nome_vice_sindico: '',
        contato_vice_sindico: '',
        nome_contato_predio: '',
        numero_contato_predio: ''
      });
    }
  }, [building, open]);

  const handleAddCaracteristica = (caracteristica: string) => {
    if (!formData.caracteristicas.includes(caracteristica)) {
      setFormData(prev => ({
        ...prev,
        caracteristicas: [...prev.caracteristicas, caracteristica]
      }));
    }
  };

  const handleRemoveCaracteristica = (caracteristica: string) => {
    setFormData(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas.filter(a => a !== caracteristica)
    }));
  };

  const handleImageUpload = async (index: number, file: File) => {
    if (!building && !formData.nome) {
      toast.error('Salve o prédio primeiro antes de fazer upload de imagens');
      return;
    }

    setUploadingIndex(index);

    try {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const buildingId = building?.id || 'temp';
      const fileName = `${buildingId}-${index + 1}-${Date.now()}.${fileExt}`;
      const filePath = `predios/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('building-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Se temos um building existente, atualizar no banco
      if (building) {
        const updateData: any = {};
        const currentImageUrls = building.image_urls || [];
        const newImageUrls = [...currentImageUrls];
        
        if (index === 0) {
          updateData.imagem_principal = filePath;
        } else if (index === 1) {
          updateData.imagem_2 = filePath;
        } else if (index === 2) {
          updateData.imagem_3 = filePath;
        } else if (index === 3) {
          updateData.imagem_4 = filePath;
        }
        
        newImageUrls[index] = filePath;
        updateData.image_urls = newImageUrls;

        const { error: updateError } = await supabase
          .from('buildings')
          .update(updateData)
          .eq('id', building.id);

        if (updateError) throw updateError;

        await supabase.rpc('log_building_action', {
          p_building_id: building.id,
          p_action_type: 'image_upload',
          p_description: `Imagem ${index + 1} ${index === 0 ? '(principal)' : ''} adicionada/atualizada`,
          p_new_values: { image_slot: index + 1, file_path: filePath }
        });
      }

      toast.success(`Imagem ${index + 1} enviada com sucesso!`);
      onSuccess();

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(error.message || 'Erro ao enviar imagem');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!building) return;

    try {
      const updateData: any = {};
      const currentImageUrls = building.image_urls || [];
      const newImageUrls = [...currentImageUrls];
      
      let imagePath = null;
      if (index === 0 && building.imagem_principal) {
        imagePath = building.imagem_principal;
        updateData.imagem_principal = null;
      } else if (index === 1 && building.imagem_2) {
        imagePath = building.imagem_2;
        updateData.imagem_2 = null;
      } else if (index === 2 && building.imagem_3) {
        imagePath = building.imagem_3;
        updateData.imagem_3 = null;
      } else if (index === 3 && building.imagem_4) {
        imagePath = building.imagem_4;
        updateData.imagem_4 = null;
      } else if (newImageUrls[index]) {
        imagePath = newImageUrls[index];
      }
      
      if (imagePath && !imagePath.startsWith('http')) {
        await supabase.storage
          .from('building-images')
          .remove([imagePath]);
      }

      newImageUrls[index] = null;
      updateData.image_urls = newImageUrls;

      const { error } = await supabase
        .from('buildings')
        .update(updateData)
        .eq('id', building.id);

      if (error) throw error;

      await supabase.rpc('log_building_action', {
        p_building_id: building.id,
        p_action_type: 'image_remove',
        p_description: `Imagem ${index + 1} ${index === 0 ? '(principal)' : ''} removida`,
        p_new_values: { image_slot: index + 1 }
      });

      toast.success(`Imagem ${index + 1} removida com sucesso!`);
      onSuccess();

    } catch (error: any) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        amenities: formData.caracteristicas,
      };

      if (building) {
        const { error } = await supabase
          .from('buildings')
          .update(dataToSave)
          .eq('id', building.id);

        if (error) throw error;

        await supabase.rpc('log_building_action', {
          p_building_id: building.id,
          p_action_type: 'update',
          p_description: `Prédio "${formData.nome}" atualizado - Tipo: ${formData.venue_type}`,
          p_new_values: dataToSave
        });

        toast.success('Prédio atualizado com sucesso!');
      } else {
        const { data, error } = await supabase
          .from('buildings')
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;

        await supabase.rpc('log_building_action', {
          p_building_id: data.id,
          p_action_type: 'create',
          p_description: `Novo prédio "${formData.nome}" criado - Tipo: ${formData.venue_type}`,
          p_new_values: dataToSave
        });

        toast.success('Prédio criado com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar prédio:', error);
      toast.error(error.message || 'Erro ao salvar prédio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {building ? 'Editar Prédio' : 'Novo Prédio'}
          </DialogTitle>
          <DialogDescription>
            {building ? 'Edite as informações do prédio' : 'Cadastre um novo prédio'} - Todos os campos são opcionais
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna 1: Dados Básicos e Comerciais */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Dados Básicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Prédio</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Residencial Solar do Jardim (opcional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço Completo</Label>
                    <Textarea
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                      placeholder="Rua, número, complemento... (opcional)"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        value={formData.bairro}
                        onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                        placeholder="Bairro (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="venue_type">Tipo de Prédio</Label>
                      <Select
                        value={formData.venue_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, venue_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Residencial">Residencial</SelectItem>
                          <SelectItem value="Comercial">Comercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="padrao_publico">Categoria</Label>
                    <Select
                      value={formData.padrao_publico}
                      onValueChange={(value: 'alto' | 'medio' | 'normal') => 
                        setFormData(prev => ({ ...prev, padrao_publico: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="medio">Intermediário</SelectItem>
                        <SelectItem value="alto">Alto Padrão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                        placeholder="Coordenada (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                        placeholder="Coordenada (opcional)"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCircle className="h-5 w-5 mr-2" />
                    Contatos do Prédio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome_sindico">Nome do Síndico</Label>
                      <Input
                        id="nome_sindico"
                        value={formData.nome_sindico}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome_sindico: e.target.value }))}
                        placeholder="Nome completo (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contato_sindico">Contato do Síndico</Label>
                      <Input
                        id="contato_sindico"
                        value={formData.contato_sindico}
                        onChange={(e) => setFormData(prev => ({ ...prev, contato_sindico: e.target.value }))}
                        placeholder="Telefone/Email (opcional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome_vice_sindico">Nome do Vice-Síndico</Label>
                      <Input
                        id="nome_vice_sindico"
                        value={formData.nome_vice_sindico}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome_vice_sindico: e.target.value }))}
                        placeholder="Nome completo (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contato_vice_sindico">Contato do Vice-Síndico</Label>
                      <Input
                        id="contato_vice_sindico"
                        value={formData.contato_vice_sindico}
                        onChange={(e) => setFormData(prev => ({ ...prev, contato_vice_sindico: e.target.value }))}
                        placeholder="Telefone/Email (opcional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome_contato_predio">Contato do Prédio</Label>
                      <Input
                        id="nome_contato_predio"
                        value={formData.nome_contato_predio}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome_contato_predio: e.target.value }))}
                        placeholder="Portaria/Administração (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero_contato_predio">Número do Prédio</Label>
                      <Input
                        id="numero_contato_predio"
                        value={formData.numero_contato_predio}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_contato_predio: e.target.value }))}
                        placeholder="Telefone principal (opcional)"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dados Comerciais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numero_unidades">Número de Unidades</Label>
                      <Input
                        id="numero_unidades"
                        type="number"
                        value={formData.numero_unidades}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_unidades: parseInt(e.target.value) || 0 }))}
                        min="0"
                        placeholder="Ex: 120 (opcional)"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preco_base">Preço Base (R$)</Label>
                      <Input
                        id="preco_base"
                        type="number"
                        step="0.01"
                        value={formData.preco_base}
                        onChange={(e) => setFormData(prev => ({ ...prev, preco_base: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        placeholder="Ex: 1500.00 (opcional)"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_traffic">Tráfego Mensal</Label>
                    <Input
                      id="monthly_traffic"
                      type="number"
                      value={formData.monthly_traffic}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthly_traffic: parseInt(e.target.value) || 0 }))}
                      min="0"
                      placeholder="Visitantes por mês (opcional)"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coluna 2: Características e Galeria */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Características de Lazer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {CARACTERISTICAS_OPTIONS.map((caracteristica) => (
                      <Button
                        key={caracteristica}
                        type="button"
                        variant={formData.caracteristicas.includes(caracteristica) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (formData.caracteristicas.includes(caracteristica)) {
                            handleRemoveCaracteristica(caracteristica);
                          } else {
                            handleAddCaracteristica(caracteristica);
                          }
                        }}
                        className="justify-start text-xs h-8 px-2"
                      >
                        {caracteristica}
                      </Button>
                    ))}
                  </div>
                  
                  {formData.caracteristicas.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.caracteristicas.map((caracteristica) => (
                        <Badge key={caracteristica} variant="secondary" className="text-xs">
                          {caracteristica}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Camera className="h-5 w-5 mr-2" />
                    Galeria de Fotos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {imageSlots.map(({ index, imageUrl }) => (
                      <div key={index} className={`relative border-2 border-dashed rounded-lg p-2 ${index === 0 ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}>
                        <div className="text-center mb-2">
                          <div className="text-xs font-medium flex items-center justify-center">
                            {index === 0 && <Star className="h-3 w-3 mr-1 text-yellow-500" />}
                            Foto {index + 1}
                            {index === 0 && <span className="text-yellow-600 ml-1">(Principal)</span>}
                          </div>
                        </div>

                        <div className="aspect-video bg-gray-100 rounded relative overflow-hidden">
                          {imageUrl ? (
                            <>
                              <img
                                src={imageUrl}
                                alt={`Foto ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => fileInputRefs.current[index]?.click()}
                                    disabled={uploadingIndex === index}
                                    className="h-8 px-2"
                                  >
                                    <Upload className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemoveImage(index)}
                                    disabled={uploadingIndex === index}
                                    className="h-8 px-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <ImageIcon className="h-8 w-8 mb-1" />
                              <p className="text-xs">Sem foto</p>
                            </div>
                          )}

                          {uploadingIndex === index && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="text-white text-xs">Enviando...</div>
                            </div>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 h-7 text-xs"
                          onClick={() => fileInputRefs.current[index]?.click()}
                          disabled={uploadingIndex === index}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          {imageUrl ? 'Trocar' : 'Adicionar'}
                        </Button>

                        <input
                          ref={(el) => {
                            fileInputRefs.current[index] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(index, file);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <p>• Primeira foto ⭐ é principal na loja online</p>
                    <p>• Máximo 5MB por imagem • Formatos: JPG, PNG, WebP</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-indexa-purple hover:bg-indexa-purple-dark">
              {loading ? 'Salvando...' : (building ? 'Atualizar Prédio' : 'Criar Prédio')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BuildingFormDialog;
