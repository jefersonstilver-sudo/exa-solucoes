import React, { useState, useEffect } from 'react';
import { CalendarClock, ShoppingBag, AlertCircle, Loader2, Filter, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUserSession } from '@/hooks/useUserSession';
import { useUserOrdersAndAttempts } from '@/hooks/useUserOrdersAndAttempts';
import Layout from '@/components/layout/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ManualPaymentVerifier } from '@/components/checkout/payment/ManualPaymentVerifier';
import { AutoPaymentVerifier } from '@/components/admin/AutoPaymentVerifier';
import { PaymentRecoveryPanel } from '@/components/admin/PaymentRecoveryPanel';

const Pedidos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [showVerifier, setShowVerifier] = useState<string | null>(null);
  const { isLoggedIn, user, hasRole } = useUserSession();
  const { userOrdersAndAttempts, loading, refetch } = useUserOrdersAndAttempts(user?.id);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isAdmin = hasRole('admin') || hasRole('super_admin');

  // LOGS DE DEBUG DETALHADOS
  console.log('📋 Pedidos: === ESTADO ATUAL ===');
  console.log('📋 Pedidos: Usuário logado:', isLoggedIn);
  console.log('📋 Pedidos: Dados do usuário:', user);
  console.log('📋 Pedidos: User ID:', user?.id);
  console.log('📋 Pedidos: É admin:', isAdmin);
  console.log('📋 Pedidos: Loading:', loading);
  console.log('📋 Pedidos: Total de itens carregados:', userOrdersAndAttempts.length);
  console.log('📋 Pedidos: Detalhes dos itens:', userOrdersAndAttempts);

  // Log de verificação de autenticação
  useEffect(() => {
    console.log('🔐 Pedidos: Verificação de autenticação');
    console.log('🔐 Pedidos: isLoggedIn:', isLoggedIn);
    console.log('🔐 Pedidos: user:', user);
    
    if (!isLoggedIn) {
      console.log('⚠️ Pedidos: Usuário não está logado, redirecionando...');
      navigate('/login');
    }
  }, [isLoggedIn, user, navigate]);

  // Se não estiver logado, não renderizar nada (será redirecionado)
  if (!isLoggedIn || !user) {
    console.log('❌ Pedidos: Usuário não autenticado');
    return null;
  }

  // Filtrar pedidos e tentativas
  const filteredItems = userOrdersAndAttempts.filter(item => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.valor_total).includes(searchTerm);
    
    const matchesStatus = 
      statusFilter === 'todos' || 
      item.status.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesType = 
      typeFilter === 'todos' || 
      (typeFilter === 'order' && item.status !== 'tentativa') ||
      (typeFilter === 'attempt' && item.status === 'tentativa');

    return matchesSearch && matchesStatus && matchesType;
  });

  console.log('🔍 Pedidos: Itens após filtros:', filteredItems.length);

  // Formatador de status para exibição
  const formatStatus = (item: any) => {
    if (item.status === 'tentativa') {
      return { 
        label: 'Tentativa Abandonada', 
        color: 'bg-orange-600 text-white text-xs px-2 py-1 font-semibold border-0' 
      };
    }

    const status = item.status.toLowerCase();
    switch (status) {
      case 'pendente':
        return { label: 'Pagamento Pendente', color: 'bg-yellow-600 text-white text-xs px-2 py-1 font-semibold border-0' };
      case 'pago':
      case 'pago_pendente_video':
        return { label: 'Pago - Aguardando Vídeo', color: 'bg-green-600 text-white text-xs px-2 py-1 font-semibold border-0' };
      case 'video_aprovado':
        return { label: 'Vídeo Aprovado', color: 'bg-blue-600 text-white text-xs px-2 py-1 font-semibold border-0' };
      case 'ativo':
        return { label: 'Campanha Ativa', color: 'bg-green-600 text-white text-xs px-2 py-1 font-semibold border-0' };
      case 'cancelado':
        return { label: 'Cancelado', color: 'bg-red-600 text-white text-xs px-2 py-1 font-semibold border-0' };
      default:
        return { label: status || 'Desconhecido', color: 'bg-gray-700 text-white text-xs px-2 py-1 font-semibold border-0' };
    }
  };

  // Formatador de data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Renderização de card para visualização mobile com verificador
  const renderMobileCard = (item: any) => {
    const status = formatStatus(item);
    const paineisList = item.lista_paineis || [];
    const isPendingPix = item.status === 'pendente';
    const isAttempt = item.status === 'tentativa';

    return (
      <Card key={item.id} className="mb-4 p-4 bg-white border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Badge className={status.color}>{status.label}</Badge>
              {isAttempt && (
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Tentativa
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900">ID: {item.id.substring(0, 8)}...</h3>
          </div>
          <p className={`text-right font-bold text-lg ${isAttempt ? 'text-orange-600' : 'text-gray-900'}`}>
            R$ {item.valor_total?.toFixed(2).replace('.', ',') || '0,00'}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mt-3">
          <div>
            <p className="text-gray-700 font-medium">Data</p>
            <p className="text-gray-900 font-semibold">{formatDate(item.created_at)}</p>
          </div>
          <div>
            <p className="text-gray-700 font-medium">Duração</p>
            <p className="text-gray-900 font-semibold">
              {item.plano_meses} {item.plano_meses === 1 ? 'mês' : 'meses'}
            </p>
          </div>
          <div>
            <p className="text-gray-700 font-medium">Período</p>
            <p className="flex items-center text-gray-900 font-semibold">
              <CalendarClock className="h-3 w-3 mr-1 text-indexa-purple" />
              <span>
                {item.data_inicio 
                  ? `${formatDate(item.data_inicio)} - ${formatDate(item.data_fim)}`
                  : 'Não definido'
                }
              </span>
            </p>
          </div>
          <div>
            <p className="text-gray-700 font-medium">Qtd. Painéis</p>
            <p className="text-gray-900 font-semibold">{paineisList.length}</p>
          </div>
        </div>
        
        {/* Verificador de pagamento para pedidos pendentes */}
        {isPendingPix && (
          <div className="mt-4">
            <ManualPaymentVerifier
              pedidoId={item.id}
              currentStatus={item.status}
              onStatusUpdated={() => {
                refetch();
                toast.success("Dados atualizados!");
              }}
            />
          </div>
        )}
        
        {!isAttempt ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/pedido-confirmado?id=${item.id}`)}
            className="w-full mt-3 border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white font-medium"
          >
            Ver Detalhes
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.info('Esta foi uma tentativa não finalizada. Experimente fazer um novo pedido!');
              navigate('/paineis-digitais/loja');
            }}
            className="w-full mt-3 border-orange-500 text-orange-700 hover:bg-orange-500 hover:text-white font-medium"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Finalizar Compra
          </Button>
        )}
      </Card>
    );
  };

  if (loading) {
    console.log('⏳ Pedidos: Exibindo tela de carregamento');
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indexa-purple mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Carregando pedidos...</h2>
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <ShoppingBag className="mr-2 h-6 w-6 md:h-8 md:w-8 text-indexa-purple" />
            Meus Pedidos e Tentativas
          </h1>
          <p className="text-gray-700 mt-1 font-medium">
            Confira o histórico completo de pedidos finalizados e tentativas de compra
          </p>
        </motion.div>

        {/* Sistema de Backup Automático e Recovery - Apenas para Admins */}
        {isAdmin && (
          <div className="mb-6 space-y-4">
            <AutoPaymentVerifier />
            <PaymentRecoveryPanel />
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Buscar por ID ou valor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:max-w-xs bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-white border-gray-300 text-gray-900">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="order">Apenas Pedidos</SelectItem>
              <SelectItem value="attempt">Apenas Tentativas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-white border-gray-300 text-gray-900">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="tentativa">Tentativas</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredItems.length === 0 ? (
          <Card className="p-8 text-center bg-white border-gray-200">
            <div className="mx-auto bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              {userOrdersAndAttempts.length === 0 ? 'Nenhum pedido encontrado' : 'Nenhum resultado para os filtros aplicados'}
            </h2>
            <p className="text-gray-700 mb-6 font-medium">
              {userOrdersAndAttempts.length === 0
                ? 'Você ainda não realizou nenhum pedido em nossa plataforma.'
                : 'Tente ajustar os filtros para encontrar seus pedidos.'
              }
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={() => navigate('/paineis-digitais/loja')}
                className="bg-indexa-purple hover:bg-indexa-purple/90 font-semibold"
              >
                Explorar Painéis
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Versão Mobile - Cards */}
            {isMobile && filteredItems.map(renderMobileCard)}

            {/* Versão Desktop - Tabela */}
            {!isMobile && (
              <Card className="overflow-hidden bg-white border-gray-200">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-200">
                        <TableHead className="text-gray-900 font-semibold">Tipo</TableHead>
                        <TableHead className="text-gray-900 font-semibold">ID</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Data</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Status</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Valor</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Duração</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Período</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Qtd. Painéis</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => {
                        const status = formatStatus(item);
                        const paineisList = item.lista_paineis || [];
                        const isPendingPix = item.status === 'pendente';
                        const isAttempt = item.status === 'tentativa';
                        
                        return (
                          <React.Fragment key={item.id}>
                            <TableRow className="border-gray-200 hover:bg-gray-50">
                              <TableCell>
                                {isAttempt ? (
                                  <Badge variant="outline" className="border-orange-500 text-orange-700">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Tentativa
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-green-500 text-green-700">
                                    Pedido
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-medium text-gray-900">
                                {item.id.substring(0, 8)}...
                              </TableCell>
                              <TableCell className="text-gray-800 font-medium">
                                {formatDate(item.created_at)}
                              </TableCell>
                              <TableCell>
                                <Badge className={status.color}>
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell className={`font-bold text-base ${isAttempt ? 'text-orange-600' : 'text-gray-900'}`}>
                                R$ {item.valor_total?.toFixed(2).replace('.', ',') || '0,00'}
                              </TableCell>
                              <TableCell className="text-gray-800 font-medium">
                                {item.plano_meses} {item.plano_meses === 1 ? 'mês' : 'meses'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                <div className="flex items-center text-gray-800 font-medium">
                                  <CalendarClock className="h-4 w-4 mr-1 text-indexa-purple" />
                                  <span>
                                    {item.data_inicio 
                                      ? `${formatDate(item.data_inicio)} - ${formatDate(item.data_fim)}`
                                      : 'Não definido'
                                    }
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-800 font-medium">
                                {paineisList.length}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col space-y-2">
                                  {!isAttempt ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigate(`/pedido-confirmado?id=${item.id}`)}
                                      className="border-indexa-purple text-indexa-purple hover:bg-indexa-purple hover:text-white font-medium"
                                    >
                                      Detalhes
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        toast.info('Tentativa não finalizada. Experimente fazer um novo pedido!');
                                        navigate('/paineis-digitais/loja');
                                      }}
                                      className="border-orange-500 text-orange-700 hover:bg-orange-500 hover:text-white font-medium"
                                    >
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Finalizar
                                    </Button>
                                  )}
                                  
                                  {isPendingPix && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowVerifier(showVerifier === item.id ? null : item.id)}
                                      className="border-blue-500 text-blue-700 hover:bg-blue-500 hover:text-white font-medium"
                                    >
                                      {showVerifier === item.id ? 'Ocultar' : 'Verificar Pag.'}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            
                            {/* Linha expandida com verificador */}
                            {isPendingPix && showVerifier === item.id && (
                              <TableRow>
                                <TableCell colSpan={9} className="p-4 bg-blue-50">
                                  <ManualPaymentVerifier
                                    pedidoId={item.id}
                                    currentStatus={item.status}
                                    onStatusUpdated={() => {
                                      refetch();
                                      setShowVerifier(null);
                                      toast.success("Dados atualizados!");
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
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
