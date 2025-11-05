import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, UserRound, TrendingUp, DollarSign, Users, Loader2 } from 'lucide-react';
import { getAllClientsForCRM } from '@/services/crmService';
import { toast } from 'sonner';
import { ClientDetailModal } from '@/components/admin/crm/ClientDetailModal';

interface ClientBasic {
  id: string;
  email: string;
  cpf?: string;
  telefone?: string;
  data_criacao: string;
  purchase_intent_score: number;
  ai_interest_level: string;
  last_visit?: string;
  total_spent: number;
  total_orders: number;
}

export default function CRMClients() {
  const [clients, setClients] = useState<ClientBasic[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm, scoreFilter, statusFilter]);

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
          c.cpf?.toLowerCase().includes(term) ||
          c.telefone?.toLowerCase().includes(term)
      );
    }

    // Filtro de score
    if (scoreFilter !== 'all') {
      filtered = filtered.filter((c) => {
        if (scoreFilter === 'very_high') return c.purchase_intent_score >= 80;
        if (scoreFilter === 'high') return c.purchase_intent_score >= 60 && c.purchase_intent_score < 80;
        if (scoreFilter === 'medium') return c.purchase_intent_score >= 40 && c.purchase_intent_score < 60;
        if (scoreFilter === 'low') return c.purchase_intent_score < 40;
        return true;
      });
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => {
        if (statusFilter === 'buyers') return c.total_orders > 0;
        if (statusFilter === 'attempts') return c.total_orders === 0;
        if (statusFilter === 'vip') return c.total_spent > 20000;
        if (statusFilter === 'recurrent') return c.total_orders > 2;
        return true;
      });
    }

    setFilteredClients(filtered);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-red-500 hover:bg-red-600';
    if (score >= 60) return 'bg-orange-500 hover:bg-orange-600';
    if (score >= 40) return 'bg-yellow-500 hover:bg-yellow-600';
    return 'bg-gray-400 hover:bg-gray-500';
  };

  const getInterestLevelLabel = (level: string) => {
    const labels = {
      very_high: 'MUITO ALTO 🔥',
      high: 'ALTO ⚡',
      medium: 'MÉDIO 📊',
      low: 'BAIXO 📉',
    };
    return labels[level as keyof typeof labels] || level;
  };

  const stats = {
    total: clients.length,
    buyers: clients.filter((c) => c.total_orders > 0).length,
    attempts: clients.filter((c) => c.total_orders === 0).length,
    totalRevenue: clients.reduce((sum, c) => sum + c.total_spent, 0),
    highScore: clients.filter((c) => c.purchase_intent_score >= 70).length,
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <UserRound className="h-8 w-8 text-orange-500" />
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

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Filter className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Alto Score IA</p>
              <p className="text-2xl font-bold">{stats.highScore}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros Avançados */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por email, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={scoreFilter} onValueChange={setScoreFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Score IA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Scores</SelectItem>
              <SelectItem value="very_high">Muito Alto (≥80)</SelectItem>
              <SelectItem value="high">Alto (60-79)</SelectItem>
              <SelectItem value="medium">Médio (40-59)</SelectItem>
              <SelectItem value="low">Baixo (&lt;40)</SelectItem>
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
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserRound className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{client.email}</p>
                      {client.cpf && <p className="text-sm text-muted-foreground">CPF: {client.cpf}</p>}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  {client.telefone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="font-medium">{client.telefone}</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Pedidos</p>
                    <p className="font-medium">{client.total_orders}</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(client.total_spent)}
                    </p>
                  </div>
                </div>

                <div className="md:col-span-3 flex items-center gap-2 justify-end">
                  <Badge className={getScoreBadgeColor(client.purchase_intent_score)}>
                    Score: {client.purchase_intent_score}%
                  </Badge>
                  <Badge variant="outline">{getInterestLevelLabel(client.ai_interest_level)}</Badge>
                </div>
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
