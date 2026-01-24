import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
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

export function LegalHealthGauge({ 
  score, 
  breakdown, 
  variant = 'full',
  className 
}: LegalHealthGaugeProps) {
  const getColor = () => {
    if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', glow: 'shadow-emerald-500/50' };
    if (score >= 60) return { bg: 'bg-amber-500', text: 'text-amber-600', glow: 'shadow-amber-500/50' };
    if (score >= 40) return { bg: 'bg-orange-500', text: 'text-orange-600', glow: 'shadow-orange-500/50' };
    return { bg: 'bg-red-500', text: 'text-red-600', glow: 'shadow-red-500/50' };
  };

  const color = getColor();

  const breakdownItems = [
    { key: 'parceiro', label: 'Parceiro', done: breakdown.parceiro },
    { key: 'objeto', label: 'Objeto', done: breakdown.objeto },
    { key: 'prazos', label: 'Prazos', done: breakdown.prazos },
    { key: 'contrapartidas', label: 'Contrapartidas', done: breakdown.contrapartidas },
    { key: 'validacao_risco', label: 'Riscos', done: breakdown.validacao_risco },
  ];

  // Minimal variant - just a colored bar
  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", color.bg)}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className={cn("text-sm font-bold tabular-nums", color.text)}>{score}%</span>
      </div>
    );
  }

  // Compact variant - bar with icons
  if (variant === 'compact') {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Legal Health</span>
          <span className={cn("text-sm font-bold tabular-nums", color.text)}>{score}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", color.bg)}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between">
          {breakdownItems.map((item) => (
            <div key={item.key} className="flex flex-col items-center">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-gray-300" />
              )}
              <span className="text-[10px] text-muted-foreground mt-0.5">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full variant - gauge with detailed breakdown
  return (
    <div className={cn("space-y-4", className)}>
      {/* Gauge visual */}
      <div className="relative flex flex-col items-center">
        <div className="relative w-48 h-24 overflow-hidden">
          {/* Background arc */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50">
            <path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Animated foreground arc */}
            <motion.path
              d="M 5 50 A 45 45 0 0 1 95 50"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={color.text}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          
          {/* Center score */}
          <div className="absolute inset-0 flex items-end justify-center pb-2">
            <motion.span 
              className={cn("text-3xl font-bold tabular-nums", color.text)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {score}%
            </motion.span>
          </div>
        </div>

        {/* Status label */}
        <div className={cn(
          "mt-2 px-3 py-1 rounded-full text-xs font-medium text-white",
          color.bg,
          score >= 80 && "shadow-lg " + color.glow
        )}>
          {score >= 80 ? '✓ Pronto para gerar' : 
           score >= 60 ? 'Quase pronto' :
           score >= 40 ? 'Parcialmente completo' :
           'Incompleto'}
        </div>
      </div>

      {/* Breakdown checklist */}
      <div className="grid grid-cols-1 gap-2 px-4">
        {breakdownItems.map((item, index) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg transition-colors",
              item.done ? "bg-emerald-50" : "bg-gray-50"
            )}
          >
            {item.done ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
            )}
            <span className={cn(
              "text-sm font-medium",
              item.done ? "text-emerald-700" : "text-gray-500"
            )}>
              {item.label}
            </span>
            <span className={cn(
              "ml-auto text-xs font-medium",
              item.done ? "text-emerald-600" : "text-gray-400"
            )}>
              +20%
            </span>
          </motion.div>
        ))}
      </div>

      {/* Warning if score < 80 */}
      {score < 80 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            Complete todos os campos para habilitar a geração do contrato
          </p>
        </motion.div>
      )}
    </div>
  );
}
