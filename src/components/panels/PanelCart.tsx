
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash, Building, Calendar, X, Check, ArrowRight, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Panel } from '@/types/panel';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ClientOnly } from '@/components/ui/client-only';
import { useUserSession } from '@/hooks/useUserSession';

interface PanelCartProps {
  cartItems: {panel: Panel, duration: number}[];
  onRemove: (panelId: string) => void;
  onClear: () => void;
  onChangeDuration: (panelId: string, duration: number) => void;
}

const durationOptions = [30, 60, 90, 180, 365];

const PanelCart: React.FC<PanelCartProps> = ({ cartItems, onRemove, onClear, onChangeDuration }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading, isLoggedIn } = useUserSession();
  
  // Calculate price based on panel info and duration
  const calculatePrice = (panel: Panel, days: number) => {
    // Base monthly price
    let pricePerMonth = 250; // Default price for 1 month
    
    // Calculate price based on total months
    const months = Math.round(days / 30);
    
    // Apply discount based on months
    if (months >= 12) {
      pricePerMonth = 180;
    } else if (months >= 6) {
      pricePerMonth = 200;
    } else if (months >= 3) {
      pricePerMonth = 220;
    }
    
    // Calculate total price for the entire duration
    return pricePerMonth * months;
  };
  
  const handleCheckout = () => {
    setIsSubmitting(true);
    setAnimateCart(true);
    
    try {
      if (!isLoggedIn) {
        // User is not logged in, redirect to login with checkout as return path
        toast({
          title: "Login necessário",
          description: "Faça login para continuar com a compra",
        });
        
        // Salve a URL de retorno para voltar após o login
        const returnUrl = '/checkout';
        
        // Redirecione para a página de login com o parâmetro de redirecionamento
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
      // Importante: Não limpe o carrinho em caso de erro ou redirecionamento
      setIsSubmitting(false);
    }
  };
  
  // Calculate total price for all items in cart
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + calculatePrice(item.panel, item.duration);
    }, 0);
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" /> Carrinho
            <Badge variant="outline" className="ml-2">
              {cartItems.length} {cartItems.length === 1 ? 'painel' : 'painéis'}
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={cartItems.length === 0 || isSubmitting}
            onClick={onClear}
            className="h-8 text-gray-500 hover:text-red-600"
            title="Limpar carrinho"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-auto">
        {cartItems.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div 
                  key={item.panel.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`${animateCart ? 'animate-cart-slide' : ''}`}
                >
                  <Card className="border shadow-sm bg-white">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-md bg-gray-100">
                          {item.panel.buildings?.imageUrl ? (
                            <img 
                              src={item.panel.buildings.imageUrl} 
                              alt={item.panel.buildings?.nome || 'Building image'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <Building className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <div className="flex justify-between">
                            <h4 className="font-semibold text-sm">
                              {item.panel.buildings?.nome || 'Painel Digital'}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-red-600 -mt-1 -mr-1"
                              onClick={() => onRemove(item.panel.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <p className="text-xs text-gray-500">
                            {item.panel.buildings?.endereco || 'Endereço não disponível'}
                          </p>
                          
                          {/* Panel specs */}
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                              {item.panel.modo || 'indoor'}
                            </Badge>
                            <Badge variant="outline" className="text-xs px-1 py-0 h-5">
                              {item.panel.resolucao || 'HD'}
                            </Badge>
                          </div>
                          
                          {/* Duration selector */}
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" /> Duração:
                            </span>
                            <select
                              value={item.duration}
                              onChange={(e) => onChangeDuration(item.panel.id, parseInt(e.target.value))}
                              className="text-xs border rounded px-1 py-0.5 bg-white"
                            >
                              {durationOptions.map((days) => (
                                <option key={days} value={days}>
                                  {Math.floor(days / 30)} {Math.floor(days / 30) === 1 ? 'mês' : 'meses'}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      {/* Price info */}
                      <div className="mt-2 text-right">
                        <p className="text-sm font-semibold text-indexa-purple">
                          R$ {calculatePrice(item.panel, item.duration).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {Math.floor(item.duration / 30)} {Math.floor(item.duration / 30) === 1 ? 'mês' : 'meses'} de exibição
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* User information if logged in */}
            <ClientOnly>
              <div className="mt-4 pt-3 border-t">
                {isLoggedIn && user ? (
                  <div className="flex items-center gap-2 bg-green-50 p-2 rounded-md">
                    <div className="bg-green-100 rounded-full p-1">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">
                        Olá, {user.name || user.email?.split('@')[0]}!
                      </p>
                      <p className="text-xs text-gray-500">
                        Finalizar como {user.email}
                      </p>
                    </div>
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-md">
                    <div className="bg-amber-100 rounded-full p-1">
                      <LogIn className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-800">
                        Faça login para finalizar
                      </p>
                      <p className="text-xs text-gray-500">
                        Você será redirecionado após clicar em finalizar compra
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ClientOnly>
            
            {/* Total and checkout */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-base font-semibold">
                  R$ {calculateTotal().toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              
              <Button
                className="w-full mt-2 bg-indexa-purple hover:bg-indexa-purple-dark"
                disabled={isSubmitting}
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
                  <span className="flex items-center">
                    Finalizar Compra <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
              <ShoppingCart className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700">Carrinho vazio</h3>
            <p className="text-sm text-gray-500 text-center mt-2 mb-4">
              Adicione painéis ao seu carrinho para iniciar sua campanha
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/paineis-digitais/loja')}
              className="mt-2"
            >
              Explorar Painéis
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-0 px-6 pb-4">
        <p className="text-xs text-center text-muted-foreground w-full">
          Preços mostrados incluem impostos e taxas de processamento.
        </p>
      </CardFooter>
    </div>
  );
};

export default PanelCart;
