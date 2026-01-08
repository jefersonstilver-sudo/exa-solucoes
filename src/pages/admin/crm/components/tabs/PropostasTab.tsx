import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Clock, CheckCircle, XCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClientCRM } from '@/types/crm';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PropostasTabProps {
  clients: ClientCRM[];
}

interface Proposta {
  id: string;
  numero_proposta: string;
  nome_cliente: string;
  empresa_cliente?: string;
  valor_total: number;
  status: string;
  created_at: string;
  validade: string;
}

const PropostasTab: React.FC<PropostasTabProps> = ({ clients }) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPropostas();
  }, []);

  const fetchPropostas = async () => {
    try {
      // Query directly without type inference issues
      const { data, error } = await supabase
        .from('propostas' as any)
        .select('id, numero_proposta, nome_cliente, empresa_cliente, valor_total, status, created_at, validade')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPropostas((data as unknown as Proposta[]) || []);
    } catch (err) {
      console.error('Erro ao buscar propostas:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-600', icon: <Clock className="w-3 h-3" /> },
      enviada: { label: 'Enviada', className: 'bg-blue-100 text-blue-600', icon: <Send className="w-3 h-3" /> },
      aceita: { label: 'Aceita', className: 'bg-emerald-100 text-emerald-600', icon: <CheckCircle className="w-3 h-3" /> },
      recusada: { label: 'Recusada', className: 'bg-red-100 text-red-600', icon: <XCircle className="w-3 h-3" /> },
      expirada: { label: 'Expirada', className: 'bg-amber-100 text-amber-600', icon: <Clock className="w-3 h-3" /> },
    };
    const { label, className, icon } = config[status] || config.rascunho;
    return (
      <Badge variant="outline" className={`${className} flex items-center gap-1`}>
        {icon}
        {label}
      </Badge>
    );
  };

  const filteredPropostas = propostas.filter(p => 
    p.nome_cliente?.toLowerCase().includes(search.toLowerCase()) ||
    p.empresa_cliente?.toLowerCase().includes(search.toLowerCase()) ||
    p.numero_proposta?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar proposta..."
            className="pl-10 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button 
          onClick={() => navigate(buildPath('propostas/nova'))}
          className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Proposta
        </Button>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filteredPropostas.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Nenhuma proposta encontrada</p>
          </div>
        ) : (
          filteredPropostas.map((proposta) => (
            <div
              key={proposta.id}
              onClick={() => navigate(buildPath(`propostas/${proposta.id}`))}
              className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-gray-400">{proposta.numero_proposta}</span>
                    {getStatusBadge(proposta.status)}
                  </div>
                  <h3 className="font-medium text-gray-900 mt-1 truncate">
                    {proposta.nome_cliente}
                  </h3>
                  {proposta.empresa_cliente && (
                    <p className="text-sm text-gray-500 truncate">{proposta.empresa_cliente}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposta.valor_total || 0)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {proposta.created_at && formatDistanceToNow(new Date(proposta.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PropostasTab;
