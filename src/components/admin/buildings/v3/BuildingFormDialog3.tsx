import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Building2, UserCircle, DollarSign, Camera, Trash2, MapPin, 
  Phone, Monitor, Users, Layers
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import ImageGallery3, { LocalImage } from './ImageGallery3';
import CharacteristicsSelector from '../form/CharacteristicsSelector';
import { useBuildingDelete } from '@/hooks/useBuildingDelete';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface BuildingFormDialog3Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
  onSuccess: () => void;
}

interface FormData {
  nome: string;
  endereco: string;
  bairro: string;
  venue_type: string;
  padrao_publico: string;
  latitude: number;
  longitude: number;
  numero_unidades: number | '';
  numero_andares: number | '';
  numero_elevadores: number | '';
  numero_blocos: number | '';
  publico_estimado: number | '';
  preco_base: number | '';
  preco_trimestral: number | '';
  preco_semestral: number | '';
  preco_anual: number | '';
  status: string;
  nome_sindico: string;
  contato_sindico: string;
  nome_vice_sindico: string;
  contato_vice_sindico: string;
  nome_contato_predio: string;
  numero_contato_predio: string;
  caracteristicas: string[];
}

const initialFormData: FormData = {
  nome: '',
  endereco: '',
  bairro: '',
  venue_type: 'Residencial',
  padrao_publico: 'normal',
  latitude: 0,
  longitude: 0,
  numero_unidades: '',
  numero_andares: '',
  numero_elevadores: '',
  numero_blocos: '',
  publico_estimado: '',
  preco_base: '',
  preco_trimestral: '',
  preco_semestral: '',
  preco_anual: '',
  status: 'ativo',
  nome_sindico: '',
  contato_sindico: '',
  nome_vice_sindico: '',
  contato_vice_sindico: '',
  nome_contato_predio: '',
  numero_contato_predio: '',
  caracteristicas: [],
};

