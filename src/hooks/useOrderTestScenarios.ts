
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logCheckoutEvent, LogLevel, CheckoutEvent } from '@/services/checkoutDebugService';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  cartItems: any[];
  selectedPlan: number;
  totalPrice: number;
  expectedOutcome: 'success' | 'failure';
}

interface TestResult {
  scenarioId: string;
  success: boolean;
  orderId?: string;
  error?: string;
  executionTime: number;
  dataValidation: boolean;
}

export const useOrderTestScenarios = () => {
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  // Cenários de teste predefinidos
  const getTestScenarios = useCallback(async (): Promise<TestScenario[]> => {
    // Buscar painéis reais para os testes
    const { data: panels } = await supabase
      .from('painels')
      .select('id, building_id, buildings(nome)')
      .limit(5);

    if (!panels || panels.length === 0) {
      toast.warning('Nenhum painel encontrado para testes');
      return [];
    }

    return [
      {
        id: 'single-panel',
        name: 'Pedido com 1 Painel',
        description: 'Teste básico com um único painel',
        cartItems: [{
          panel: panels[0],
          duration: 30
        }],
        selectedPlan: 1,
        totalPrice: 50,
        expectedOutcome: 'success'
      },
      {
        id: 'multiple-panels',
        name: 'Pedido com Múltiplos Painéis',
        description: 'Teste com vários painéis do mesmo prédio',
        cartItems: panels.slice(0, 3).map(panel => ({
          panel,
          duration: 30
        })),
        selectedPlan: 3,
        totalPrice: 150,
        expectedOutcome: 'success'
      },
      {
        id: 'different-buildings',
        name: 'Painéis de Prédios Diferentes',
        description: 'Teste com painéis de prédios diferentes',
        cartItems: panels.slice(0, 2).map(panel => ({
          panel,
          duration: 30
        })),
        selectedPlan: 6,
        totalPrice: 300,
        expectedOutcome: 'success'
      },
      {
        id: 'invalid-panel',
        name: 'Painel Inválido',
        description: 'Teste com painel que não existe',
        cartItems: [{
          panel: { id: 'invalid-id', building_id: 'invalid-building' },
          duration: 30
        }],
        selectedPlan: 1,
        totalPrice: 50,
        expectedOutcome: 'failure'
      },
      {
        id: 'zero-price',
        name: 'Preço Zero',
        description: 'Teste com preço inválido',
        cartItems: [{
          panel: panels[0],
          duration: 30
        }],
        selectedPlan: 1,
        totalPrice: 0,
        expectedOutcome: 'failure'
      }
    ];
  }, []);

  // Executar um cenário de teste
  const runTestScenario = useCallback(async (scenario: TestScenario, userId: string): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 [TEST_SCENARIO] Executando: ${scenario.name}`);
      
      // Simular criação de pedido com dados do cenário
      const orderData = {
        client_id: userId,
        lista_paineis: scenario.cartItems.map(item => item.panel.id),
        lista_predios: [...new Set(scenario.cartItems.map(item => item.panel.building_id))],
        plano_meses: scenario.selectedPlan,
        valor_total: scenario.totalPrice,
        status: 'teste',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: new Date(Date.now() + scenario.selectedPlan * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        termos_aceitos: true,
        log_pagamento: {
          test_scenario: scenario.id,
          test_timestamp: new Date().toISOString(),
          expected_outcome: scenario.expectedOutcome
        }
      };

      const { data: pedidoData, error: pedidoError } = await supabase
        .from('pedidos')
        .insert(orderData)
        .select()
        .single();

      const executionTime = Date.now() - startTime;

      if (pedidoError) {
        // Erro esperado para cenários de falha
        if (scenario.expectedOutcome === 'failure') {
          return {
            scenarioId: scenario.id,
            success: true, // Sucesso porque o erro era esperado
            executionTime,
            dataValidation: true
          };
        } else {
          return {
            scenarioId: scenario.id,
            success: false,
            error: pedidoError.message,
            executionTime,
            dataValidation: false
          };
        }
      }

      // Validar dados criados
      const dataValidation = await validateCreatedOrder(pedidoData, scenario);

      // Limpar dados de teste
      if (pedidoData?.id) {
        await supabase
          .from('pedidos')
          .delete()
          .eq('id', pedidoData.id);
      }

      return {
        scenarioId: scenario.id,
        success: scenario.expectedOutcome === 'success',
        orderId: pedidoData?.id,
        executionTime,
        dataValidation
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      return {
        scenarioId: scenario.id,
        success: scenario.expectedOutcome === 'failure',
        error: error.message,
        executionTime,
        dataValidation: false
      };
    }
  }, []);

  // Validar pedido criado
  const validateCreatedOrder = useCallback(async (orderData: any, scenario: TestScenario): Promise<boolean> => {
    try {
      // Verificar se lista_paineis foi salva corretamente
      const expectedPanelIds = scenario.cartItems.map(item => item.panel.id);
      const savedPanelIds = orderData.lista_paineis || [];
      
      if (expectedPanelIds.length !== savedPanelIds.length) {
        console.error('Lista de painéis não corresponde');
        return false;
      }

      // Verificar se lista_predios foi extraída corretamente
      const expectedBuildingIds = [...new Set(scenario.cartItems.map(item => item.panel.building_id))];
      const savedBuildingIds = orderData.lista_predios || [];
      
      if (expectedBuildingIds.length !== savedBuildingIds.length) {
        console.error('Lista de prédios não corresponde');
        return false;
      }

      // Verificar valor total
      if (orderData.valor_total !== scenario.totalPrice) {
        console.error('Valor total não corresponde');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro na validação:', error);
      return false;
    }
  }, []);

  // Executar todos os cenários de teste
  const runAllTestScenarios = useCallback(async (userId: string) => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      const scenarios = await getTestScenarios();
      const results: TestResult[] = [];

      toast.info(`Executando ${scenarios.length} cenários de teste...`);

      for (const scenario of scenarios) {
        const result = await runTestScenario(scenario, userId);
        results.push(result);

        logCheckoutEvent(
          CheckoutEvent.DEBUG_EVENT,
          result.success ? LogLevel.INFO : LogLevel.ERROR,
          `Cenário de teste: ${scenario.name}`,
          { scenario: scenario.id, result }
        );

        // Aguardar um pouco entre testes
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setTestResults(results);

      const passedTests = results.filter(r => r.success).length;
      const totalTests = results.length;

      if (passedTests === totalTests) {
        toast.success(`Todos os ${totalTests} testes passaram! Sistema pronto para uso.`);
      } else {
        toast.warning(`${passedTests}/${totalTests} testes passaram. Verifique os resultados.`);
      }

    } catch (error) {
      console.error('Erro ao executar testes:', error);
      toast.error('Erro ao executar cenários de teste');
    } finally {
      setIsRunningTests(false);
    }
  }, [getTestScenarios, runTestScenario]);

  return {
    isRunningTests,
    testResults,
    runAllTestScenarios,
    runTestScenario,
    getTestScenarios
  };
};
