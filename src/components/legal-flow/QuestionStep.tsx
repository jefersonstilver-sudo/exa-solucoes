import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuestionStepProps {
  question: string;
  subtitle?: string;
  children: ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  canContinue?: boolean;
  showAIBadge?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  nextLabel?: string;
  className?: string;
}

export function QuestionStep({
  question,
  subtitle,
  children,
  onNext,
  onPrev,
  canContinue = true,
  showAIBadge = false,
  isFirst = false,
  isLast = false,
  nextLabel = 'Continuar',
  className,
}: QuestionStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col h-full",
        className
      )}
    >
      {/* Question Header */}
      <div className="text-center mb-8">
        {showAIBadge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full mb-4"
          >
            <Sparkles className="h-3 w-3" />
            Processado por IA
          </motion.div>
        )}
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-2"
        >
          {question}
        </motion.h2>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col items-center justify-center"
      >
        {children}
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between mt-8 pt-4 border-t border-border"
      >
        {!isFirst ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onPrev}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        ) : (
          <div />
        )}

        {!isLast && (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className={cn(
              "gap-2 min-w-[140px]",
              canContinue 
                ? "bg-[#9C1E1E] hover:bg-[#7D1818]" 
                : "bg-gray-300"
            )}
          >
            {nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
