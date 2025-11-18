import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { getUnifiedClientData, analyzeUserBehavior, type UnifiedClientData, type AIAnalysis } from '@/services/crmService';
import { toast } from 'sonner';
import { ClientSummaryTab } from './tabs/ClientSummaryTab';
import { ClientOrdersTab } from './tabs/ClientOrdersTab';
import { ClientAttemptsTab } from './tabs/ClientAttemptsTab';
import { ClientAIAnalysisTab } from './tabs/ClientAIAnalysisTab';
import { ClientBehaviorTab } from './tabs/ClientBehaviorTab';
import { ClientNotesTab } from './tabs/ClientNotesTab';
import { supabase } from '@/integrations/supabase/client';

interface ClientDetailModalProps {
  clientId: string;
  open: boolean;
  onClose: () => void;
}

export function ClientDetailModal({ clientId, open, onClose }: ClientDetailModalProps) {
  const [data, setData] = useState<UnifiedClientData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  useEffect(() => {
    if (open && clientId) {
      fetchClientData();
      
      // 🔥 Real-time subscription para detectar mudanças em pedidos e tentativas
      const channel = supabase
        .channel(`client-detail-${clientId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'pedidos',
            filter: `client_id=eq.${clientId}`
          }, 
          (payload) => {
            console.log('🔄 [CRM] Mudança em pedidos detectada:', payload);
            fetchClientData(); // Refetch automático
          }
        )
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tentativas_compra',
            filter: `user_id=eq.${clientId}`
          },
          (payload) => {
            console.log('🔄 [CRM] Mudança em tentativas detectada:', payload);
            fetchClientData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [open, clientId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Registrar visualização do perfil
      const { logClientProfileView } = await import('@/services/crmService');
      await logClientProfileView(clientId);
      
      const clientData = await getUnifiedClientData(clientId);
      setData(clientData);
      
      // Se já tem análise IA, carregar
      if (clientData?.behavior?.ai_behavior_summary) {
        setAiAnalysis({
          interest_score: clientData.behavior.purchase_intent_score || 0,
          interest_level: (clientData.behavior.ai_interest_level as any) || 'low',
          behavior_summary: clientData.behavior.ai_behavior_summary || '',
          main_interests: [],
          conversion_probability: 'medium',
          conversion_probability_percent: 50,
          recommended_actions: clientData.behavior.ai_recommended_actions || [],
          next_best_action: '',
          churn_risk: 'low',
          insights: [],
        });
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Erro ao carregar dados do cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    try {
      setAnalyzingAI(true);
      toast.info('Iniciando análise comportamental com IA...');
      const analysis = await analyzeUserBehavior(clientId);
      setAiAnalysis(analysis);
      toast.success('Análise IA concluída!');
      // Recarregar dados para pegar análise atualizada
      await fetchClientData();
    } catch (error) {
      console.error('Error running AI analysis:', error);
      toast.error('Erro ao executar análise IA');
    } finally {
      setAnalyzingAI(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Cliente</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRunAIAnalysis}
                disabled={analyzingAI}
              >
                {analyzingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar Análise IA
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : data ? (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="summary">Resumo</TabsTrigger>
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="attempts">Tentativas</TabsTrigger>
              <TabsTrigger value="ai">Análise IA</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="notes">Notas CRM</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <ClientSummaryTab data={data} />
            </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <ClientOrdersTab orders={data.orders} />
            </TabsContent>

            <TabsContent value="attempts" className="space-y-4">
              <ClientAttemptsTab attempts={data.attempts} />
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <ClientAIAnalysisTab
                analysis={aiAnalysis}
                onRunAnalysis={handleRunAIAnalysis}
                loading={analyzingAI}
              />
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              <ClientBehaviorTab behavior={data.behavior} />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <ClientNotesTab clientId={clientId} notes={data.notes} onRefresh={fetchClientData} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Erro ao carregar dados do cliente
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