const BuildingFormDialog3: React.FC<BuildingFormDialog3Props> = ({
  open,
  onOpenChange,
  building,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basico');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { permissions } = useUserPermissions();
  const { deleteBuilding, loading: deleting } = useBuildingDelete();

  // Initialize form data when building changes
  useEffect(() => {
    if (open) {
      if (building) {
        setFormData({
          nome: building.nome || '',
          endereco: building.endereco || '',
          bairro: building.bairro || '',
          venue_type: building.venue_type || 'Residencial',
          padrao_publico: building.padrao_publico || 'normal',
          latitude: building.latitude || 0,
          longitude: building.longitude || 0,
          numero_unidades: building.numero_unidades || '',
          numero_andares: building.numero_andares || '',
          numero_elevadores: building.numero_elevadores || '',
          numero_blocos: building.numero_blocos || '',
          publico_estimado: building.publico_estimado || '',
          preco_base: building.preco_base || '',
          preco_trimestral: building.preco_trimestral || '',
          preco_semestral: building.preco_semestral || '',
          preco_anual: building.preco_anual || '',
          status: building.status || 'ativo',
          nome_sindico: building.nome_sindico || '',
          contato_sindico: building.contato_sindico || '',
          nome_vice_sindico: building.nome_vice_sindico || '',
          contato_vice_sindico: building.contato_vice_sindico || '',
          nome_contato_predio: building.nome_contato_predio || '',
          numero_contato_predio: building.numero_contato_predio || '',
          caracteristicas: building.caracteristicas || building.amenities || [],
        });

        // Load existing images
        const existingImages: LocalImage[] = [];
        const imageFields = ['imagem_principal', 'imagem_2', 'imagem_3', 'imagem_4'];
        imageFields.forEach((field, index) => {
          if (building[field]) {
            const path = building[field];
            const url = path.startsWith('http') 
              ? path 
              : supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl;
            existingImages.push({
              id: `existing-${index}`,
              url,
              isNew: false,
              originalPath: path,
            });
          }
        });
        setImages(existingImages);
      } else {
        setFormData(initialFormData);
        setImages([]);
      }
      setActiveTab('basico');
    }
  }, [building, open]);

  const handleClose = () => {
    // Clean up blob URLs
    images.forEach(img => {
      if (img.isNew && img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    });
    onOpenChange(false);
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCharacteristicToggle = (caracteristica: string) => {
    setFormData(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas.includes(caracteristica)
        ? prev.caracteristicas.filter(c => c !== caracteristica)
        : [...prev.caracteristicas, caracteristica]
    }));
  };

  const handleUnidadesChange = (value: number | '') => {
    const numValue = value === '' ? '' : Number(value);
    const publicoCalculado = numValue === '' ? '' : Math.round(Number(numValue) * 3.5);
    setFormData(prev => ({
      ...prev,
      numero_unidades: numValue,
      publico_estimado: publicoCalculado
    }));
  };

  const uploadImages = async (buildingId: string) => {
    const newImages = images.filter(img => img.isNew && img.file);
    const uploadedPaths: { index: number; path: string }[] = [];

    for (let i = 0; i < newImages.length; i++) {
      const img = newImages[i];
      if (!img.file) continue;

      const fileExt = img.file.name.split('.').pop();
      const fileName = `${buildingId}-${i + 1}-${Date.now()}.${fileExt}`;
      const filePath = `predios/${fileName}`;

      const { error } = await supabase.storage
        .from('building-images')
        .upload(filePath, img.file, { upsert: true });

      if (error) {
        console.error('Error uploading image:', error);
        continue;
      }

      uploadedPaths.push({ 
        index: images.findIndex(m => m.id === img.id), 
        path: filePath 
      });
    }

    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert empty strings to null for numeric fields
      const payload = {
        nome: formData.nome,
        endereco: formData.endereco,
        bairro: formData.bairro,
        venue_type: formData.venue_type,
        padrao_publico: formData.padrao_publico,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        numero_unidades: formData.numero_unidades === '' ? null : Number(formData.numero_unidades),
        numero_andares: formData.numero_andares === '' ? null : Number(formData.numero_andares),
        numero_elevadores: formData.numero_elevadores === '' ? null : Number(formData.numero_elevadores),
        numero_blocos: formData.numero_blocos === '' ? null : Number(formData.numero_blocos),
        publico_estimado: formData.publico_estimado === '' ? null : Number(formData.publico_estimado),
        preco_base: formData.preco_base === '' ? null : Number(formData.preco_base),
        preco_trimestral: formData.preco_trimestral === '' ? null : Number(formData.preco_trimestral),
        preco_semestral: formData.preco_semestral === '' ? null : Number(formData.preco_semestral),
        preco_anual: formData.preco_anual === '' ? null : Number(formData.preco_anual),
        status: formData.status,
        nome_sindico: formData.nome_sindico || null,
        contato_sindico: formData.contato_sindico || null,
        nome_vice_sindico: formData.nome_vice_sindico || null,
        contato_vice_sindico: formData.contato_vice_sindico || null,
        nome_contato_predio: formData.nome_contato_predio || null,
        numero_contato_predio: formData.numero_contato_predio || null,
        amenities: formData.caracteristicas,
      };

      let buildingId = building?.id;

      if (building) {
        // Update existing building
        const { error } = await supabase
          .from('buildings')
          .update(payload)
          .eq('id', building.id);

        if (error) throw error;
      } else {
        // Create new building
        const { data, error } = await supabase
          .from('buildings')
          .insert([payload])
          .select()
          .single();

        if (error) throw error;
        buildingId = data.id;

        // Tentar criar cliente externo (não-bloqueante: API externa pode estar offline)
        try {
          const clienteId = data.id.replace(/-/g, '').substring(0, 4);
          const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke('create-building-client', {
            body: { cliente_id: clienteId, cliente_name: formData.nome }
          });

          if (edgeFunctionError || !edgeFunctionData?.success) {
            const detail = edgeFunctionData?.error || edgeFunctionError?.message || 'API externa indisponível';
            console.warn('[BuildingFormDialog3] Cliente externo não pôde ser criado agora:', detail);
            toast.warning('Prédio criado, mas o cliente externo não foi sincronizado. Tente novamente mais tarde.', {
              description: detail,
            });
          }
        } catch (apiError: any) {
          console.warn('[BuildingFormDialog3] Falha ao chamar create-building-client:', apiError);
          toast.warning('Prédio criado, mas o cliente externo não foi sincronizado.', {
            description: apiError?.message || 'API externa indisponível',
          });
        }
      }

      // Upload new images
      if (buildingId) {
        const uploadedPaths = await uploadImages(buildingId);
        
        if (uploadedPaths.length > 0 || images.length > 0) {
          // Build image update payload
          const imageUpdate: any = {
            imagem_principal: null,
            imagem_2: null,
            imagem_3: null,
            imagem_4: null,
          };

          images.forEach((img, index) => {
            const uploaded = uploadedPaths.find(u => u.index === index);
            const path = uploaded?.path || img.originalPath;
            
            if (path) {
              if (index === 0) imageUpdate.imagem_principal = path;
              else if (index === 1) imageUpdate.imagem_2 = path;
              else if (index === 2) imageUpdate.imagem_3 = path;
              else if (index === 3) imageUpdate.imagem_4 = path;
            }
          });

          await supabase.from('buildings').update(imageUpdate).eq('id', buildingId);
        }
      }

      toast.success(building ? 'Prédio atualizado!' : 'Prédio criado!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error saving building:', error);
      toast.error(error.message || 'Erro ao salvar prédio');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!building?.id) return;
    
    await deleteBuilding(building.id, building.nome || 'Prédio', () => {
      setShowDeleteConfirm(false);
      handleClose();
      onSuccess();
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#9C1E1E]" />
              {building ? 'Editar Prédio' : 'Novo Prédio'}
            </DialogTitle>
            <DialogDescription>
              {building ? 'Atualize as informações do prédio' : 'Cadastre um novo prédio no sistema'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid grid-cols-4 w-full mb-4">
                <TabsTrigger value="basico" className="text-xs">
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  Básico
                </TabsTrigger>
                <TabsTrigger value="comercial" className="text-xs">
                  <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                  Comercial
                </TabsTrigger>
                <TabsTrigger value="contatos" className="text-xs">
                  <UserCircle className="h-3.5 w-3.5 mr-1.5" />
                  Contatos
                </TabsTrigger>
                <TabsTrigger value="fotos" className="text-xs">
                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                  Fotos
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-1">
                {/* Tab: Básico */}
                <TabsContent value="basico" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>Nome do Prédio</Label>
                    <Input
                      value={formData.nome}
                      onChange={(e) => updateField('nome', e.target.value)}
                      placeholder="Ex: Residencial Solar"
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <AddressAutocomplete
                      value={formData.endereco}
                      onChange={(value) => updateField('endereco', value)}
                      onPlaceSelect={(place) => {
                        updateField('endereco', place.address);
                        updateField('latitude', place.coordinates.lat);
                        updateField('longitude', place.coordinates.lng);
                        if (place.neighborhood && !formData.bairro) {
                          updateField('bairro', place.neighborhood);
                        }
                      }}
                      placeholder="Digite o endereço..."
                      className="h-10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bairro</Label>
                      <Input
                        value={formData.bairro}
                        onChange={(e) => updateField('bairro', e.target.value)}
                        placeholder="Bairro"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={formData.venue_type} onValueChange={(v) => updateField('venue_type', v)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Residencial">🏠 Residencial</SelectItem>
                          <SelectItem value="Comercial">🏢 Comercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={formData.padrao_publico} onValueChange={(v) => updateField('padrao_publico', v)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="medio">Intermediário</SelectItem>
                          <SelectItem value="alto">Alto Padrão</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => updateField('status', v)}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="interno">🏢 Interno</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="instalacao">Instalação</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/60 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src="/selos/airbnb.png" alt="Airbnb" className="h-7 w-auto" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                      <div>
                        <Label className="text-sm font-medium">Tem Airbnb?</Label>
                        <p className="text-xs text-gray-500">Marca este prédio como tendo hóspedes via Airbnb</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean((formData as any).tem_airbnb)}
                      onClick={() => updateField('tem_airbnb' as any, !((formData as any).tem_airbnb))}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${(formData as any).tem_airbnb ? 'bg-[#FF5A5F]' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${(formData as any).tem_airbnb ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>

                  <div className="pt-4">
                    <CharacteristicsSelector
                      selectedCharacteristics={formData.caracteristicas}
                      onToggle={handleCharacteristicToggle}
                    />
                  </div>
                </TabsContent>

                {/* Tab: Comercial */}
                <TabsContent value="comercial" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Unidades
                      </Label>
                      <Input
                        type="number"
                        value={formData.numero_unidades}
                        onChange={(e) => handleUnidadesChange(e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="120"
                        min="0"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Público Estimado
                      </Label>
                      <Input
                        type="number"
                        value={formData.publico_estimado}
                        onChange={(e) => updateField('publico_estimado', e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="Auto: unidades × 3.5"
                        min="0"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5" />
                        Andares
                      </Label>
                      <Input
                        type="number"
                        value={formData.numero_andares}
                        onChange={(e) => updateField('numero_andares', e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="15"
                        min="0"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5" />
                        Telas
                      </Label>
                      <Input
                        type="number"
                        value={formData.numero_elevadores}
                        onChange={(e) => updateField('numero_elevadores', e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="2"
                        min="0"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        Blocos
                      </Label>
                      <Input
                        type="number"
                        value={formData.numero_blocos}
                        onChange={(e) => updateField('numero_blocos', e.target.value === '' ? '' : parseInt(e.target.value))}
                        placeholder="1"
                        min="1"
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 space-y-4">
                    <h4 className="text-sm font-medium text-emerald-800 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Preços por Plano
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-emerald-700">Mensal (1M)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.preco_base}
                          onChange={(e) => updateField('preco_base', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          placeholder="R$ 200"
                          min="0"
                          className="h-10 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-emerald-700">Trimestral Total (3M)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.preco_trimestral}
                          onChange={(e) => updateField('preco_trimestral', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          placeholder="R$ 480"
                          min="0"
                          className="h-10 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-emerald-700">Semestral Total (6M)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.preco_semestral}
                          onChange={(e) => updateField('preco_semestral', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          placeholder="R$ 840"
                          min="0"
                          className="h-10 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-emerald-700">Anual Total (12M)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.preco_anual}
                          onChange={(e) => updateField('preco_anual', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          placeholder="R$ 1500"
                          min="0"
                          className="h-10 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Contatos */}
                <TabsContent value="contatos" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Síndico</Label>
                      <Input
                        value={formData.nome_sindico}
                        onChange={(e) => updateField('nome_sindico', e.target.value)}
                        placeholder="Nome completo"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contato do Síndico</Label>
                      <Input
                        value={formData.contato_sindico}
                        onChange={(e) => updateField('contato_sindico', e.target.value)}
                        placeholder="Telefone/Email"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Vice-Síndico</Label>
                      <Input
                        value={formData.nome_vice_sindico}
                        onChange={(e) => updateField('nome_vice_sindico', e.target.value)}
                        placeholder="Nome completo"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Contato do Vice</Label>
                      <Input
                        value={formData.contato_vice_sindico}
                        onChange={(e) => updateField('contato_vice_sindico', e.target.value)}
                        placeholder="Telefone/Email"
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contato do Prédio</Label>
                      <Input
                        value={formData.nome_contato_predio}
                        onChange={(e) => updateField('nome_contato_predio', e.target.value)}
                        placeholder="Portaria/Administração"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone Principal</Label>
                      <Input
                        value={formData.numero_contato_predio}
                        onChange={(e) => updateField('numero_contato_predio', e.target.value)}
                        placeholder="(45) 99999-9999"
                        className="h-10"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Fotos */}
                <TabsContent value="fotos" className="mt-0">
                  <ImageGallery3
                    images={images}
                    onImagesChange={setImages}
                    buildingId={building?.id}
                    disabled={loading}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="pt-4 border-t mt-4 flex justify-between">
              <div>
                {building && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={!permissions.canDeleteBuildings || loading || deleting}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Deletar
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || deleting}
                  className="bg-[#9C1E1E] hover:bg-[#7A1818]"
                >
                  {loading ? 'Salvando...' : (building ? 'Atualizar' : 'Criar Prédio')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar prédio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O prédio "{building?.nome}" será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BuildingFormDialog3;
