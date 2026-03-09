import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DeviceIncident } from "../../hooks/useDeviceIncidents";

interface IncidentHistoryTabProps {
  incidents: DeviceIncident[];
  loading: boolean;
}

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
  causa_registrada: { label: 'Causa Registrada', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: AlertTriangle },
  resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle2 },
};

export const IncidentHistoryTab = ({ incidents, loading }: IncidentHistoryTabProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-module-accent" />
      </div>
    );
  }

  if (!incidents.length) {
    return (
      <Card className="bg-module-card border-module">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-3" />
          <p className="text-module-secondary text-sm">Nenhum incidente registrado para este painel.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {incidents.map((incident) => {
        const config = statusConfig[incident.status] || statusConfig.pendente;
        const StatusIcon = config.icon;
        const duration = incident.resolved_at
          ? formatDistanceStrict(new Date(incident.started_at), new Date(incident.resolved_at), { locale: ptBR })
          : null;

        return (
          <Card key={incident.id} className="bg-module-card border-module shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StatusIcon className={cn("h-4 w-4", 
                    incident.status === 'pendente' ? 'text-red-500' : 
                    incident.status === 'causa_registrada' ? 'text-amber-500' : 'text-green-500'
                  )} />
                  <span className="text-sm font-semibold text-module-primary">
                    {format(new Date(incident.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                  {duration && (
                    <span className="text-xs text-module-secondary flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Duração: {duration}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", config.color)}>
                    {config.label}
                  </Badge>
                  {incident.auto_resolved && (
                    <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                      Auto-resolvido
                    </Badge>
                  )}
                </div>
              </div>

              {/* Categoria */}
              {incident.category && (
                <Badge
                  className="text-xs mb-2"
                  style={{
                    backgroundColor: `${incident.category.color}20`,
                    color: incident.category.color,
                    borderColor: `${incident.category.color}40`,
                  }}
                >
                  {incident.category.icon} {incident.category.label}
                </Badge>
              )}

              {/* Causa e resolução */}
              {incident.causa && (
                <div className="bg-module-secondary/50 rounded p-2 mb-2">
                  <p className="text-xs font-semibold text-module-secondary mb-0.5">Causa:</p>
                  <p className="text-sm text-module-primary">{incident.causa}</p>
                </div>
              )}
              {incident.resolucao && (
                <div className="bg-module-secondary/50 rounded p-2 mb-2">
                  <p className="text-xs font-semibold text-module-secondary mb-0.5">Resolução:</p>
                  <p className="text-sm text-module-primary">{incident.resolucao}</p>
                </div>
              )}

              {/* Responsável */}
              {incident.registrado_por_nome && (
                <div className="flex items-center gap-1.5 text-xs text-module-secondary mt-2">
                  <User className="h-3 w-3" />
                  <span>
                    Registrado por <strong>{incident.registrado_por_nome}</strong>
                    {incident.registrado_em && (
                      <> em {format(new Date(incident.registrado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>
                    )}
                  </span>
                </div>
              )}

              {/* Sem causa registrada */}
              {!incident.causa && incident.status === 'resolvido' && (
                <p className="text-xs text-red-500 italic mt-1">
                  ⚠ Resolvido sem causa registrada
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
