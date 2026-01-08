import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCw, Phone, Mail, Building2, ChevronRight, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClientCRM, CRMHubFilters, FunilStatus } from '@/types/crm';
import { useAdminBasePath } from '@/hooks/useAdminBasePath';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VisaoGeralTabProps {
  clients: ClientCRM[];
  loading: boolean;
  filters: CRMHubFilters;
  setFilters: React.Dispatch<React.SetStateAction<CRMHubFilters>>;
  onRefresh: () => void;
}

const VisaoGeralTab: React.FC<VisaoGeralTabProps> = ({
  clients,
  loading,
  filters,
  setFilters,
  onRefresh
}) => {
  const navigate = useNavigate();
  const { buildPath } = useAdminBasePath();

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleFunilFilter = (value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      funilStatus: value === 'all' ? undefined : value as FunilStatus 
    }));
  };

  const getFunilBadge = (status: FunilStatus) => {
    const styles: Record<FunilStatus, string> = {
      lead: 'bg-blue-100 text-blue-700 border-blue-200',
      oportunidade: 'bg-amber-100 text-amber-700 border-amber-200',
      cliente: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      churn: 'bg-red-100 text-red-700 border-red-200',
    };
    const labels: Record<FunilStatus, string> = {
      lead: 'Lead',
      oportunidade: 'Oportunidade',
      cliente: 'Cliente',
      churn: 'Churn',
    };
    return (
      <Badge variant="outline" className={`${styles[status]} text-xs font-medium`}>
        {labels[status]}
      </Badge>
    );
  };

  const openContactDetail = (id: string) => {
    navigate(buildPath(`contatos/${id}`));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, empresa, telefone..."
            className="pl-10 bg-white border-gray-200"
            value={filters.search || ''}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <Select value={filters.funilStatus || 'all'} onValueChange={handleFunilFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Funil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="oportunidade">Oportunidade</SelectItem>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="churn">Churn</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={onRefresh} className="shrink-0">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Lista de Contatos */}
      <div className="space-y-2">
        {clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum contato encontrado</p>
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              onClick={() => openContactDetail(client.id)}
              className="group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Avatar e Info Principal */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] flex items-center justify-center text-white font-semibold shrink-0">
                    {client.nome?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {client.nome} {client.sobrenome}
                      </h3>
                      {getFunilBadge(client.funil_status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                      {client.empresa && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3" />
                          {client.empresa}
                        </span>
                      )}
                      {client.telefone && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Phone className="w-3 h-3" />
                          {client.telefone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="hidden md:flex items-center gap-4 text-sm text-gray-400">
                  {client.updated_at && (
                    <span className="whitespace-nowrap">
                      {formatDistanceToNow(new Date(client.updated_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VisaoGeralTab;
