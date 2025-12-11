import React from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Plus, RefreshCw } from 'lucide-react';

interface BuildingsHeader3Props {
  stats: {
    total: number;
    active: number;
    inactive: number;
    totalPanels: number;
  };
  loading: boolean;
  onRefresh: () => void;
  onNewBuilding: () => void;
}

const BuildingsHeader3: React.FC<BuildingsHeader3Props> = ({
  stats,
  loading,
  onRefresh,
  onNewBuilding
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        {/* Title & Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#9C1E1E]/10 rounded-xl">
              <Building2 className="h-5 w-5 text-[#9C1E1E]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Prédios</h1>
              <p className="text-xs text-gray-500">Gestão de locais</p>
            </div>
          </div>

          {/* Inline Stats */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold text-gray-900">{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg">
              <span className="text-emerald-600">Ativos</span>
              <span className="font-semibold text-emerald-700">{stats.active}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
              <span className="text-gray-500">Inativos</span>
              <span className="font-semibold text-gray-700">{stats.inactive}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
              <span className="text-blue-600">Telas</span>
              <span className="font-semibold text-blue-700">{stats.totalPanels}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 w-9 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={onNewBuilding}
            size="sm"
            className="h-9 bg-[#9C1E1E] hover:bg-[#7A1818] text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Prédio
          </Button>
        </div>
      </div>

      {/* Mobile Stats */}
      <div className="md:hidden grid grid-cols-4 gap-2 mt-4">
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{stats.total}</div>
          <div className="text-[10px] text-gray-500 uppercase">Total</div>
        </div>
        <div className="text-center p-2 bg-emerald-50 rounded-lg">
          <div className="text-lg font-bold text-emerald-700">{stats.active}</div>
          <div className="text-[10px] text-emerald-600 uppercase">Ativos</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-700">{stats.inactive}</div>
          <div className="text-[10px] text-gray-500 uppercase">Inativos</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-700">{stats.totalPanels}</div>
          <div className="text-[10px] text-blue-600 uppercase">Telas</div>
        </div>
      </div>
    </div>
  );
};

export default BuildingsHeader3;
