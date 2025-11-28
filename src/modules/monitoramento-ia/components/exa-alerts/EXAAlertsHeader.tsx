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
    <div className="space-y-4 md:space-y-6">
      {/* Hero Header - Glass Premium */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-[#9C1E1E] via-[#B02029] to-[#D72638] p-6 md:p-8 text-white shadow-2xl"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2 md:mb-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              Agente EXA Alerts
            </h1>
          </div>
          <p className="text-white/90 text-sm md:text-base lg:text-lg max-w-2xl">
            Configure alertas inteligentes e monitore envios em tempo real
          </p>
        </div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
        </div>
      </motion.div>

      {/* Stats Cards - Glass Modern */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
      >
        {/* Total Directors */}
        <div className="group relative bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/30 dark:border-white/10 p-4 md:p-6 shadow-lg hover:shadow-xl hover:bg-white/80 dark:hover:bg-neutral-900/50 transition-all duration-300">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl group-hover:bg-blue-500/20 transition-colors">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Diretores Ativos</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{stats.totalDirectors}</p>
            </div>
          </div>
        </div>

        {/* Alerts Today */}
        <div className="group relative bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/30 dark:border-white/10 p-4 md:p-6 shadow-lg hover:shadow-xl hover:bg-white/80 dark:hover:bg-neutral-900/50 transition-all duration-300">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl group-hover:bg-purple-500/20 transition-colors">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Alertas Hoje</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{stats.alertsToday}</p>
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="group relative bg-white/70 dark:bg-neutral-900/40 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/30 dark:border-white/10 p-4 md:p-6 shadow-lg hover:shadow-xl hover:bg-white/80 dark:hover:bg-neutral-900/50 transition-all duration-300 sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="p-2 md:p-3 bg-green-500/10 dark:bg-green-500/20 rounded-xl group-hover:bg-green-500/20 transition-colors">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">Taxa de Entrega</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{stats.successRate}%</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
