import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useConversationNotes } from '../../hooks/useConversationNotes';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationNotesProps {
  phoneNumber: string;
  agentKey: string;
}

export const ConversationNotes: React.FC<ConversationNotesProps> = ({
  phoneNumber,
  agentKey
}) => {
  const { notes, loading, addNote, deleteNote } = useConversationNotes(phoneNumber, agentKey);
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setAdding(true);
    await addNote(newNote);
    setNewNote('');
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <StickyNote className="w-5 h-5 text-yellow-500" />
        <h3 className="font-semibold">Notas Internas</h3>
      </div>

      {/* Add Note */}
      <div className="space-y-2">
        <Textarea
          placeholder="Adicionar nota interna..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <Button 
          onClick={handleAddNote} 
          disabled={!newNote.trim() || adding}
          size="sm"
          className="w-full"
        >
          {adding ? 'Adicionando...' : 'Adicionar Nota'}
        </Button>
      </div>

      {/* Notes List */}
      <ScrollArea className="h-[300px]">
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando notas...</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma nota ainda</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="bg-muted/50 rounded p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1">{note.note_text}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{note.users?.email || 'Sistema'}</span>
                  <span>•</span>
                  <span>
                    {format(new Date(note.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
