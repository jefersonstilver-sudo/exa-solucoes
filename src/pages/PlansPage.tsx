
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlans } from '@/hooks/usePlans';
import { useCartManager } from '@/hooks/useCartManager';
import PlanSelector from '@/components/checkout/PlanSelector';
import PlanComparison from '@/components/plans/PlanComparison';
import PlanSummary from '@/components/plans/PlanSummary';
import { Calculator, Eye, Trophy } from 'lucide-react';

const PlansPage = () => {
  const navigate = useNavigate();
  const { selectedPlan, setSelectedPlan, plans, calculatePlanPrice } = usePlans();
  const { cartItems } = useCartManager();
  const [selectedTab, setSelectedTab] = useState('selector');
  
  const panelCount = cartItems.length || 1;
  const totalPrice = calculatePlanPrice(selectedPlan, panelCount);
  const selectedPlanData = plans[selectedPlan];

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      navigate('/paineis-digitais/loja');
      return;
    }
    navigate('/selecionar-plano');
  };

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-7xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-[#3C1361] mb-4"
          >
            Escolha seu Plano
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Selecione o período ideal para sua campanha e maximize o alcance da sua marca
          </motion.p>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="selector" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Comparar Planos
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculadora
            </TabsTrigger>
          </TabsList>

          {/* Plan Selector */}
          <TabsContent value="selector">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Selecione seu Plano</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PlanSelector
                      selectedPlan={selectedPlan}
                      onSelectPlan={setSelectedPlan}
                      plans={plans}
                      panelCount={panelCount}
                    />
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <PlanSummary
                  plan={selectedPlanData}
                  planKey={selectedPlan}
                  panelCount={panelCount}
                  totalPrice={totalPrice}
                />
                
                <Button
                  onClick={handleProceedToCheckout}
                  className="w-full mt-4 bg-[#3C1361] hover:bg-[#3C1361]/90"
                  size="lg"
                >
                  {cartItems.length === 0 ? 'Escolher Painéis' : 'Continuar para Checkout'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Plan Comparison */}
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Compare todos os planos</CardTitle>
              </CardHeader>
              <CardContent>
                <PlanComparison
                  plans={plans}
                  selectedPlan={selectedPlan}
                  onSelectPlan={setSelectedPlan}
                  panelCount={panelCount}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Price Calculator */}
          <TabsContent value="calculator">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Calculadora de Preços</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Número de painéis: {panelCount}
                    </label>
                    <p className="text-sm text-gray-600">
                      {cartItems.length === 0 
                        ? 'Adicione painéis ao seu carrinho para ver o cálculo exato'
                        : `Você tem ${cartItems.length} ${cartItems.length === 1 ? 'painel selecionado' : 'painéis selecionados'}`
                      }
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(plans).map(([key, plan]) => {
                      const planKey = parseInt(key) as keyof typeof plans;
                      const price = calculatePlanPrice(planKey, panelCount);
                      const monthlyPrice = price / plan.months;
                      
                      return (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{plan.name}</h4>
                              <p className="text-sm text-gray-600">{plan.months} {plan.months === 1 ? 'mês' : 'meses'}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-[#3C1361]">
                                R$ {price.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-600">
                                R$ {monthlyPrice.toFixed(2)}/mês
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <div>
                <PlanSummary
                  plan={selectedPlanData}
                  planKey={selectedPlan}
                  panelCount={panelCount}
                  totalPrice={totalPrice}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </Layout>
  );
};

export default PlansPage;
