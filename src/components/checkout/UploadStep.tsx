
import React from 'react';
import { motion } from 'framer-motion';
import { Upload, FileUp } from 'lucide-react';
import { Panel } from '@/types/panel';
import { PlanKey } from '@/types/checkout';
import { Card } from '@/components/ui/card';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface UploadStepProps {
  cartItems: CartItem[];
  selectedPlan: PlanKey;
}

const UploadStep: React.FC<UploadStepProps> = ({ cartItems, selectedPlan }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold flex items-center">
          <Upload className="mr-2 h-5 w-5 text-indexa-purple" />
          Envie seu vídeo
        </h2>
        <p className="text-sm text-muted-foreground">
          Faça upload do vídeo que será exibido nos painéis selecionados
        </p>
      </div>

      <Card className="p-6 border-2 border-indexa-purple/20">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-100 p-8 rounded-lg"
          >
            <div className="flex justify-center mb-4">
              <div className="bg-indexa-purple/10 p-4 rounded-full">
                <FileUp className="h-10 w-10 text-indexa-purple" />
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-2">
              Você está quase lá!
            </h3>
            
            <p className="text-muted-foreground mb-4">
              Após o pagamento, você poderá enviar seu vídeo para veiculação.
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-700 text-sm">
                Formatos aceitos: MP4, MOV, AVI<br />
                Duração máxima: {selectedPlan >= 12 ? '30 segundos' : '20 segundos'}<br />
                Resolução recomendada: 1080p ou 4K
              </p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-sm text-muted-foreground">
              Finalize seu pagamento para continuar e fazer o upload do seu vídeo.
            </p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

export default UploadStep;
