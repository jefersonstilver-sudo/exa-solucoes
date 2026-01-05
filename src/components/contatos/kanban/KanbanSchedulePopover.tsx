import React, { useState } from 'react';
import { Calendar, Clock, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addHours, addDays, format, startOfTomorrow, setHours } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types/contatos';

interface KanbanSchedulePopoverProps {
  contact: Contact | null;
  onClose: () => void;
}

const QUICK_OPTIONS = [
  { label: 'Em 1 hora', getValue: () => addHours(new Date(), 1) },
  { label: 'Em 3 horas', getValue: () => addHours(new Date(), 3) },
  { label: 'Amanhã 9h', getValue: () => setHours(startOfTomorrow(), 9) },
  { label: 'Amanhã 14h', getValue: () => setHours(startOfTomorrow(), 14) },
  { label: 'Em 1 semana', getValue: () => addDays(new Date(), 7) },
];

export const KanbanSchedulePopover: React.FC<KanbanSchedulePopoverProps> = ({
  contact,
  onClose,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleQuickSelect = (option: typeof QUICK_OPTIONS[0]) => {
    setSelectedDate(option.getValue());
    if (!title) {
      setTitle(`Follow-up: ${contact?.nome || 'Contato'}`);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !contact) return;

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from('calendar_events').insert({
        title: title || `Follow-up: ${contact.nome}`,
        description: notes || undefined,
        start_at: selectedDate.toISOString(),
        event_type: 'follow_up',
        status: 'agendado',
        contact_id: contact.id,
        created_by: userData.user?.id,
      });

      if (error) throw error;

      toast.success('Lembrete agendado!', {
        description: `Para ${format(selectedDate, "dd/MM 'às' HH:mm")}`,
      });

      onClose();
      resetForm();
    } catch (error) {
      console.error('Erro ao agendar:', error);
      toast.error('Erro ao criar lembrete');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedDate(null);
    setTitle('');
    setNotes('');
  };

  return (
    <Sheet open={!!contact} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[380px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            Agendar Lembrete
          </SheetTitle>
          <SheetDescription>
            Para: {contact?.nome || 'Contato'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Options */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Opções rápidas</Label>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_OPTIONS.map((option, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(option)}
                  className={cn(
                    "text-xs h-9 justify-start",
                    selectedDate && 
                    format(selectedDate, 'HH:mm dd/MM') === format(option.getValue(), 'HH:mm dd/MM') &&
                    "border-primary bg-primary/5"
                  )}
                >
                  <Clock className="h-3.5 w-3.5 mr-2" />
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Date */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ou escolha data/hora</Label>
            <Input
              type="datetime-local"
              value={selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : ''}
              onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
              className="text-sm"
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Título (opcional)</Label>
            <Input
              placeholder={`Follow-up: ${contact?.nome || 'Contato'}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
            <Textarea
              placeholder="O que você precisa lembrar?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Selected Date Preview */}
          {selectedDate && (
            <div className="bg-purple-50 rounded-lg p-3 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: require('date-fns/locale/pt-BR').ptBR })}
                </p>
                <p className="text-xs text-purple-700">
                  às {format(selectedDate, 'HH:mm')}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onClose();
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              onClick={handleSave}
              disabled={!selectedDate || saving}
            >
              {saving ? 'Salvando...' : 'Agendar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
