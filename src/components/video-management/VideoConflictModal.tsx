import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Calendar, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScheduleConflict {
  conflictingVideoName: string;
  day: number;
  conflictingTimeRange: string;
  newVideoTimeRange: string;
}

interface VideoConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryAgain?: () => void;
  conflicts: ScheduleConflict[];
  suggestions: { [day: number]: string[] };
  newVideoName: string;
}

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const VideoConflictModal: React.FC<VideoConflictModalProps> = ({
  isOpen,
  onClose,
  onTryAgain,
  conflicts,
  suggestions,
  newVideoName
}) => {
  console.log('🎭 [CONFLICT_MODAL] Renderizando modal:', { 
    isOpen, 
    conflictsCount: conflicts?.length, 
    suggestionsKeys: Object.keys(suggestions || {}),
    newVideoName 
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="bg-destructive/10 border-b border-destructive/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Conflito de Horário Detectado
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      O vídeo "{newVideoName}" possui conflitos de agendamento
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-destructive/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              {/* Conflicts Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-destructive" />
                  <h3 className="font-medium text-foreground">Conflitos Identificados</h3>
                </div>
                
                <div className="space-y-3">
                  {conflicts.map((conflict, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-destructive/5 border border-destructive/20 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {dayNames[conflict.day]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-destructive">
                              {conflict.conflictingVideoName}
                            </span>
                            {' '}já ocupa o horário {conflict.conflictingTimeRange}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Seu vídeo: {conflict.newVideoTimeRange}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Suggestions Section */}
              {Object.keys(suggestions).length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-primary" />
                    <h3 className="font-medium text-foreground">Horários Disponíveis</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(suggestions).map(([day, timeSlots], index) => (
                      <motion.div
                        key={day}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index * 0.1) + 0.3 }}
                        className="bg-primary/5 border border-primary/20 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground mb-2">
                              {dayNames[parseInt(day)]}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {timeSlots.map((timeSlot, slotIndex) => (
                                <span
                                  key={slotIndex}
                                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                >
                                  {timeSlot}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-muted/30 border-t border-border p-6">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="min-w-[100px]"
                >
                  Fechar
                </Button>
                {onTryAgain && (
                  <Button
                    onClick={onTryAgain}
                    className="min-w-[120px]"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};