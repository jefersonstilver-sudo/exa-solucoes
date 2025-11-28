import { AlertCircle, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { AlertStats } from '../utils/alerts';

interface AlertStatsCardsProps {
  stats: AlertStats;
}

export const AlertStatsCards = ({ stats }: AlertStatsCardsProps) => {
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-4 md:mb-6">
      {/* Abertos */}
      <div className="group bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 border border-white/20 dark:border-white/10 hover:border-[#9C1E1E]/40 dark:hover:border-[#9C1E1E]/40 shadow-lg hover:shadow-xl hover:bg-white/70 dark:hover:bg-neutral-900/50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9C1E1E]/10 dark:bg-[#9C1E1E]/20 flex items-center justify-center group-hover:bg-[#9C1E1E]/20 transition-colors">
            <AlertCircle className="w-5 h-5 text-[#9C1E1E]" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Abertos</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">{stats.open}</p>
          </div>
        </div>
      </div>

      {/* Agendados */}
      <div className="group bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/15 shadow-lg hover:shadow-xl hover:bg-white/70 dark:hover:bg-neutral-900/50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Agendados</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">{stats.scheduled}</p>
          </div>
        </div>
      </div>

      {/* Resolvidos */}
      <div className="group bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 border border-white/20 dark:border-white/10 hover:border-green-500/40 dark:hover:border-green-500/40 shadow-lg hover:shadow-xl hover:bg-white/70 dark:hover:bg-neutral-900/50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Resolvidos</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Ignorados */}
      <div className="group bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 border border-white/20 dark:border-white/10 hover:border-white/30 dark:hover:border-white/15 shadow-lg hover:shadow-xl hover:bg-white/70 dark:hover:bg-neutral-900/50 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-500/10 dark:bg-gray-500/20 flex items-center justify-center group-hover:bg-gray-500/20 transition-colors">
            <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">Ignorados</p>
            <p className="text-xl md:text-2xl font-bold text-foreground">{stats.ignored}</p>
          </div>
        </div>
      </div>

      {/* Críticos */}
      <div className="group bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md rounded-xl lg:rounded-2xl p-4 border border-[#9C1E1E] dark:border-[#9C1E1E] shadow-lg hover:shadow-xl shadow-[#9C1E1E]/20 hover:bg-white/70 dark:hover:bg-neutral-900/50 transition-all duration-300 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9C1E1E] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-white/90 dark:text-white/90 font-medium">Críticos</p>
            <p className="text-xl md:text-2xl font-bold text-[#9C1E1E] dark:text-[#9C1E1E]">{stats.critical}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
