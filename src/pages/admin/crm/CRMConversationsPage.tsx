import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChatPanel } from './components/ChatPanel';
import { SofiaChatPanel } from './components/SofiaChatPanel';
import { NandoChatPanel } from './components/NandoChatPanel';
import type { CollaboratorRow } from './components/CollaboratorCard';

const foneCurto = (t?: string | null) => {
  const d = (t || '').replace(/\D/g, '');
  if (d.length === 13) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  if (d.length === 12) return `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return t || null;
};

const CRMConversationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collaborator, setCollaborator] = useState<CollaboratorRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      const base = (supabase as any)
        .from('evolution_instances')
        .select(
          'id, collaborator_name, collaborator_phone, profile_picture_url, profile_name, status, instance_name',
        );
      // "sofia" = atalho usado pelo botao Conversar da lista de pedidos
      const { data } = id === 'sofia'
        ? await base.or('collaborator_name.ilike.%sofia%,instance_name.ilike.%sofia%').limit(1).maybeSingle()
        : await base.eq('id', id).maybeSingle();
      setCollaborator((data as CollaboratorRow) ?? null);
      setLoading(false);
    })();
  }, [id]);

  const goBack = () => navigate(-1);
  const rotulo = collaborator ? `${collaborator.collaborator_name} ${(collaborator as any).instance_name ?? ''}` : '';
  const ehSofia = /sofia/i.test(rotulo);
  const ehNando = !ehSofia && /nando/i.test(rotulo);
  const tel = foneCurto(collaborator?.collaborator_phone);

  return (
    <>
      <Helmet>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" />
        <title>
          {collaborator
            ? `${collaborator.collaborator_name} — Conversas | EXA Admin`
            : 'Conversas | EXA Admin'}
        </title>
      </Helmet>

      <div className="crm-conversations flex flex-col">
        {/* Nando e Sofia trazem a seta de volta no topo da própria lista */}
        {!loading && collaborator && !ehSofia && !ehNando && (
          <div className="flex items-center px-3 border-b border-border">
            <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground gap-2">
              <ArrowLeft className="h-4 w-4" />CRM Evolution
            </Button>
            <span className="ml-auto text-xs text-muted-foreground truncate">{collaborator.collaborator_phone || collaborator.profile_name}</span>
          </div>
        )}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[520px] bg-white">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : !collaborator ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-sm text-gray-500">Colaborador não encontrado.</p>
              <Button variant="outline" onClick={goBack} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Voltar ao CRM
              </Button>
            </div>
          ) : ehSofia ? (
            <SofiaChatPanel onVoltar={goBack} fotoAgente={collaborator.profile_picture_url} telefoneAgente={tel} />
          ) : ehNando ? (
            <NandoChatPanel onVoltar={goBack} telefoneAgente={tel} />
          ) : (
            <ChatPanel collaborator={collaborator} />
          )}
        </div>
      </div>
    </>
  );
};

export default CRMConversationsPage;
