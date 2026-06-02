import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ChatPanel } from './components/ChatPanel';
import type { CollaboratorRow } from './components/CollaboratorCard';

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
      const { data } = await (supabase as any)
        .from('evolution_instances')
        .select(
          'id, collaborator_name, collaborator_phone, profile_picture_url, profile_name, status, instance_name',
        )
        .eq('id', id)
        .maybeSingle();
      setCollaborator((data as CollaboratorRow) ?? null);
      setLoading(false);
    })();
  }, [id]);

  const goBack = () => navigate(-1);

  const initials = (name: string) =>
    name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <Helmet>
        <title>
          {collaborator
            ? `${collaborator.collaborator_name} — Conversas | EXA Admin`
            : 'Conversas | EXA Admin'}
        </title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 md:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              className="text-gray-700 hover:bg-gray-100 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Voltar
            </Button>

            {collaborator && (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                  {collaborator.profile_picture_url ? (
                    <img
                      src={collaborator.profile_picture_url}
                      alt={collaborator.collaborator_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    initials(collaborator.collaborator_name)
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-base md:text-lg font-bold text-gray-900 truncate leading-tight">
                    {collaborator.collaborator_name}
                  </h1>
                  <p className="text-xs text-gray-500 truncate">
                    {collaborator.collaborator_phone ||
                      collaborator.profile_name ||
                      'Sem telefone vinculado'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[520px] rounded-2xl border border-gray-200 bg-white">
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
          ) : (
            <ChatPanel collaborator={collaborator} />
          )}
        </div>
      </div>
    </>
  );
};

export default CRMConversationsPage;
