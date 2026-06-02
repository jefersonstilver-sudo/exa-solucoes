import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MessageCircle, UserPlus, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AddCollaboratorDialog } from './components/AddCollaboratorDialog';
import { CollaboratorCard, type CollaboratorRow } from './components/CollaboratorCard';

const CRMEvolutionPage: React.FC = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('evolution_instances')
      .select('id, collaborator_name, collaborator_phone, profile_picture_url, profile_name, status')
      .order('created_at', { ascending: false });
    if (!error && data) setCollaborators(data as CollaboratorRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Helmet>
        <title>CRM Evolution | EXA Admin</title>
        <meta
          name="description"
          content="CRM para acompanhar conversas dos colaboradores via Evolution API"
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] flex items-center justify-center shadow-sm flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight truncate">
                  CRM Evolution
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 truncate">
                  Conversas dos colaboradores via Evolution API
                </p>
              </div>
            </div>
            <Button
              onClick={() => setAddOpen(true)}
              className="bg-[#9C1E1E] hover:bg-[#7D1818] text-white flex-shrink-0"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Adicionar colaborador</span>
              <span className="sm:hidden">Adicionar</span>
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Users className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">Colaboradores</h2>
            <span className="text-xs text-gray-400">({collaborators.length})</span>
          </div>

          {loading ? (
            <div className="flex gap-3 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-36 h-48 rounded-2xl bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : collaborators.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Nenhum colaborador conectado ainda.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Clique em "Adicionar colaborador" para começar.
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:thin]">
              {collaborators.map((c) => (
                <div key={c.id} className="snap-start">
                  <CollaboratorCard collaborator={c} onUpdated={load} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddCollaboratorDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={load}
      />
    </>
  );
};

export default CRMEvolutionPage;
