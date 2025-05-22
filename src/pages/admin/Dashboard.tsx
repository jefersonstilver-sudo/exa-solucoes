
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BuildingIcon, 
  ImageIcon, 
  ShoppingBag, 
  ArrowUp, 
  ArrowDown,
  Users,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types
interface DashboardStats {
  totalBuildings: number;
  activePanels: number;
  pendingOrders: number;
  totalRevenue: number;
  recentOrders: any[];
}

// Dummy data (will be replaced with real data)
const fetchDashboardData = async (): Promise<DashboardStats> => {
  try {
    // Get buildings count
    const { count: buildingsCount, error: buildingsError } = await supabase
      .from('buildings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo');
    
    // Get panels count
    const { count: panelsCount, error: panelsError } = await supabase
      .from('painels')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'online');
    
    // Get pending orders
    const { count: pendingOrdersCount, error: pendingOrdersError } = await supabase
      .from('pedidos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pendente');
    
    // Get total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('pedidos')
      .select('valor_total')
      .eq('status', 'pago');
    
    let totalRevenue = 0;
    if (revenueData) {
      totalRevenue = revenueData.reduce((sum, order) => sum + (Number(order.valor_total) || 0), 0);
    }
    
    // Get recent orders
    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from('pedidos')
      .select(`
        id, 
        created_at, 
        valor_total, 
        status, 
        client_id,
        plano_meses
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (buildingsError || panelsError || pendingOrdersError || revenueError || recentOrdersError) {
      console.error("Error fetching dashboard data:", { 
        buildingsError, panelsError, pendingOrdersError, revenueError, recentOrdersError 
      });
      throw new Error("Failed to fetch dashboard data");
    }
    
    return {
      totalBuildings: buildingsCount || 0,
      activePanels: panelsCount || 0,
      pendingOrders: pendingOrdersCount || 0,
      totalRevenue,
      recentOrders: recentOrders || []
    };
  } catch (error) {
    console.error("Error in fetchDashboardData:", error);
    // Return default values if there's an error
    return {
      totalBuildings: 0,
      activePanels: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      recentOrders: []
    };
  }
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Fetch dashboard data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    refetchInterval: 60000 // Refetch every minute
  });
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  // Handle status badge color
  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pendente':
      case 'false':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pendente</Badge>;
      case 'pago':
      case 'true':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Pago</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Prédios Cadastrados</CardTitle>
              <BuildingIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : data?.totalBuildings}</div>
              <p className="text-xs text-gray-500 mt-1">+2 no último mês</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Painéis Ativos</CardTitle>
              <ImageIcon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : data?.activePanels}</div>
              <div className="flex items-center pt-1">
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+5% este mês</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
              <ShoppingBag className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : data?.pendingOrders}</div>
              <div className="flex items-center pt-1">
                <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-xs text-red-500">Requer atenção</span>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs justify-center"
                onClick={() => navigate('/admin/pedidos/pendentes')}
              >
                Ver detalhes
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <Calendar className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : formatCurrency(data?.totalRevenue || 0)}
              </div>
              <div className="flex items-center pt-1">
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-500">+12% este mês</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Os 5 pedidos mais recentes do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indexa-purple"></div>
              </div>
            ) : data?.recentOrders && data.recentOrders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID do Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatCurrency(order.valor_total || 0)}</TableCell>
                      <TableCell>
                        {order.plano_meses || 1} {order.plano_meses === 1 ? 'mês' : 'meses'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/admin/pedidos/detalhes/${order.id}`)}
                        >
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum pedido recente encontrado
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="ghost" onClick={() => refetch()}>Atualizar</Button>
            <Button onClick={() => navigate('/admin/pedidos')}>Ver todos os pedidos</Button>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
