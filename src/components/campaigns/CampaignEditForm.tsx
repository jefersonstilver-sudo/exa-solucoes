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

  // 🔧 CORREÇÃO CRÍTICA: Normalizar datas para formato YYYY-MM-DD consistente
  const normalizeDateFormat = (dateString: string) => {
    if (!dateString) return '';
    
    // Se já está no formato correto, retornar
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
      return dateString.trim();
    }
    
    // Extrair de ISO string se necessário
    if (dateString.includes('T')) {
      return dateString.split('T')[0].trim();
    }
    
    return dateString.trim();
  };

  // Sincronizar formData com campaign data
  useEffect(() => {
    console.log('🔄 [CAMPAIGN EDIT] === SINCRONIZAÇÃO DE DADOS ===');
    console.log('🔄 [CAMPAIGN EDIT] Campaign recebida:', campaign);
    
    const startDate = campaign.start_date || campaign.data_inicio || '';
    const endDate = campaign.end_date || campaign.data_fim || '';
    
    // Normalizar datas para comparação consistente
    const normalizedStartDate = normalizeDateFormat(startDate);
    const normalizedEndDate = normalizeDateFormat(endDate);
    
    console.log('📅 [CAMPAIGN EDIT] Datas normalizadas:', {
      original_start: startDate,
      normalized_start: normalizedStartDate,
      original_end: endDate,
      normalized_end: normalizedEndDate
    });
    
    const newFormData = {
      name: campaign.name || '',
      description: campaign.description || campaign.obs || '',
      status: campaign.status || '',
      start_date: normalizedStartDate,
      end_date: normalizedEndDate
    };
    
    console.log('📝 [CAMPAIGN EDIT] FormData atualizado:', newFormData);
    setFormData(newFormData);
  }, [campaign, open]);

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

        // Verificar mudanças nos campos com normalização de datas
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
        
        // 🔧 CORREÇÃO CRÍTICA: Sempre incluir datas quando fornecidas, melhorando detecção
        const originalStartDate = normalizeDateFormat(campaign.start_date || '');
        const formStartDate = normalizeDateFormat(formData.start_date || '');
        
        console.log('🔍 [CAMPAIGN EDIT] Comparação Start Date DETALHADA:', {
          campaign_start_date: campaign.start_date,
          formData_start_date: formData.start_date,
          original_normalized: originalStartDate,
          form_normalized: formStartDate,
          are_equal: formStartDate === originalStartDate,
          will_include: formStartDate && (formStartDate !== originalStartDate || !originalStartDate)
        });
        
        // ✅ CORREÇÃO: Incluir start_date se foi fornecida E é diferente OU se não existe no banco
        if (formStartDate && (formStartDate !== originalStartDate || !originalStartDate)) {
          updates.start_date = formStartDate;
          hasChanges = true;
          console.log('✅ [CAMPAIGN EDIT] Start date INCLUÍDA NO UPDATE:', originalStartDate, '->', formStartDate);
        } else {
          console.log('🔄 [CAMPAIGN EDIT] Start date mantida:', originalStartDate);
        }
        
        const originalEndDate = normalizeDateFormat(campaign.end_date || '');
        const formEndDate = normalizeDateFormat(formData.end_date || '');
        
        console.log('🔍 [CAMPAIGN EDIT] Comparação End Date DETALHADA:', {
          campaign_end_date: campaign.end_date,
          formData_end_date: formData.end_date,
          original_normalized: originalEndDate,
          form_normalized: formEndDate,
          are_equal: formEndDate === originalEndDate,
          will_include: formEndDate && (formEndDate !== originalEndDate || !originalEndDate)
        });
        
        // ✅ CORREÇÃO: Incluir end_date se foi fornecida E é diferente OU se não existe no banco
        if (formEndDate && (formEndDate !== originalEndDate || !originalEndDate)) {
          updates.end_date = formEndDate;
          hasChanges = true;
          console.log('✅ [CAMPAIGN EDIT] End date INCLUÍDA NO UPDATE:', originalEndDate, '->', formEndDate);
        } else {
          console.log('🔄 [CAMPAIGN EDIT] End date mantida:', originalEndDate);
        }
        
        console.log('🚀 [CAMPAIGN EDIT] Updates para campanha AVANÇADA:', JSON.stringify(updates, null, 2));
      } else {
        // Campanha legacy - usar campos antigos com normalização
        if ((formData.description?.trim() || '') !== (campaign.obs || '')) {
          updates.obs = formData.description?.trim() || '';
          hasChanges = true;
          console.log('📝 [CAMPAIGN EDIT] Obs alterada');
        }
        
        // 🔧 CORREÇÃO CRÍTICA: Normalizar datas legacy antes da comparação
        const originalDataInicio = normalizeDateFormat(campaign.data_inicio || '');
        const formDataInicio = normalizeDateFormat(formData.start_date || '');
        
        if (formDataInicio && formDataInicio !== originalDataInicio) {
          updates.data_inicio = formDataInicio;
          hasChanges = true;
          console.log('📅 [CAMPAIGN EDIT] Data inicio alterada:', originalDataInicio, '->', formDataInicio);
        }
        
        const originalDataFim = normalizeDateFormat(campaign.data_fim || '');
        const formDataFim = normalizeDateFormat(formData.end_date || '');
        
        if (formDataFim && formDataFim !== originalDataFim) {
          updates.data_fim = formDataFim;
          hasChanges = true;
          console.log('📅 [CAMPAIGN EDIT] Data fim alterada:', originalDataFim, '->', formDataFim);
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

  // 🔧 CORREÇÃO CRÍTICA: Formatação de data otimizada para garantir persistência
  const formatDateForInput = (dateString: string) => {
    if (!dateString) {
      console.log('🔴 [DATE FORMAT] Data vazia recebida');
      return '';
    }
    
    console.log('📅 [DATE FORMAT] Input recebido:', dateString, 'Tipo:', typeof dateString);
    
    try {
      // PRIORIDADE 1: Se já está no formato YYYY-MM-DD, validar e usar
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString.trim())) {
        const testDate = new Date(dateString.trim() + 'T00:00:00.000Z');
        if (!isNaN(testDate.getTime())) {
          console.log('✅ [DATE FORMAT] Data válida mantida:', dateString.trim());
          return dateString.trim();
        }
      }
      
      // PRIORIDADE 2: Extrair data de ISO string
      if (dateString.includes('T')) {
        const extractedDate = dateString.split('T')[0].trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(extractedDate)) {
          console.log('✅ [DATE FORMAT] Data extraída de ISO:', extractedDate);
          return extractedDate;
        }
      }
      
      // PRIORIDADE 3: Parse e formatação com UTC rigoroso
      let parsedDate;
      
      // Tentar diferentes formatos de entrada
      if (dateString.includes('-')) {
        parsedDate = new Date(dateString.trim() + 'T00:00:00.000Z');
      } else {
        parsedDate = new Date(dateString.trim());
      }
      
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getUTCFullYear();
        const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(parsedDate.getUTCDate()).padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        
        // Validação dupla para garantir que a data formatada é válida
        const validation = new Date(formatted + 'T00:00:00.000Z');
        if (!isNaN(validation.getTime())) {
          console.log('✅ [DATE FORMAT] Data formatada e validada:', dateString, '->', formatted);
          return formatted;
        }
      }
      
      console.warn('⚠️ [DATE FORMAT] Falha na formatação, retornando valor original:', dateString);
      return dateString.trim();
    } catch (error) {
      console.error('❌ [DATE FORMAT] Erro crítico na formatação:', error);
      return dateString.trim();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] sm:max-w-3xl lg:max-w-4xl max-h-[95vh] p-3 sm:p-6 overflow-y-auto">
        <DialogHeader className="flex-shrink-0 pb-2 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl">Editar Campanha</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6 flex-1 overflow-y-auto">
          {isAdvanced && (
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="name" className="text-sm">Nome da Campanha</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome da campanha"
                className="text-sm"
              />
            </div>
          )}

          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="description" className="text-sm">
              {isAdvanced ? 'Descrição' : 'Observações'}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={isAdvanced ? 'Descrição da campanha' : 'Observações sobre a campanha'}
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Status é controlado automaticamente pelo scheduler */}
          <div className="space-y-1 sm:space-y-2">
            <Label className="text-sm">Status da Campanha</Label>
            <div className="p-2 sm:p-3 bg-muted rounded-md">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-xs sm:text-sm font-medium">
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="start_date" className="text-sm">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="end_date" className="text-sm">Data de Fim</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="text-sm"
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

          <div className="flex flex-col gap-2 pt-3 sm:flex-row sm:gap-3 sm:pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || isSubmitting}
              className="flex-1 sm:flex-none order-1 sm:order-2"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignEditForm;