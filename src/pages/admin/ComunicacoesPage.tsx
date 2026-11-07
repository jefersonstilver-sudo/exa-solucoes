import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pagina, Cabecalho, Busca, Pilulas, Kpi, Chip, TOM, Avatar, Carregando, Vazio, BOTAO2, vidro } from '@/components/admin/ui/exa';
import { 
  Mail, 
  Send, 
  FileText, 
  TrendingUp, 
  Search, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Video,
  Shield,
  Gift,
  Download,
  Eye,
  RefreshCw,
  ExternalLink,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEmailStats } from '@/hooks/useEmailStats';
import { useEmailHistory } from '@/hooks/useEmailHistory';
import EmailTemplatePreviewDialog from '@/components/admin/emails/EmailTemplatePreviewDialog';
import { EmailTemplateSyncButton } from '@/components/admin/emails/EmailTemplateSyncButton';
import AdminPeriodSelector, { PeriodType, getPeriodDates } from '@/components/admin/common/AdminPeriodSelector';

interface EmailTemplate {
  id: string;
  name: string;
  category: 'auth' | 'admin' | 'video' | 'benefits';
  description: string;
  icon: React.ReactNode;
}

interface EmailStats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
}

const ComunicacoesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodType>('current_month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    templateId: string;
    templateName: string;
    templateCategory: string;
  }>({
    open: false,
    templateId: '',
    templateName: '',
    templateCategory: '',
  });

  const { start, end } = getPeriodDates(periodFilter, customStartDate, customEndDate);
  
  // Calcular dias para fetchAll
  const days = start && end 
    ? Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    : 365 * 10;
  const fetchAll = periodFilter === 'all';
  
  const { stats, loading: statsLoading, refetch: refetchStats } = useEmailStats(days, fetchAll);
  const { emails, loading: historyLoading, totalCount, refetch: refetchHistory } = useEmailHistory(days, fetchAll);

  const handlePeriodChange = (period: PeriodType) => {
    setPeriodFilter(period);
  };

  const handleCustomDateChange = (start: Date | undefined, end: Date | undefined) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  // Templates disponíveis
  const templates: EmailTemplate[] = [
    {
      id: 'confirmation',
      name: 'Confirmação de Email',
      category: 'auth',
      description: 'Email de boas-vindas com link de confirmação para novos usuários',
      icon: <CheckCircle2 className="h-5 w-5" />
    },
    {
      id: 'resend_confirmation',
      name: 'Reenvio de Confirmação',
      category: 'auth',
      description: 'Reenvio do link de confirmação quando solicitado pelo usuário',
      icon: <Clock className="h-5 w-5" />
    },
    {
      id: 'password_recovery',
      name: 'Recuperação de Senha',
      category: 'auth',
      description: 'Email com link seguro para redefinir senha',
      icon: <Shield className="h-5 w-5" />
    },
    {
      id: 'admin_welcome',
      name: 'Boas-vindas Admin',
      category: 'admin',
      description: 'Email de boas-vindas para novos administradores com credenciais',
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'video_submitted',
      name: 'Vídeo Recebido',
      category: 'video',
      description: 'Confirmação de recebimento de vídeo para análise',
      icon: <Video className="h-5 w-5" />
    },
    {
      id: 'video_approved',
      name: 'Vídeo Aprovado',
      category: 'video',
      description: 'Notificação de aprovação com detalhes da campanha',
      icon: <CheckCircle2 className="h-5 w-5" />
    },
    {
      id: 'video_rejected',
      name: 'Vídeo Precisa Ajustes',
      category: 'video',
      description: 'Notificação de rejeição com motivos e orientações',
      icon: <AlertCircle className="h-5 w-5" />
    },
    {
      id: 'benefit_invitation',
      name: 'Convite Presente',
      category: 'benefits',
      description: 'Convite para prestador escolher presente de ativação',
      icon: <Gift className="h-5 w-5" />
    },
    {
      id: 'benefit_code',
      name: 'Código do Presente',
      category: 'benefits',
      description: 'Envio do código/link do presente escolhido',
      icon: <Gift className="h-5 w-5" />
    }
  ];

  const openPreview = (template: EmailTemplate) => {
    setPreviewDialog({
      open: true,
      templateId: template.id,
      templateName: template.name,
      templateCategory: template.category,
    });
  };

  const categoryColors: Record<string, string> = {
    auth: 'bg-blue-500/10 text-blue-700 border-blue-200',
    admin: 'bg-purple-500/10 text-purple-700 border-purple-200',
    video: 'bg-green-500/10 text-green-700 border-green-200',
    benefits: 'bg-orange-500/10 text-orange-700 border-orange-200'
  };

  const categoryNames: Record<string, string> = {
    auth: 'Autenticação',
    admin: 'Administrativo',
    video: 'Vídeos',
    benefits: 'Benefícios'
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const [aba, setAba] = useState<'historico' | 'templates'>('historico');
  const STATUS: Record<string, { l: string; tom: keyof typeof TOM }> = {
    delivered: { l: 'entregue', tom: 'verde' }, sent: { l: 'enviado', tom: 'azul' }, opened: { l: 'aberto', tom: 'roxo' }, clicked: { l: 'clicado', tom: 'ambar' }, bounced: { l: 'rejeitado', tom: 'vermelho' }, failed: { l: 'falhou', tom: 'vermelho' },
  };
  const CAT_TOM: Record<string, keyof typeof TOM> = { auth: 'azul', video: 'roxo', benefits: 'verde', order: 'ambar', system: 'cinza' };
  const quandoE = (iso: string) => format(new Date(iso), "dd/MM HH:mm", { locale: ptBR });
  const falhas = emails.filter((e) => ['bounced', 'failed'].includes(e.status)).length;
  return (
    <Pagina>
      <Cabecalho
        titulo="E-mails"
        sub="O que o sistema mandou (Resend, de noreply@examidia.com.br), quem abriu e os modelos de cada mensagem."
        acoes={(
          <>
            <AdminPeriodSelector value={periodFilter} onChange={handlePeriodChange} customStartDate={customStartDate} customEndDate={customEndDate} onCustomDateChange={handleCustomDateChange} />
            <button type="button" className={BOTAO2} onClick={() => { refetchHistory(); refetchStats(); }} disabled={historyLoading} title="Atualizar"><RefreshCw className={`h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} /></button>
          </>
        )}
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Kpi rotulo="Enviados" valor={statsLoading ? '…' : stats.sent.toLocaleString('pt-BR')} sub={`${stats.total.toLocaleString('pt-BR')} no período`} icone={Send} />
        <Kpi rotulo="Abertura" valor={statsLoading ? '…' : `${stats.openRate.toFixed(0)}%`} sub={`${stats.opened.toLocaleString('pt-BR')} abertos`} icone={Eye} cor="#1E6B47" />
        <Kpi rotulo="Cliques" valor={statsLoading ? '…' : `${stats.clickRate.toFixed(0)}%`} sub={`${stats.clicked.toLocaleString('pt-BR')} cliques`} icone={ExternalLink} cor="#2B4C8C" />
        <Kpi rotulo="Falhas" valor={historyLoading ? '…' : falhas} sub="rejeitados ou com erro" icone={AlertCircle} cor={falhas ? '#B0261D' : '#17181A'} />
      </div>

      <Busca valor={searchTerm} onChange={setSearchTerm} placeholder={aba === 'historico' ? 'Assunto ou destinatário' : 'Nome do modelo'}>
        <Pilulas valor={aba} onChange={(v) => setAba(v as any)} opcoes={[{ valor: 'historico', rotulo: 'Enviados', n: totalCount }, { valor: 'templates', rotulo: 'Modelos', n: templates.length }]} />
        {aba === 'templates' && (
          <>
            <Pilulas valor={selectedCategory} onChange={setSelectedCategory} opcoes={[{ valor: 'all', rotulo: 'Todos' }, { valor: 'auth', rotulo: 'Conta' }, { valor: 'video', rotulo: 'Vídeos' }, { valor: 'benefits', rotulo: 'Benefícios' }]} />
            <EmailTemplateSyncButton />
          </>
        )}
      </Busca>

      {aba === 'historico' ? (
        historyLoading ? <Carregando texto="Carregando e-mails…" /> : (() => {
          const q = searchTerm.trim().toLowerCase();
          const lista = emails.filter((e) => !q || [e.subject, e.recipient_email, e.recipient_name].some((x) => String(x || '').toLowerCase().includes(q)));
          return !lista.length ? <Vazio icone={<Mail className="h-5 w-5" />} titulo="Nenhum e-mail no período" /> : (
            <div className={`${vidro} overflow-hidden rounded-[22px]`}>
              <ul className="divide-y divide-black/[0.06]">
                {lista.map((email) => {
                  const st = STATUS[email.status] || STATUS.sent;
                  return (
                    <li key={email.id} className="flex items-start gap-3 px-3 py-2.5 md:px-4">
                      <Avatar nome={email.recipient_name || email.recipient_email} tamanho={38} cor={TOM[st.tom].cor} />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="truncate text-[14px] font-bold">{email.subject}</span><Chip {...TOM[st.tom]}>{st.l}</Chip></span>
                        <span className="block truncate text-[12.5px] text-[#6A6B70]">para {email.recipient_name ? `${email.recipient_name} · ` : ''}{email.recipient_email}{email.opened_at ? ` · aberto ${quandoE(email.opened_at)}` : ''}{email.clicked_at ? ` · clicou ${quandoE(email.clicked_at)}` : ''}</span>
                        {email.error_message && <span className="mt-1 block rounded-lg bg-[#FDECEC] px-2 py-1 text-[12px] text-[#B0261D]">{email.error_message}</span>}
                      </span>
                      <span className="shrink-0 text-[12px] tabular-nums text-[#8A8B90]">{quandoE(email.sent_at)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })()
      ) : (
        !filteredTemplates.length ? <Vazio icone={<FileText className="h-5 w-5" />} titulo="Nenhum modelo encontrado" /> : (
          <div className={`${vidro} overflow-hidden rounded-[22px]`}>
            <ul className="divide-y divide-black/[0.06]">
              {filteredTemplates.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/70 md:px-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: TOM[CAT_TOM[t.category] || 'cinza'].fundo, color: TOM[CAT_TOM[t.category] || 'cinza'].cor }}>{t.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="truncate text-[14px] font-bold">{t.name}</span><Chip {...TOM[CAT_TOM[t.category] || 'cinza']}>{categoryNames[t.category] || t.category}</Chip></span>
                    <span className="block truncate text-[12.5px] text-[#6A6B70]">{t.description}</span>
                  </span>
                  <button type="button" className={`${BOTAO2} h-9`} onClick={() => openPreview(t)}><Eye className="h-4 w-4" /> Ver e editar</button>
                </li>
              ))}
            </ul>
          </div>
        )
      )}

      <EmailTemplatePreviewDialog
        open={previewDialog.open}
        onOpenChange={(open) => setPreviewDialog({ ...previewDialog, open })}
        templateId={previewDialog.templateId}
        templateName={previewDialog.templateName}
        templateCategory={previewDialog.templateCategory}
      />
    </Pagina>
  );
};

export default ComunicacoesPage;
