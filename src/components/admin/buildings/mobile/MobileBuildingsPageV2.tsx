import React, { useState } from 'react';
import { Search, Plus, RefreshCw, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MobileBuildingCardV2 from './MobileBuildingCardV2';
import BuildingFormDialog from '../BuildingFormDialog';
import { useBuildingsVideoCount } from '@/hooks/useBuildingsVideoCount';
import { useBuildingsPanelsStatus } from '@/hooks/useBuildingPanelsStatus';
import { BuildingStats } from '@/services/buildingsStatsService';
import { cn } from '@/lib/utils';

interface MobileBuildingsPageV2Props {
  buildings: any[];
  stats: BuildingStats;
  loading: boolean;
  refetch: () => void;
  showFormDialog: boolean;
  onFormDialogChange: (show: boolean) => void;
  selectedBuilding: any;
  onNewBuilding: () => void;
  onView: (building: any) => void;
  onEdit: (building: any) => void;
  onImageManager: (building: any) => void;
  onDelete: (building: any) => void;
}

const MobileBuildingsPageV2: React.FC<MobileBuildingsPageV2Props> = ({
  buildings,
  stats,
  loading,
  refetch,
  showFormDialog,
  onFormDialogChange,
  selectedBuilding,
  onNewBuilding,
  onView,
  onEdit,
  onImageManager,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all');

  // Filter
  const filtered = buildings.filter(b => {
    const matchSearch = !searchTerm || 
      b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bairro.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount = buildings.filter(b => b.status === 'ativo').length;
  const inactiveCount = buildings.length - activeCount;

  // Hooks
  const buildingIds = filtered.map(b => b.id);
  const { counts: videoCounts } = useBuildingsVideoCount(buildingIds);
  const { data: panelsStatuses, isLoading: panelsLoading } = useBuildingsPanelsStatus(buildingIds);

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-[#F2F2F7]/95 backdrop-blur-xl border-b border-black/5">
        <div className="px-4 pt-3 pb-2">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Prédios</h1>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={refetch}
                disabled={loading}
                className="h-8 w-8 rounded-full"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
              <Button
                size="icon"
                onClick={onNewBuilding}
                className="h-8 w-8 rounded-full bg-[#9C1E1E] hover:bg-[#7A1818]"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Inline Stats */}
          <div className="flex items-center gap-4 text-[11px] mb-3">
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.total}</span> total
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-green-600">{stats.active}</span> ativos
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-orange-500">{stats.inactive}</span> inativos
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.totalPanels}</span> painéis
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 pr-3 text-[13px] bg-white/60 border-0 rounded-lg placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1.5">
            {(['all', 'ativo', 'inativo'] as const).map((key) => {
              const label = key === 'all' ? 'Todos' : key === 'ativo' ? 'Ativos' : 'Inativos';
              const count = key === 'all' ? buildings.length : key === 'ativo' ? activeCount : inactiveCount;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all",
                    statusFilter === key
                      ? "bg-[#9C1E1E] text-white"
                      : "bg-white/50 text-muted-foreground"
                  )}
                >
                  {label} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-3 space-y-1.5 pb-24">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum prédio encontrado</p>
          </div>
        ) : (
          filtered.map((building) => (
            <MobileBuildingCardV2
              key={building.id}
              building={building}
              videoCount={videoCounts[building.id] ?? 0}
              panelsStatus={panelsStatuses[building.id]}
              panelsStatusLoading={panelsLoading}
              onView={onView}
              onEdit={onEdit}
              onImageManager={onImageManager}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      <BuildingFormDialog
        open={showFormDialog}
        onOpenChange={onFormDialogChange}
        building={selectedBuilding}
        onSuccess={refetch}
      />
    </div>
  );
};

export default MobileBuildingsPageV2;
