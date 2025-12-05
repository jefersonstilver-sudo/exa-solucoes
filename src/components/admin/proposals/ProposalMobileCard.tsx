import React from 'react';
import { Eye, Clock, User, Check, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CollapsibleCard } from '@/components/admin/shared/CollapsibleCard';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useLongPress } from '@/hooks/useLongPress';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Proposal {
  id: string;
  number: string;
  client_name: string;
  client_cnpj?: string | null;
  client_phone: string | null;
  client_email: string | null;
  total_panels: number;
  fidel_monthly_value: number;
  cash_total_value: number;
  duration_months: number;
  status: string;
  created_at: string;
  view_count: number | null;
  total_time_spent_seconds: number | null;
  is_viewing?: boolean;
}

interface ProposalMobileCardProps {
  proposal: Proposal;
  onViewDetails: (id: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
}

const formatCurrency = (value: number) => {
  return value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00';
};

const formatTimeSpent = (seconds: number | null) => {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}min`;
};

const getStatusConfig = (status: string, isViewing?: boolean) => {
  if (isViewing && !['recusada', 'paga', 'convertida', 'expirada', 'aceita'].includes(status)) {
    return { label: '👁️ Ao vivo', className: 'bg-green-500 text-white animate-pulse' };
  }
  
  const configs: Record<string, { label: string; className: string }> = {
    pendente: { label: 'Pendente', className: 'bg-gray-100 text-gray-700' },
    enviada: { label: 'Enviada', className: 'bg-blue-100 text-blue-700' },
    visualizada: { label: 'Visualizada', className: 'bg-purple-100 text-purple-700' },
    aceita: { label: '✅ Aceita', className: 'bg-emerald-100 text-emerald-700' },
    paga: { label: '💰 Paga', className: 'bg-green-100 text-green-700' },
    convertida: { label: '🎉 Pedido', className: 'bg-green-600 text-white' },
    recusada: { label: '❌ Recusada', className: 'bg-red-100 text-red-700' },
    expirada: { label: 'Expirada', className: 'bg-gray-100 text-gray-500' },
  };
  return configs[status] || configs.pendente;
};

export const ProposalMobileCard: React.FC<ProposalMobileCardProps> = ({
  proposal,
  onViewDetails,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
  onToggleSelect,
}) => {
  const longPressHandlers = useLongPress({
    onLongPress: () => {
      if (onLongPress) onLongPress();
    },
    onClick: () => {
      if (isSelectionMode && onToggleSelect) {
        onToggleSelect();
      }
    },
    threshold: 500,
  });

  const statusConfig = getStatusConfig(proposal.status, proposal.is_viewing);
  const timeAgo = formatDistanceToNow(new Date(proposal.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const preview = (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono text-muted-foreground">{proposal.number}</span>
        <Badge className={`${statusConfig.className} text-[10px] px-1.5 py-0 border-0`}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Client name */}
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium text-foreground truncate text-sm">{proposal.client_name}</span>
      </div>

      {/* Values row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground">À Vista</p>
            <p className="text-sm font-bold text-emerald-600">{formatCurrency(proposal.cash_total_value)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Fidelidade</p>
            <p className="text-sm font-semibold">{formatCurrency(proposal.fidel_monthly_value)}/mês</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">{proposal.duration_months} meses</p>
          <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {/* Engagement metrics */}
      {(proposal.view_count || proposal.total_time_spent_seconds) && (
        <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
          {proposal.view_count && proposal.view_count > 0 && (
            <div className="flex items-center gap-1 text-purple-600">
              <Eye className="h-3 w-3" />
              <span className="text-[10px] font-medium">{proposal.view_count}x</span>
            </div>
          )}
          {proposal.total_time_spent_seconds && proposal.total_time_spent_seconds > 0 && (
            <div className="flex items-center gap-1 text-blue-600">
              <Clock className="h-3 w-3" />
              <span className="text-[10px] font-medium">{formatTimeSpent(proposal.total_time_spent_seconds)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const expandedContent = (
    <div className="space-y-3 pt-2" onClick={(e) => e.stopPropagation()}>
      {/* Buildings */}
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-[#9C1E1E]" />
        <span className="text-sm font-medium">{proposal.total_panels} painéis</span>
      </div>

      {/* Contact info */}
      {proposal.client_email && (
        <p className="text-xs text-muted-foreground truncate">{proposal.client_email}</p>
      )}
      {proposal.client_phone && (
        <p className="text-xs text-muted-foreground">{proposal.client_phone}</p>
      )}

      {/* Action */}
      <Button
        onClick={() => onViewDetails(proposal.id)}
        className="w-full bg-[#9C1E1E] hover:bg-[#7A1818] text-white h-9 text-sm font-medium"
      >
        Ver Detalhes
      </Button>
    </div>
  );

  // Selection mode - render simple selectable card
  if (isSelectionMode) {
    return (
      <motion.div
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        {...longPressHandlers}
        className={cn(
          "relative p-3 rounded-xl border-2 transition-all duration-200 select-none",
          "bg-white/80 backdrop-blur-sm shadow-md",
          isSelected 
            ? "border-[#9C1E1E] bg-red-50/50" 
            : "border-transparent"
        )}
      >
        {/* Selection checkbox - circular */}
        <motion.div 
          initial={false}
          animate={{ 
            scale: isSelected ? 1 : 0.9,
            backgroundColor: isSelected ? '#9C1E1E' : '#FFFFFF'
          }}
          className={cn(
            "absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected ? "border-[#9C1E1E]" : "border-gray-300"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleSelect) onToggleSelect();
          }}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
            >
              <Check className="h-3.5 w-3.5 text-white" />
            </motion.div>
          )}
        </motion.div>
        
        {/* Card content */}
        <div className="pr-8">
          {preview}
        </div>
      </motion.div>
    );
  }

  // Normal mode - render collapsible card with long press
  return (
    <div {...longPressHandlers}>
      <CollapsibleCard
        preview={preview}
        borderColor="border-[#9C1E1E]"
        className="shadow-md hover:shadow-lg transition-shadow bg-white/80 backdrop-blur-sm"
      >
        {expandedContent}
      </CollapsibleCard>
    </div>
  );
};
