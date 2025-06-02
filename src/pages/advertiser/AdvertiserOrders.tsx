
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight,
  Filter,
  Search,
  Download,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdvertiserOrders = () => {
  const navigate = useNavigate();

  // Mock data - em produção viria da API
  const orders = [
    {
      id: 1,
      number: '#ADV-2024-001',
      status: 'pending',
      total: 299.90,
      date: '2024-01-15',
      panels: 3,
      building: 'Edifício Sunset Boulevard',
      neighborhood: 'Jardins'
    },
    {
      id: 2,
      number: '#ADV-2024-002',
      status: 'approved',
      total: 450.00,
      date: '2024-01-10',
      panels: 5,
      building: 'Residencial Green Park',
      neighborhood: 'Vila Madalena'
    },
    {
      id: 3,
      number: '#ADV-2024-003',
      status: 'completed',
      total: 180.50,
      date: '2024-01-05',
      panels: 2,
      building: 'Condomínio Flores',
      neighborhood: 'Pinheiros'
    }
  ];

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { 
        label: 'Pendente', 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Clock 
      },
      approved: { 
        label: 'Aprovado', 
        color: 'bg-blue-100 text-blue-800', 
        icon: CheckCircle 
      },
      completed: { 
        label: 'Concluído', 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle 
      },
      rejected: { 
        label: 'Rejeitado', 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle 
      }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const stats = [
    {
      title: 'Total de Pedidos',
      value: '12',
      change: '+2 este mês',
      icon: ShoppingBag,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Pedidos Ativos',
      value: '8',
      change: '+1 esta semana',
      icon: Clock,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Concluídos',
      value: '24',
      change: '+5 este mês',
      icon: CheckCircle,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Valor Total',
      value: 'R$ 3.240',
      change: '+12% este mês',
      icon: ArrowRight,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              Meus Pedidos
            </h1>
            <p className="text-gray-600 mt-2">
              Acompanhe o status e detalhes dos seus pedidos de publicidade
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`}></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm bg-white/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por número do pedido, prédio..."
                    className="pl-10 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
                  <Calendar className="h-4 w-4 mr-2" />
                  Período
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Orders List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-4"
      >
        {orders.map((order, index) => {
          const statusInfo = getStatusInfo(order.status);
          const StatusIcon = statusInfo.icon;
          
          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group"
            >
              <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white/70 backdrop-blur-sm group-hover:bg-white/90">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {order.number}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {order.building} • {order.neighborhood}
                          </p>
                        </div>
                        <Badge className={`${statusInfo.color} border-0`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Data</p>
                          <p className="font-medium text-gray-900">
                            {new Date(order.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Painéis</p>
                          <p className="font-medium text-gray-900">{order.panels}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Valor</p>
                          <p className="font-medium text-gray-900">
                            R$ {order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/anunciante/pedido/${order.id}`)}
                        className="border-purple-200 text-purple-700 hover:bg-purple-50 group-hover:scale-105 transition-transform"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty State */}
      {orders.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center py-12"
        >
          <div className="mx-auto w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-12 w-12 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum pedido encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            Você ainda não fez nenhum pedido. Que tal começar agora?
          </p>
          <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Fazer Primeiro Pedido
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default AdvertiserOrders;
