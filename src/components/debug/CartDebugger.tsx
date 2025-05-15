
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import MercadoPagoDebug from "./MercadoPagoDebug";

interface CartDebuggerProps {
  open: boolean;
  onClose: () => void;
}

const CartDebugger = ({ open, onClose }: CartDebuggerProps) => {
  const [cartData, setCartData] = useState<any>(null);
  const [logData, setLogData] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      loadDebugData();
    }
  }, [open]);

  const loadDebugData = () => {
    // Load cart data
    try {
      const cartJson = localStorage.getItem('indexa_cart');
      if (cartJson) {
        setCartData(JSON.parse(cartJson));
      } else {
        setCartData({ message: "No cart data found" });
      }
    } catch (e) {
      console.error("Error loading cart data:", e);
      setCartData({ error: "Failed to parse cart data" });
    }

    // Load checkout logs
    try {
      const logsJson = localStorage.getItem('checkout_logs');
      if (logsJson) {
        const logs = JSON.parse(logsJson);
        setLogData(Array.isArray(logs) ? logs : []);
      } else {
        setLogData([]);
      }
    } catch (e) {
      console.error("Error loading log data:", e);
      setLogData([]);
    }
  };

  const clearCart = () => {
    try {
      localStorage.removeItem('indexa_cart');
      localStorage.removeItem('selectedPlan');
      setCartData(null);
      loadDebugData();
    } catch (e) {
      console.error("Error clearing cart:", e);
    }
  };

  const clearLogs = () => {
    try {
      localStorage.removeItem('checkout_logs');
      setLogData([]);
    } catch (e) {
      console.error("Error clearing logs:", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Diagnóstico do Carrinho e Checkout</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="cart" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="cart">Carrinho</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="mercadopago">Mercado Pago</TabsTrigger>
          </TabsList>

          <TabsContent value="cart" className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={loadDebugData} 
                variant="outline" 
                size="sm"
                className="mr-2"
              >
                Recarregar
              </Button>
              <Button 
                onClick={clearCart} 
                variant="destructive" 
                size="sm"
              >
                Limpar Carrinho
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md overflow-x-auto">
              <pre className="text-xs">{JSON.stringify(cartData, null, 2)}</pre>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={loadDebugData} 
                variant="outline" 
                size="sm"
                className="mr-2"
              >
                Recarregar
              </Button>
              <Button 
                onClick={clearLogs} 
                variant="destructive" 
                size="sm"
              >
                Limpar Logs
              </Button>
            </div>

            <div className="bg-gray-50 p-4 rounded-md overflow-x-auto max-h-80">
              {logData.length > 0 ? (
                <div className="space-y-2">
                  {logData.slice().reverse().map((log, idx) => (
                    <div key={idx} className={`p-2 rounded text-xs ${
                      log.level === 'error' ? 'bg-red-100' : 
                      log.level === 'warning' ? 'bg-yellow-100' : 
                      log.level === 'success' ? 'bg-green-100' : 
                      'bg-blue-100'
                    }`}>
                      <div className="flex justify-between">
                        <span className="font-semibold">{log.event}</span>
                        <span className="text-gray-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div>{log.message}</div>
                      {log.details && (
                        <pre className="mt-1 bg-white p-1 rounded">{JSON.stringify(log.details, null, 2)}</pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">Nenhum log encontrado</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mercadopago">
            <MercadoPagoDebug />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CartDebugger;
