import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, MapPin, Video, Phone, Users, CheckCircle, XCircle, CalendarCheck, History, Trash2, Edit } from 'lucide-react';
import { Contact } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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
        title: '',
        description: '',
        event_type: 'reuniao',
        start_at: '',
        end_at: '',
        location: '',
        meeting_url: '',
        notes: ''
      });
      fetchEventos();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error('Erro ao salvar evento');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (eventoId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update({ status: newStatus })
        .eq('id', eventoId);

      if (error) throw error;
      
      toast.success(`Status atualizado para ${newStatus}`);
      fetchEventos();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeleteEvento = async (eventoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;

    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventoId);

      if (error) throw error;
      
      toast.success('Evento excluído');
      fetchEventos();
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Erro ao excluir evento');
    }
  };

  const getEventTypeConfig = (type: string) => {
    switch (type) {
      case 'reuniao':
        return { label: 'Reunião', icon: Video, color: 'text-purple-500', bgColor: 'bg-purple-100' };
      case 'visita':
        return { label: 'Visita', icon: MapPin, color: 'text-blue-500', bgColor: 'bg-blue-100' };
      case 'ligacao':
        return { label: 'Ligação', icon: Phone, color: 'text-green-500', bgColor: 'bg-green-100' };
      case 'follow_up':
        return { label: 'Follow-up', icon: Users, color: 'text-amber-500', bgColor: 'bg-amber-100' };
      default:
        return { label: 'Outro', icon: Calendar, color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmado':
        return { label: 'Confirmado', color: 'bg-green-100 text-green-700' };
      case 'realizado':
        return { label: 'Realizado', color: 'bg-blue-100 text-blue-700' };
      case 'cancelado':
        return { label: 'Cancelado', color: 'bg-red-100 text-red-700' };
      case 'reagendado':
        return { label: 'Reagendado', color: 'bg-yellow-100 text-yellow-700' };
      default:
        return { label: 'Agendado', color: 'bg-purple-100 text-purple-700' };
    }
  };

  const proximosEventos = eventos.filter(e => isFuture(new Date(e.start_at)) || isToday(new Date(e.start_at)));
  const eventosPassados = eventos.filter(e => isPast(new Date(e.start_at)) && !isToday(new Date(e.start_at)));

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="py-8">
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Eventos</p>
                <p className="text-base font-bold">{eventos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Próximos</p>
                <p className="text-base font-bold">{proximosEventos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Realizados</p>
                <p className="text-base font-bold">{eventos.filter(e => e.status === 'realizado').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <History className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Histórico</p>
                <p className="text-base font-bold">{eventosPassados.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Agenda & Reuniões</p>
                <p className="text-xs text-muted-foreground">{eventos.length} evento(s)</p>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agendar
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
                          <SelectItem value="outro">Outro</SelectItem>
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
                    <Button onClick={handleSaveEvento} disabled={saving}>
                      {saving ? 'Salvando...' : 'Agendar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Próximos Compromissos */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Próximos Compromissos ({proximosEventos.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {proximosEventos.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum evento agendado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Agende uma reunião ou visita com este contato
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {proximosEventos.map((evento) => {
                const typeConfig = getEventTypeConfig(evento.event_type);
                const statusConfig = getStatusConfig(evento.status);
                const TypeIcon = typeConfig.icon;
                
                return (
                  <div key={evento.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${typeConfig.bgColor} flex items-center justify-center`}>
                          <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{evento.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(evento.start_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                            </span>
                            {evento.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {evento.location}
                              </span>
                            )}
                          </div>
                          {evento.description && (
                            <p className="text-xs text-muted-foreground mt-2">{evento.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        <div className="flex gap-1">
                          {evento.status === 'agendado' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => handleUpdateStatus(evento.id, 'confirmado')}
                              title="Confirmar"
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                          {(evento.status === 'agendado' || evento.status === 'confirmado') && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => handleUpdateStatus(evento.id, 'realizado')}
                              title="Marcar como realizado"
                            >
                              <CalendarCheck className="w-4 h-4 text-blue-500" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => handleDeleteEvento(evento.id)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Reuniões */}
      {eventosPassados.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Histórico de Reuniões ({eventosPassados.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {eventosPassados.slice(0, 5).map((evento) => {
                const typeConfig = getEventTypeConfig(evento.event_type);
                const statusConfig = getStatusConfig(evento.status);
                const TypeIcon = typeConfig.icon;
                
                return (
                  <div key={evento.id} className="p-4 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${typeConfig.bgColor} flex items-center justify-center`}>
                          <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{evento.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(evento.start_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TabAgenda;
