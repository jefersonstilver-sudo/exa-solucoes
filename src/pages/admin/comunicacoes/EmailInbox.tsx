import React, { useState } from 'react';
import { 
  Mail, 
  Inbox, 
  Send, 
  Star, 
  Archive, 
  Search, 
  RefreshCw,
  Filter,
  MoreVertical,
  Paperclip,
  Clock,
  User,
  Building2,
  ArrowLeft,
  Reply,
  Forward,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEmails } from '@/hooks/email/useEmails';
import { Email, EmailDirection } from '@/types/email';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const EmailInbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'starred' | 'archived'>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  
  // Filtros baseados na tab ativa
  const filters = {
    inbox: { direction: 'inbound' as EmailDirection, isArchived: false },
    sent: { direction: 'outbound' as EmailDirection, isArchived: false },
    starred: { isStarred: true, isArchived: false },
    archived: { isArchived: true }
  };

  const { emails, loading, stats, markAsRead, toggleStar, archiveEmail, fetchEmails } = useEmails({
    ...filters[activeTab],
    search: searchQuery || undefined
  });

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      await markAsRead(email.id);
    }
  };

  const handleBack = () => {
    setSelectedEmail(null);
  };

  const getCategoriaColor = (categoria: string | null) => {
    switch (categoria) {
      case 'comercial': return 'bg-blue-500/10 text-blue-500';
      case 'financeiro': return 'bg-green-500/10 text-green-500';
      case 'marketing': return 'bg-purple-500/10 text-purple-500';
      case 'suporte': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (selectedEmail) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold truncate flex-1">{selectedEmail.subject}</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => toggleStar(selectedEmail.id)}>
              <Star className={cn("h-5 w-5", selectedEmail.is_starred && "fill-yellow-400 text-yellow-400")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => archiveEmail(selectedEmail.id)}>
              <Archive className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Reply className="h-4 w-4 mr-2" /> Responder
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="h-4 w-4 mr-2" /> Encaminhar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedEmail.from_name || selectedEmail.from_email}</p>
                  <p className="text-sm text-muted-foreground">{selectedEmail.from_email}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedEmail.received_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                </p>
                {selectedEmail.categoria && (
                  <Badge className={cn("mt-1", getCategoriaColor(selectedEmail.categoria))}>
                    {selectedEmail.categoria}
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-sm text-muted-foreground mb-4">
              Para: {selectedEmail.to_email}
              {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                <span className="ml-2">Cc: {selectedEmail.cc.join(', ')}</span>
              )}
            </div>

            <Separator className="my-4" />

            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: selectedEmail.body_html || selectedEmail.body_text || '' }}
            />

            {selectedEmail.has_attachments && selectedEmail.attachments?.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm font-medium mb-2">Anexos</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmail.attachments.map((att, idx) => (
                      <Button key={idx} variant="outline" size="sm">
                        <Paperclip className="h-4 w-4 mr-2" />
                        {att.filename}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {selectedEmail.client && (
              <>
                <Separator className="my-4" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Vinculado a: {selectedEmail.client.nome}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button className="flex-1">
            <Reply className="h-4 w-4 mr-2" /> Responder
          </Button>
          <Button variant="outline" className="flex-1">
            <Forward className="h-4 w-4 mr-2" /> Encaminhar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Central de E-mails
          </h1>
          <p className="text-muted-foreground">
            {stats.unread} não lidos de {stats.total} e-mails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchEmails()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button>
            <Mail className="h-4 w-4 mr-2" /> Novo E-mail
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab('inbox')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Inbox className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inbound}</p>
              <p className="text-xs text-muted-foreground">Recebidos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab('sent')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Send className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.outbound}</p>
              <p className="text-xs text-muted-foreground">Enviados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setActiveTab('starred')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.starred}</p>
              <p className="text-xs text-muted-foreground">Favoritos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Mail className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.unread}</p>
              <p className="text-xs text-muted-foreground">Não lidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="inbox" className="gap-2">
                  <Inbox className="h-4 w-4" /> Entrada
                </TabsTrigger>
                <TabsTrigger value="sent" className="gap-2">
                  <Send className="h-4 w-4" /> Enviados
                </TabsTrigger>
                <TabsTrigger value="starred" className="gap-2">
                  <Star className="h-4 w-4" /> Favoritos
                </TabsTrigger>
                <TabsTrigger value="archived" className="gap-2">
                  <Archive className="h-4 w-4" /> Arquivados
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar e-mails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Comercial</DropdownMenuItem>
                  <DropdownMenuItem>Financeiro</DropdownMenuItem>
                  <DropdownMenuItem>Marketing</DropdownMenuItem>
                  <DropdownMenuItem>Suporte</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mb-4 opacity-50" />
                <p>Nenhum e-mail encontrado</p>
              </div>
            ) : (
              <div className="divide-y">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleEmailClick(email)}
                    className={cn(
                      "flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                      !email.is_read && "bg-primary/5"
                    )}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("font-medium truncate", !email.is_read && "font-semibold")}>
                          {email.direction === 'inbound' 
                            ? (email.from_name || email.from_email)
                            : `Para: ${email.to_email}`
                          }
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {email.has_attachments && <Paperclip className="h-4 w-4 text-muted-foreground" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStar(email.id);
                            }}
                            className="hover:scale-110 transition-transform"
                          >
                            <Star className={cn(
                              "h-4 w-4",
                              email.is_starred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            )} />
                          </button>
                        </div>
                      </div>
                      <p className={cn("text-sm truncate", !email.is_read ? "text-foreground" : "text-muted-foreground")}>
                        {email.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {email.body_preview}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {email.categoria && (
                            <Badge variant="outline" className={cn("text-xs", getCategoriaColor(email.categoria))}>
                              {email.categoria}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(email.received_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailInbox;
