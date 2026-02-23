import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, Phone, Mail, MapPin, Calendar, Clock, 
  MessageCircle, FileText, Package, DollarSign, User, LogIn, Bot, UserPlus, Link2,
  StickyNote, Star, Plus, Mic, Video, Loader2, ArrowRight
} from 'lucide-react';
import { Contact, ContactNote, CATEGORIAS_CONFIG } from '@/types/contatos';
import { OrigemBadge } from '@/components/contatos/common/OrigemBadge';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const SOURCE_LABELS: Record<string, string> = {
  sync_conversations: 'Sincronizado de conversas WhatsApp',
  sync_escalacoes: 'Escalação comercial',
  sync_pedidos: 'Sincronizado de pedidos',
  sync_lead_profiles: 'Importado de perfil de lead',
};

interface TabVisaoGeralProps {
  contact: Contact;
  editing?: boolean;
  formData?: Partial<Contact>;
  setFormData?: (data: Partial<Contact>) => void;
}

export const TabVisaoGeral: React.FC<TabVisaoGeralProps> = ({ 
  contact, 
  editing = false,
  formData = {},
  setFormData
}) => {
  const categoriaConfig = CATEGORIAS_CONFIG[contact.categoria];
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [recentNotes, setRecentNotes] = useState<ContactNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [quickNote, setQuickNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    const metadata = contact.metadata as Record<string, any> | undefined;
    if (metadata?.auto_created) {
      setCreatorName('Sistema (sincronização automática)');
      return;
    }
    if (contact.created_by) {
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', contact.created_by)
        .single()
        .then(({ data }) => {
          setCreatorName(data?.full_name || 'Usuário desconhecido');
        });
    } else {
      setCreatorName('Não registrado');
    }
  }, [contact.created_by, contact.metadata]);

  useEffect(() => {
    fetchRecentNotes();
  }, [contact.id]);

  const fetchRecentNotes = async () => {
    try {
      setLoadingNotes(true);
      const { data, error } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      setRecentNotes((data as ContactNote[]) || []);
    } catch (err) {
      console.error('Erro ao buscar notas recentes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleQuickNote = async () => {
    if (!quickNote.trim()) return;
    try {
      setSavingNote(true);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('contact_notes').insert({
        contact_id: contact.id,
        content: quickNote.trim(),
        created_by: userData.user?.id,
        created_by_email: userData.user?.email,
        note_type: 'text',
      });
      if (error) throw error;
      toast.success('Nota adicionada!');
      setQuickNote('');
      fetchRecentNotes();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar nota');
    } finally {
      setSavingNote(false);
    }
  };

  const NOTE_TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
    text: { icon: StickyNote, color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Texto' },
    audio: { icon: Mic, color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Áudio' },
    meeting: { icon: Video, color: 'text-emerald-700', bgColor: 'bg-emerald-100', label: 'Reunião' },
    call: { icon: Phone, color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Ligação' },
    file: { icon: FileText, color: 'text-rose-700', bgColor: 'bg-rose-100', label: 'Arquivo' },
  };

  const metadata = contact.metadata as Record<string, any> | undefined;
  const sourceLabel = metadata?.source ? SOURCE_LABELS[metadata.source] : null;
  const referenceId = metadata?.order_id || contact.conversation_id;

  const handleChange = (field: keyof Contact, value: any) => {
    if (setFormData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const displayValue = (field: keyof Contact) => {
    return editing ? (formData[field] as string) || '' : (contact[field] as string) || '';
  };

  return (
    <div className="space-y-4">
      {/* Resumo Executivo */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Resumo do Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">
                {contact.created_at 
                  ? Math.floor((Date.now() - new Date(contact.created_at).getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">Dias no sistema</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <DollarSign className="w-5 h-5 mx-auto text-green-600 mb-1" />
              <p className="text-lg font-bold">
                {contact.total_investido 
                  ? `R$ ${contact.total_investido.toLocaleString('pt-BR')}`
                  : 'R$ 0'}
              </p>
              <p className="text-xs text-muted-foreground">Total investido</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <MessageCircle className="w-5 h-5 mx-auto text-blue-600 mb-1" />
              <p className="text-lg font-bold">{contact.dias_sem_contato || 0}</p>
              <p className="text-xs text-muted-foreground">Dias sem contato</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Package className="w-5 h-5 mx-auto text-amber-600 mb-1" />
              <p className="text-lg font-bold">0</p>
              <p className="text-xs text-muted-foreground">Pedidos ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canal de Entrada - Rastreabilidade */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Canal de Entrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Origem</p>
              <div className="mt-1">
                {contact.origem ? (
                  <OrigemBadge origem={contact.origem} size="md" showIcon />
                ) : (
                  <p className="text-muted-foreground">-</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Criado por</p>
              <p className="font-medium mt-1 flex items-center gap-1">
                {metadata?.auto_created ? (
                  <><Bot className="w-3.5 h-3.5 text-muted-foreground" /> {creatorName}</>
                ) : contact.created_by ? (
                  <><UserPlus className="w-3.5 h-3.5 text-muted-foreground" /> {creatorName || 'Carregando...'}</>
                ) : (
                  <span className="text-muted-foreground">{creatorName || 'Não registrado'}</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data de criação</p>
              <p className="font-medium mt-1">
                {contact.created_at
                  ? format(new Date(contact.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                  : '-'}
              </p>
            </div>
            {sourceLabel && (
              <div>
                <p className="text-xs text-muted-foreground">Fonte</p>
                <p className="font-medium mt-1">{sourceLabel}</p>
              </div>
            )}
            {contact.agent_sources && contact.agent_sources.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground">Agente(s)</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {contact.agent_sources.map((agent) => (
                    <Badge key={agent} variant="secondary" className="text-xs">
                      {agent}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {referenceId && (
              <div>
                <p className="text-xs text-muted-foreground">Referência</p>
                <p className="font-medium mt-1 flex items-center gap-1 text-xs truncate">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{referenceId}</span>
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Categoria</p>
              <Badge className={`mt-1 text-xs ${categoriaConfig.bgColor} text-white`}>
                {categoriaConfig.label}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Última atualização</p>
              <p className="font-medium mt-1">
                {contact.updated_at
                  ? formatDistanceToNow(new Date(contact.updated_at), { addSuffix: true, locale: ptBR })
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas e Atualizações Recentes */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            Notas e Atualizações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick note form */}
          <div className="flex gap-2">
            <Textarea
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              placeholder="Adicionar nota rápida..."
              className="min-h-[60px] text-sm flex-1"
            />
            <Button
              size="sm"
              onClick={handleQuickNote}
              disabled={!quickNote.trim() || savingNote}
              className="self-end"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {savingNote ? '...' : 'Nota'}
            </Button>
          </div>

          {/* Recent notes */}
          {loadingNotes ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : recentNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              Nenhuma nota registrada ainda
            </p>
          ) : (
            <div className="space-y-2">
              {recentNotes.map((note) => {
                const type = (note.note_type as string) || 'text';
                const config = NOTE_TYPE_ICONS[type] || NOTE_TYPE_ICONS.text;
                const Icon = config.icon;

                return (
                  <div
                    key={note.id}
                    className={cn(
                      'p-2.5 rounded-lg border text-sm transition-colors',
                      note.is_important
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-muted/30 border-transparent'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Badge className={cn('text-[10px] px-1.5 py-0 font-medium shrink-0', config.bgColor, config.color, 'border-0')}>
                        <Icon className="w-3 h-3 mr-0.5" />
                        {config.label}
                      </Badge>
                      {note.is_important && (
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-sm mt-1 line-clamp-2">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {note.created_by_email || 'Sistema'} • {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {recentNotes.length > 0 && (
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <ArrowRight className="w-3 h-3" />
              Acesse a aba "Notas" para ver todas e gravar áudios
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dados Pessoais - Editável */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Primeiro Nome</Label>
              <Input
                value={displayValue('nome')}
                onChange={(e) => handleChange('nome', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Nome"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Sobrenome</Label>
              <Input
                value={displayValue('sobrenome')}
                onChange={(e) => handleChange('sobrenome', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Sobrenome"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Telefone</Label>
              <Input
                value={displayValue('telefone')}
                onChange={(e) => handleChange('telefone', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input
                value={displayValue('email')}
                onChange={(e) => handleChange('email', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados da Empresa - Editável */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Dados da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Empresa</Label>
              <Input
                value={displayValue('empresa')}
                onChange={(e) => handleChange('empresa', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">CNPJ</Label>
              <Input
                value={displayValue('cnpj')}
                onChange={(e) => handleChange('cnpj', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs">Tipo de Negócio</Label>
              <Input
                value={displayValue('tipo_negocio')}
                onChange={(e) => handleChange('tipo_negocio', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Ex: Restaurante, Loja, Clínica"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço - Editável */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Endereço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs">Endereço</Label>
              <Input
                value={displayValue('endereco')}
                onChange={(e) => handleChange('endereco', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Rua, número"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Bairro</Label>
              <Input
                value={displayValue('bairro')}
                onChange={(e) => handleChange('bairro', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Bairro"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Cidade</Label>
              <Input
                value={displayValue('cidade')}
                onChange={(e) => handleChange('cidade', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="Cidade"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Estado</Label>
              <Input
                value={displayValue('estado')}
                onChange={(e) => handleChange('estado', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="UF"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">CEP</Label>
              <Input
                value={displayValue('cep')}
                onChange={(e) => handleChange('cep', e.target.value)}
                readOnly={!editing}
                className={!editing ? 'bg-muted' : ''}
                placeholder="00000-000"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabVisaoGeral;