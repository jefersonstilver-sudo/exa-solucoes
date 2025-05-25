
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
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BuildingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
  onSuccess: () => void;
}

const AMENITIES_OPTIONS = [
  'Piscina',
  'Churrasqueira',
  'Salão de festas',
  'Academia',
  'Playground',
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
    venue_type: '',
    location_type: 'residential',
    latitude: 0,
    longitude: 0,
    amenities: [] as string[]
  });
  const [loading, setLoading] = useState(false);

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
        venue_type: building.venue_type || '',
        location_type: building.location_type || 'residential',
        latitude: building.latitude || 0,
        longitude: building.longitude || 0,
        amenities: building.amenities || []
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
        venue_type: '',
        location_type: 'residential',
        latitude: 0,
        longitude: 0,
        amenities: []
      });
    }
  }, [building]);

  const handleAddAmenity = (amenity: string) => {
    if (!formData.amenities.includes(amenity)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity]
      }));
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (building) {
        // Atualizar prédio existente
        const { error } = await supabase
          .from('buildings')
          .update(formData)
          .eq('id', building.id);

        if (error) throw error;

        // Log da ação
        await supabase.rpc('log_building_action', {
          p_building_id: building.id,
          p_action_type: 'update',
          p_description: `Prédio "${formData.nome}" atualizado`,
          p_new_values: formData
        });

        toast.success('Prédio atualizado com sucesso!');
      } else {
        // Criar novo prédio
        const { data, error } = await supabase
          .from('buildings')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;

        // Log da ação
        await supabase.rpc('log_building_action', {
          p_building_id: data.id,
          p_action_type: 'create',
          p_description: `Novo prédio "${formData.nome}" criado`,
          p_new_values: formData
        });

        toast.success('Prédio criado com sucesso!');
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar prédio:', error);
      toast.error(error.message || 'Erro ao salvar prédio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {building ? 'Editar Prédio' : 'Novo Prédio'}
          </DialogTitle>
          <DialogDescription>
            {building ? 'Edite as informações do prédio' : 'Cadastre um novo prédio no sistema'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Prédio *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço Completo *</Label>
            <Textarea
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_unidades">Número de Unidades *</Label>
              <Input
                id="numero_unidades"
                type="number"
                value={formData.numero_unidades}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_unidades: parseInt(e.target.value) }))}
                required
                min="1"
              />
              <p className="text-xs text-gray-500">
                Público estimado: {formData.numero_unidades * 3} pessoas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_base">Preço Base (R$) *</Label>
              <Input
                id="preco_base"
                type="number"
                step="0.01"
                value={formData.preco_base}
                onChange={(e) => setFormData(prev => ({ ...prev, preco_base: parseFloat(e.target.value) }))}
                required
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="padrao_publico">Padrão do Público</Label>
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
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="location_type">Tipo de Local</Label>
              <Select
                value={formData.location_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, location_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residencial</SelectItem>
                  <SelectItem value="commercial">Comercial</SelectItem>
                  <SelectItem value="mixed">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue_type">Tipo de Venue</Label>
              <Input
                id="venue_type"
                value={formData.venue_type}
                onChange={(e) => setFormData(prev => ({ ...prev, venue_type: e.target.value }))}
                placeholder="Ex: Condomínio, Shopping, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Características de Lazer</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <Button
                  key={amenity}
                  type="button"
                  variant={formData.amenities.includes(amenity) ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (formData.amenities.includes(amenity)) {
                      handleRemoveAmenity(amenity);
                    } else {
                      handleAddAmenity(amenity);
                    }
                  }}
                  className="justify-start text-xs"
                >
                  {amenity}
                </Button>
              ))}
            </div>
            
            {formData.amenities.length > 0 && (
              <div className="space-y-2">
                <Label>Características Selecionadas:</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                      {amenity}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveAmenity(amenity)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (building ? 'Atualizar' : 'Criar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BuildingFormDialog;
