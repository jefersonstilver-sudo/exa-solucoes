import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SindicoRow } from '@/hooks/useSindicosList';
import { STATUS_OPTIONS } from '../SindicoStatusBadge';

interface Props {
  sindico: SindicoRow;
  onSaved?: () => void;
}

interface ResponsavelOption {
  id: string;
  nome: string;
}

const ROLES_RESPONSAVEL = ['admin', 'super_admin', 'gestor_comercial', 'diretora_operacoes'] as const;

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
};

export const TabGestaoInterna: React.FC<Props> = ({ sindico, onSaved }) => {
  const [status, setStatus] = useState(sindico.status);
  const [observacoes, setObservacoes] = useState(sindico.observacoes_internas ?? '');
  const [visita, setVisita] = useState(toLocalInput(sindico.visita_agendada_em));
  const [responsavelId, setResponsavelId] = useState<string>(sindico.responsavel_id ?? 'none');
  const [responsaveis, setResponsaveis] = useState<ResponsavelOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(sindico.status);
    setObservacoes(sindico.observacoes_internas ?? '');
    setVisita(toLocalInput(sindico.visita_agendada_em));
    setResponsavelId(sindico.responsavel_id ?? 'none');
  }, [sindico.id]);

  useEffect(() => {
    const loadResponsaveis = async () => {
      const { data, error } = await supabase
        .from('users_with_role')
        .select('id, full_name, email, role')
        .in('role', ROLES_RESPONSAVEL as any)
        .limit(200);
      if (error) {
        console.error('[TabGestaoInterna] erro responsáveis:', error);
        return;
      }
      const opts: ResponsavelOption[] = (data ?? []).map((u: any) => ({
        id: u.id,
        nome: u.full_name || u.email || u.id,
      }));
      setResponsaveis(opts);
    };
    loadResponsaveis();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, any> = {
      status,
      observacoes_internas: observacoes || null,
      visita_agendada_em: visita ? new Date(visita).toISOString() : null,
      responsavel_id: responsavelId === 'none' ? null : responsavelId,
    };

    const { error } = await supabase
      .from('sindicos_interessados')
      .update(payload)
      .eq('id', sindico.id);

    setSaving(false);

    if (error) {
      console.error('[TabGestaoInterna] erro ao salvar:', error);
      toast.error('Erro ao salvar: ' + error.message);
      return;
    }
    toast.success('Alterações salvas');
    onSaved?.();
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Observações internas</Label>
        <Textarea
          rows={4}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Anotações visíveis apenas para a equipe interna…"
        />
      </div>

      <div className="space-y-2">
        <Label>Visita agendada em</Label>
        <Input
          type="datetime-local"
          value={visita}
          onChange={(e) => setVisita(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Responsável pelo contato</Label>
        <Select value={responsavelId} onValueChange={setResponsavelId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Sem responsável —</SelectItem>
            {responsaveis.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="pt-2 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar alterações
        </Button>
      </div>
    </Card>
  );
};
