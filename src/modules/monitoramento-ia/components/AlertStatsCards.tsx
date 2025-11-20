import { AlertCircle, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { AlertStats } from '../utils/alerts';

interface AlertStatsCardsProps {
  stats: AlertStats;
}

export const AlertStatsCards = ({ stats }: AlertStatsCardsProps) => {
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {/* Abertos */}
      <div className="bg-module-card rounded-[14px] p-4 border border-module-accent hover:border-[#9C1E1E]/40 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#9C1E1E]/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-[#9C1E1E]" />
          </div>
          <div>
            <p className="text-sm text-module-secondary">Abertos</p>
            <p className="text-2xl font-bold text-module-primary">{stats.open}</p>
          </div>
        </div>
      </div>

      {/* Agendados */}
      <div className="bg-module-card rounded-[14px] p-4 border border-module hover:border-module transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-module-input flex items-center justify-center">
            <Calendar className="w-5 h-5 text-module-secondary" />
          </div>
          <div>
            <p className="text-sm text-module-secondary">Agendados</p>
            <p className="text-2xl font-bold text-module-primary">{stats.scheduled}</p>
          </div>
        </div>
      </div>

      {/* Resolvidos */}
      <div className="bg-module-card rounded-[14px] p-4 border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-module-secondary">Resolvidos</p>
            <p className="text-2xl font-bold text-module-primary">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Ignorados */}
      <div className="bg-module-card rounded-[14px] p-4 border border-module hover:border-module transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-module-input flex items-center justify-center">
            <XCircle className="w-5 h-5 text-module-muted" />
          </div>
          <div>
            <p className="text-sm text-module-secondary">Ignorados</p>
            <p className="text-2xl font-bold text-module-primary">{stats.ignored}</p>
          </div>
        </div>
      </div>

      {/* Críticos */}
      <div className="bg-module-card rounded-[14px] p-4 border border-[#9C1E1E] hover:border-[#9C1E1E] transition-all duration-300 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#9C1E1E] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-module-secondary">Críticos</p>
            <p className="text-2xl font-bold text-[#9C1E1E]">{stats.critical}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
