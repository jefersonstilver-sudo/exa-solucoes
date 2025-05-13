
import React, { useState } from 'react';
import { ShoppingCart, Trash, X, Check, ArrowRight, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/types/panel';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ClientOnly } from '@/components/ui/client-only';
import { useUserSession } from '@/hooks/useUserSession';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatters';

interface PanelCartProps {
  cartItems: {panel: Panel, duration: number}[];
  onRemove: (panelId: string) => void;
  onClear: () => void;
  onChangeDuration: (panelId: string, duration: number) => void;
}

const durationOptions = [30, 60, 90, 180, 365];

const PanelCart: React.FC<PanelCartProps> = ({ cartItems, onRemove, onClear, onChangeDuration }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useUserSession();
  
  // Calculate price for a single panel based on duration
  const calculatePrice = (panel: Panel, days: number) => {
    // Base monthly price
    let pricePerMonth = 280; // Default price for 1 month
    
    // Add slight variation based on panel ID
    const priceVariation = parseInt(panel.id.slice(-2), 16) % 40; // 0-39 variation
    pricePerMonth += priceVariation;
    
    // Apply discount based on months
    const months = Math.round(days / 30);
    
    if (months >= 12) {
      return pricePerMonth * months * 0.85; // 15% discount
    } else if (months >= 6) {
      return pricePerMonth * months * 0.9; // 10% discount
    } else if (months >= 3) {
      return pricePerMonth * months * 0.95; // 5% discount
    }
    
    return pricePerMonth * months;
  };
  
  // Calculate total price for all items in cart
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + calculatePrice(item.panel, item.duration);
    }, 0);
  };

  // Calculate potential discount amount
  const calculateDiscount = () => {
    if (cartItems.length >= 3) {
      return calculateTotal() * 0.05; // 5% discount for 3+ items
    }
    return 0;
  };

  // Calculate final price after discounts
  const calculateFinalPrice = () => {
    return calculateTotal() - calculateDiscount();
  };
  
  const handleCheckout = () => {
    setIsSubmitting(true);
    
    try {
      if (!isLoggedIn) {
        toast({
          title: "Login necessário",
          description: "Faça login para continuar com a compra",
        });
        
        // Save the return URL to get back after login
        const returnUrl = '/checkout';
        navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      } else {
        // User is already logged in, proceed to checkout
        navigate('/checkout');
      }
    } catch (error) {
      console.error("Erro ao processar checkout:", error);
      toast({
        title: "Erro ao processar",
        description: "Ocorreu um erro ao finalizar a compra. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getFirstName = () => {
    if (!user || !user.name) return '';
    return user.name.split(' ')[0];
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="h-5 w-5 text-[#3C1361] mr-2" />
            <h2 className="text-lg font-semibold text-[#3C1361]">Carrinho</h2>
            {cartItems.length > 0 && (
              <Badge variant="outline" className="ml-2 bg-[#3C1361]/10 text-[#3C1361] border-none">
                {cartItems.length} {cartItems.length === 1 ? 'painel' : 'painéis'}
              </Badge>
            )}
          </div>
          {cartItems.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClear}
              className="h-8 text-gray-500 hover:text-red-600"
              title="Limpar carrinho"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-grow overflow-auto px-4 sm:px-6 pb-4 pt-2">
        <AnimatePresence>
          {cartItems.length > 0 ? (
            <>
              {/* User information if logged in */}
              <ClientOnly>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5"
                >
                  {isLoggedIn && user ? (
                    <div className="bg-green-50 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 rounded-full p-2">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            Olá, {getFirstName()}! 🎉
                          </p>
                          <p className="text-xs text-gray-500">
                            Finalizar como: {user.email}
                          </p>
                        </div>
                        <Check className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 p-4 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 rounded-full p-2">
                          <LogIn className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            Faça login para continuar sua compra
                          </p>
                          <p className="text-xs text-gray-500">
                            Entre para finalizar a compra
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8"
                          onClick={() => navigate('/login')}
                        >
                          Entrar ou Cadastrar
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </ClientOnly>
              
              {/* Cart items */}
              <div className="space-y-4 mt-2">
                {cartItems.map((item) => (
                  <motion.div 
                    key={item.panel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    <Card className="border shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="w-24 h-24 bg-gray-100 relative">
                            <img 
                              src={item.panel.buildings?.imageUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab'} 
                              alt={item.panel.buildings?.nome || 'Building image'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3 flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-sm text-[#3C1361] line-clamp-1">
                                  {item.panel.buildings?.nome || 'Painel Digital'}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 mb-1.5 line-clamp-1">
                                  {item.panel.buildings?.endereco || 'Endereço não disponível'}
                                </p>
                                
                                <Select
                                  value={item.duration.toString()}
                                  onValueChange={(value) => onChangeDuration(item.panel.id, parseInt(value))}
                                >
                                  <SelectTrigger className="h-7 w-[90px] text-xs">
                                    <SelectValue placeholder="30 dias" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {durationOptions.map((days) => (
                                      <SelectItem key={days} value={days.toString()}>
                                        {days === 30 ? '1 mês' : `${Math.floor(days/30)} meses`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex flex-col items-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-gray-400 hover:text-red-600"
                                  onClick={() => onRemove(item.panel.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <p className="text-sm font-medium text-[#3C1361] mt-auto">
                                  {formatCurrency(calculatePrice(item.panel, item.duration))}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[400px] text-center px-6"
            >
              <div className="bg-gray-100 rounded-full p-6 mb-4">
                <ShoppingCart className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-[#3C1361] mb-2">Seu carrinho está vazio</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">
                Adicione painéis ao seu carrinho para iniciar sua campanha de mídia digital
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/paineis-digitais/loja')}
                className="border-[#3C1361] text-[#3C1361] hover:bg-[#3C1361] hover:text-white"
              >
                Explorar Painéis
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {cartItems.length > 0 && (
        <div className="border-t p-4 sm:p-6 bg-gray-50">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm font-medium">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
            
            {calculateDiscount() > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="text-sm">Desconto</span>
                <span className="text-sm font-medium">
                  - {formatCurrency(calculateDiscount())}
                </span>
              </div>
            )}
            
            <Separator className="my-2" />
            
            <div className="flex justify-between">
              <span className="font-medium">Total</span>
              <span className="text-lg font-bold text-[#3C1361]">
                {formatCurrency(calculateFinalPrice())}
              </span>
            </div>
          </div>
          
          <Button
            className="w-full bg-[#3C1361] hover:bg-[#3C1361]/90 text-white rounded-lg py-6 transition-transform hover:scale-[1.02]"
            disabled={isSubmitting || cartItems.length === 0}
            onClick={handleCheckout}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </span>
            ) : (
              <span className="flex items-center font-medium">
                Finalizar Compra <ArrowRight className="ml-2 h-5 w-5" />
              </span>
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground mt-3">
            Preços mostrados incluem impostos e taxas de processamento.
          </p>
        </div>
      )}
    </div>
  );
};

export default PanelCart;
