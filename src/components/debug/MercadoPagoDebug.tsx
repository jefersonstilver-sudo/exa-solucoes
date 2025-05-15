
import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TEST_CREDIT_CARDS } from '@/constants/mercadoPagoConstants';

export const MercadoPagoDebug = () => {
  const [preferenceInfo, setPreferenceInfo] = useState<any>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for saved preference ID
    const prefId = localStorage.getItem('last_mercadopago_preference');
    if (prefId) {
      setPreferenceInfo({
        id: prefId,
        created_at: new Date().toISOString(),
        init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${prefId}`
      });
    }
    
    // Check for pending order
    const orderId = localStorage.getItem('pending_order_id');
    if (orderId) {
      setPendingOrderId(orderId);
    }
  }, []);
  
  // Simulate payment callback
  const simulateCallback = (status: string) => {
    if (pendingOrderId) {
      // Simulate a redirect from Mercado Pago
      window.location.href = `/pedido-confirmado?id=${pendingOrderId}&status=${status}`;
    } else {
      alert('Nenhum pedido pendente encontrado');
    }
  };
  
  // Clear stored preference and order
  const clearStoredData = () => {
    localStorage.removeItem('last_mercadopago_preference');
    localStorage.removeItem('pending_order_id');
    setPreferenceInfo(null);
    setPendingOrderId(null);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Debug Mercado Pago</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preferences">
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
            <TabsTrigger value="callbacks">Callbacks</TabsTrigger>
            <TabsTrigger value="testcards">Cartões de Teste</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preferences" className="space-y-4">
            <div className="text-xs">
              {preferenceInfo ? (
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold">ID da Preferência:</span> {preferenceInfo.id}
                  </div>
                  <div>
                    <span className="font-semibold">Criado em:</span> {new Date(preferenceInfo.created_at).toLocaleString()}
                  </div>
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => window.open(preferenceInfo.init_point, '_blank')}
                    >
                      Abrir checkout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Nenhuma preferência encontrada</div>
              )}
              
              <div className="mt-4">
                {pendingOrderId && (
                  <div className="mb-2">
                    <span className="font-semibold">ID do Pedido pendente:</span> {pendingOrderId}
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                  onClick={clearStoredData}
                >
                  Limpar dados armazenados
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="callbacks" className="space-y-4">
            <div className="text-xs">
              <div className="font-semibold mb-2">Simular callbacks do Mercado Pago</div>
              {pendingOrderId ? (
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                    onClick={() => simulateCallback('approved')}
                  >
                    Simular pagamento aprovado
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700"
                    onClick={() => simulateCallback('pending')}
                  >
                    Simular pagamento pendente
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                    onClick={() => simulateCallback('rejected')}
                  >
                    Simular pagamento rejeitado
                  </Button>
                </div>
              ) : (
                <div className="text-gray-500">
                  Nenhum pedido pendente encontrado para simular callbacks
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="testcards">
            <ScrollArea className="h-40">
              <div className="space-y-3 text-xs">
                {TEST_CREDIT_CARDS.map((card, index) => (
                  <div key={index} className="border rounded p-2">
                    <div className="font-semibold">{card.name}</div>
                    <div className="font-mono bg-gray-50 p-1 rounded mt-1">{card.number}</div>
                    <div className="mt-1">
                      CVV: {card.cvv} | Validade: {card.expiration}
                    </div>
                    <div className="mt-1">
                      <span 
                        className={`text-xs px-1 rounded ${
                          card.status === 'approved' ? 'bg-green-100 text-green-800' :
                          card.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        Status: {card.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MercadoPagoDebug;
