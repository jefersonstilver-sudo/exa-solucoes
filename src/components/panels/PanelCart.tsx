
import React from 'react';
import { ShoppingCart, Trash, Building, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/types/panel';

interface PanelCartProps {
  cartItems: {panel: Panel, duration: number}[];
  onRemove: (panelId: string) => void;
  onClear: () => void;
  onChangeDuration: (panelId: string, duration: number) => void;
}

const durationOptions = [30, 90, 180, 365];

const PanelCart: React.FC<PanelCartProps> = ({ cartItems, onRemove, onClear, onChangeDuration }) => {
  // Calculate price based on panel info and duration
  const calculatePrice = (panel: Panel, days: number) => {
    // In a real implementation, this would come from the backend
    const basePrice = 100; // Base daily rate
    const locationFactor = panel.buildings?.bairro === 'Vila Olímpia' ? 1.5 : 
                          panel.buildings?.bairro === 'Moema' ? 1.3 : 1;
    
    // Apply discount based on duration
    let discount = 0;
    if (days >= 365) discount = 0.25;
    else if (days >= 180) discount = 0.15;
    else if (days >= 90) discount = 0.10;
    
    const rawPrice = basePrice * locationFactor * days;
    return Math.round(rawPrice * (1 - discount));
  };
  
  // Calculate total price of all items
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + calculatePrice(item.panel, item.duration);
    }, 0);
  };
  
  // Calculate original price without discounts
  const calculateOriginalTotal = () => {
    return cartItems.reduce((total, item) => {
      const basePrice = 100; // Base daily rate
      const locationFactor = item.panel.buildings?.bairro === 'Vila Olímpia' ? 1.5 : 
                            item.panel.buildings?.bairro === 'Moema' ? 1.3 : 1;
      return total + (basePrice * locationFactor * item.duration);
    }, 0);
  };
  
  // Calculate discount amount
  const calculateDiscount = () => {
    const original = calculateOriginalTotal();
    const discounted = calculateTotal();
    return original - discounted;
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (cartItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Seu Carrinho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">Seu carrinho está vazio</h3>
            <p className="mb-4 text-sm text-muted-foreground px-6">
              Explore os painéis disponíveis e adicione-os ao carrinho para continuar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Seu Carrinho
          </span>
          <Badge variant="outline" className="ml-2">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {cartItems.map(({ panel, duration }) => (
          <div key={panel.id} className="animate-fade-in">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-start">
                <Building className="h-4 w-4 mt-1 mr-2 text-muted-foreground flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">{panel.buildings?.nome}</h4>
                  <p className="text-xs text-muted-foreground">{panel.buildings?.bairro}</p>
                </div>
              </div>
              <button 
                onClick={() => onRemove(panel.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <div className="flex items-center text-sm flex-1">
                <span className="mr-2">Duração:</span>
                <select 
                  className="border rounded px-1 py-0.5 text-xs"
                  value={duration}
                  onChange={(e) => onChangeDuration(panel.id, parseInt(e.target.value))}
                >
                  {durationOptions.map(days => (
                    <option key={days} value={days}>{days} dias</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span>Preço:</span>
              <span className="font-semibold">{formatCurrency(calculatePrice(panel, duration))}</span>
            </div>
            
            <Separator className="my-3" />
          </div>
        ))}
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(calculateOriginalTotal())}</span>
          </div>
          
          <div className="flex justify-between text-sm text-green-600">
            <span>Desconto:</span>
            <span>- {formatCurrency(calculateDiscount())}</span>
          </div>
          
          <Separator className="my-2" />
          
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col space-y-2">
        <Button className="w-full bg-indexa-purple hover:bg-indexa-purple-dark">
          Finalizar Compra
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={onClear}
        >
          <Trash className="mr-2 h-4 w-4" />
          Limpar Carrinho
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PanelCart;
