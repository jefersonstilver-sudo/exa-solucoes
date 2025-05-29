
import React, { useState, useEffect } from 'react';
import { CalendarClock, ShoppingBag, AlertCircle, Loader2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserSession } from '@/hooks/useUserSession';
import Layout from '@/components/layout/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Pedido {
  id: string;
  created_at: string;
  status: string | boolean;
  valor_total: number;
  lista_paineis: string[] | null;
  plano_meses: number;
  data_inicio?: string;
  data_fim?: string;
  client_id?: string;
}

const Pedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const { isLoggedIn, user, hasRole } = useUserSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isAdmin = hasRole('admin') || hasRole('super_admin');

  // LOGS DE DEBUG para diagnóstico
  console.log('📋 Pedidos: Componente renderizado');
  console.log('📋 Pedidos: URL atual:', window.location.pathname);
  console.log('📋 Pedidos: Usuário logado:', isLoggedIn);
  console.log('📋 Pedidos: Dados do usuário:', user);
  console.log('📋 Pedidos: É admin:', isAdmin);

  // Carregar os pedidos baseado no perfil do usuário
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        console.log('📋 Pedidos: Iniciando carregamento de pedidos...');
        setIsLoading(true);
        
        let query = supabase.from('pedidos').select('*').order('created_at', { ascending: false });
        
        // Se não for admin, filtrar apenas os pedidos do usuário logado
        if (!isAdmin && user?.id) {
          console.log('📋 Pedidos: Filtrando por client_id:', user.id);
          query = query.eq('client_id', user.id);
        } else {
          console.log('📋 Pedidos: Carregando todos os pedidos (usuário admin)');
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('❌ Pedidos: Erro detalhado ao carregar pedidos:', error);
          throw error;
        }
        
        console.log("✅ Pedidos: Dados carregados com sucesso:", data);
        console.log("📊 Pedidos: Quantidade de pedidos:", data?.length || 0);
        setPedidos(data || []);
        setFilteredPedidos(data || []);
      } catch (error: any) {
        console.error('💥 Pedidos: Erro crítico ao carregar pedidos:', error.message || error);
        toast.error('Não foi possível carregar os pedidos');
      } finally {
        console.log('📋 Pedidos: Finalizando carregamento...');
        setIsLoading(false);
      }
    };

    if (user) {
      console.log('📋 Pedidos: Usuário disponível, iniciando carregamento');
      fetchPedidos();
    } else {
      console.log('📋 Pedidos: Aguardando dados do usuário...');
    }

    // Configurar inscrição em tempo real para atualizações de pedidos
    const channel = supabase
      .channel('public:pedidos')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pedidos' 
        }, 
        (payload) => {
          console.log('🔄 Pedidos: Mudança detectada em tempo real:', payload);
          if (user) {
            fetchPedidos(); // Recarregar todos os pedidos quando houver mudanças
          }
        }
      )
      .subscribe();

    // Limpar inscrição ao desmontar
    return () => {
      console.log('🧹 Pedidos: Limpando inscrições de tempo real');
      supabase.removeChannel(channel);
    };
  }, [isAdmin, user]);

  // Filtrar pedidos quando o termo de pesquisa ou filtro de status mudar
  useEffect(() => {
    if (pedidos.length === 0) return;

    console.log('🔍 Pedidos: Aplicando filtros - Termo:', searchTerm, 'Status:', statusFilter);

    const filtered = pedidos.filter(pedido => {
      const matchesSearch = 
        pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pedido.data_inicio && pedido.data_inicio.toLowerCase().includes(searchTerm.toLowerCase())) ||
        String(pedido.valor_total).includes(searchTerm);
      
      const matchesStatus = 
        statusFilter === 'todos' || 
        String(pedido.status).toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    console.log('📊 Pedidos: Resultados filtrados:', filtered.length);
    setFilteredPedidos(filtered);
  }, [searchTerm, statusFilter, pedidos]);

  // Formatador de status para exibição
  const formatStatus = (status: string | boolean) => {
    // Convertendo o status para string para garantir compatibilidade
    const statusString = String(status).toLowerCase();
    
    switch (statusString) {
      case 'pendente':
      case 'false':
        return { label: 'Pendente', color: 'bg-yellow-600 text-white text-xs px-2 py-1' };
      case 'pago':
      case 'true':
        return { label: 'Pago', color: 'bg-green-600 text-white text-xs px-2 py-1' };
      case 'cancelado':
        return { label: 'Cancelado', color: 'bg-red-600 text-white text-xs px-2 py-1' };
      default:
        return { label: statusString || 'Desconhecido', color: 'bg-gray-600 text-white text-xs px-2 py-1' };
    }
  };

  // Formatador de data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Renderização de card para visualização mobile
  const renderMobileCard = (pedido: Pedido) => {
    const status = formatStatus(pedido.status);
    const paineisList = Array.isArray(pedido.lista_paineis) ? pedido.lista_paineis : [];

    return (
      <Card key={pedido.id} className="mb-4 p-4 bg-white border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div>
            <Badge className={status.color}>{status.label}</Badge>
            <h3 className="font-medium mt-2 text-gray-900">ID: {pedido.id.substring(0, 8)}...</h3>
          </div>
          <p className="text-right font-semibold text-gray-900">
            R$ {pedido.valor_total?.toFixed(2).replace('.', ',') || '0,00'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
          <div>
            <p className="text-gray-600">Data do Pedido</p>
            <p className="text-gray-900">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-gray-600">Duração</p>
            <p className="text-gray-900">{pedido.plano_meses} {pedido.plano_meses === 1 ? 'mês' : 'meses'}</p>
          </div>
          <div>
            <p className="text-gray-600">Período</p>
            <p className="flex items-center text-gray-900">
              <CalendarClock className="h-3 w-3 mr-1 text-gray-500" />
              <span>{formatDate(pedido.data_inicio)} - {formatDate(pedido.data_fim)}</span>
            </p>
          </div>
          <div>
            <p className="text-gray-600">Qtd. Painéis</p>
            <p className="text-gray-900">{paineisList.length}</p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/pedido-confirmado?id=${pedido.id}`)}
          className="w-full mt-3"
        >
          Ver Detalhes
        </Button>
      </Card>
    );
  };

  if (isLoading) {
    console.log('⏳ Pedidos: Exibindo tela de carregamento');
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indexa-purple mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Carregando pedidos...</h2>
          </div>
        </div>
      </Layout>
    );
  }

  console.log('🎨 Pedidos: Renderizando interface principal');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-8">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
            <ShoppingBag className="mr-2 h-6 w-6 md:h-8 md:w-8 text-indexa-purple" />
            {isAdmin ? "Todos os Pedidos" : "Meus Pedidos"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? "Lista completa de todos os pedidos do sistema" : "Confira o histórico e status de todas as suas campanhas"}
          </p>
        </motion.div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Buscar por ID, data ou valor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-xs bg-white border-gray-300 text-gray-900"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-white border-gray-300 text-gray-900">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredPedidos.length === 0 ? (
          <Card className="p-8 text-center bg-white border-gray-200">
            <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="text-xl font-medium mb-2 text-gray-900">Nenhum pedido encontrado</h2>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'todos' 
                ? 'Nenhum pedido corresponde aos filtros aplicados.'
                : 'Você ainda não realizou nenhum pedido em nossa plataforma.'}
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={() => navigate('/paineis-digitais/loja')}
                className="bg-indexa-purple hover:bg-indexa-purple/90"
              >
                Explorar Painéis
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Versão Mobile - Cards */}
            {isMobile && filteredPedidos.map(renderMobileCard)}

            {/* Versão Desktop - Tabela */}
            {!isMobile && (
              <Card className="overflow-hidden bg-white border-gray-200">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-700 font-semibold">ID do Pedido</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Data</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Valor</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Duração</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Período</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Qtd. Painéis</TableHead>
                        <TableHead className="text-gray-700 font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPedidos.map((pedido) => {
                        const status = formatStatus(pedido.status);
                        const paineisList = Array.isArray(pedido.lista_paineis) ? pedido.lista_paineis : [];
                        
                        return (
                          <TableRow key={pedido.id} className="border-gray-200 hover:bg-gray-50">
                            <TableCell className="font-medium text-gray-900">
                              {pedido.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-900 font-semibold">
                              R$ {pedido.valor_total?.toFixed(2).replace('.', ',') || '0,00'}
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {pedido.plano_meses} {pedido.plano_meses === 1 ? 'mês' : 'meses'}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center text-gray-700">
                                <CalendarClock className="h-4 w-4 mr-1 text-gray-500" />
                                <span>
                                  {formatDate(pedido.data_inicio)} - {formatDate(pedido.data_fim)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">
                              {paineisList.length}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/pedido-confirmado?id=${pedido.id}`)}
                              >
                                Detalhes
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Pedidos;
