
import React, { useEffect, useState } from 'react';
import { loadCartFromStorage, CART_STORAGE_KEY } from '@/services/cartStorageService';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface CartDebuggerProps {
  onClose: () => void;
}

const CartDebugger: React.FC<CartDebuggerProps> = ({ onClose }) => {
  const [cartData, setCartData] = useState<any>(null);
  const [rawCartData, setRawCartData] = useState<string | null>(null);
  
  // Carregar dados
  useEffect(() => {
    try {
      // Carregar dados brutos
      const rawData = localStorage.getItem(CART_STORAGE_KEY);
      setRawCartData(rawData);
      
      // Carregar dados processados
      const processedCart = loadCartFromStorage();
      setCartData(processedCart);
      
      console.log("CartDebugger: Dados carregados", {
        raw: rawData,
        processed: processedCart
      });
    } catch (e) {
      console.error("Erro ao carregar dados para depuração:", e);
    }
  }, []);
  
  const handleForceReload = () => {
    try {
      // Recarregar dados
      const rawData = localStorage.getItem(CART_STORAGE_KEY);
      setRawCartData(rawData);
      
      const processedCart = loadCartFromStorage();
      setCartData(processedCart);
      
      console.log("CartDebugger: Dados recarregados", {
        raw: rawData,
        processed: processedCart
      });
    } catch (e) {
      console.error("Erro ao recarregar dados:", e);
    }
  };
  
  return (
    <div className="p-5 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Depuração do Carrinho</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </div>
      
      <div className="mb-4">
        <Badge variant={cartData && cartData.length > 0 ? "success" : "destructive"}>
          {cartData && cartData.length > 0 ? 
            `Carrinho com ${cartData.length} item(s)` : 
            "Carrinho vazio"
          }
        </Badge>
        <Badge variant="outline" className="ml-2">
          Chave: {CART_STORAGE_KEY}
        </Badge>
      </div>
      
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium mb-1">Dados brutos (localStorage)</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
            {rawCartData || "null"}
          </pre>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium mb-1">Dados processados ({cartData ? cartData.length : 0} itens)</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
            {cartData ? JSON.stringify(cartData, null, 2) : "null"}
          </pre>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex flex-col space-y-2">
        <Button size="sm" onClick={handleForceReload}>
          Recarregar dados
        </Button>
      </div>
    </div>
  );
};

export default CartDebugger;
