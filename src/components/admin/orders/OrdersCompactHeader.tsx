import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { RefreshCw, Volume2, VolumeX, Play, Wrench, Settings2 } from 'lucide-react';
import { OrderPeriodFilter, PeriodFilter } from './OrderPeriodFilter';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationSound, SOUND_OPTIONS } from '@/hooks/useNotificationSound';
import { useOrdersReconciliationComplete } from '@/hooks/useOrdersReconciliationComplete';
import ReconciliationModal from './ReconciliationModal';

interface OrdersCompactHeaderProps {
  onRefresh: () => void;
  loading: boolean;
  periodFilter: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  onAddOrder?: () => void;
}

const OrdersCompactHeader: React.FC<OrdersCompactHeaderProps> = ({
  onRefresh,
  loading,
  periodFilter,
  onPeriodChange,
  onAddOrder
}) => {
  const { enabled, volume, soundType, toggleSound, setVolume, setSoundType, playPreview } = useNotificationSound();
  const { runReconciliation, isReconciling, result, clearResult } = useOrdersReconciliationComplete();
  const [reconciliationModalOpen, setReconciliationModalOpen] = useState(false);

  const handleReconcile = async () => {
    await runReconciliation();
  };

  const handleOpenReconciliationModal = () => {
    clearResult();
    setReconciliationModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between py-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-gradient-to-b from-[#9C1E1E] to-[#DC2626] rounded-full" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] bg-clip-text text-transparent">
            Pedidos
          </h1>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Period Filter */}
          <OrderPeriodFilter value={periodFilter} onChange={onPeriodChange} />
          
          {/* Botão Adicionar Pedido - Visível */}
          {onAddOrder && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddOrder}
                    className="h-9 border-[#9C1E1E]/30 text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white transition-all duration-200 font-medium gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Adicionar Pedido</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Criar pedido manualmente (Horizontal ou Vertical Premium)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-9 w-9 p-0 hover:bg-[#9C1E1E]/10 hover:text-[#9C1E1E] transition-all duration-200"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {onAddOrder && (
                <>
                  <DropdownMenuItem onClick={onAddOrder}>
                    <Plus className="h-4 w-4 mr-2 text-[#9C1E1E]" />
                    <span className="text-[#9C1E1E] font-medium">Adicionar Pedido</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={onRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar Dados
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleOpenReconciliationModal}>
                <Wrench className="h-4 w-4 mr-2 text-amber-600" />
                <span className="text-amber-600 font-medium">Reconciliar Pagamentos</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        
        {/* Sound Control Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-9 w-9 p-0 hover:bg-[#9C1E1E]/10 transition-all duration-200"
            >
              {enabled ? (
                <Volume2 className="h-4 w-4 text-[#9C1E1E]" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              {/* Header with toggle */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Som de Notificação</h4>
                <Switch 
                  checked={enabled} 
                  onCheckedChange={toggleSound}
                />
              </div>

              {/* Sound Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="sound-type" className="text-sm">
                  Tipo de Som
                </Label>
                <Select
                  value={soundType}
                  onValueChange={setSoundType}
                  disabled={!enabled}
                >
                  <SelectTrigger id="sound-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOUND_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Volume Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="volume-slider" className="text-sm">
                    Volume
                  </Label>
                  <span className="text-sm font-medium text-[#9C1E1E]">
                    {volume}%
                  </span>
                </div>
                <Slider 
                  id="volume-slider"
                  value={[volume]} 
                  onValueChange={([v]) => setVolume(v)}
                  max={100}
                  step={5}
                  disabled={!enabled}
                />
              </div>

              {/* Preview Button */}
              <Button 
                variant="outline" 
                className="w-full border-[#9C1E1E] text-[#9C1E1E] hover:bg-[#9C1E1E] hover:text-white"
                onClick={playPreview}
                disabled={!enabled}
              >
                <Play className="h-4 w-4 mr-2" />
                Testar Som
              </Button>

              {/* Info */}
              <p className="text-xs text-muted-foreground">
                💰 O som será tocado quando um novo pedido for pago.
              </p>
            </div>
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {/* Reconciliation Modal */}
      <ReconciliationModal
        open={reconciliationModalOpen}
        onOpenChange={setReconciliationModalOpen}
        result={result}
        isReconciling={isReconciling}
        onReconcile={handleReconcile}
        onRefresh={onRefresh}
      />
    </>
  );
};

export default OrdersCompactHeader;
