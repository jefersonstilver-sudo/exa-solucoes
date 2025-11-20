import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Search, Building2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: string;
  contact_phone: string;
  contact_name: string | null;
  last_message_at: string | null;
  status: string | null;
  external_id: string | null;
}

interface ConversationWithDevice extends Conversation {
  device_name?: string;
  condominio_name?: string;
}

export const ConversasPage = () => {
  const [conversations, setConversations] = useState<ConversationWithDevice[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithDevice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [searchTerm, conversations]);

  const fetchConversations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      // Enrich with device info if possible (placeholder for future integration)
      const enriched = data.map(conv => ({
        ...conv,
        device_name: 'Painel Desconhecido',
        condominio_name: 'Condomínio Desconhecido',
      }));
      setConversations(enriched);
    }
    setLoading(false);
  };

  const filterConversations = () => {
    if (!searchTerm) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(
      (c) =>
        c.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact_phone.includes(searchTerm) ||
        c.condominio_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConversations(filtered);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const formatLastMessage = (date: string | null) => {
    if (!date) return 'Sem mensagens';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
  };

  const statsData = {
    total: conversations.length,
    lastHour: conversations.filter(c => 
      c.last_message_at && 
      new Date(c.last_message_at) > new Date(Date.now() - 60 * 60 * 1000)
    ).length,
    pending: conversations.filter(c => c.status === 'active').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-module-card rounded-xl border-module border p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-module-primary mb-2">
          Conversas Analisadas
        </h1>
        <p className="text-module-secondary">
          Histórico de conversas do ManyChat vinculadas aos painéis
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-module-card border-module border">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#9C1E1E]" />
            <div>
              <p className="text-sm text-module-secondary">Total de Conversas</p>
              <p className="text-2xl font-bold text-module-primary">{statsData.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-module-card border-module border">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-module-secondary">Última Hora</p>
              <p className="text-2xl font-bold text-module-primary">{statsData.lastHour}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-module-card border-module border">
          <div className="flex items-center gap-3">
            <ExternalLink className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-module-secondary">Pendentes</p>
              <p className="text-2xl font-bold text-module-primary">{statsData.pending}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-module-tertiary" />
        <Input
          type="text"
          placeholder="Buscar por nome, telefone ou condomínio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-module-input border-module border text-module-primary placeholder-module-muted"
        />
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="text-center py-12 bg-module-card rounded-xl border-module border">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#9C1E1E]"></div>
          <p className="mt-4 text-module-secondary">Carregando conversas...</p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-12 bg-module-card rounded-xl border-module border">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-module-secondary" />
          <p className="text-module-secondary">Nenhuma conversa encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConversations.map((conv) => (
            <Card key={conv.id} className="p-4 bg-module-card border-module border hover:bg-module-hover cursor-pointer transition-colors rounded-[14px]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#9C1E1E]" />
                  <span className="font-semibold text-module-primary">
                    {conv.contact_name || 'Sem nome'}
                  </span>
                </div>
                <Badge className={getStatusColor(conv.status)}>
                  {conv.status || 'unknown'}
                </Badge>
              </div>
              <p className="text-sm text-module-secondary mb-2">{conv.contact_phone}</p>
              <p className="text-sm text-module-secondary mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                {conv.condominio_name}
              </p>
              <p className="text-xs text-module-tertiary">
                {formatLastMessage(conv.last_message_at)}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
