import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Eye, MessageCircle, AlertTriangle, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Contact, CATEGORIAS_CONFIG, calcularCompletude } from '@/types/contatos';
import { CategoriaBadge, TemperaturaBadge, ScoreCircle, OrigemBadge } from '../common';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { cn } from '@/lib/utils';

interface ContatosTableProps {
  contacts: Contact[];
  loading: boolean;
}

export const ContatosTable: React.FC<ContatosTableProps> = ({ contacts, loading }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();

  const handleWhatsApp = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    if (contact.bloqueado) return;
    const phone = contact.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${phone}`, '_blank');
  };

  const handlePhone = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    if (contact.bloqueado) return;
    window.open(`tel:${contact.telefone}`, '_blank');
  };

  const handleEmail = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    if (!contact.email) return;
    window.open(`mailto:${contact.email}`, '_blank');
  };

  const handleView = (contact: Contact) => {
    navigate(buildPath(`contatos/${contact.id}`));
  };

  const handleViewConversation = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    if (!contact.conversation_id) return;
    navigate(buildPath(`monitoramento/ia?conversation=${contact.conversation_id}`));
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <div className="animate-pulse text-muted-foreground">Carregando contatos...</div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-8 text-center">
        <p className="text-muted-foreground">Nenhum contato encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[60px]">Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nome / Empresa</TableHead>
            <TableHead className="hidden md:table-cell">Origem</TableHead>
            <TableHead className="hidden md:table-cell">Bairro / Cidade</TableHead>
            <TableHead className="hidden lg:table-cell">Última Interação</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => {
            const config = CATEGORIAS_CONFIG[contact.categoria];
            const hasPontuacao = config?.hasPontuacao;
            const completude = calcularCompletude(contact);
            const isCritico = completude <= 30;
            const isParcial = completude > 30 && completude <= 70;

            return (
              <TableRow 
                key={contact.id} 
                className={cn(
                  "hover:bg-muted/50 cursor-pointer transition-colors",
                  isCritico && "bg-red-50 border-l-4 border-l-red-500 hover:bg-red-100",
                  isParcial && "bg-amber-50/50 border-l-4 border-l-amber-400 hover:bg-amber-100/50"
                )}
                onClick={() => handleView(contact)}
              >
                <TableCell>
                  {hasPontuacao && contact.pontuacao_atual !== null ? (
                    <ScoreCircle score={contact.pontuacao_atual || 0} size="md" />
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <CategoriaBadge categoria={contact.categoria} size="sm" />
                    <TemperaturaBadge temperatura={contact.temperatura} size="sm" />
                    {isCritico && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0 h-5 gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Crítico
                      </Badge>
                    )}
                    {isParcial && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-amber-600 border-amber-300 bg-amber-50">
                        Completar
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">
                    {contact.empresa || `${contact.nome} ${contact.sobrenome || ''}`}
                  </div>
                  {contact.empresa && (
                    <div className="text-xs text-muted-foreground">
                      {contact.nome} {contact.sobrenome}
                    </div>
                  )}
                  {contact.cnpj && (
                    <div className="text-xs text-muted-foreground">CNPJ: {contact.cnpj}</div>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col gap-1">
                    {contact.origem && <OrigemBadge origem={contact.origem} size="sm" />}
                    {contact.agent_sources && contact.agent_sources.length > 0 && (
                      <div className="flex gap-0.5">
                        {contact.agent_sources.map((agent) => (
                          <Badge 
                            key={agent} 
                            variant="outline" 
                            className="text-[9px] px-1 py-0 h-4 capitalize"
                          >
                            {agent}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="text-sm text-foreground">{contact.bairro || '-'}</div>
                  <div className="text-xs text-muted-foreground">
                    {contact.cidade}, {contact.estado}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          {contact.last_interaction_at 
                            ? formatDistanceToNow(new Date(contact.last_interaction_at), { addSuffix: true, locale: ptBR })
                            : contact.last_contact_at 
                              ? formatDistanceToNow(new Date(contact.last_contact_at), { addSuffix: true, locale: ptBR })
                              : '-'
                          }
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {contact.last_interaction_at 
                          ? format(new Date(contact.last_interaction_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : contact.last_contact_at 
                            ? format(new Date(contact.last_contact_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : 'Sem interação registrada'
                        }
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${contact.bloqueado ? 'opacity-50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                      onClick={(e) => handleWhatsApp(e, contact)}
                      disabled={contact.bloqueado}
                      title={contact.bloqueado ? 'Bloqueado: Pontuação insuficiente' : 'WhatsApp'}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${contact.bloqueado ? 'opacity-50 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                      onClick={(e) => handlePhone(e, contact)}
                      disabled={contact.bloqueado}
                      title={contact.bloqueado ? 'Bloqueado: Pontuação insuficiente' : 'Ligar'}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={(e) => handleEmail(e, contact)}
                      disabled={!contact.email}
                      title="Email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-muted hover:bg-muted/80"
                      onClick={(e) => { e.stopPropagation(); handleView(contact); }}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {contact.conversation_id && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 bg-purple-500 hover:bg-purple-600 text-white"
                              onClick={(e) => handleViewConversation(e, contact)}
                              title="Ver conversa"
                            >
                              <MessagesSquare className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver conversa no Monitoramento IA</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContatosTable;
