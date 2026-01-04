import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Send, Eye, CheckCircle, XCircle, Clock, TrendingUp, DollarSign, BarChart3, ExternalLink } from 'lucide-react';
import { Contact } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';

interface TabPropostasProps {
  contact: Contact;
}

interface Proposal {
  id: string;
  number: string | null;
  client_name: string | null;
  status: string;
  fidel_monthly_value: number | null;
  cash_total_value: number | null;
  duration_months: number | null;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  responded_at: string | null;
  expires_at: string | null;
  view_count: number | null;
  total_time_spent_seconds: number | null;
  converted_order_id: string | null;
  total_panels: number | null;
}

export const TabPropostas: React.FC<TabPropostasProps> = ({ contact }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [propostas, setPropostas] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    enviadas: 0,
    aceitas: 0,
    taxaConversao: 0,
    valorTotal: 0
  });

  useEffect(() => {
    fetchPropostas();
  }, [contact.id, contact.telefone, contact.email]);

  const fetchPropostas = async () => {
    try {
      setLoading(true);
      const phone = contact.telefone?.replace(/\D/g, '') || '';
      const email = contact.email || '';
      
      // Buscar propostas por telefone ou email
      let query = supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      // Adicionar filtros dinâmicos
      if (email && phone) {
        query = query.or(`client_email.eq.${email},client_phone.ilike.%${phone}%`);
      } else if (email) {
        query = query.eq('client_email', email);
      } else if (phone) {
        query = query.ilike('client_phone', `%${phone}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      
      setPropostas(data || []);
      
      // Calcular estatísticas
      const total = data?.length || 0;
      const enviadas = data?.filter(p => p.sent_at).length || 0;
      const aceitas = data?.filter(p => p.status === 'aceita' || p.converted_order_id).length || 0;
      const valorTotal = data?.reduce((sum, p) => sum + (p.cash_total_value || p.fidel_monthly_value || 0), 0) || 0;
      
      setStats({
        total,
        enviadas,
        aceitas,
        taxaConversao: enviadas > 0 ? Math.round((aceitas / enviadas) * 100) : 0,
        valorTotal
      });
      
    } catch (error) {
      console.error('Erro ao buscar propostas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (proposal: Proposal) => {
    if (proposal.converted_order_id) {
      return { label: 'Convertida', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    }
    switch (proposal.status?.toLowerCase()) {
      case 'aceita':
        return { label: 'Aceita', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 'rejeitada':
        return { label: 'Rejeitada', color: 'bg-red-100 text-red-700', icon: XCircle };
      case 'expirada':
        return { label: 'Expirada', color: 'bg-gray-100 text-gray-700', icon: Clock };
      case 'enviada':
        return { label: 'Enviada', color: 'bg-blue-100 text-blue-700', icon: Send };
      case 'visualizada':
        return { label: 'Visualizada', color: 'bg-purple-100 text-purple-700', icon: Eye };
      case 'rascunho':
      default:
        return { label: 'Rascunho', color: 'bg-yellow-100 text-yellow-700', icon: FileText };
    }
  };

  const formatTimeSpent = (seconds: number | null) => {
    if (!seconds) return '-';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const handleViewProposal = (proposalId: string) => {
    navigate(buildPath(`propostas/${proposalId}`));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardContent className="p-3">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="py-8">
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Propostas</p>
                <p className="text-base font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Send className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Enviadas</p>
                <p className="text-base font-bold">{stats.enviadas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Conversão</p>
                <p className="text-base font-bold">{stats.taxaConversao}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
                <p className="text-base font-bold">
                  R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Propostas Comerciais</p>
                <p className="text-xs text-muted-foreground">{propostas.length} proposta(s)</p>
              </div>
            </div>
            <Button size="sm" className="h-8" onClick={() => navigate(buildPath('propostas/nova'))}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nova Proposta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="p-0">
          {propostas.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhuma proposta enviada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie uma proposta comercial para este contato
              </p>
              <Button variant="outline" className="mt-4" size="sm" onClick={() => navigate(buildPath('propostas/nova'))}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Criar Primeira Proposta
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {propostas.map((proposta) => {
                const statusConfig = getStatusConfig(proposta);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div
                    key={proposta.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleViewProposal(proposta.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color.includes('green') ? 'text-green-500' : statusConfig.color.includes('amber') ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          Proposta #{proposta.number || proposta.id.slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {format(new Date(proposta.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          {proposta.duration_months && (
                            <span>{proposta.duration_months} meses</span>
                          )}
                          {proposta.total_panels && (
                            <span>{proposta.total_panels} painéis</span>
                          )}
                          {proposta.view_count && proposta.view_count > 0 && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {proposta.view_count}x
                            </span>
                          )}
                          {proposta.total_time_spent_seconds && proposta.total_time_spent_seconds > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeSpent(proposta.total_time_spent_seconds)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                      <p className="font-bold text-sm min-w-[80px] text-right">
                        R$ {(proposta.cash_total_value || proposta.fidel_monthly_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </p>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabPropostas;
