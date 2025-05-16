
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileUp, ArrowUp } from 'lucide-react';
import { Panel } from '@/types/panel';
import { PlanKey } from '@/types/checkout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

interface CartItem {
  panel: Panel;
  duration: number;
}

interface UploadStepProps {
  cartItems: CartItem[];
  selectedPlan: PlanKey;
}

const UploadStep: React.FC<UploadStepProps> = ({ cartItems, selectedPlan }) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileSelect = (file: File) => {
    // Check file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/avi'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Por favor, envie um arquivo MP4, MOV ou AVI."
      });
      return;
    }
    
    // Check file size (max 1GB)
    if (file.size > 1024 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 1GB."
      });
      return;
    }
    
    setUploadedFile(file);
    simulateUpload(file);
  };
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };
  
  const simulateUpload = (file: File) => {
    setIsUploading(true);
    
    // Simulate upload progress
    sonnerToast.loading(`Enviando ${file.name}...`, {
      duration: 3000,
    });
    
    // Simulate successful upload after 3 seconds
    setTimeout(() => {
      setIsUploading(false);
      sonnerToast.success("Upload concluído com sucesso!");
      
      // Save to localStorage to remember the upload was completed
      localStorage.setItem('video_uploaded', 'true');
      localStorage.setItem('video_filename', file.name);
      
      // If this were a real implementation, we would actually upload the file to a storage service here
    }, 3000);
  };
  
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

      <Card className={`p-6 border-2 ${isDragging ? 'border-indexa-purple border-dashed bg-indexa-purple/5' : 'border-indexa-purple/20'}`}>
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {!uploadedFile ? (
              <div 
                className="bg-gray-100 p-8 rounded-lg cursor-pointer"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  type="file"
                  id="file-input"
                  className="hidden"
                  accept="video/mp4,video/quicktime,video/avi"
                  onChange={handleFileInputChange}
                  disabled={isUploading}
                />
                <div className="flex justify-center mb-4">
                  <div className="bg-indexa-purple/10 p-4 rounded-full">
                    {isUploading ? (
                      <div className="animate-spin">
                        <RefreshCw className="h-10 w-10 text-indexa-purple" />
                      </div>
                    ) : (
                      <FileUp className="h-10 w-10 text-indexa-purple" />
                    )}
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-2">
                  {isUploading ? 'Enviando arquivo...' : 'Arraste seu vídeo aqui ou clique para selecionar'}
                </h3>
                
                <p className="text-muted-foreground mb-4">
                  Seu vídeo será exibido em {cartItems.length} painéis selecionados
                </p>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-700 text-sm">
                    Formatos aceitos: MP4, MOV, AVI<br />
                    Duração máxima: {selectedPlan >= 12 ? '30 segundos' : '20 segundos'}<br />
                    Resolução recomendada: 1080p ou 4K
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 p-8 rounded-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 p-4 rounded-full">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-2">
                  Upload concluído!
                </h3>
                
                <p className="text-green-700 mb-4">
                  {uploadedFile.name}
                </p>
                
                <Button
                  onClick={() => {
                    setUploadedFile(null);
                    document.getElementById('file-input')?.click();
                  }}
                  variant="outline"
                  className="mt-2"
                >
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Enviar outro arquivo
                </Button>
              </div>
            )}
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <p className="text-sm text-muted-foreground">
              Seu arquivo será enviado diretamente para nossos servidores e avaliado em até 24 horas.
            </p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};

// Helper component for CheckCircle icon for uploaded state
const CheckCircle = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const RefreshCw = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 2v6h-6"/>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
    <path d="M3 22v-6h6"/>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
  </svg>
);

export default UploadStep;

