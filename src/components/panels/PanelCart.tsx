
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash, Building, Calendar, X, Check, ArrowRight, User } from 'lucide-react';
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
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Calculate price based on panel info and duration
  const calculatePrice = (panel: Panel, days: number) => {
    const basePrice = 100; // Base daily rate
    const locationFactor = panel.buildings?.bairro === 'Vila A' ? 1.5 : 
                          panel.buildings?.bairro === 'Centro' ? 1.3 : 1;
    
    // Apply discount based on duration
    let discount = 0;
    if (days >= 365) discount = 0.25;
    else if (days >= 180) discount = 0.15;
    else if (days >= 90) discount = 0.10;
    else if (days >= 60) discount = 0.05;
    
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
      const locationFactor = item.panel.buildings?.bairro === 'Vila A' ? 1.5 : 
                            item.panel.buildings?.bairro === 'Centro' ? 1.3 : 1;
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

  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        setUser(data.session.user);
        
        // Fetch user profile information if available
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (profileData) {
            setUserProfile(profileData);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };
    
    checkUser();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setUser(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setUserProfile(null);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Trigger cart bubble animation when items are added
  useEffect(() => {
    if (cartItems.length > 0) {
      setAnimateCart(true);
      setTimeout(() => setAnimateCart(false), 600);
    }
  }, [cartItems.length]);

  // Handle checkout with authentication check and navigation
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione itens ao carrinho para continuar.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check if user is authenticated
      const { data } = await supabase.auth.getSession();
      
      if (!data.session?.user) {
        // Redirect to login with return path
        toast({
          title: "Login necessário",
          description: "Faça login para continuar com a compra.",
        });
        navigate('/login?redirect=/checkout');
        return;
      }
      
      // User is authenticated, redirect to checkout
      navigate('/checkout');
    } catch (error) {
      console.error("Error during checkout:", error);
      toast({
        title: "Erro ao processar",
        description: "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CartContent = () => {
    if (cartItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <motion.div 
            className="mb-4 rounded-full bg-muted p-3"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
          </motion.div>
          <h3 className="mb-1 text-lg font-semibold">Seu carrinho está vazio</h3>
          <p className="mb-4 text-sm text-muted-foreground px-6">
            Explore os painéis disponíveis e adicione-os ao carrinho para continuar.
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/paineis-digitais/loja')}
            className="bg-indexa-purple/5 border-indexa-purple/20 text-indexa-purple hover:bg-indexa-purple/10"
          >
            Explorar painéis
          </Button>
        </div>
      );
    }

    return (
      <>
        {/* User info if logged in */}
        {user && (
          <div className="bg-indexa-purple/5 rounded-lg p-3 mb-4 flex items-center">
            <div className="rounded-full bg-indexa-purple h-8 w-8 flex items-center justify-center text-white mr-3">
              {user.user_metadata?.name ? user.user_metadata.name.charAt(0).toUpperCase() : 
               user.email ? user.email.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-medium">
                {user.user_metadata?.name || user.email}
              </p>
              <p className="text-xs text-gray-500">
                {userProfile?.documento || user.email}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          <AnimatePresence>
            {cartItems.map(({ panel, duration }) => (
              <motion.div 
                key={panel.id} 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start">
                    <Building className="h-4 w-4 mt-1 mr-2 text-indexa-purple flex-shrink-0" />
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
                
                <div className="flex items-center mb-2 ml-6">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <div className="flex items-center text-sm flex-1">
                    <span className="mr-2">Duração:</span>
                    <select 
                      className="border rounded px-2 py-1 text-xs border-indexa-purple focus:outline-indexa-mint"
                      value={duration}
                      onChange={(e) => onChangeDuration(panel.id, parseInt(e.target.value))}
                    >
                      {durationOptions.map(days => (
                        <option key={days} value={days}>{days} dias</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm ml-6">
                  <span>Preço:</span>
                  <span className="font-semibold">{formatCurrency(calculatePrice(panel, duration))}</span>
                </div>
                
                <Separator className="my-3" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="space-y-1.5 bg-gray-50 p-3 rounded-md">
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
      </>
    );
  };

  // Mobile view - Drawer
  const MobileCart = () => {
    return (
      <div className="lg:hidden fixed bottom-4 right-4 z-30">
        <Drawer>
          <DrawerTrigger asChild>
            <motion.button
              className="rounded-full h-14 w-14 shadow-lg bg-indexa-purple text-white hover:bg-indexa-mint hover:text-gray-800 transition-all duration-200 relative flex items-center justify-center"
              animate={animateCart ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItems.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-indexa-mint text-gray-800 border-2 border-white">
                  {cartItems.length}
                </Badge>
              )}
            </motion.button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <CardHeader className="px-0 pt-0 pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ShoppingCart className="mr-2 h-5 w-5 text-indexa-purple" />
                    Seu Carrinho
                  </span>
                  {cartItems.length > 0 && (
                    <Badge variant="outline" className="ml-2 border-indexa-purple text-indexa-purple">
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <CartContent />
              </CardContent>
              {cartItems.length > 0 && (
                <CardFooter className="flex-col space-y-2 px-0">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full"
                  >
                    <Button 
                      className="w-full bg-indexa-mint hover:bg-indexa-mint-dark text-gray-800 transition-all duration-200"
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Processando...
                        </>
                      ) : (
                        <>
                          Finalizar Compra <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                  <Button 
                    variant="outline" 
                    className="w-full hover:border-red-500 hover:text-red-500 transition-all" 
                    onClick={onClear}
                    disabled={isSubmitting}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Limpar Carrinho
                  </Button>
                </CardFooter>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  };

  // Desktop view - Sidebar
  return (
    <>
      {/* Mobile Cart */}
      <MobileCart />
      
      {/* Desktop Cart */}
      <Card className="sticky top-4 hidden lg:block hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5 text-indexa-purple" />
              Seu Carrinho
            </span>
            {cartItems.length > 0 && (
              <Badge variant="outline" className={`ml-2 border-indexa-purple text-indexa-purple ${animateCart ? 'animate-cart-bubble' : ''}`}>
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'itens'}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <CartContent />
        </CardContent>
        {cartItems.length > 0 && (
          <CardFooter className="flex-col space-y-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full"
            >
              <Button 
                className="w-full bg-indexa-mint hover:bg-indexa-mint-dark text-gray-800 transition-all duration-200"
                onClick={handleCheckout}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Processando...
                  </>
                ) : (
                  <>
                    Finalizar Compra <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
            <Button 
              variant="outline" 
              className="w-full hover:border-red-500 hover:text-red-500 transition-all" 
              onClick={onClear}
              disabled={isSubmitting}
            >
              <Trash className="mr-2 h-4 w-4" />
              Limpar Carrinho
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  );
};

export default PanelCart;
