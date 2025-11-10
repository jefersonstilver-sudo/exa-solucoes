import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comunicações</h1>
          <p className="text-muted-foreground mt-1">
            Gerenciamento de templates e envio de emails
          </p>
        </div>
        
        <AdminPeriodSelector
          value={periodFilter}
          onChange={handlePeriodChange}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={handleCustomDateChange}
        />
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Emails</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : (
                stats.total.toLocaleString('pt-BR')
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {periodFilter === 'all' ? 'Desde o início' : `Últimos ${periodFilter === 'current_month' ? 'mês' : periodFilter} dias`}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <Send className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : (
                stats.sent.toLocaleString('pt-BR')
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statsLoading ? '...' : `${stats.deliveryRate.toFixed(1)}% do total`}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : (
                `${stats.openRate.toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statsLoading ? '...' : `${stats.opened.toLocaleString('pt-BR')} abertos`}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cliques</CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/10">
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : (
                `${stats.clickRate.toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statsLoading ? '...' : `${stats.clicked.toLocaleString('pt-BR')} cliques`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Templates de Email</CardTitle>
              <CardDescription>
                {templates.length} templates disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={selectedCategory === 'auth' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('auth')}
                  >
                    Autenticação
                  </Button>
                  <Button
                    variant={selectedCategory === 'video' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('video')}
                  >
                    Vídeos
                  </Button>
                  <Button
                    variant={selectedCategory === 'benefits' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('benefits')}
                  >
                    Benefícios
                  </Button>
                </div>
              </div>

              {/* Lista de Templates */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2.5 rounded-lg ${categoryColors[template.category]}`}>
                            {template.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{template.name}</CardTitle>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <Badge variant="outline" className={categoryColors[template.category]}>
                          {categoryNames[template.category]}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openPreview(template)}
                          className="hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros ou buscar por outro termo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Envios</CardTitle>
                  <CardDescription>
                    {totalCount.toLocaleString('pt-BR')} emails registrados • Atualização automática a cada 2 minutos
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    refetchHistory();
                    refetchStats();
                  }}
                  disabled={historyLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${historyLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Carregando histórico...</span>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum email encontrado</h3>
                  <p className="text-muted-foreground">
                    Não há emails registrados para o período selecionado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emails.map((email) => {
                    const statusConfig = {
                      delivered: { color: 'bg-green-500/10 text-green-700 border-green-200', icon: CheckCircle2, label: 'Entregue' },
                      sent: { color: 'bg-blue-500/10 text-blue-700 border-blue-200', icon: Send, label: 'Enviado' },
                      opened: { color: 'bg-purple-500/10 text-purple-700 border-purple-200', icon: Eye, label: 'Aberto' },
                      clicked: { color: 'bg-orange-500/10 text-orange-700 border-orange-200', icon: ExternalLink, label: 'Clicado' },
                      bounced: { color: 'bg-red-500/10 text-red-700 border-red-200', icon: AlertCircle, label: 'Rejeitado' },
                      failed: { color: 'bg-red-500/10 text-red-700 border-red-200', icon: XCircle, label: 'Falhou' },
                    };
                    
                    const config = statusConfig[email.status as keyof typeof statusConfig] || statusConfig.sent;
                    const StatusIcon = config.icon;
                    
                    return (
                      <div
                        key={email.id}
                        className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${config.color} flex-shrink-0`}>
                                <StatusIcon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{email.subject}</h4>
                                <p className="text-sm text-muted-foreground truncate">
                                  Para: {email.recipient_name || email.recipient_email}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground ml-[52px]">
                              <span>📅 {format(new Date(email.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                              {email.opened_at && (
                                <span>• 👁️ Aberto {format(new Date(email.opened_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                              )}
                              {email.clicked_at && (
                                <span>• 🖱️ Clicado {format(new Date(email.clicked_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                              )}
                              {email.resend_id && (
                                <span className="font-mono">• ID: {email.resend_id.slice(0, 8)}...</span>
                              )}
                            </div>
                            
                            {email.error_message && (
                              <div className="ml-[52px] mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                <strong>Erro:</strong> {email.error_message}
                              </div>
                            )}
                          </div>
                          
                          <Badge variant="outline" className={`${config.color} flex-shrink-0`}>
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="configuracoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>
                Configurações gerais do sistema de emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Provedor de Email</h4>
                    <p className="text-sm text-muted-foreground">Resend API</p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                    Ativo
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Remetente</h4>
                    <p className="text-sm text-muted-foreground">noreply@examidia.com.br</p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                    Verificado
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div>
                  <h4 className="font-medium mb-2">Sistema de Customização</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Você pode personalizar o HTML de qualquer template clicando em "Visualizar" e depois em "Editar HTML". 
                    As customizações salvas serão aplicadas automaticamente em todos os envios futuros.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                    <strong>💡 Dica:</strong> Templates customizados aparecem com badge "✓ Customizado" e podem ser restaurados ao original a qualquer momento.
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div>
                  <h4 className="font-medium mb-2">Sistema de Templates</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Sistema modular centralizado em <code className="bg-muted px-1 py-0.5 rounded">supabase/functions/_shared/email-templates/</code>
                  </p>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Documentação
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <EmailTemplatePreviewDialog
        open={previewDialog.open}
        onOpenChange={(open) => setPreviewDialog({ ...previewDialog, open })}
        templateId={previewDialog.templateId}
        templateName={previewDialog.templateName}
        templateCategory={previewDialog.templateCategory}
      />
    </div>
  );
};

export default ComunicacoesPage;
