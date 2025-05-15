
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogHeader,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { X, Check, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartDebuggerProps {
  open: boolean;
  onClose: () => void;
}

const CartDebugger = ({ open, onClose }: CartDebuggerProps) => {
  const { toast } = useToast();
  const [cartContent, setCartContent] = useState<string>('');
  
  const loadCartData = () => {
    try {
      const localStorageCart = localStorage.getItem('indexa_cart');
      setCartContent(localStorageCart || 'Cart is empty');
    } catch (e) {
      setCartContent('Error loading cart: ' + String(e));
    }
  };
  
  React.useEffect(() => {
    if (open) {
      loadCartData();
    }
  }, [open]);
  
  const clearCart = () => {
    try {
      localStorage.removeItem('indexa_cart');
      setCartContent('Cart cleared');
      toast({
        title: "Carrinho limpo",
        description: "O carrinho foi limpo com sucesso",
        variant: "default",
      });
      loadCartData();
    } catch (e) {
      toast({
        title: "Erro ao limpar carrinho",
        description: String(e),
        variant: "destructive", 
      });
    }
  };
  
  const fixCart = () => {
    try {
      const emptyCart = JSON.stringify([]);
      localStorage.setItem('indexa_cart', emptyCart);
      setCartContent(emptyCart);
      toast({
        title: "Carrinho resetado",
        description: "O carrinho foi resetado para um array vazio",
        variant: "default", // Alterado de "success" para "default"
      });
      loadCartData();
    } catch (e) {
      toast({
        title: "Erro ao resetar carrinho",
        description: String(e),
        variant: "destructive",
      });
    }
  };
  
  const refreshCart = () => {
    loadCartData();
    toast({
      title: "Carrinho atualizado",
      description: "Os dados do carrinho foram atualizados",
      variant: "default",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Depurador de Carrinho
            <Badge variant="outline" className="ml-2">
              Debug
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Modo de depuração</AlertTitle>
            <AlertDescription>
              Esta ferramenta é destinada apenas para depuração. Manipular diretamente o localStorage 
              pode causar comportamentos inesperados.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Conteúdo do carrinho (localStorage):</h3>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-64">
              <pre className="text-xs whitespace-pre-wrap break-words">{cartContent}</pre>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={refreshCart}>
              <Check className="mr-1 h-4 w-4" /> Atualizar
            </Button>
            <Button size="sm" variant="outline" onClick={fixCart}>
              <Check className="mr-1 h-4 w-4" /> Resetar
            </Button>
            <Button size="sm" variant="destructive" onClick={clearCart}>
              <Trash2 className="mr-1 h-4 w-4" /> Limpar
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-1 h-4 w-4" /> Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CartDebugger;
