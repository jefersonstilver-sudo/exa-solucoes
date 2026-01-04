import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Clock, History } from 'lucide-react';
import { Contact } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { isPast, isFuture, isToday, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  MiniCalendar, 
  ReuniaoCardVisual, 
  InsightCard, 
  TeamMembersList 
} from './ui';

interface TabAgendaProps {
  contact: Contact;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_at: string;
  end_at: string | null;
  location: string | null;
  meeting_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export const TabAgenda: React.FC<TabAgendaProps> = ({ contact }) => {
  const [eventos, setEventos] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'reuniao',
    start_at: '',
    end_at: '',
    location: '',
    meeting_url: '',
    notes: ''
  });

  useEffect(() => {
    fetchEventos();
  }, [contact.id]);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('contact_id', contact.id)
        .order('start_at', { ascending: true });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvento = async () => {
    if (!formData.title || !formData.start_at) {
      toast.error('Preencha o título e a data');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('calendar_events')
        .insert({
          contact_id: contact.id,
          title: formData.title,
          description: formData.description || null,
          event_type: formData.event_type,
          start_at: formData.start_at,
          end_at: formData.end_at || null,
          location: formData.location || null,
          meeting_url: formData.meeting_url || null,
          notes: formData.notes || null,
          status: 'agendado'
        });

      if (error) throw error;
      
      toast.success('Evento agendado com sucesso!');
      setDialogOpen(false);
      setFormData({
        title: '', description: '', event_type: 'reuniao', start_at: '',
        end_at: '', location: '', meeting_url: '', notes: ''
      });
      fetchEventos();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento');
    } finally {
      setSaving(false);
    }
  };

  const proximosEventos = eventos.filter(e => {
    const date = parseISO(e.start_at);
    return isFuture(date) || isToday(date);
  });

  const eventosPassados = eventos.filter(e => {
    const date = parseISO(e.start_at);
    return isPast(date) && !isToday(date);
  }).slice(0, 3);

  const highlightedDates = eventos.map(e => parseISO(e.start_at));

  // Mock team members for design
  const teamMembers = [
    { id: '1', name: 'Carlos M.', status: 'available' as const },
    { id: '2', name: 'Julia R.', status: 'busy' as const },
    { id: '3', name: 'André L.', status: 'available' as const }
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Left Column - Events */}
      <div className="lg:col-span-2 space-y-4">
        {/* Próximas Reuniões Header */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Próximas Reuniões</h2>
                  <p className="text-xs text-muted-foreground">
                    {proximosEventos.length} compromisso(s) agendado(s)
                  </p>
                </div>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#9C1E1E] hover:bg-[#7d1818]">
                    <Plus className="w-4 h-4 mr-1" />
                    Nova Reunião
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Agendar Evento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Título *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Ex: Reunião de apresentação"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reuniao">Reunião</SelectItem>
                            <SelectItem value="visita">Visita</SelectItem>
                            <SelectItem value="ligacao">Ligação</SelectItem>
                            <SelectItem value="follow_up">Follow-up</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Data e Hora *</Label>
                        <Input
                          type="datetime-local"
                          value={formData.start_at}
                          onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Local</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Endereço ou sala"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link da reunião (Meet/Zoom)</Label>
                      <Input
                        value={formData.meeting_url}
                        onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detalhes do evento..."
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveEvento} disabled={saving} className="bg-[#9C1E1E] hover:bg-[#7d1818]">
                        {saving ? 'Salvando...' : 'Agendar'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Próximos Eventos Cards */}
        {proximosEventos.length === 0 ? (
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum evento agendado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Agende uma reunião ou visita com este contato
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {proximosEventos.map((evento) => {
              const date = parseISO(evento.start_at);
              const status = isToday(date) ? 'today' : 'upcoming';
              
              return (
                <ReuniaoCardVisual
                  key={evento.id}
                  id={evento.id}
                  title={evento.title}
                  date={date}
                  duration="1h"
                  location={evento.location || undefined}
                  meetingUrl={evento.meeting_url || undefined}
                  participants={2}
                  status={status}
                  eventType={evento.event_type as any}
                  onAction={() => evento.meeting_url && window.open(evento.meeting_url, '_blank')}
                />
              );
            })}
          </div>
        )}

        {/* Histórico Recente */}
        {eventosPassados.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-6">
              <History className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Histórico Recente
              </h3>
            </div>
            <div className="space-y-3">
              {eventosPassados.map((evento) => (
                <ReuniaoCardVisual
                  key={evento.id}
                  id={evento.id}
                  title={evento.title}
                  date={parseISO(evento.start_at)}
                  duration="30m"
                  location={evento.location || undefined}
                  meetingUrl={evento.meeting_url || undefined}
                  participants={1}
                  status="past"
                  eventType={evento.event_type as any}
                  actionLabel="Ver Detalhes"
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right Column - Calendar & Insights */}
      <div className="space-y-4">
        <MiniCalendar highlightedDates={highlightedDates} />
        
        <InsightCard 
          content="Melhor horário para reuniões com este contato é entre 14h e 16h, com preferência para terças e quintas."
        />

        <TeamMembersList members={teamMembers} />
      </div>
    </div>
  );
};

export default TabAgenda;
