import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import CampaignScheduleEdit from './CampaignScheduleEdit';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

  // 🔧 CORREÇÃO 1: Sincronizar formData com mudanças na campanha
  useEffect(() => {
    console.log('🔄 [CAMPAIGN EDIT] Sincronizando formData com nova campanha:', campaign);
    setFormData({
      name: campaign.name || '',
      description: campaign.description || campaign.obs || '',
      status: campaign.status || '',
      start_date: campaign.start_date || campaign.data_inicio || '',
      end_date: campaign.end_date || campaign.data_fim || ''
    });
  }, [campaign, open]); // Incluir 'open' para resetar quando o modal abrir

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('📝 [CAMPAIGN EDIT] Dados do formulário antes do submit:', formData);
      console.log('🎯 [CAMPAIGN EDIT] Campanha atual:', campaign);
      console.log('🔧 [CAMPAIGN EDIT] Modo avançado:', isAdvanced);

      const updates: Partial<CampaignData> = {};

      if (isAdvanced) {
        // Campanha avançada - sempre enviar as datas, mesmo se não mudaram
        updates.name = formData.name;
        updates.description = formData.description;
        updates.start_date = formData.start_date;
        updates.end_date = formData.end_date;
        console.log('🚀 [CAMPAIGN EDIT] Updates para campanha avançada:', updates);
      } else {
        // Campanha legacy - sempre enviar as datas, mesmo se não mudaram
        updates.obs = formData.description;
        updates.data_inicio = formData.start_date;
        updates.data_fim = formData.end_date;
        console.log('🚀 [CAMPAIGN EDIT] Updates para campanha legacy:', updates);
      }

      // 🔧 CORREÇÃO 2: Validação básica das datas
      if (updates.start_date && updates.end_date) {
        const startDate = new Date(updates.start_date);
        const endDate = new Date(updates.end_date);
        
        if (endDate < startDate) {
          toast.error('Data de fim não pode ser anterior à data de início');
          return;
        }
      }

      console.log('📤 [CAMPAIGN EDIT] Enviando updates:', updates);
      const success = await onUpdate(updates);
      
      if (success) {
        console.log('✅ [CAMPAIGN EDIT] Atualização bem-sucedida!');
        toast.success('Campanha atualizada com sucesso!');
        
        // 🔧 CORREÇÃO 3: Resetar formData após sucesso para forçar refresh
        setTimeout(() => {
          setFormData({
            name: campaign.name || '',
            description: campaign.description || campaign.obs || '',
            status: campaign.status || '',
            start_date: campaign.start_date || campaign.data_inicio || '',
            end_date: campaign.end_date || campaign.data_fim || ''
          });
        }, 100);
        
        onOpenChange(false);
      } else {
        console.error('❌ [CAMPAIGN EDIT] Falha na atualização');
        toast.error('Erro ao atualizar campanha. Tente novamente.');
      }
    } catch (error) {
      console.error('💥 [CAMPAIGN EDIT] Erro no submit:', error);
      toast.error('Erro inesperado ao salvar. Tente novamente.');
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

          {/* Status é controlado automaticamente pelo scheduler */}
          <div className="space-y-2">
            <Label>Status da Campanha</Label>
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Status Atual: <span className="capitalize">{campaign.status}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Controlado automaticamente
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                O status é definido automaticamente baseado nas datas e horários configurados.
              </p>
            </div>
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