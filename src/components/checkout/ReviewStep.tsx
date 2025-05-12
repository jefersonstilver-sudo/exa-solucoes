
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Building, MapPin, Calendar, Layers, Users } from 'lucide-react';
import { Panel } from '@/types/panel';

interface ReviewStepProps {
  cartItems: { panel: Panel, duration: number }[];
  unavailablePanels: string[];
}

const ReviewStep: React.FC<ReviewStepProps> = ({ cartItems, unavailablePanels }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h2 className="text-xl font-semibold flex items-center">
          <Layers className="mr-2 h-5 w-5 text-indexa-purple" />
          Revise seus painéis
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Confira os painéis selecionados para sua campanha antes de continuar.
        </p>
      </motion.div>
      
      <div className="space-y-4">
        {cartItems.map((item, index) => (
          <motion.div 
            key={item.panel.id}
            variants={itemVariants}
            className="overflow-hidden"
          >
            <Card className={unavailablePanels.includes(item.panel.id) 
              ? "border-red-400 bg-red-50" 
              : "border-gray-200 hover:border-indexa-purple/30 transition-colors"
            }>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Panel image preview (placeholder) */}
                  <div className="w-full sm:w-1/3 h-32 bg-gray-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indexa-purple/20 to-indexa-mint/20"></div>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      ID: {item.panel.code}
                    </div>
                  </div>
                  
                  {/* Panel details */}
                  <div className="p-4 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium flex items-center">
                          <Building className="h-4 w-4 mr-1 text-indexa-purple" />
                          {item.panel.buildings?.nome}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {item.panel.buildings?.endereco}
                        </p>
                        <p className="text-sm mt-1">{item.panel.buildings?.bairro}</p>
                        
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="bg-indexa-purple/10 text-indexa-purple px-2 py-0.5 rounded-full flex items-center">
                            <Calendar className="h-3 w-3 mr-1" /> {item.duration} dias
                          </span>
                          <span className="bg-indexa-purple/10 text-indexa-purple px-2 py-0.5 rounded-full flex items-center">
                            <Users className="h-3 w-3 mr-1" /> ~5.000 visualizações/dia
                          </span>
                        </div>
                      </div>
                      
                      {unavailablePanels.includes(item.panel.id) && (
                        <div className="flex items-center text-red-500 text-sm bg-red-100/80 px-2 py-1 rounded">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Indisponível para o período
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {unavailablePanels.length > 0 && (
        <motion.div 
          className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
          variants={itemVariants}
        >
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Atenção: Alguns painéis estão indisponíveis</p>
              <p className="mt-1">Para continuar, remova os painéis indisponíveis do seu carrinho ou escolha um período diferente.</p>
            </div>
          </div>
        </motion.div>
      )}
      
      <motion.div 
        className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800"
        variants={itemVariants}
      >
        <p className="font-medium">Dica:</p>
        <p className="mt-1">Para maximizar o impacto da sua campanha, recomendamos a contratação de no mínimo 3 painéis na mesma região.</p>
      </motion.div>
    </motion.div>
  );
};

export default ReviewStep;
