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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BasicInfoForm from './form/BasicInfoForm';
import ContactInfoForm from './form/ContactInfoForm';
import CommercialDataForm from './form/CommercialDataForm';
import CharacteristicsSelector from './form/CharacteristicsSelector';
import ImageGallery from './form/ImageGallery';
import PanelManagementSection from './form/PanelManagementSection';

interface BuildingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building?: any;
  onSuccess: () => void;
}

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
    nome_sindico: '',
    contato_sindico: '',
    nome_vice_sindico: '',
    contato_vice_sindico: '',
    nome_contato_predio: '',
    numero_contato_predio: ''
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
        venue_type: (building.venue_type === 'Residencial' || building.venue_type === 'Comercial') 
          ? building.venue_type 
          : 'Residencial',
        location_type: building.location_type || 'residential',
        latitude: building.latitude || 0,
        longitude: building.longitude || 0,
        caracteristicas: building.caracteristicas || building.amenities || [],
        monthly_traffic: building.monthly_traffic || 0,
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
        nome_sindico: '',
        contato_sindico: '',
        nome_vice_sindico: '',
        contato_vice_sindico: '',
        nome_contato_predio: '',
        numero_contato_predio: ''
      });
    }
  }, [building, open]);

  const handleFormUpdate = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleCharacteristicToggle = (caracteristica: string) => {
    if (formData.caracteristicas.includes(caracteristica)) {
      setFormData(prev => ({
        ...prev,
        caracteristicas: prev.caracteristicas.filter(a => a !== caracteristica)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        caracteristicas: [...prev.caracteristicas, caracteristica]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToSave = {
        ...formData,
        amenities: formData.caracteristicas,
        venue_type: (formData.venue_type === 'Residencial' || formData.venue_type === 'Comercial') 
          ? formData.venue_type 
          : 'Residencial',
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
          p_description: `Prédio "${formData.nome}" atualizado - Tipo: ${dataToSave.venue_type}`,
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
          p_description: `Novo prédio "${formData.nome}" criado - Tipo: ${dataToSave.venue_type}`,
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
            {/* Primeira coluna - Informações básicas, contato e dados comerciais */}
            <div className="space-y-4">
              <BasicInfoForm
                formData={{
                  nome: formData.nome,
                  endereco: formData.endereco,
                  bairro: formData.bairro,
                  venue_type: formData.venue_type,
                  padrao_publico: formData.padrao_publico,
                  latitude: formData.latitude,
                  longitude: formData.longitude
                }}
                onUpdate={handleFormUpdate}
              />

              <ContactInfoForm
                formData={{
                  nome_sindico: formData.nome_sindico,
                  contato_sindico: formData.contato_sindico,
                  nome_vice_sindico: formData.nome_vice_sindico,
                  contato_vice_sindico: formData.contato_vice_sindico,
                  nome_contato_predio: formData.nome_contato_predio,
                  numero_contato_predio: formData.numero_contato_predio
                }}
                onUpdate={handleFormUpdate}
              />

              <CommercialDataForm
                formData={{
                  numero_unidades: formData.numero_unidades,
                  preco_base: formData.preco_base,
                  status: formData.status,
                  monthly_traffic: formData.monthly_traffic
                }}
                onUpdate={handleFormUpdate}
              />
            </div>

            {/* Segunda coluna - Características, galeria de fotos e gestão de painéis */}
            <div className="space-y-4">
              <CharacteristicsSelector
                selectedCharacteristics={formData.caracteristicas}
                onToggle={handleCharacteristicToggle}
              />

              <ImageGallery
                building={building}
                onSuccess={onSuccess}
              />

              <PanelManagementSection
                buildingId={building?.id}
                buildingName={formData.nome || building?.nome}
                onPanelsChange={onSuccess}
              />
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
