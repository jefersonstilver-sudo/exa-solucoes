import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  FileSignature,
  Download,
  RefreshCw,
  Send,
  XCircle,
  CheckCircle2,
  Clock,
  Eye,
  User,
  Building2,
  CreditCard,
  Calendar,
  Loader2,
  Edit3,
  FileText,
  MoreVertical,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Hash,
  Monitor,
  AlertTriangle,
  Copy
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ContractPreview from '@/components/admin/contracts/ContractPreview';
import FullscreenContractEditor from '@/components/admin/contracts/FullscreenContractEditor';
import { ContractPDFExporter } from '@/components/admin/contracts/ContractPDFExporter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-500', icon: FileSignature },
  enviado: { label: 'Enviado', color: 'bg-blue-500', icon: Send },
  visualizado: { label: 'Visualizado', color: 'bg-amber-500', icon: Eye },
  assinado: { label: 'Assinado', color: 'bg-emerald-500', icon: CheckCircle2 },
  recusado: { label: 'Recusado', color: 'bg-red-500', icon: XCircle },
  expirado: { label: 'Expirado', color: 'bg-orange-500', icon: Clock },
  cancelado: { label: 'Cancelado', color: 'bg-gray-700', icon: XCircle },
};

const ContratoDetalhesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const { isMobile } = useResponsiveLayout();
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { data: contrato, isLoading, refetch } = useQuery({
    queryKey: ['contrato-detalhes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_legais')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: logs } = useQuery({
    queryKey: ['contrato-logs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contratos_legais_logs')
        .select('*')
        .eq('contrato_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!id
  });

  const resendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('clicksign-resend', {
        body: { contrato_id: id }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Notificação reenviada!');
      queryClient.invalidateQueries({ queryKey: ['contrato-detalhes', id] });
    },
    onError: (err: any) => toast.error(`Erro ao reenviar: ${err.message || 'Erro desconhecido'}`)
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('clicksign-cancel', {
        body: { contrato_id: id }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Contrato cancelado');
      queryClient.invalidateQueries({ queryKey: ['contrato-detalhes', id] });
    },
    onError: (err: any) => toast.error(`Erro ao cancelar: ${err.message || 'Erro desconhecido'}`)
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      console.log('📤 [DETALHES] Enviando contrato para ClickSign...');
      const { data, error } = await supabase.functions.invoke('clicksign-create-contract', {
        body: { contrato_id: id }
      });
      
      console.log('📥 [DETALHES] Resposta ClickSign:', { data, error });
      
      if (error) {
        console.error('❌ [DETALHES] Erro ClickSign:', error);
        throw new Error(error.message || 'Erro ao enviar para ClickSign');
      }
      
      if (data?.error) {
        console.error('❌ [DETALHES] Erro na resposta:', data.error);
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: () => {
      toast.success('Contrato enviado para assinatura!');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['contrato-detalhes', id] });
    },
    onError: (err: any) => {
      console.error('❌ [DETALHES] Mutation error:', err);
      toast.error(`Erro ao enviar: ${err.message || 'Erro desconhecido'}`);
    }
  });

  const saveClausulasMutation = useMutation({
    mutationFn: async (clausulas: string) => {
      const { error } = await supabase
        .from('contratos_legais')
        .update({ clausulas_especiais: clausulas })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cláusulas salvas!');
      queryClient.invalidateQueries({ queryKey: ['contrato-detalhes', id] });
    },
    onError: () => toast.error('Erro ao salvar')
  });

  const handleDownloadPDF = async () => {
    if (!contrato) return;
    try {
      const exporter = new ContractPDFExporter();
      await exporter.generateContractPDF({
        ...contrato,
        lista_predios: listaPredios,
        parcelas: parcelas
      });
      toast.success('PDF gerado!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error('Erro ao gerar PDF');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#9C1E1E]" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-4">
        <Card className="max-w-md mx-auto p-6 text-center bg-white/80">
          <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-2">Contrato não encontrado</h2>
          <Button size="sm" onClick={() => navigate(buildPath('juridico'))}>
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  const status = statusConfig[contrato.status] || statusConfig.rascunho;
  const StatusIcon = status.icon;
  const listaPredios = Array.isArray(contrato.lista_predios) ? contrato.lista_predios : [];
  const parcelas = Array.isArray(contrato.parcelas) ? contrato.parcelas : [];
  const totalPaineis = listaPredios.reduce((acc: number, p: any) => acc + (p.quantidade_telas || 1), 0);

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatDateTime = (date: string | null) => {
    if (!date) return '—';
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const timelineSteps = [
    { key: 'created', label: 'Criado', date: contrato.created_at, done: true },
    { key: 'sent', label: 'Enviado', date: contrato.enviado_em, done: !!contrato.enviado_em },
    { key: 'viewed', label: 'Visualizado', date: contrato.visualizado_em, done: !!contrato.visualizado_em },
    { key: 'signed', label: 'Assinado', date: contrato.assinado_em, done: !!contrato.assinado_em }
  ];

  const tipoContratoLabel = contrato.tipo_contrato === 'comodato' ? 'Comodato (Síndico)' : 
                           contrato.tipo_contrato === 'sindico' ? 'Síndico' : 'Anunciante';
  
  const tipoProdutoLabel = contrato.tipo_produto === 'vertical_premium' ? 'Vertical Premium' : 'Horizontal Padrão';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(buildPath('juridico'))}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold">{contrato.numero_contrato}</h1>
                <Badge className={`${status.color} text-white text-[10px] px-1.5 py-0`}>
                  {status.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[180px]">{contrato.cliente_nome}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver Prévia
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </DropdownMenuItem>
              {contrato.status === 'rascunho' && (
                <DropdownMenuItem onClick={() => setEditorOpen(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar Cláusulas
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {contrato.status === 'assinado' && contrato.clicksign_download_url && (
                <DropdownMenuItem onClick={() => window.open(contrato.clicksign_download_url, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Assinado
                </DropdownMenuItem>
              )}
              {['enviado', 'visualizado'].includes(contrato.status) && (
                <>
                  <DropdownMenuItem onClick={() => resendMutation.mutate()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reenviar Notificação
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => cancelMutation.mutate()} className="text-red-600">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar Contrato
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Alerta se rascunho sem envio */}
        {contrato.status === 'rascunho' && !contrato.clicksign_envelope_id && (
          <Card className="p-3 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-800">Contrato não enviado</p>
                <p className="text-[10px] text-amber-700">Clique em "Enviar para Assinatura" para enviar ao cliente via ClickSign.</p>
              </div>
            </div>
          </Card>
        )}

        {/* ALERTA CRÍTICO: Estado inconsistente - status='enviado' mas sem envelope */}
        {contrato.status === 'enviado' && !contrato.clicksign_envelope_id && (
          <Card className="p-3 bg-red-50 border-red-300">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-red-800">⚠️ Erro de Envio Detectado</p>
                <p className="text-[10px] text-red-700 mb-2">
                  O contrato está marcado como "enviado" mas não foi transmitido ao ClickSign. 
                  Clique abaixo para reenviar.
                </p>
                <Button 
                  size="sm" 
                  className="h-7 text-xs bg-red-600 hover:bg-red-700"
                  onClick={() => sendMutation.mutate()}
                  disabled={sendMutation.isPending}
                >
                  {sendMutation.isPending ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3 mr-1.5" />
                      Reenviar para ClickSign
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Timeline Horizontal */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center justify-between overflow-x-auto scrollbar-hide">
            {timelineSteps.map((step, i, arr) => (
              <div key={step.key} className="contents">
                <div className={`flex flex-col items-center min-w-[60px] ${step.done ? 'text-[#9C1E1E]' : 'text-gray-300'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    step.done ? 'bg-[#9C1E1E] text-white' : 'bg-gray-100'
                  }`}>
                    {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-[10px] mt-1 font-medium">{step.label}</span>
                  {step.date && (
                    <span className="text-[9px] text-muted-foreground">
                      {format(new Date(step.date), "dd/MM HH:mm")}
                    </span>
                  )}
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 min-w-[20px] ${step.done ? 'bg-[#9C1E1E]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Preview Button */}
        <Card 
          className="p-4 bg-gradient-to-br from-gray-50 to-white border-dashed border-2 border-gray-200 cursor-pointer hover:border-[#9C1E1E]/30 transition-colors"
          onClick={() => setPreviewOpen(true)}
        >
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-5 w-5 text-[#9C1E1E]" />
            <div className="text-center">
              <p className="text-sm font-medium">Ver Prévia do Contrato</p>
              <p className="text-[10px] text-muted-foreground">Visualize o documento completo</p>
            </div>
          </div>
        </Card>

        {/* Accordion com todas as informações */}
        <Accordion type="multiple" defaultValue={['cliente', 'periodo', 'clicksign']} className="space-y-2">
          {/* Cliente */}
          <AccordionItem value="cliente" className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl overflow-hidden">
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-[#9C1E1E]" />
                <span className="font-semibold text-sm">Cliente</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground text-[10px]">Nome</p>
                    <p className="font-medium">{contrato.cliente_nome || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">Cargo</p>
                    <p className="font-medium">{contrato.cliente_cargo || '—'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground text-[10px]">CNPJ</p>
                    <p className="font-medium font-mono">{contrato.cliente_cnpj || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">Razão Social</p>
                    <p className="font-medium">{contrato.cliente_razao_social || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{contrato.cliente_email || '—'}</span>
                  {contrato.cliente_email && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(contrato.cliente_email, 'Email')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1">{contrato.cliente_telefone || '—'}</span>
                  {contrato.cliente_telefone && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => copyToClipboard(contrato.cliente_telefone, 'Telefone')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground text-[10px]">Segmento</p>
                    <p className="font-medium">{contrato.cliente_segmento || '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">Cidade</p>
                    <p className="font-medium">{contrato.cliente_cidade || '—'}</p>
                  </div>
                </div>

                {contrato.cliente_endereco && (
                  <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                    <span className="flex-1 text-[11px]">{contrato.cliente_endereco}</span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Período & Valores */}
          <AccordionItem value="periodo" className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl overflow-hidden">
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#9C1E1E]" />
                <span className="font-semibold text-sm">Período & Valores</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-3">
                {/* Valores em destaque */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-emerald-50 rounded-xl text-center">
                    <p className="text-[10px] text-emerald-600 font-medium">Valor Total</p>
                    <p className="text-lg font-bold text-emerald-700">{formatCurrency(contrato.valor_total)}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl text-center">
                    <p className="text-[10px] text-blue-600 font-medium">Valor Mensal</p>
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(contrato.valor_mensal)}</p>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo Contrato</span>
                    <span className="font-medium">{tipoContratoLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produto</span>
                    <span className="font-medium">{tipoProdutoLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-medium">{contrato.plano_meses} meses</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dia Vencimento</span>
                    <span className="font-medium">Dia {contrato.dia_vencimento || '10'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Início</span>
                    <span className="font-medium">{formatDate(contrato.data_inicio)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fim</span>
                    <span className="font-medium">{formatDate(contrato.data_fim)}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Método Pagamento</span>
                    <span className="font-medium capitalize">{contrato.metodo_pagamento?.replace(/_/g, ' ') || '—'}</span>
                  </div>
                </div>

                {/* Parcelas */}
                {parcelas.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">PARCELAS ({parcelas.length})</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {parcelas.map((parcela: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-xs">
                          <span className="font-medium">#{parcela.installment || index + 1}</span>
                          <span className="text-muted-foreground">{formatDate(parcela.due_date)}</span>
                          <span className="font-bold">{formatCurrency(parcela.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Prédios */}
          <AccordionItem value="predios" className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl overflow-hidden">
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#9C1E1E]" />
                <span className="font-semibold text-sm">Prédios ({listaPredios.length})</span>
                <Badge variant="secondary" className="text-[9px] ml-auto mr-2">{totalPaineis} painéis</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {listaPredios.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum prédio vinculado</p>
                ) : (
                  listaPredios.map((predio: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{predio.building_name || predio.nome}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{predio.bairro} - {predio.endereco}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Monitor className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{predio.quantidade_telas || 1}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ClickSign */}
          <AccordionItem value="clicksign" className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl overflow-hidden">
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-[#9C1E1E]" />
                <span className="font-semibold text-sm">ClickSign</span>
                {contrato.clicksign_envelope_id ? (
                  <Badge className="bg-emerald-500 text-white text-[9px] ml-auto mr-2">Conectado</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] ml-auto mr-2">Não enviado</Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-muted-foreground">Envelope ID</span>
                    <span className="font-mono text-[10px]">{contrato.clicksign_envelope_id || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-muted-foreground">Document Key</span>
                    <span className="font-mono text-[10px]">{contrato.clicksign_document_key || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-muted-foreground">Signer Key</span>
                    <span className="font-mono text-[10px]">{contrato.clicksign_signer_key || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Enviado em</span>
                    <span className="font-medium">{formatDateTime(contrato.enviado_em)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Visualizado em</span>
                    <span className="font-medium">{formatDateTime(contrato.visualizado_em)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Assinado em</span>
                    <span className="font-medium">{formatDateTime(contrato.assinado_em)}</span>
                  </div>
                  {contrato.prazo_assinatura && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Prazo Assinatura</span>
                      <span className="font-medium">{formatDateTime(contrato.prazo_assinatura)}</span>
                    </div>
                  )}
                </div>

                {contrato.clicksign_download_url && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2 h-8"
                    onClick={() => window.open(contrato.clicksign_download_url, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    Abrir no ClickSign
                  </Button>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Histórico */}
          <AccordionItem value="historico" className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl overflow-hidden">
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#9C1E1E]" />
                <span className="font-semibold text-sm">Histórico</span>
                <Badge variant="secondary" className="text-[9px] ml-auto mr-2">{logs?.length || 0}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {!logs || logs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Nenhum registro</p>
                ) : (
                  logs.map((log: any) => (
                    <div key={log.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#9C1E1E] mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{log.acao}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDateTime(log.created_at)}
                        </p>
                        {log.detalhes && (
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            {typeof log.detalhes === 'object' ? JSON.stringify(log.detalhes).slice(0, 100) : log.detalhes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* IDs Técnicos */}
          <AccordionItem value="tecnico" className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl overflow-hidden">
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#9C1E1E]" />
                <span className="font-semibold text-sm">IDs Técnicos</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-muted-foreground">Contrato ID</span>
                  <span className="font-mono text-[10px]">{contrato.id}</span>
                </div>
                {contrato.pedido_id && (
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-muted-foreground">Pedido ID</span>
                    <span className="font-mono text-[10px]">{contrato.pedido_id}</span>
                  </div>
                )}
                {contrato.proposta_id && (
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="text-muted-foreground">Proposta ID</span>
                    <span className="font-mono text-[10px]">{contrato.proposta_id}</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-muted-foreground">Criado em</span>
                  <span className="font-medium">{formatDateTime(contrato.created_at)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="text-muted-foreground">Atualizado em</span>
                  <span className="font-medium">{formatDateTime(contrato.updated_at)}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 p-3 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-50" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {contrato.status === 'rascunho' && (
          <Button 
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending}
            className="w-full bg-[#9C1E1E] hover:bg-[#7D1818] h-11"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar para Assinatura
          </Button>
        )}
        {['enviado', 'visualizado'].includes(contrato.status) && (
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              className="flex-1 h-11"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reenviar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex-1 h-11"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
        {contrato.status === 'assinado' && contrato.clicksign_download_url && (
          <Button 
            onClick={() => window.open(contrato.clicksign_download_url, '_blank')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF Assinado
          </Button>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl h-[90vh] p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#9C1E1E]" />
              Prévia do Contrato - {contrato.numero_contrato}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 h-[calc(90vh-120px)]">
            <div className="p-4">
              <ContractPreview
                data={{
                  ...contrato,
                  lista_predios: listaPredios,
                  parcelas: parcelas
                }}
              />
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)} className="flex-1">
              Fechar
            </Button>
            <Button onClick={handleDownloadPDF} className="flex-1 bg-[#9C1E1E] hover:bg-[#7D1818]">
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor Modal */}
      {editorOpen && (
        <FullscreenContractEditor
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          initialContent={contrato.clausulas_especiais || ''}
          onSave={(clausulas) => saveClausulasMutation.mutate(clausulas)}
        />
      )}
    </div>
  );
};

export default ContratoDetalhesPage;
