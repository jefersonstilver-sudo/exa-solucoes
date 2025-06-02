
import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  ShoppingBag, 
  Video, 
  TrendingUp, 
  Eye,
  Play,
  Calendar,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const AdvertiserDashboard = () => {
  const stats = [
    {
      title: 'Campanhas Ativas',
      value: '8',
      change: '+2 esta semana',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Total de Pedidos',
      value: '24',
      change: '+15% este mês',
      icon: ShoppingBag,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Vídeos Publicados',
      value: '156',
      change: '+8 esta semana',
      icon: Video,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Visualizações',
      value: '12.4K',
      change: '+23% este mês',
      icon: Eye,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const recentOrders = [
    {
      id: 1,
      number: '#ADV-2024-001',
      status: 'pending',
      building: 'Edifício Sunset',
      date: '2024-01-15'
    },
    {
      id: 2,
      number: '#ADV-2024-002',
      status: 'approved',
      building: 'Green Park',
      date: '2024-01-10'
    },
    {
      id: 3,
      number: '#ADV-2024-003',
      status: 'completed',
      building: 'Condomínio Flores',
      date: '2024-01-05'
    }
  ];

  const recentVideos = [
    {
      id: 1,
      title: 'Campanha Verão 2024',
      views: '2.1K',
      status: 'active',
      thumbnail: 'https://via.placeholder.com/120x80'
    },
    {
      id: 2,
      title: 'Promoção Black Friday',
      views: '3.8K',
      status: 'completed',
      thumbnail: 'https://via.placeholder.com/120x80'
    },
    {
      id: 3,
      title: 'Lançamento Produto',
      views: '1.5K',
      status: 'pending',
      thumbnail: 'https://via.placeholder.com/120x80'
    }
  ];

  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
      active: { label: 'Ativo', color: 'bg-green-100 text-green-800' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center lg:text-left"
      >
        <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
          Bem-vindo de volta! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          Aqui está o resumo das suas campanhas e atividades recentes
        </p>
      </motion.div>

      {/* Stats Grid */}
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
            whileHover={{ scale: 1.05 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm group">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2 text-purple-600" />
                  Pedidos Recentes
                </CardTitle>
                <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentOrders.map((order, index) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <ShoppingBag className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.number}</p>
                        <p className="text-sm text-gray-600">{order.building}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${statusInfo.color} border-0 mb-1`}>
                        {statusInfo.label}
                      </Badge>
                      <p className="text-xs text-gray-500">
                        {new Date(order.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Videos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <Video className="h-5 w-5 mr-2 text-purple-600" />
                  Vídeos Recentes
                </CardTitle>
                <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentVideos.map((video, index) => {
                const statusInfo = getStatusInfo(video.status);
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors group"
                  >
                    <div className="relative w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{video.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {video.views} visualizações
                        </p>
                        <Badge className={`${statusInfo.color} border-0 text-xs`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
          <CardContent className="p-8 relative">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Pronto para criar sua próxima campanha?</h3>
                <p className="text-purple-100">
                  Alcance milhares de pessoas com publicidade direcionada em prédios residenciais
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <Video className="h-4 w-4 mr-2" />
                  Criar Vídeo
                </Button>
                <Button variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Novo Pedido
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdvertiserDashboard;
