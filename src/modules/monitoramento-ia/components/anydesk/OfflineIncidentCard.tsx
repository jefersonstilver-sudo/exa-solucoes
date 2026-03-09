import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Settings, User, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DeviceIncident, IncidentCategory, useIncidentCategories } from "../../hooks/useDeviceIncidents";
import { IncidentCategoryManager } from "./IncidentCategoryManager";

interface OfflineIncidentCardProps {
  incident: DeviceIncident | null;
  onRegisterCause: (incidentId: string, categoryId: string, causa: string, resolucao?: string) => Promise<void>;
  isDeviceOffline?: boolean;
}

export const OfflineIncidentCard = ({ incident, onRegisterCause, isDeviceOffline }: OfflineIncidentCardProps) => {
  const { categories } = useIncidentCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [causa, setCausa] = useState("");
  const [resolucao, setResolucao] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  // Não renderizar se não há incidente E o device não está offline
  if (!incident && !isDeviceOffline) return null;

  const isPending = !incident || incident.status === 'pendente';
  const hasCause = incident?.status === 'causa_registrada';

  const handleSave = async () => {
    if (!incident) return; // Ainda carregando o incidente
    if (!selectedCategoryId || !causa.trim()) return;
    setSaving(true);
    try {
      await onRegisterCause(incident.id, selectedCategoryId, causa.trim(), resolucao.trim() || undefined);
      setCausa("");
      setResolucao("");
      setSelectedCategoryId("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className={cn(
        "md:col-span-3 border-2 shadow-md",
        isPending ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-300"
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className={cn("h-4 w-4", isPending ? "text-red-600" : "text-amber-600")} />
              <span className={isPending ? "text-red-700" : "text-amber-700"}>
                {isPending ? "⚠️ INCIDENTE ATIVO — Causa Pendente" : "📋 INCIDENTE — Causa Registrada"}
              </span>
            </span>
            <Badge className={cn(
              "text-xs",
              isPending 
                ? "bg-red-100 text-red-700 border-red-300" 
                : "bg-amber-100 text-amber-700 border-amber-300"
            )}>
              <Clock className="h-3 w-3 mr-1" />
              {incident ? `Offline há ${formatDistanceToNow(new Date(incident.started_at), { locale: ptBR })}` : 'Carregando...'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasCause ? (
            /* Causa já registrada — modo visualização */
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                {incident.category && (
                  <Badge
                    className="text-sm px-3 py-1"
                    style={{
                      backgroundColor: `${incident.category.color}20`,
                      color: incident.category.color,
                      borderColor: `${incident.category.color}40`,
                    }}
                  >
                    {incident.category.icon} {incident.category.label}
                  </Badge>
                )}
              </div>
              <div className="bg-white/80 rounded-lg p-3 border border-amber-200">
                <p className="text-xs font-semibold text-amber-700 mb-1">Causa:</p>
                <p className="text-sm text-gray-800">{incident.causa}</p>
              </div>
              {incident.resolucao && (
                <div className="bg-white/80 rounded-lg p-3 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Resolução:</p>
                  <p className="text-sm text-gray-800">{incident.resolucao}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <User className="h-3 w-3" />
                <span>
                  Registrado por <strong>{incident.registrado_por_nome}</strong> em{' '}
                  {incident.registrado_em ? format(new Date(incident.registrado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'}
                </span>
              </div>
            </div>
          ) : (
            /* Sem causa — modo formulário */
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-red-700">Categoria do Incidente</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => setShowCategoryManager(true)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Gerenciar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        selectedCategoryId === cat.id
                          ? "ring-2 ring-offset-1 scale-105"
                          : "opacity-70 hover:opacity-100"
                      )}
                      style={{
                        backgroundColor: selectedCategoryId === cat.id ? `${cat.color}30` : `${cat.color}15`,
                        color: cat.color,
                        borderColor: selectedCategoryId === cat.id ? cat.color : `${cat.color}40`,
                      }}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-red-700 mb-1 block">
                  Causa da Queda *
                </label>
                <Textarea
                  placeholder="Descreva o motivo da queda do painel..."
                  value={causa}
                  onChange={(e) => setCausa(e.target.value)}
                  className="bg-white border-red-200 text-sm min-h-[60px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-red-700 mb-1 block">
                  Resolução (opcional)
                </label>
                <Textarea
                  placeholder="O que está sendo feito para resolver..."
                  value={resolucao}
                  onChange={(e) => setResolucao(e.target.value)}
                  className="bg-white border-red-200 text-sm min-h-[60px]"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || !selectedCategoryId || !causa.trim()}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {saving ? 'Registrando...' : 'Registrar Causa'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <IncidentCategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />
    </>
  );
};
