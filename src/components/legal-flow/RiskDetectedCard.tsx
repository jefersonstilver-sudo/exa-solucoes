import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RiskDetectedCardProps {
  nivel: 'baixo' | 'medio' | 'alto' | 'critico';
  descricao: string;
  sugestao: string;
  aceito?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  className?: string;
}

export function RiskDetectedCard({
  nivel,
  descricao,
  sugestao,
  aceito,
  onAccept,
  onReject,
  className,
}: RiskDetectedCardProps) {
  const config = {
    critico: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      titleColor: 'text-red-800',
      textColor: 'text-red-700',
      badge: 'bg-red-600',
      pulse: true,
    },
    alto: {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
      titleColor: 'text-orange-800',
      textColor: 'text-orange-700',
      badge: 'bg-orange-600',
      pulse: false,
    },
    medio: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      icon: AlertCircle,
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-800',
      textColor: 'text-amber-700',
      badge: 'bg-amber-600',
      pulse: false,
    },
    baixo: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      icon: Info,
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700',
      badge: 'bg-blue-600',
      pulse: false,
    },
  };

  const style = config[nivel];
  const Icon = style.icon;

  if (aceito) {
    return (
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        className={cn(
          "p-4 rounded-lg border-2 bg-emerald-50 border-emerald-300",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                ✓ ACEITO
              </span>
            </div>
            <p className="text-sm text-emerald-800 line-through opacity-60">{descricao}</p>
            <p className="text-xs text-emerald-700 mt-1">
              Sugestão aplicada: {sugestao}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        ...(style.pulse && { scale: [1, 1.02, 1] })
      }}
      transition={{ 
        duration: 0.3,
        ...(style.pulse && { 
          scale: { repeat: Infinity, duration: 2 } 
        })
      }}
      className={cn(
        "p-4 rounded-lg border-2",
        style.bg,
        style.border,
        style.pulse && "shadow-lg shadow-red-200",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", style.iconColor)} />
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-full text-white uppercase",
              style.badge
            )}>
              ⚠️ {nivel}
            </span>
          </div>

          {/* Description */}
          <p className={cn("text-sm font-medium mb-2", style.titleColor)}>
            {descricao}
          </p>

          {/* Suggestion */}
          <div className="p-2 bg-white/50 rounded border border-white/80">
            <p className={cn("text-xs", style.textColor)}>
              <strong>💡 Sugestão:</strong> {sugestao}
            </p>
          </div>

          {/* Actions */}
          {(onAccept || onReject) && (
            <div className="flex items-center gap-2 mt-3">
              {onAccept && (
                <Button
                  type="button"
                  size="sm"
                  onClick={onAccept}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Aceitar Sugestão
                </Button>
              )}
              {onReject && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onReject}
                  className={style.textColor}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Ignorar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
