import { AlertCircle, Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { AlertStats } from '../utils/alerts';

interface AlertStatsCardsProps {
  stats: AlertStats;
}

export const AlertStatsCards = ({ stats }: AlertStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {/* Abertos */}
      <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#E30613]/20 hover:border-[#E30613]/40 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E30613]/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-[#E30613]" />
          </div>
          <div>
            <p className="text-sm text-white/70">Abertos</p>
            <p className="text-2xl font-bold text-white">{stats.open}</p>
          </div>
        </div>
      </div>

      {/* Agendados */}
      <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2C2C2C] hover:border-[#2C2C2C]/60 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2C2C2C] flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <p className="text-sm text-white/70">Agendados</p>
            <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
          </div>
        </div>
      </div>

      {/* Resolvidos */}
      <div className="bg-[#1A1A1A] rounded-lg p-4 border border-green-500/20 hover:border-green-500/40 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-white/70">Resolvidos</p>
            <p className="text-2xl font-bold text-white">{stats.resolved}</p>
          </div>
        </div>
      </div>

      {/* Ignorados */}
      <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#2C2C2C] hover:border-[#2C2C2C]/60 transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#2C2C2C] flex items-center justify-center">
            <XCircle className="w-5 h-5 text-white/50" />
          </div>
          <div>
            <p className="text-sm text-white/70">Ignorados</p>
            <p className="text-2xl font-bold text-white">{stats.ignored}</p>
          </div>
        </div>
      </div>

      {/* Críticos */}
      <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#E30613] hover:border-[#E30613] transition-all duration-300 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#E30613] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-white/70">Críticos</p>
            <p className="text-2xl font-bold text-[#E30613]">{stats.critical}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
