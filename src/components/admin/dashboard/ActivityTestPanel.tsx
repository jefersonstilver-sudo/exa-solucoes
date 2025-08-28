import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TestTube, Zap } from 'lucide-react';
import { logActivity } from '@/hooks/useActivityFeed';
import { useToast } from '@/hooks/use-toast';

const ActivityTestPanel = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testScenarios = [
    {
      name: 'Admin aprova vídeo',
      type: 'admin_action' as const,
      action: 'video_approved',
      entityType: 'video',
      severity: 'info' as const,
      details: { message: 'Vídeo promocional aprovado', video_name: 'promo_2024.mp4' }
    },
    {
      name: 'Usuário cria pedido',
      type: 'user_action' as const,
      action: 'order_created', 
      entityType: 'pedido',
      severity: 'info' as const,
      details: { message: 'Novo pedido R$ 1.500,00', duration: '2 meses' }
    },
    {
      name: 'Painel sincronizado',
      type: 'system_event' as const,
      action: 'panel_sync',
      entityType: 'painel', 
      severity: 'info' as const,
      details: { message: 'Painel P003 online', sync_time: '1.2s' }
    },
    {
      name: 'Pedido bloqueado',
      type: 'admin_action' as const,
      action: 'order_blocked',
      entityType: 'pedido',
      severity: 'warning' as const,
      details: { message: 'Bloqueio por suspeita', reason: 'Pagamento duplicado' }
    },
    {
      name: 'Erro crítico',
      type: 'system_event' as const,
      action: 'system_error',
      entityType: 'system',
      severity: 'critical' as const,
      details: { message: 'Falha na conectividade com MercadoPago', error_code: 'MP_TIMEOUT' }
    }
  ];

  const handleTestScenario = async (scenario: typeof testScenarios[0]) => {
    try {
      setLoading(true);
      await logActivity(
        scenario.type,
        scenario.action,
        scenario.entityType,
        undefined,
        scenario.details,
        scenario.severity
      );

      toast({
        title: "✅ Atividade registrada",
        description: `${scenario.name} adicionado ao feed`,
      });
    } catch (error) {
      console.error('Error logging test activity:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao registrar atividade de teste",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    toast({
      title: "🧪 Executando cenários de teste",
      description: "Adicionando atividades de demonstração...",
    });

    try {
      for (const scenario of testScenarios) {
        await logActivity(
          scenario.type,
          scenario.action,
          scenario.entityType,
          undefined,
          scenario.details,
          scenario.severity
        );
        // Pequeno delay para visualizar as atividades sendo adicionadas
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      toast({
        title: "✅ Teste concluído",
        description: "Todas as atividades de teste foram adicionadas",
      });
    } catch (error) {
      console.error('Error running all tests:', error);
      toast({
        title: "❌ Erro no teste",
        description: "Falha ao executar alguns cenários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-blue-300 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <TestTube className="h-5 w-5" />
          🧪 Painel de Testes - Sistema de Monitoramento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testScenarios.map((scenario, index) => (
            <Button
              key={index}
              onClick={() => handleTestScenario(scenario)}
              disabled={loading}
              variant="outline"
              className="h-auto p-3 flex flex-col items-start text-left"
            >
              <div className="font-medium">{scenario.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {scenario.type} • {scenario.severity}
              </div>
            </Button>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={runAllTests}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            {loading ? 'Executando testes...' : 'Executar Todos os Cenários'}
          </Button>
        </div>

        <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
          <strong>💡 Como funciona:</strong> Este painel permite testar o sistema de monitoramento adicionando atividades simuladas. 
          Observe como elas aparecem em tempo real no "Monitor de Atividades" ao lado.
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTestPanel;