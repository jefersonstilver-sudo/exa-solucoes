import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertTriangle, ShieldAlert, ShieldCheck, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthBreakdown {
  parceiro: boolean;
  objeto: boolean;
  prazos: boolean;
  contrapartidas: boolean;
  validacao_risco: boolean;
}

interface LegalHealthGaugeProps {
  score: number;
  breakdown: HealthBreakdown;
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
}

// Status Badge Component
function StatusBadge({ score }: { score: number }) {
  const getStatus = () => {
    if (score === 0) return { 
      label: 'Risco Crítico', 
      color: 'bg-red-500', 
      textColor: 'text-red-700',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      icon: ShieldAlert 
    };
    if (score < 50) return { 
      label: 'Incompleto', 
      color: 'bg-orange-500', 
      textColor: 'text-orange-700',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      icon: Shield 
    };
    if (score < 85) return { 
      label: 'Em Análise', 
      color: 'bg-amber-500', 
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: Shield 
    };
    return { 
      label: 'Seguro', 
      color: 'bg-emerald-500', 
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: ShieldCheck 
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full border",
      status.bgColor, status.borderColor
    )}>
      <div className={cn("w-2 h-2 rounded-full animate-pulse", status.color)} />
      <Icon className={cn("h-4 w-4", status.textColor)} />
      <span className={cn("text-xs font-semibold", status.textColor)}>
        {status.label}
      </span>
    </div>
  );
}

export function LegalHealthGauge({ 
  score, 
  breakdown, 
  variant = 'full',
  className 
}: LegalHealthGaugeProps) {
  // CORREÇÃO: Forçar 0% quando não há dados reais
  const realScore = (breakdown.parceiro || breakdown.objeto || breakdown.contrapartidas || breakdown.prazos) 
    ? score 
    : 0;

  const getColor = () => {
    if (realScore >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', stroke: '#10b981', glow: 'shadow-emerald-500/50' };
    if (realScore >= 60) return { bg: 'bg-amber-500', text: 'text-amber-600', stroke: '#f59e0b', glow: 'shadow-amber-500/50' };
    if (realScore >= 40) return { bg: 'bg-orange-500', text: 'text-orange-600', stroke: '#f97316', glow: 'shadow-orange-500/50' };
    return { bg: 'bg-red-500', text: 'text-red-600', stroke: '#ef4444', glow: 'shadow-red-500/50' };
  };

  const color = getColor();

  const breakdownItems = [
    { key: 'parceiro', label: 'Parceiro', done: breakdown.parceiro, points: 15 },
    { key: 'objeto', label: 'Objeto', done: breakdown.objeto, points: 25 },
    { key: 'contrapartidas', label: 'Contrapartidas', done: breakdown.contrapartidas, points: 20 },
    { key: 'prazos', label: 'Prazos', done: breakdown.prazos, points: 10 },
    { key: 'validacao_risco', label: 'Riscos', done: breakdown.validacao_risco, points: 30 },
  ];

  // Minimal variant - just a colored bar
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <motion.div
            className={cn("h-full rounded-full", color.bg)}
            initial={{ width: 0 }}
            animate={{ width: `${realScore}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className={cn("text-sm font-bold tabular-nums min-w-[3rem]", color.text)}>{realScore}%</span>
        <StatusBadge score={realScore} />
      </div>
    );
  }

  // Compact variant - bar with icons and badge
  if (variant === 'compact') {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Legal Health</span>
          <StatusBadge score={realScore} />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className={cn("h-full rounded-full", color.bg)}
              initial={{ width: 0 }}
              animate={{ width: `${realScore}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className={cn("text-lg font-bold tabular-nums", color.text)}>{realScore}%</span>
        </div>
        <div className="flex justify-between">
          {breakdownItems.map((item) => (
            <div key={item.key} className="flex flex-col items-center">
              {item.done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300" />
              )}
              <span className="text-[10px] text-muted-foreground mt-1 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full variant - LARGER gauge with detailed breakdown
  return (
    <div className={cn("space-y-5", className)}>
      {/* Gauge visual - LARGER */}
      <div className="relative flex flex-col items-center">
        <div className="relative w-56 h-28 overflow-hidden">
          {/* Background arc */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50">
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Animated foreground arc - THICKER */}
            <motion.path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke={color.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: realScore / 100 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          
          {/* Center score - LARGER */}
          <div className="absolute inset-0 flex items-end justify-center pb-1">
            <motion.span 
              className={cn("text-4xl font-bold tabular-nums", color.text)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {realScore}%
            </motion.span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-3">
          <StatusBadge score={realScore} />
        </div>
      </div>

      {/* Breakdown checklist - improved styling */}
      <div className="grid grid-cols-1 gap-2 px-2">
        {breakdownItems.map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
              item.done 
                ? "bg-emerald-50 border border-emerald-200" 
                : "bg-gray-50 border border-gray-100"
            )}
          >
            {item.done ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
            )}
            <span className={cn(
              "text-sm font-medium flex-1",
              item.done ? "text-emerald-700" : "text-gray-500"
            )}>
              {item.label}
            </span>
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full",
              item.done 
                ? "bg-emerald-100 text-emerald-600" 
                : "bg-gray-200 text-gray-400"
            )}>
              +{item.points}%
            </span>
          </motion.div>
        ))}
      </div>

      {/* Warning if score < 80 */}
      {realScore < 80 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            Complete todos os campos para habilitar a geração do contrato
          </p>
        </motion.div>
      )}
    </div>
  );
}
