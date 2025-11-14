import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Wrench } from 'lucide-react';

export const FixPedidoListaPaineisButton = () => {
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleFix = async () => {
    try {
      setIsFixing(true);
      console.log('🔧 [FIX_BUTTON] Calling fix-pedido-lista-paineis edge function...');

      const { data, error } = await supabase.functions.invoke('fix-pedido-lista-paineis', {
        body: {}
      });

      if (error) {
        console.error('❌ [FIX_BUTTON] Error:', error);
        toast.error('Erro ao corrigir pedidos: ' + error.message);
        return;
      }

      console.log('✅ [FIX_BUTTON] Success:', data);
      setResults(data.results);
      
      toast.success(`Correção concluída! ${data.results.pedidos_fixed} pedidos corrigidos.`, {
        description: `Total encontrado: ${data.results.total_pedidos_found} | Falhas: ${data.results.pedidos_failed} | Ignorados: ${data.results.pedidos_skipped}`
      });
    } catch (error) {
      console.error('❌ [FIX_BUTTON] Exception:', error);
      toast.error('Erro ao corrigir pedidos');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Card className="border-orange-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-orange-500" />
          Corrigir Lista de Painéis
        </CardTitle>
        <CardDescription>
          Corrige pedidos com lista_paineis e lista_predios vazios extraindo os IDs dos contratos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleFix} 
          disabled={isFixing}
          className="w-full"
          variant="outline"
        >
          {isFixing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Corrigindo...
            </>
          ) : (
            <>
              <Wrench className="mr-2 h-4 w-4" />
              Executar Correção
            </>
          )}
        </Button>

        {results && (
          <div className="mt-4 space-y-2 rounded-md bg-muted p-4">
            <div className="font-semibold">Resultados:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total encontrado:</div>
              <div className="font-mono">{results.total_pedidos_found}</div>
              
              <div className="text-green-600">Corrigidos:</div>
              <div className="font-mono text-green-600">{results.pedidos_fixed}</div>
              
              <div className="text-yellow-600">Ignorados:</div>
              <div className="font-mono text-yellow-600">{results.pedidos_skipped}</div>
              
              <div className="text-red-600">Falhas:</div>
              <div className="font-mono text-red-600">{results.pedidos_failed}</div>
            </div>

            {results.details && results.details.length > 0 && (
              <div className="mt-4">
                <div className="font-semibold mb-2">Detalhes:</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.details.map((detail: any, index: number) => (
                    <div 
                      key={index} 
                      className={`text-xs p-2 rounded ${
                        detail.status === 'fixed' ? 'bg-green-500/10' :
                        detail.status === 'skipped' ? 'bg-yellow-500/10' :
                        'bg-red-500/10'
                      }`}
                    >
                      <div className="font-mono">{detail.pedido_id}</div>
                      <div>Status: {detail.status}</div>
                      {detail.panel_ids_added && (
                        <div>Painéis: {detail.panel_ids_added.length}</div>
                      )}
                      {detail.building_ids_added && (
                        <div>Prédios: {detail.building_ids_added.length}</div>
                      )}
                      {detail.reason && (
                        <div className="text-yellow-600">Motivo: {detail.reason}</div>
                      )}
                      {detail.error && (
                        <div className="text-red-600">Erro: {detail.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
