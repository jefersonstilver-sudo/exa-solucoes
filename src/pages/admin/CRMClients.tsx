import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, TrendingUp, DollarSign, Users, Loader2, FileText, UserRound, AlertCircle } from 'lucide-react';
import { getAllClientsForCRM } from '@/services/crmService';
import { toast } from 'sonner';
import { ClientDetailModal } from '@/components/admin/crm/ClientDetailModal';
import { PhoneWithActions } from '@/components/admin/crm/PhoneWithActions';

interface ClientBasic {
  id: string;
  email: string;
  nome?: string;
  cpf?: string;
  telefone?: string;
  data_criacao: string;
  purchase_intent_score: number;
  ai_interest_level: string;
  last_visit?: string;
  total_spent: number;
  total_orders: number;
  total_attempts: number;
  last_purchase_date?: string;
}

export default function CRMClients() {
  const [clients, setClients] = useState<ClientBasic[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('recent_purchase');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm, sortBy, statusFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const data = await getAllClientsForCRM();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.email.toLowerCase().includes(term) ||
          c.nome?.toLowerCase().includes(term) ||
          c.cpf?.toLowerCase().includes(term) ||
          c.telefone?.toLowerCase().includes(term)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => {
        if (statusFilter === 'buyers') return c.total_orders > 0;
        if (statusFilter === 'attempts') return c.total_orders === 0 && c.total_attempts > 0;
        if (statusFilter === 'vip') return c.total_spent > 20000;
        if (statusFilter === 'recurrent') return c.total_orders > 2;
        return true;
      });
    }

    // Aplicar ordenação
    filtered = applySorting(filtered);

    setFilteredClients(filtered);
  };

  const applySorting = (clientsList: ClientBasic[]) => {
    const sorted = [...clientsList];

    switch (sortBy) {
      case 'recent_purchase':
        return sorted.sort((a, b) => {
          if (!a.last_purchase_date) return 1;
          if (!b.last_purchase_date) return -1;
          return new Date(b.last_purchase_date).getTime() - new Date(a.last_purchase_date).getTime();
        });
      case 'total_spent_desc':
        return sorted.sort((a, b) => b.total_spent - a.total_spent);
      case 'total_spent_asc':
        return sorted.sort((a, b) => a.total_spent - b.total_spent);
      case 'total_orders_desc':
        return sorted.sort((a, b) => b.total_orders - a.total_orders);
      case 'total_orders_asc':
        return sorted.sort((a, b) => a.total_orders - b.total_orders);
      case 'total_attempts_desc':
        return sorted.sort((a, b) => b.total_attempts - a.total_attempts);
      case 'score_desc':
        return sorted.sort((a, b) => b.purchase_intent_score - a.purchase_intent_score);
      case 'score_asc':
        return sorted.sort((a, b) => a.purchase_intent_score - b.purchase_intent_score);
      case 'name_asc':
        return sorted.sort((a, b) => (a.nome || a.email).localeCompare(b.nome || b.email));
      case 'name_desc':
        return sorted.sort((a, b) => (b.nome || b.email).localeCompare(a.nome || a.email));
      default:
        return sorted;
    }
  };

  const stats = {
    total: clients.length,
    buyers: clients.filter((c) => c.total_orders > 0).length,
    attempts: clients.filter((c) => c.total_orders === 0 && c.total_attempts > 0).length,
    totalRevenue: clients.reduce((sum, c) => sum + c.total_spent, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM Clientes</h1>
          <p className="text-muted-foreground">
            Gestão completa de clientes com análise comportamental por IA
          </p>
        </div>
        <Button onClick={fetchClients} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Clientes</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Compradores</p>
              <p className="text-2xl font-bold">{stats.buyers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Tentativas</p>
              <p className="text-2xl font-bold">{stats.attempts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent_purchase">Última Compra (Mais Recente)</SelectItem>
              <SelectItem value="total_spent_desc">Maior Valor Gasto</SelectItem>
              <SelectItem value="total_spent_asc">Menor Valor Gasto</SelectItem>
              <SelectItem value="total_orders_desc">Mais Pedidos</SelectItem>
              <SelectItem value="total_orders_asc">Menos Pedidos</SelectItem>
              <SelectItem value="total_attempts_desc">Mais Tentativas Abandonadas</SelectItem>
              <SelectItem value="score_desc">Maior Score IA</SelectItem>
              <SelectItem value="score_asc">Menor Score IA</SelectItem>
              <SelectItem value="name_asc">Nome (A-Z)</SelectItem>
              <SelectItem value="name_desc">Nome (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="buyers">Compradores</SelectItem>
              <SelectItem value="attempts">Apenas Tentativas</SelectItem>
              <SelectItem value="vip">VIPs (&gt;R$ 20k)</SelectItem>
              <SelectItem value="recurrent">Recorrentes (&gt;2 pedidos)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lista de Clientes */}
      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Nenhum cliente encontrado</p>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Card
              key={client.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedClient(client.id)}
            >
              <div className="flex items-start justify-between gap-6">
                {/* Informações Principais - Esquerda */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserRound className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Nome */}
                    <h3 className="text-lg font-bold">
                      {client.nome || client.email.split('@')[0]}
                    </h3>
                    
                    {/* Email */}
                    <p className="text-sm text-muted-foreground truncate">
                      {client.email}
                    </p>
                    
                    {/* Telefone com ações */}
                    {client.telefone && (
                      <PhoneWithActions phone={client.telefone} />
                    )}
                    
                    {/* CPF */}
                    {client.cpf && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>{client.cpf}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Métricas - Direita */}
                <div className="grid grid-cols-3 gap-6 text-right">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pedidos</p>
                    <p className="text-2xl font-bold">{client.total_orders}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Gasto</p>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(client.total_spent)}
                    </p>
                  </div>
                  
                  {client.total_attempts > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tentativas</p>
                      <p className="text-2xl font-bold text-orange-500">{client.total_attempts}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Ver Detalhes */}
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => setSelectedClient(client.id)}>
                  Ver Detalhes Completos →
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedClient && (
        <ClientDetailModal
          clientId={selectedClient}
          open={!!selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}
