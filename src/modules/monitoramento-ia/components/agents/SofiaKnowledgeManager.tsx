import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Building, FileText, Target, HelpCircle, MapPin, Building2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { KnowledgeSection } from './KnowledgeSection';
import { FAQSection } from './FAQSection';

interface KnowledgeEntry {
  id: string;
  section: string;
  title: string;
  content: string;
  metadata: any;
  is_active: boolean;
}

export const SofiaKnowledgeManager = () => {
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeSection, setActiveSection] = useState('perfil_identidade');

  useEffect(() => {
    loadKnowledge();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('sofia-knowledge-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_knowledge',
          filter: 'agent_key=eq.sofia'
        },
        () => {
          console.log('Knowledge updated, reloading...');
          loadKnowledge();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadKnowledge = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_knowledge')
        .select('*')
        .eq('agent_key', 'sofia')
        .eq('is_active', true)
        .order('section', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;

      setKnowledge(data || []);
    } catch (error) {
      console.error('Error loading knowledge:', error);
      toast.error('Erro ao carregar conhecimento');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAgent = async () => {
    try {
      setUpdating(true);
      
      // Força recarregamento da base de conhecimento
      await loadKnowledge();
      
      // Atualiza timestamp do agente para notificar mudanças
      const { error } = await supabase
        .from('agents')
        .update({ updated_at: new Date().toISOString() })
        .eq('key', 'sofia');

      if (error) throw error;

      toast.success('Agente atualizado! Todas as mudanças foram aplicadas.');
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Erro ao atualizar agente');
    } finally {
      setUpdating(false);
    }
  };

  const sections = [
    { key: 'perfil_identidade', label: 'Perfil e Identidade', Icon: Building },
    { key: 'instrucoes', label: 'Instruções do Agente', Icon: FileText },
    { key: 'fluxo_comercial', label: 'Fluxo Comercial', Icon: Target },
    { key: 'faq', label: 'Perguntas Frequentes', Icon: HelpCircle },
    { key: 'contexto_local', label: 'Contexto Local', Icon: MapPin },
    { key: 'predios', label: 'Prédios e Acesso', Icon: Building2 }
  ];

  const getSectionItems = (section: string) => {
    return knowledge.filter(item => item.section === section);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-module-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Base de Conhecimento da Sofia</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todo o conhecimento do agente em tempo real
          </p>
        </div>
        <Button onClick={handleUpdateAgent} disabled={updating}>
          {updating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Atualizar Agente
        </Button>
      </div>

      {/* Layout with Sidebar */}
      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <Card className="w-64 flex-shrink-0">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Seções</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-1 p-4">
                {sections.map(section => {
                  const Icon = section.Icon;
                  const isActive = activeSection === section.key;
                  return (
                    <button
                      key={section.key}
                      onClick={() => setActiveSection(section.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {sections.map(section => {
              if (activeSection !== section.key) return null;
              return (
                <div key={section.key} className="space-y-4">
                  <KnowledgeSection
                    agentKey="sofia"
                    section={section.key}
                    items={getSectionItems(section.key).map(item => ({
                      id: item.id,
                      title: item.title,
                      content: item.content,
                      type: item.metadata?.type || 'text',
                      metadata: item.metadata
                    }))}
                    onRefresh={loadKnowledge}
                  />
                </div>
              );
            })}

            {activeSection === 'faq' && (
              <div className="space-y-4">
                <FAQSection agentKey="sofia" onRefresh={loadKnowledge} />
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
