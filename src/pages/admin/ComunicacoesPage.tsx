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
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  // Estatísticas simuladas (pode ser conectado ao banco depois)
  const stats: EmailStats = {
    total: 1247,
    sent: 1189,
    opened: 892,
    clicked: 456
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comunicações</h1>
        <p className="text-muted-foreground mt-1">
          Gerenciamento de templates e envio de emails
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviados</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.sent / stats.total) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.opened / stats.sent) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.opened.toLocaleString('pt-BR')} abertos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cliques</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats.clicked / stats.sent) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.clicked.toLocaleString('pt-BR')} cliques
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${categoryColors[template.category]}`}>
                            {template.icon}
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={categoryColors[template.category]}>
                          {categoryNames[template.category]}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Ver
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
              <CardTitle>Histórico de Envios</CardTitle>
              <CardDescription>
                Registro de todos os emails enviados pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Em breve</h3>
                <p className="text-muted-foreground">
                  O histórico detalhado de envios estará disponível em breve
                </p>
              </div>
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
    </div>
  );
};

export default ComunicacoesPage;
