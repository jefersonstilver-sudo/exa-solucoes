import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  StickyNote, Plus, Star, Trash2, Mic, MicOff, Paperclip, 
  FileText, Phone, Video, X, Play, Pause, Loader2, Download,
  ExternalLink
} from 'lucide-react';
import { Contact, ContactNote } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

type NoteType = 'text' | 'audio' | 'meeting' | 'call' | 'file';

const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  text: { label: 'Texto', icon: StickyNote, color: 'text-blue-700', bgColor: 'bg-blue-100' },
  audio: { label: 'Áudio', icon: Mic, color: 'text-purple-700', bgColor: 'bg-purple-100' },
  meeting: { label: 'Reunião', icon: Video, color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  call: { label: 'Ligação', icon: Phone, color: 'text-orange-700', bgColor: 'bg-orange-100' },
  file: { label: 'Arquivo', icon: FileText, color: 'text-rose-700', bgColor: 'bg-rose-100' },
};

interface TabNotasProps {
  contact: Contact;
}

export const TabNotas: React.FC<TabNotasProps> = ({ contact }) => {
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [noteType, setNoteType] = useState<NoteType>('text');
  const [isImportant, setIsImportant] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    isRecording,
    isTranscribing,
    formattedDuration,
    audioUrl: recordedAudioUrl,
    transcription,
    startRecording,
    stopRecording,
    cancelRecording,
    reset: resetRecorder,
  } = useVoiceRecorder({
    onTranscriptionComplete: (text) => {
      setNewNote(prev => prev ? `${prev}\n\n${text}` : text);
    },
  });

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 50MB.');
      return;
    }

    try {
      setUploadingFile(true);
      setAttachmentFile(file);

      const { data: userData } = await supabase.auth.getUser();
      const ext = file.name.split('.').pop();
      const fileName = `${userData.user?.id}/${contact.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('contact-attachments')
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('contact-attachments')
        .getPublicUrl(fileName);

      setAttachmentUrl(data.publicUrl);
      setNoteType('file');
      toast.success('Arquivo enviado!');
    } catch (error: any) {
      toast.error('Erro ao enviar arquivo: ' + error.message);
      setAttachmentFile(null);
    } finally {
      setUploadingFile(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddNote = async () => {
    if (!newNote.trim() && !recordedAudioUrl && !attachmentUrl) return;

    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();

      const noteData: Record<string, any> = {
        contact_id: contact.id,
        content: newNote.trim() || (recordedAudioUrl ? '[Nota de áudio]' : '[Arquivo anexado]'),
        created_by: userData.user?.id,
        created_by_email: userData.user?.email,
        is_important: isImportant,
        note_type: noteType,
      };

      if (recordedAudioUrl) noteData.audio_url = recordedAudioUrl;
      if (attachmentUrl) noteData.attachment_url = attachmentUrl;

      const { error } = await supabase
        .from('contact_notes')
        .insert(noteData);

      if (error) throw error;

      toast.success('Nota adicionada!');
      setNewNote('');
      setNoteType('text');
      setIsImportant(false);
      removeAttachment();
      resetRecorder();
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

  const togglePlayAudio = (noteId: string, url: string) => {
    if (playingAudioId === noteId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audio.onended = () => setPlayingAudioId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingAudioId(noteId);
    }
  };

  const formatFileSize = (name: string) => {
    return name.length > 30 ? name.substring(0, 27) + '...' : name;
  };

  const getFileNameFromUrl = (url: string) => {
    const parts = url.split('/');
    const last = parts[parts.length - 1];
    return decodeURIComponent(last.split('?')[0]);
  };

  return (
    <div className="space-y-4">
      {/* Formulário de Nova Nota */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <StickyNote className="w-4 h-4" />
            Nova Nota
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de nota */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(NOTE_TYPE_CONFIG) as [NoteType, typeof NOTE_TYPE_CONFIG[NoteType]][]).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setNoteType(type)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    noteType === type
                      ? `${config.bgColor} ${config.color} ring-2 ring-offset-1 ring-current`
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Textarea */}
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={
              noteType === 'audio' || noteType === 'meeting'
                ? 'Grave o áudio ou escreva a nota da reunião...'
                : noteType === 'call'
                ? 'Resumo da ligação...'
                : noteType === 'file'
                ? 'Descrição do arquivo anexado...'
                : 'Escreva uma nota sobre este contato...'
            }
            className="min-h-[100px]"
          />

          {/* Gravação de áudio */}
          {isRecording && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg animate-pulse">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono font-medium text-red-700">{formattedDuration}</span>
              <span className="text-sm text-red-600">Gravando...</span>
              <div className="flex-1" />
              <Button size="sm" variant="destructive" onClick={stopRecording}>
                <MicOff className="w-3.5 h-3.5 mr-1" /> Parar
              </Button>
              <Button size="sm" variant="outline" onClick={cancelRecording}>
                <X className="w-3.5 h-3.5 mr-1" /> Cancelar
              </Button>
            </div>
          )}

          {isTranscribing && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
              <span className="text-sm text-purple-700">Transcrevendo áudio com IA...</span>
            </div>
          )}

          {recordedAudioUrl && !isTranscribing && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Button
                size="sm"
                variant="outline"
                onClick={() => togglePlayAudio('new', recordedAudioUrl)}
                className="h-8"
              >
                {playingAudioId === 'new' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </Button>
              <span className="text-sm text-emerald-700 flex-1">
                Áudio gravado {transcription ? '• Transcrito ✓' : ''}
              </span>
              <Button size="sm" variant="ghost" onClick={resetRecorder} className="h-8">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Arquivo anexo */}
          {attachmentFile && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 flex-1">
                {formatFileSize(attachmentFile.name)} ({(attachmentFile.size / (1024 * 1024)).toFixed(1)} MB)
              </span>
              {uploadingFile && <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />}
              <Button size="sm" variant="ghost" onClick={removeAttachment} className="h-8">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {/* Ações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (isRecording) {
                    stopRecording();
                  } else {
                    setNoteType('audio');
                    startRecording();
                  }
                }}
                disabled={isTranscribing}
                className={cn(
                  'h-9',
                  isRecording && 'border-red-300 text-red-600 bg-red-50'
                )}
              >
                <Mic className="w-4 h-4 mr-1" />
                {isRecording ? 'Parar' : 'Gravar Áudio'}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={handleFileSelect}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                className="h-9"
              >
                <Paperclip className="w-4 h-4 mr-1" />
                {uploadingFile ? 'Enviando...' : 'Anexar'}
              </Button>

              <button
                onClick={() => setIsImportant(!isImportant)}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  isImportant
                    ? 'text-yellow-500 bg-yellow-50'
                    : 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-50'
                )}
              >
                <Star className={cn('w-4 h-4', isImportant && 'fill-yellow-500')} />
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={(!newNote.trim() && !recordedAudioUrl && !attachmentUrl) || saving || isTranscribing}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {saving ? 'Salvando...' : 'Adicionar Nota'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Notas */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Histórico de Notas ({notes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhuma nota</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione notas, grave áudios ou anexe arquivos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => {
                const type = (note.note_type as NoteType) || 'text';
                const config = NOTE_TYPE_CONFIG[type];
                const Icon = config.icon;

                return (
                  <div
                    key={note.id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      note.is_important
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-muted/30 border-transparent hover:border-muted'
                    )}
                  >
                    {/* Header: badge + actions */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge className={cn('text-[10px] px-2 py-0.5 font-medium', config.bgColor, config.color, 'border-0')}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleToggleImportant(note.id, note.is_important)}
                        >
                          <Star className={cn('w-4 h-4', note.is_important ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground')} />
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

                    {/* Conteúdo */}
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>

                    {/* Player de áudio */}
                    {note.audio_url && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-background rounded-md">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => togglePlayAudio(note.id, note.audio_url!)}
                        >
                          {playingAudioId === note.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                        <span className="text-xs text-muted-foreground flex-1">Áudio gravado</span>
                        <a href={note.audio_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </a>
                      </div>
                    )}

                    {/* Arquivo anexo */}
                    {note.attachment_url && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-background rounded-md">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground flex-1 truncate">
                          {getFileNameFromUrl(note.attachment_url)}
                        </span>
                        <a href={note.attachment_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                        </a>
                      </div>
                    )}

                    {/* Footer */}
                    <p className="text-xs text-muted-foreground mt-2">
                      {note.created_by_email || 'Sistema'} • {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TabNotas;
