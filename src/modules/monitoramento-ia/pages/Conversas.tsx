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
      <div className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Conversas Analisadas
        </h1>
        <p className="text-[#A0A0A0]">
          Histórico de conversas do ManyChat vinculadas aos painéis
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#1A1A1A] border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#9C1E1E]" />
            <div>
              <p className="text-sm text-[#A0A0A0]">Total de Conversas</p>
              <p className="text-2xl font-bold text-white">{statsData.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-[#1A1A1A] border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-[#A0A0A0]">Última Hora</p>
              <p className="text-2xl font-bold text-white">{statsData.lastHour}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-[#1A1A1A] border-[#2A2A2A]">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-[#A0A0A0]">Pendentes</p>
              <p className="text-2xl font-bold text-white">{statsData.pending}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
        <Input
          placeholder="Buscar por nome, telefone ou condomínio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder:text-[#6B7280]"
        />
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-[#A0A0A0]">Carregando conversas...</p>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
          <p className="text-[#A0A0A0]">
            {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa registrada'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConversations.map((conv) => (
            <Card key={conv.id} className="p-4 bg-[#1A1A1A] border-[#2A2A2A] hover:shadow-lg hover:shadow-[#9C1E1E]/10 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#9C1E1E]" />
                    <span className="font-semibold text-white">
                      {conv.contact_name || conv.contact_phone}
                    </span>
                    <Badge variant="outline" className={getStatusColor(conv.status)}>
                      {conv.status || 'unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#A0A0A0]">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{conv.condominio_name}</span>
                    </div>
                    <span>•</span>
                    <span>{conv.device_name}</span>
                  </div>
                  <div className="text-sm text-[#6B7280]">
                    Última mensagem: {formatLastMessage(conv.last_message_at)}
                  </div>
                </div>
                {conv.external_id && (
                  <a
                    href={`https://manychat.com/fb123456789/chat/${conv.external_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9C1E1E] hover:text-[#7A1717] transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
