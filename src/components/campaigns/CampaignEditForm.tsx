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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      console.log('⚠️ [CAMPAIGN EDIT] Submit já em andamento, ignorando...');
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);

    console.log('📝 [CAMPAIGN EDIT] === INÍCIO DO SUBMIT ===');
    console.log('📝 [CAMPAIGN EDIT] FormData atual:', formData);
    console.log('📝 [CAMPAIGN EDIT] Campaign original:', campaign);
    console.log('🔧 [CAMPAIGN EDIT] Modo avançado:', isAdvanced);

    try {
      // Validação rigorosa de datas com logs detalhados
      if (formData.start_date && formData.end_date) {
        // Validar formato primeiro
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.start_date)) {
          console.error('❌ [CAMPAIGN EDIT] Formato de start_date inválido:', formData.start_date);
          toast.error('Formato da data de início inválido (esperado: YYYY-MM-DD)');
          return;
        }
        
        if (!dateRegex.test(formData.end_date)) {
          console.error('❌ [CAMPAIGN EDIT] Formato de end_date inválido:', formData.end_date);
          toast.error('Formato da data de fim inválido (esperado: YYYY-MM-DD)');
          return;
        }
        
        // Validar se as datas são válidas usando UTC
        const startDate = new Date(formData.start_date + 'T00:00:00.000Z');
        const endDate = new Date(formData.end_date + 'T00:00:00.000Z');
        
        console.log('📅 [CAMPAIGN EDIT] Validando datas com UTC:', {
          start_date_input: formData.start_date,
          end_date_input: formData.end_date,
          start_date_utc: startDate.toISOString(),
          end_date_utc: endDate.toISOString(),
          start_valid: !isNaN(startDate.getTime()),
          end_valid: !isNaN(endDate.getTime())
        });

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error('❌ [CAMPAIGN EDIT] Datas inválidas detectadas');
          toast.error('Uma ou mais datas são inválidas');
          return;
        }

        if (startDate >= endDate) {
          console.error('❌ [CAMPAIGN EDIT] Erro de validação: Data início >= Data fim');
          toast.error('A data de início deve ser anterior à data de fim');
          return;
        }
      }

      // Verificar mudanças antes de atualizar
      const updates: Partial<CampaignData> = {};
      let hasChanges = false;

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

        // Verificar mudanças nos campos
        if (formData.name.trim() !== (campaign.name || '')) {
          updates.name = formData.name.trim();
          hasChanges = true;
          console.log('📝 [CAMPAIGN EDIT] Nome alterado:', campaign.name, '->', updates.name);
        }
        
        if ((formData.description?.trim() || '') !== (campaign.description || '')) {
          updates.description = formData.description?.trim() || '';
          hasChanges = true;
          console.log('📝 [CAMPAIGN EDIT] Descrição alterada');
        }
        
        if (formData.start_date.trim() !== (campaign.start_date || '')) {
          updates.start_date = formData.start_date.trim();
          hasChanges = true;
          console.log('📅 [CAMPAIGN EDIT] Start date alterada:', campaign.start_date, '->', updates.start_date);
        }
        
        if (formData.end_date.trim() !== (campaign.end_date || '')) {
          updates.end_date = formData.end_date.trim();
          hasChanges = true;
          console.log('📅 [CAMPAIGN EDIT] End date alterada:', campaign.end_date, '->', updates.end_date);
        }
        
        console.log('🚀 [CAMPAIGN EDIT] Updates para campanha AVANÇADA:', JSON.stringify(updates, null, 2));
      } else {
        // Campanha legacy - usar campos antigos
        if ((formData.description?.trim() || '') !== (campaign.obs || '')) {
          updates.obs = formData.description?.trim() || '';
          hasChanges = true;
        }
        
        if (formData.start_date?.trim() && formData.start_date.trim() !== (campaign.data_inicio || '')) {
          updates.data_inicio = formData.start_date.trim();
          hasChanges = true;
          console.log('📅 [CAMPAIGN EDIT] Data inicio alterada:', campaign.data_inicio, '->', updates.data_inicio);
        }
        
        if (formData.end_date?.trim() && formData.end_date.trim() !== (campaign.data_fim || '')) {
          updates.data_fim = formData.end_date.trim();
          hasChanges = true;
          console.log('📅 [CAMPAIGN EDIT] Data fim alterada:', campaign.data_fim, '->', updates.data_fim);
        }
        
        console.log('🚀 [CAMPAIGN EDIT] Updates para campanha LEGACY:', JSON.stringify(updates, null, 2));
      }
      
      if (!hasChanges) {
        console.log('⚠️ [CAMPAIGN EDIT] Nenhuma alteração detectada');
        toast.info('Nenhuma alteração foi detectada');
        return;
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
      setIsSubmitting(false);
      setLoading(false);
      console.log('📝 [CAMPAIGN EDIT] === FIM DO SUBMIT ===');
    }
  };

  // 🔧 CORREÇÃO CRÍTICA: Formatação de data melhorada com validação UTC
  const formatDateForInput = (dateString: string) => {
    if (!dateString) {
      console.log('🔴 [DATE FORMAT] Data vazia recebida');
      return '';
    }
    
    console.log('📅 [DATE FORMAT] Input recebido:', dateString, 'Tipo:', typeof dateString);
    
    try {
      // Se já está no formato YYYY-MM-DD, validar e usar diretamente
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Validar se é uma data válida
        const testDate = new Date(dateString + 'T00:00:00.000Z');
        if (!isNaN(testDate.getTime())) {
          console.log('✅ [DATE FORMAT] Data válida no formato correto:', dateString);
          return dateString;
        }
      }
      
      // Se for uma data completa ISO, extrair apenas a parte da data
      if (dateString.includes('T')) {
        const formattedDate = dateString.split('T')[0];
        console.log('✅ [DATE FORMAT] Data extraída do ISO:', formattedDate);
        return formattedDate;
      }
      
      // Tentar parse com UTC para evitar problemas de timezone
      const date = new Date(dateString + 'T00:00:00.000Z');
      if (!isNaN(date.getTime())) {
        // Usar UTC para evitar mudanças de timezone
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        console.log('✅ [DATE FORMAT] Data formatada com UTC:', dateString, '->', formatted);
        return formatted;
      }
      
      console.log('⚠️ [DATE FORMAT] Usando valor original (não pôde formatar):', dateString);
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
              disabled={loading || isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignEditForm;