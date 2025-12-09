import React from 'react';
import { BuildingStats } from '@/services/buildingsStatsService';

interface MobileBuildingsStatsProps {
  stats: BuildingStats;
}

const MobileBuildingsStats: React.FC<MobileBuildingsStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-4 gap-2">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
        <p className="text-lg font-bold text-foreground">{stats.total}</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ativos</p>
        <p className="text-lg font-bold text-green-600">{stats.active}</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Inativos</p>
        <p className="text-lg font-bold text-orange-500">{stats.inactive}</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 text-center shadow-sm border border-gray-100">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Painéis</p>
        <p className="text-lg font-bold text-foreground">{stats.totalPanels}</p>
      </div>
    </div>
  );
};

export default MobileBuildingsStats;
