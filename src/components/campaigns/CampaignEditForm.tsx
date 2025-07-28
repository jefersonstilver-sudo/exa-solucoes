import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import CampaignScheduleEdit from './CampaignScheduleEdit';
import { format } from 'date-fns';

interface CampaignData {
  id: string;
  client_id: string;
  status: string;
  created_at: string;
  data_inicio?: string;
  data_fim?: string;
  obs?: string;
  painel_id?: string;
  video_id?: string;
  start_date?: string;
  end_date?: string;
  name?: string;
  description?: string;
  pedido_id?: string;
  updated_at?: string;
}

interface CampaignEditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: CampaignData;
  onUpdate: (updates: Partial<CampaignData>) => Promise<boolean>;
  isAdvanced: boolean;
}

const CampaignEditForm: React.FC<CampaignEditFormProps> = ({
  open,
  onOpenChange,
  campaign,
  onUpdate,
  isAdvanced
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: campaign.name || '',
    description: campaign.description || campaign.obs || '',
    status: campaign.status || '',
    start_date: campaign.start_date || campaign.data_inicio || '',
    end_date: campaign.end_date || campaign.data_fim || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates: Partial<CampaignData> = {};

      if (isAdvanced) {
        if (formData.name) updates.name = formData.name;
        if (formData.description) updates.description = formData.description;
        if (formData.status) updates.status = formData.status;
        if (formData.start_date) updates.start_date = formData.start_date;
        if (formData.end_date) updates.end_date = formData.end_date;
      } else {
        if (formData.description) updates.obs = formData.description;
        if (formData.status) updates.status = formData.status;
        if (formData.start_date) updates.data_inicio = formData.start_date;
        if (formData.end_date) updates.data_fim = formData.end_date;
      }

      const success = await onUpdate(updates);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      // Se for uma data completa, extrair apenas a parte da data
      return dateString.split('T')[0];
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Campanha</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isAdvanced && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Campanha</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome da campanha"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">
              {isAdvanced ? 'Descrição' : 'Observações'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={isAdvanced ? 'Descrição da campanha' : 'Observações sobre a campanha'}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativa</SelectItem>
                <SelectItem value="pausado">Pausada</SelectItem>
                <SelectItem value="agendado">Agendada</SelectItem>
                <SelectItem value="finalizado">Finalizada</SelectItem>
                <SelectItem value="cancelado">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formatDateForInput(formData.start_date)}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={formatDateForInput(formData.end_date)}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
          </div>

          {/* Horários de Veiculação */}
          {isAdvanced && (
            <>
              <Separator />
              <CampaignScheduleEdit
                campaignId={campaign.id}
                isAdvanced={isAdvanced}
                onScheduleUpdate={() => {
                  // Callback para atualizar dados se necessário
                }}
              />
            </>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignEditForm;