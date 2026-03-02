import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, ArrowRight, Bell, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';

interface ScheduleTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskName: string;
  targetDate: string;
  originalDate?: string;
  taskId?: string;
  existingTime?: string | null;
  onConfirm: (hora: string, tipoHorario: 'fixo' | 'ate') => void;
  isLoading?: boolean;
}

const ScheduleTimeModal: React.FC<ScheduleTimeModalProps> = ({
  open,
  onOpenChange,
  taskName,
  targetDate,
  originalDate,
  taskId,
  existingTime,
  onConfirm,
  isLoading = false,
}) => {
  const isMobile = useIsMobile();
  const [keepTime, setKeepTime] = useState(Boolean(existingTime));
  const [hora, setHora] = useState(existingTime || '09:00');

  useEffect(() => {
    if (!open) return;
    const hasExistingTime = Boolean(existingTime);
    setKeepTime(hasExistingTime);
    setHora(existingTime || '09:00');
  }, [open, existingTime, taskId]);

  const handleConfirm = () => {
    if (keepTime) {
      onConfirm('', 'fixo');
      return;
    }
    onConfirm(hora, 'fixo');
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleModalOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose();
      return;
    }
    onOpenChange(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy (EEE)", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const content = (
    <div className="space-y-4 py-2">
      <div className="p-3 rounded-xl bg-muted/50 border border-border">
        <p className="text-sm font-medium text-foreground line-clamp-2">{taskName || 'Tarefa'}</p>
      </div>

      {originalDate && targetDate && (
        <div className="flex items-center gap-2 justify-center p-3 rounded-xl bg-muted/30 border border-border">
          <div className="text-center min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">De</p>
            <p className="text-xs md:text-sm font-semibold text-foreground truncate">{formatDate(originalDate)}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="text-center min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Para</p>
            <p className="text-xs md:text-sm font-semibold text-primary truncate">{formatDate(targetDate)}</p>
          </div>
        </div>
      )}

      {!originalDate && targetDate && (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <Calendar className="h-4 w-4 text-primary" />
          <div>
            <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Nova data</p>
            <p className="text-sm font-semibold text-foreground capitalize">{formatDate(targetDate)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
        <Checkbox
          id="keep-time"
          checked={keepTime}
          onCheckedChange={(v) => setKeepTime(!!v)}
          data-checkbox
        />
        <Label htmlFor="keep-time" className="text-sm text-foreground cursor-pointer flex-1">
          Manter horário atual
        </Label>
      </div>

      {!keepTime && (
        <div className="space-y-2">
          <Label htmlFor="hora" className="text-sm font-medium text-muted-foreground">Novo horário</Label>
          <div className="relative">
            <Input
              id="hora"
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="pl-10 h-12"
            />
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
        <Bell className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Os contatos notificados serão informados da alteração após confirmar o reagendamento.
        </p>
      </div>
    </div>
  );

  const footer = (
    <div className="flex gap-2 w-full">
      <Button variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1 h-12 md:h-10">
        Cancelar
      </Button>
      <Button
        onClick={handleConfirm}
        disabled={(!keepTime && !hora) || isLoading}
        className="flex-1 h-12 md:h-10 bg-primary hover:bg-primary/90"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Reagendando...
          </>
        ) : (
          'Confirmar Reagendamento'
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleModalOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              Reagendar Compromisso
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4">{content}</div>
          <DrawerFooter>{footer}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            Reagendar Compromisso
          </DialogTitle>
        </DialogHeader>
        {content}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleTimeModal;
