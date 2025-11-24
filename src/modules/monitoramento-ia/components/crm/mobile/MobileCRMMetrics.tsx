import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, AlertCircle, TrendingUp, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileCRMMetricsProps {
  metrics: {
    total: number;
    unread: number;
    critical: number;
    hotLeads: number;
    awaiting: number;
    avgResponseTime: number;
  };
}

export const MobileCRMMetrics: React.FC<MobileCRMMetricsProps> = ({ metrics }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-[#25D366]/10 to-[#20bd5a]/10 border-b border-module-border">
      {/* Resumo Colapsado */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between touch-manipulation"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#25D366]" />
          <span className="font-medium text-module-primary">
            {metrics.total} conversas
          </span>
          {metrics.unread > 0 && (
            <span className="text-sm text-muted-foreground">
              • {metrics.unread} não lidas
            </span>
          )}
        </div>
        
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Métricas Expandidas */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex gap-2 overflow-x-auto no-scrollbar">
              <MetricCard
                icon={MessageSquare}
                label="Total"
                value={metrics.total}
                color="text-blue-500"
                bgColor="bg-blue-500/10"
              />
              <MetricCard
                icon={Zap}
                label="Novas"
                value={metrics.unread}
                color="text-[#25D366]"
                bgColor="bg-[#25D366]/10"
              />
              <MetricCard
                icon={AlertCircle}
                label="Crítico"
                value={metrics.critical}
                color="text-red-500"
                bgColor="bg-red-500/10"
              />
              <MetricCard
                icon={TrendingUp}
                label="Hot"
                value={metrics.hotLeads}
                color="text-orange-500"
                bgColor="bg-orange-500/10"
              />
              <MetricCard
                icon={Clock}
                label="Aguardando"
                value={metrics.awaiting}
                color="text-yellow-500"
                bgColor="bg-yellow-500/10"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, color, bgColor }) => (
  <div className={`shrink-0 ${bgColor} rounded-xl p-3 min-w-[90px] flex flex-col items-center gap-1`}>
    <Icon className={`w-5 h-5 ${color}`} />
    <span className="text-2xl font-bold text-module-primary">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);
