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

  // 🔧 CORREÇÃO CRÍTICA: Sincronizar formData com formatação correta de datas
  useEffect(() => {
    console.log('🔄 [CAMPAIGN EDIT] === SINCRONIZAÇÃO DE DADOS ===');
    console.log('🔄 [CAMPAIGN EDIT] Campaign recebida:', campaign);
    
    const startDate = campaign.start_date || campaign.data_inicio || '';
    const endDate = campaign.end_date || campaign.data_fim || '';
    
    console.log('📅 [CAMPAIGN EDIT] Datas antes da formatação:', {
      start_date: campaign.start_date,
      data_inicio: campaign.data_inicio,
      end_date: campaign.end_date,
      data_fim: campaign.data_fim,
      startDate_selected: startDate,
      endDate_selected: endDate
    });
    
    const formattedStartDate = formatDateForInput(startDate);
    const formattedEndDate = formatDateForInput(endDate);
    
    console.log('📅 [CAMPAIGN EDIT] Datas após formatação:', {
      formattedStartDate,
      formattedEndDate
    });
    
    const newFormData = {
      name: campaign.name || '',
      description: campaign.description || campaign.obs || '',
      status: campaign.status || '',
      start_date: formattedStartDate,
      end_date: formattedEndDate
    };
    
    console.log('📝 [CAMPAIGN EDIT] FormData atualizado:', newFormData);
    setFormData(newFormData);
  }, [campaign, open]); // Incluir 'open' para resetar quando o modal abrir

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('📝 [CAMPAIGN EDIT] === INÍCIO DO SUBMIT ===');
    console.log('📝 [CAMPAIGN EDIT] FormData atual:', formData);
    console.log('📝 [CAMPAIGN EDIT] Campaign original:', campaign);
    console.log('🔧 [CAMPAIGN EDIT] Modo avançado:', isAdvanced);

    try {
      // Validação de datas mais robusta
      if (formData.start_date && formData.end_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);
        
        console.log('📅 [CAMPAIGN EDIT] Validando datas:', {
          start_date_input: formData.start_date,
          end_date_input: formData.end_date,
          start_date_parsed: startDate.toISOString(),
          end_date_parsed: endDate.toISOString(),
          start_valid: !isNaN(startDate.getTime()),
          end_valid: !isNaN(endDate.getTime())
        });

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error('❌ [CAMPAIGN EDIT] Datas inválidas detectadas');
          toast.error('Formato de data inválido');
          return;
        }

        if (startDate >= endDate) {
          console.error('❌ [CAMPAIGN EDIT] Erro de validação: Data início >= Data fim');
          toast.error('A data de início deve ser anterior à data de fim');
          return;
        }
      }

      // 🔧 DEBUG CRÍTICO: Verificar dados antes da atualização
      console.log('📋 [CAMPAIGN EDIT] FormData ANTES da preparação:', {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.end_date,
        start_date_type: typeof formData.start_date,
        end_date_type: typeof formData.end_date
      });

      // 🔧 CORREÇÃO CRÍTICA: Preparar dados para atualização
      const updates: Partial<CampaignData> = {};

      if (isAdvanced) {
        // Campanha avançada - VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
        if (!formData.name?.trim()) {
          console.error('❌ [CAMPAIGN EDIT] Campo obrigatório: nome da campanha');
          toast.error('Nome da campanha é obrigatório');
          return;
        }
        if (!formData.start_date?.trim()) {
          console.error('❌ [CAMPAIGN EDIT] Campo obrigatório: data de início');
          toast.error('Data de início é obrigatória');
          return;
        }
        if (!formData.end_date?.trim()) {
          console.error('❌ [CAMPAIGN EDIT] Campo obrigatório: data de fim');
          toast.error('Data de fim é obrigatória');
          return;
        }

        // ✅ CORREÇÃO: Dados diretos do input (já estão em YYYY-MM-DD)
        updates.name = formData.name.trim();
        updates.description = formData.description?.trim() || '';
        updates.start_date = formData.start_date.trim(); // Input já está em YYYY-MM-DD
        updates.end_date = formData.end_date.trim(); // Input já está em YYYY-MM-DD
        
        console.log('🚀 [CAMPAIGN EDIT] Updates para campanha AVANÇADA:', JSON.stringify(updates, null, 2));
        console.log('📝 [CAMPAIGN EDIT] Formato das datas:', {
          start_date_format: updates.start_date,
          end_date_format: updates.end_date,
          start_date_regex_test: /^\d{4}-\d{2}-\d{2}$/.test(updates.start_date || ''),
          end_date_regex_test: /^\d{4}-\d{2}-\d{2}$/.test(updates.end_date || '')
        });
      } else {
        // Campanha legacy - usar campos antigos
        updates.obs = formData.description;
        if (formData.start_date?.trim()) {
          updates.data_inicio = formData.start_date.trim();
        }
        if (formData.end_date?.trim()) {
          updates.data_fim = formData.end_date.trim();
        }
        console.log('🚀 [CAMPAIGN EDIT] Updates para campanha LEGACY:', JSON.stringify(updates, null, 2));
      }

      console.log('📤 [CAMPAIGN EDIT] === ENVIANDO PARA SUPABASE ===');
      console.log('📤 [CAMPAIGN EDIT] Updates finais:', updates);
      console.log('📤 [CAMPAIGN EDIT] ID da campanha:', campaign.id);
      console.log('📤 [CAMPAIGN EDIT] Tabela alvo:', isAdvanced ? 'campaigns_advanced' : 'campanhas');

      const success = await onUpdate(updates);
      
      if (success) {
        console.log('✅ [CAMPAIGN EDIT] Atualização bem-sucedida!');
        toast.success('Campanha atualizada com sucesso!');
        onOpenChange(false);
      } else {
        console.error('❌ [CAMPAIGN EDIT] Falha na atualização - onUpdate retornou false');
        toast.error('Erro ao atualizar campanha. Tente novamente.');
      }
    } catch (error) {
      console.error('💥 [CAMPAIGN EDIT] Erro inesperado no submit:', error);
      toast.error('Erro inesperado ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
      console.log('📝 [CAMPAIGN EDIT] === FIM DO SUBMIT ===');
    }
  };

  // 🔧 CORREÇÃO CRÍTICA: Formatação de data melhorada
  const formatDateForInput = (dateString: string) => {
    if (!dateString) {
      console.log('🔴 [DATE FORMAT] Data vazia recebida');
      return '';
    }
    
    console.log('📅 [DATE FORMAT] Input recebido:', dateString, 'Tipo:', typeof dateString);
    
    try {
      // Se já está no formato YYYY-MM-DD, usar diretamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.log('✅ [DATE FORMAT] Data já no formato correto:', dateString);
        return dateString;
      }
      
      // Se for uma data completa ISO, extrair apenas a parte da data
      if (dateString.includes('T')) {
        const formattedDate = dateString.split('T')[0];
        console.log('✅ [DATE FORMAT] Data extraída do ISO:', formattedDate);
        return formattedDate;
      }
      
      // Tentar parse e formatar
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const formatted = date.toISOString().split('T')[0];
        console.log('✅ [DATE FORMAT] Data formatada via Date:', formatted);
        return formatted;
      }
      
      console.log('⚠️ [DATE FORMAT] Usando valor original:', dateString);
      return dateString;
    } catch (error) {
      console.error('❌ [DATE FORMAT] Erro ao formatar:', error);
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