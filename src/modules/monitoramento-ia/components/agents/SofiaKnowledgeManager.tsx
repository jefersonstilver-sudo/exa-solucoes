import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Save, RefreshCw, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('perfil');
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

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
      
      // Inicializar conteúdo editado
      const initialContent: Record<string, string> = {};
      data?.forEach(item => {
        initialContent[item.id] = item.content;
      });
      setEditedContent(initialContent);
    } catch (error) {
      console.error('Error loading knowledge:', error);
      toast.error('Erro ao carregar conhecimento');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (itemId: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('agent_knowledge')
        .update({ 
          content: editedContent[itemId],
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) throw error;

      toast.success('Conhecimento atualizado! Preview será atualizado automaticamente.');
    } catch (error) {
      console.error('Error saving knowledge:', error);
      toast.error('Erro ao salvar conhecimento');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(editedContent).map(([id, content]) => ({
        id,
        content,
        updated_at: new Date().toISOString()
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('agent_knowledge')
          .update({ content: update.content, updated_at: update.updated_at })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success('Todas as configurações salvas! Preview atualizado.');
    } catch (error) {
      console.error('Error saving all:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { key: 'perfil', label: 'Perfil & Identidade', icon: '🎀' },
    { key: 'missao', label: 'Missão', icon: '🎯' },
    { key: 'regras_obrigatorias', label: 'Regras Obrigatórias', icon: '📋' },
    { key: 'classificacao', label: 'Classificação Automática', icon: '🔍' },
    { key: 'fluxo_venda', label: 'Fluxo de Venda', icon: '💰' },
    { key: 'qualificacao_score', label: 'Qualificação & Score', icon: '📊' },
    { key: 'alertas_exa', label: 'Sistema de Alertas', icon: '🚨' },
    { key: 'sobre_exa', label: 'Sobre a EXA', icon: 'ℹ️' },
    { key: 'acesso_predios', label: 'Acesso a Prédios', icon: '🏢' }
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
          <h3 className="text-xl font-bold text-module-primary">Base de Conhecimento da Sofia</h3>
          <p className="text-sm text-module-secondary mt-1">
            Edite o conhecimento e o preview será atualizado automaticamente em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadKnowledge} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Tudo
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Atualizações em Tempo Real Ativas</p>
              <p>Qualquer alteração salva aqui será automaticamente refletida no preview do chat e em todas as conversas futuras com a Sofia.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections Tabs */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="bg-module-input border-module w-full grid grid-cols-3 lg:grid-cols-5 gap-2">
          {sections.map(section => {
            const hasContent = getSectionItems(section.key).length > 0;
            return (
              <TabsTrigger
                key={section.key}
                value={section.key}
                className="data-[state=active]:bg-white data-[state=active]:text-module-accent data-[state=inactive]:text-module-secondary"
              >
                <span className="mr-1">{section.icon}</span>
                {section.label}
                {hasContent && (
                  <Badge variant="outline" className="ml-2 px-1 py-0 text-xs">
                    {getSectionItems(section.key).length}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {sections.map(section => (
          <TabsContent key={section.key} value={section.key} className="space-y-4">
            <ScrollArea className="h-[600px] pr-4">
              {getSectionItems(section.key).map(item => (
                <Card key={item.id} className="mb-4 bg-module-card border-module">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-module-primary flex items-center gap-2">
                        {section.icon} {item.title}
                        {item.metadata?.priority === 'critical' && (
                          <Badge variant="destructive" className="ml-2">CRÍTICO</Badge>
                        )}
                        {item.metadata?.automated && (
                          <Badge variant="secondary" className="ml-2">AUTO</Badge>
                        )}
                      </CardTitle>
                      <Button
                        size="sm"
                        onClick={() => handleSave(item.id)}
                        disabled={saving || editedContent[item.id] === item.content}
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : editedContent[item.id] === item.content ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(item.metadata).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label className="text-module-primary">Conteúdo</Label>
                      <Textarea
                        value={editedContent[item.id] || ''}
                        onChange={(e) => setEditedContent(prev => ({
                          ...prev,
                          [item.id]: e.target.value
                        }))}
                        className="min-h-[300px] font-mono text-sm bg-module-input border-module text-module-primary"
                        placeholder="Digite o conteúdo do conhecimento..."
                      />
                      <p className="text-xs text-module-secondary">
                        Última atualização: {new Date(item.metadata?.updated_at || Date.now()).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    {editedContent[item.id] !== item.content && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Há alterações não salvas neste item
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {getSectionItems(section.key).length === 0 && (
                <Card className="bg-module-input border-module">
                  <CardContent className="py-12 text-center">
                    <p className="text-module-secondary">
                      Nenhum conteúdo encontrado para esta seção
                    </p>
                  </CardContent>
                </Card>
              )}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
