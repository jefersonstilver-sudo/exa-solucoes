import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Plus, Star, Trash2 } from 'lucide-react';
import { Contact, ContactNote } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TabNotasProps {
  contact: Contact;
}

export const TabNotas: React.FC<TabNotasProps> = ({ contact }) => {
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [contact.id]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes((data as ContactNote[]) || []);
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('contact_notes')
        .insert({
          contact_id: contact.id,
          content: newNote.trim(),
          created_by: userData.user?.id,
          created_by_email: userData.user?.email
        });

      if (error) throw error;
      
      toast.success('Nota adicionada');
      setNewNote('');
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar nota');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleImportant = async (noteId: string, isImportant: boolean) => {
    try {
      const { error } = await supabase
        .from('contact_notes')
        .update({ is_important: !isImportant })
        .eq('id', noteId);

      if (error) throw error;
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar nota');
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('contact_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      toast.success('Nota removida');
      fetchNotes();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover nota');
    }
  };

  return (
    <div className="space-y-4">
      {/* Nova Nota */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            Nova Nota Interna
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Escreva uma nota sobre este contato..."
            className="min-h-[100px] mb-3"
          />
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={handleAddNote}
              disabled={!newNote.trim() || saving}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {saving ? 'Salvando...' : 'Adicionar Nota'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notas */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Histórico de Notas ({notes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhuma nota</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione notas internas sobre este contato
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    'p-3 rounded-lg border transition-colors',
                    note.is_important 
                      ? 'bg-yellow-50 border-yellow-200' 
                      : 'bg-muted/50 border-transparent'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm whitespace-pre-wrap flex-1">{note.content}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleToggleImportant(note.id, note.is_important)}
                      >
                        <Star 
                          className={cn(
                            'w-4 h-4',
                            note.is_important 
                              ? 'text-yellow-500 fill-yellow-500' 
                              : 'text-muted-foreground'
                          )} 
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(note.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {note.created_by_email || 'Sistema'} • {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabNotas;
