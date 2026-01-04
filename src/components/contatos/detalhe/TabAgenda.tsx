import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Clock, MapPin, Video } from 'lucide-react';
import { Contact } from '@/types/contatos';

interface TabAgendaProps {
  contact: Contact;
}

export const TabAgenda: React.FC<TabAgendaProps> = ({ contact }) => {
  // TODO: Integrar com tabela de calendar_events
  const eventos: any[] = [];

  return (
    <div className="space-y-4">
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
            <Button size="sm" className="h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Agendar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Próximos Compromissos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventos.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-foreground">Nenhum evento agendado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Agende uma reunião ou visita com este contato
              </p>
              <Button variant="outline" className="mt-4" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Agendar Reunião
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Placeholder */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-sm">Reunião de Apresentação</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Amanhã às 14:00
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  Confirmado
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Histórico de Reuniões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma reunião realizada ainda
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabAgenda;
