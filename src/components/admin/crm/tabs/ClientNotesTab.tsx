import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StickyNote, Plus, Phone, Mail, Users, Eye, Star } from 'lucide-react';
import { addCRMNote } from '@/services/crmService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientNotesTabProps {
  clientId: string;
  notes: {
    total_notes: number;
    notes: Array<{
      id: string;
      note_type: string;
      content: string;
      is_important: boolean;
      created_at: string;
      created_by_name?: string;
    }>;
  };
  onRefresh: () => void;
}

export function ClientNotesTab({ clientId, notes, onRefresh }: ClientNotesTabProps) {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'call' | 'email' | 'meeting' | 'observation' | 'follow_up'>('observation');
  const [isImportant, setIsImportant] = useState(false);
  const [adding, setAdding] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Digite uma nota antes de adicionar');
      return;
    }

    try {
      setAdding(true);
      await addCRMNote(clientId, noteType, newNote, isImportant);
      toast.success('Nota adicionada com sucesso!');
      setNewNote('');
      setIsImportant(false);
      onRefresh();
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Erro ao adicionar nota');
    } finally {
      setAdding(false);
    }
  };

  const getNoteIcon = (type: string) => {
    const icons: Record<string, any> = {
      call: Phone,
      email: Mail,
      meeting: Users,
      observation: Eye,
      follow_up: Star,
    };
    const Icon = icons[type] || StickyNote;
    return <Icon className="h-4 w-4" />;
  };

  const getNoteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      call: 'Ligação',
      email: 'Email',
      meeting: 'Reunião',
      observation: 'Observação',
      follow_up: 'Follow-up',
    };
    return labels[type] || type;
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Adicionar Nova Nota */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Adicionar Nova Nota
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={noteType} onValueChange={(value: any) => setNoteType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de nota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="observation">Observação</SelectItem>
                <SelectItem value="call">Ligação</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="important"
                checked={isImportant}
                onChange={(e) => setIsImportant(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="important" className="text-sm">
                Marcar como importante
              </label>
            </div>
          </div>

          <Textarea
            placeholder="Digite sua nota aqui..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
          />

          <Button onClick={handleAddNote} disabled={adding} className="w-full">
            {adding ? 'Adicionando...' : 'Adicionar Nota'}
          </Button>
        </div>
      </Card>

      {/* Lista de Notas */}
      {notes.total_notes === 0 ? (
        <Card className="p-12 text-center">
          <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma nota registrada para este cliente</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.notes.map((note) => (
            <Card
              key={note.id}
              className={`p-6 ${
                note.is_important ? 'border-l-4 border-l-orange-500 bg-orange-50/50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getNoteIcon(note.note_type)}
                  <Badge variant="outline">{getNoteTypeLabel(note.note_type)}</Badge>
                  {note.is_important && (
                    <Badge variant="destructive" className="ml-2">
                      Importante
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(note.created_at)}</p>
              </div>

              <p className="text-sm leading-relaxed mb-3 whitespace-pre-line">{note.content}</p>

              {note.created_by_name && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Criado por: {note.created_by_name}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
