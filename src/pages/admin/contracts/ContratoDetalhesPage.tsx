import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Maximize2,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ContractPreview from '@/components/admin/contracts/ContractPreview';
import FullscreenContractEditor from '@/components/admin/contracts/FullscreenContractEditor';
import { ContractPDFExporter } from '@/components/admin/contracts/ContractPDFExporter';

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

  // Reenviar notificação
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
    onError: () => {
      toast.error('Erro ao reenviar');
    }
  });

  // Cancelar contrato
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
    onError: () => {
      toast.error('Erro ao cancelar');
    }
  });

  // Enviar para assinatura (rascunho)
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
    onError: () => {
      toast.error('Erro ao enviar');
    }
  });

  // Salvar cláusulas especiais
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
    onError: () => {
      toast.error('Erro ao salvar');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6">
        <Card className="max-w-md mx-auto p-8 text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Contrato não encontrado</h2>
          <Button onClick={() => navigate(buildPath('juridico'))}>
            Voltar para Lista
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(buildPath('juridico'))}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <FileSignature className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold">{contrato.numero_contrato}</h1>
                <Badge className={`${status.color} text-white`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{contrato.cliente_nome}</p>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {contrato.status === 'rascunho' && (
            <>
              <Button 
                variant="outline"
                onClick={async () => {
                  try {
                    const exporter = new ContractPDFExporter();
                    await exporter.generateContractPDF({
                      ...contrato,
                      lista_predios: Array.isArray(contrato.lista_predios) ? contrato.lista_predios : [],
                      parcelas: Array.isArray(contrato.parcelas) ? contrato.parcelas : []
                    });
                    toast.success('PDF gerado com sucesso!');
                  } catch (err) {
                    console.error('Erro ao gerar PDF:', err);
                    toast.error('Erro ao gerar PDF');
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Gerar HTML editável para abrir no Word/Google Docs
                  const parcelas = Array.isArray(contrato.parcelas) ? contrato.parcelas : [];
                  const predios = Array.isArray(contrato.lista_predios) ? contrato.lista_predios : [];
                  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
                  
                  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${contrato.numero_contrato}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #9C1E1E; text-align: center; border-bottom: 2px solid #9C1E1E; padding-bottom: 10px; }
    h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background: #f5f5f5; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item { margin-bottom: 10px; }
    .info-label { font-size: 12px; color: #666; }
    .info-value { font-weight: bold; }
    .signature-area { margin-top: 60px; display: flex; justify-content: space-around; }
    .signature-box { text-align: center; width: 40%; }
    .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 10px; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(200,200,200,0.3); z-index: -1; }
  </style>
</head>
<body>
  <div class="watermark">RASCUNHO</div>
  <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS<br><small style="font-size: 14px; color: #666;">${contrato.numero_contrato}</small></h1>
  
  <h2>CONTRATADA</h2>
  <p><strong>EXA MÍDIA LTDA</strong><br>CNPJ: 42.538.968/0001-06<br>Av. Paraná, 3695 - 2º Andar, Centro - Foz do Iguaçu/PR</p>
  
  <h2>CONTRATANTE</h2>
  <div class="info-grid">
    <div class="info-item"><div class="info-label">Nome/Razão Social</div><div class="info-value">${contrato.cliente_razao_social || contrato.cliente_nome}</div></div>
    <div class="info-item"><div class="info-label">CNPJ/CPF</div><div class="info-value">${contrato.cliente_cnpj || '-'}</div></div>
    <div class="info-item"><div class="info-label">E-mail</div><div class="info-value">${contrato.cliente_email}</div></div>
    <div class="info-item"><div class="info-label">Telefone</div><div class="info-value">${contrato.cliente_telefone || '-'}</div></div>
  </div>
  
  <h2>OBJETO</h2>
  <p>${contrato.objeto || 'Prestação de serviços de veiculação de publicidade em mídia digital indoor (painéis digitais em elevadores).'}</p>
  
  <h2>LOCAIS DE VEICULAÇÃO</h2>
  <table>
    <thead><tr><th>Prédio</th><th>Bairro</th><th>Telas</th></tr></thead>
    <tbody>
      ${predios.map((p: any) => `<tr><td>${p.building_name || p.nome}</td><td>${p.bairro || '-'}</td><td>${p.quantidade_telas || 1}</td></tr>`).join('')}
    </tbody>
  </table>
  
  <h2>CONDIÇÕES FINANCEIRAS</h2>
  ${contrato.metodo_pagamento === 'custom' ? `
  <p><strong>Condição Personalizada</strong></p>
  <table>
    <thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th></tr></thead>
    <tbody>
      ${parcelas.map((p: any, i: number) => `<tr><td>${i + 1}ª</td><td>${p.due_date ? new Date(p.due_date).toLocaleDateString('pt-BR') : '-'}</td><td>${formatCurrency(p.amount)}</td></tr>`).join('')}
    </tbody>
  </table>
  <p><strong>Valor Total:</strong> ${formatCurrency(contrato.valor_total || 0)}</p>
  ` : `
  <p><strong>Valor Mensal:</strong> ${formatCurrency(contrato.valor_mensal || 0)}</p>
  <p><strong>Duração:</strong> ${contrato.plano_meses} meses</p>
  <p><strong>Valor Total:</strong> ${formatCurrency(contrato.valor_total || 0)}</p>
  `}
  
  <h2>CLÁUSULAS CONTRATUAIS</h2>
  <p><strong>1. DA VIGÊNCIA</strong><br>O presente contrato terá vigência de ${contrato.plano_meses || 1} meses.</p>
  <p><strong>2. DO CONTEÚDO</strong><br>O CONTRATANTE é integralmente responsável pelo conteúdo publicitário veiculado.</p>
  <p><strong>3. DAS ESPECIFICAÇÕES TÉCNICAS</strong><br>Os vídeos devem ter: duração de 15 segundos, formato horizontal (16:9), resolução mínima de 1920x1080, sem áudio.</p>
  <p><strong>4. DA APROVAÇÃO</strong><br>O material publicitário está sujeito à aprovação da CONTRATADA.</p>
  <p><strong>5. DO PAGAMENTO</strong><br>Os pagamentos deverão ser realizados conforme condição estabelecida.</p>
  <p><strong>6. DA RESCISÃO</strong><br>A rescisão antecipada implica multa de 30% do valor restante.</p>
  <p><strong>7. DO USO DE IMAGEM</strong><br>O CONTRATANTE autoriza uso de imagens para divulgação e portfólio.</p>
  ${contrato.clausulas_especiais ? `<p><strong>8. CLÁUSULAS ESPECIAIS</strong><br>${contrato.clausulas_especiais}</p>` : ''}
  
  <div class="signature-area">
    <div class="signature-box">
      <div class="signature-line">EXA MÍDIA LTDA<br><small>CONTRATADA</small></div>
    </div>
    <div class="signature-box">
      <div class="signature-line">${contrato.cliente_nome}<br><small>CONTRATANTE</small></div>
    </div>
  </div>
</body>
</html>`;
                  
                  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${contrato.numero_contrato}_editavel.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Arquivo editável baixado!');
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Baixar Editável
              </Button>
              <Button 
                variant="outline"
                onClick={() => setEditorOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Cláusulas
              </Button>
              <Button 
                onClick={() => sendMutation.mutate()}
                disabled={sendMutation.isPending}
                className="bg-primary"
              >
                {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar para Assinatura
              </Button>
            </>
          )}
          {['enviado', 'visualizado'].includes(contrato.status) && (
            <>
              <Button 
                variant="outline"
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
              >
                {resendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Reenviar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </>
          )}
          {contrato.status === 'assinado' && contrato.clicksign_download_url && (
            <Button onClick={() => window.open(contrato.clicksign_download_url, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF Assinado
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4">Timeline</h3>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {[
                { key: 'created', label: 'Criado', date: contrato.created_at, done: true },
                { key: 'sent', label: 'Enviado', date: contrato.enviado_em, done: !!contrato.enviado_em },
                { key: 'viewed', label: 'Visualizado', date: contrato.visualizado_em, done: !!contrato.visualizado_em },
                { key: 'signed', label: 'Assinado', date: contrato.assinado_em, done: !!contrato.assinado_em }
              ].map((step, i, arr) => (
                <React.Fragment key={step.key}>
                  <div className={`flex flex-col items-center min-w-[80px] ${step.done ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.done ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {step.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </div>
                    <span className="text-xs mt-1 font-medium">{step.label}</span>
                    {step.date && (
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(step.date), "dd/MM HH:mm")}
                      </span>
                    )}
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`flex-1 h-0.5 min-w-[20px] ${step.done ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </Card>

          {/* Dados do Cliente */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Dados do Cliente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Nome</p>
                <p className="font-medium">{contrato.cliente_nome}</p>
              </div>
              <div>
                <p className="text-muted-foreground">E-mail</p>
                <p className="font-medium">{contrato.cliente_email}</p>
              </div>
              <div>
                <p className="text-muted-foreground">CNPJ</p>
                <p className="font-medium">{contrato.cliente_cnpj || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Razão Social</p>
                <p className="font-medium">{contrato.cliente_razao_social || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p className="font-medium">{contrato.cliente_telefone || '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Segmento</p>
                <p className="font-medium">{contrato.cliente_segmento || '-'}</p>
              </div>
            </div>
          </Card>

          {/* Prédios */}
          {listaPredios.length > 0 && (
            <Card className="p-6 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Locais Contratados</h3>
              </div>
              <div className="space-y-2">
                {listaPredios.map((predio: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{predio.nome || predio.building_name}</p>
                      <p className="text-sm text-muted-foreground">{predio.bairro}</p>
                    </div>
                    <span className="text-sm">{predio.quantidade_telas || 1} tela(s)</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Preview do Contrato */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4">Prévia do Contrato</h3>
            <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
              <ContractPreview data={{
                ...contrato,
                lista_predios: Array.isArray(contrato.lista_predios) ? contrato.lista_predios : [],
                parcelas: Array.isArray(contrato.parcelas) ? contrato.parcelas : []
              }} />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Valores */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Valores</h3>
            </div>
            <div className="space-y-3">
              {contrato.metodo_pagamento === 'custom' ? (
                <>
                  <div className="mb-2">
                    <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-1 rounded">
                      Condição Personalizada
                    </span>
                  </div>
                  {Array.isArray(contrato.parcelas) && contrato.parcelas.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{i + 1}ª Parcela ({p.due_date ? new Date(p.due_date).toLocaleDateString('pt-BR') : '-'})</span>
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Mensal</span>
                    <span className="font-semibold">{formatCurrency(contrato.valor_mensal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração</span>
                    <span className="font-semibold">{contrato.plano_meses} meses</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-medium">Total</span>
                <span className="font-bold text-primary">{formatCurrency(contrato.valor_total)}</span>
              </div>
            </div>
          </Card>

          {/* Datas */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Datas</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em</span>
                <span>{format(new Date(contrato.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
              {contrato.data_inicio && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Início</span>
                  <span>{format(new Date(contrato.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              )}
              {contrato.dia_vencimento && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimento</span>
                  <span>Dia {contrato.dia_vencimento}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Histórico de Logs */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4">Histórico</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {logs?.map(log => (
                <div key={log.id} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium capitalize">{log.acao}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
              {(!logs || logs.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento registrado
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Editor de Cláusulas Especiais em Tela Cheia */}
      <FullscreenContractEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        initialContent={contrato.clausulas_especiais || ''}
        onSave={(content) => saveClausulasMutation.mutate(content)}
        title={`Editar Cláusulas - ${contrato.numero_contrato}`}
      />
    </div>
  );
};

export default ContratoDetalhesPage;
