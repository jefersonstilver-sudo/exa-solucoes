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
  MoreVertical
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
} from '@/components/ui/dropdown-menu';

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

  const { data: contrato, isLoading } = useQuery({
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
    onError: () => toast.error('Erro ao reenviar')
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
    onError: () => toast.error('Erro ao cancelar')
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('clicksign-create-contract', {
        body: { contrato_id: id }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Contrato enviado para assinatura!');
      queryClient.invalidateQueries({ queryKey: ['contrato-detalhes', id] });
    },
    onError: () => toast.error('Erro ao enviar')
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

  const formatCurrency = (value: number | null) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const timelineSteps = [
    { key: 'created', label: 'Criado', date: contrato.created_at, done: true },
    { key: 'sent', label: 'Enviado', date: contrato.enviado_em, done: !!contrato.enviado_em },
    { key: 'viewed', label: 'Visualizado', date: contrato.visualizado_em, done: !!contrato.visualizado_em },
    { key: 'signed', label: 'Assinado', date: contrato.assinado_em, done: !!contrato.assinado_em }
  ];

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
            <DropdownMenuContent align="end">
              {contrato.status === 'rascunho' && (
                <>
                  <DropdownMenuItem onClick={() => setEditorOpen(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar Cláusulas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    try {
                      const exporter = new ContractPDFExporter();
                      await exporter.generateContractPDF({
                        ...contrato,
                        lista_predios: listaPredios,
                        parcelas: Array.isArray(contrato.parcelas) ? contrato.parcelas : []
                      });
                      toast.success('PDF gerado!');
                    } catch (err) {
                      toast.error('Erro ao gerar PDF');
                    }
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </DropdownMenuItem>
                </>
              )}
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
                    Reenviar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => cancelMutation.mutate()} className="text-red-600">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Timeline Horizontal */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center justify-between overflow-x-auto scrollbar-hide">
            {timelineSteps.map((step, i, arr) => (
              <React.Fragment key={step.key}>
                <div className={`flex flex-col items-center min-w-[60px] ${step.done ? 'text-[#9C1E1E]' : 'text-gray-300'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    step.done ? 'bg-[#9C1E1E] text-white' : 'bg-gray-100'
                  }`}>
                    {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-[10px] mt-1 font-medium">{step.label}</span>
                  {step.date && (
                    <span className="text-[9px] text-muted-foreground">
                      {format(new Date(step.date), "dd/MM")}
                    </span>
                  )}
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 min-w-[20px] ${step.done ? 'bg-[#9C1E1E]' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>

        {/* Cliente */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Cliente</h3>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-xs">Nome</span>
              <span className="font-medium text-xs">{contrato.cliente_nome}</span>
            </div>
            {contrato.cliente_cnpj && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">CNPJ</span>
                <span className="text-xs">{contrato.cliente_cnpj}</span>
              </div>
            )}
            {contrato.cliente_email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Email</span>
                <span className="text-xs truncate ml-2 max-w-[150px]">{contrato.cliente_email}</span>
              </div>
            )}
            {contrato.cliente_telefone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-xs">Telefone</span>
                <span className="text-xs">{contrato.cliente_telefone}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Valores */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Valores</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <p className="text-[10px] text-muted-foreground">Total</p>
              <p className="text-base font-bold text-emerald-600">{formatCurrency(contrato.valor_total)}</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-[10px] text-muted-foreground">Mensal</p>
              <p className="text-base font-bold">{formatCurrency(contrato.valor_mensal)}</p>
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-muted-foreground">Duração</span>
            <span className="font-medium">{contrato.plano_meses} meses</span>
          </div>
        </Card>

        {/* Prédios */}
        <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-[#9C1E1E]" />
            <h3 className="font-semibold text-sm">Prédios ({listaPredios.length})</h3>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {listaPredios.map((predio: any, index: number) => (
              <div key={index} className="flex justify-between text-xs p-1.5 bg-gray-50 rounded">
                <span className="truncate">{predio.building_name || predio.nome}</span>
                <span className="text-muted-foreground">{predio.quantidade_telas || 1} tela(s)</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Histórico */}
        {logs && logs.length > 0 && (
          <Card className="p-3 bg-white/80 backdrop-blur-sm border-white/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-[#9C1E1E]" />
              <h3 className="font-semibold text-sm">Histórico</h3>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {logs.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#9C1E1E] mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">{log.acao}</span>
                    <span className="text-muted-foreground ml-2">
                      {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl border-t border-gray-100 safe-area-bottom">
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

      {/* Editor Modal */}
      {editorOpen && (
        <FullscreenContractEditor
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          initialContent={contrato.clausulas_especiais || ''}
          onSave={(clausulas) => saveClausulasMutation.mutate(clausulas)}
          title={`Editar Cláusulas - ${contrato.numero_contrato}`}
        />
      )}
    </div>
  );
};

export default ContratoDetalhesPage;
