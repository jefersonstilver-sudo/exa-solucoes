import { motion } from 'framer-motion';
import { Bell, Users, TrendingUp, CheckCircle } from 'lucide-react';

interface EXAAlertsHeaderProps {
  stats: {
    totalDirectors: number;
    alertsToday: number;
    successRate: number;
  };
}

export const EXAAlertsHeader = ({ stats }: EXAAlertsHeaderProps) => {
  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#9C1E1E] via-[#B02029] to-[#D72638] p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Bell className="w-6 h-6" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold">
              Agente EXA Alerts
            </h1>
          </div>
          <p className="text-white/90 text-lg max-w-2xl">
            Configure alertas inteligentes e monitore envios em tempo real
          </p>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-white/10" />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Total Directors */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Diretores Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDirectors}</p>
            </div>
          </div>
        </div>

        {/* Alerts Today */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Alertas Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{stats.alertsToday}</p>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Taxa de Entrega</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
