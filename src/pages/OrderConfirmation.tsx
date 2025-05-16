
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, FileUp, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';

const OrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  // Get order ID from URL params or localStorage (fallback)
  const orderId = searchParams.get('id') || localStorage.getItem('lastPedidoId');
  
  // Page animation
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };
  
  // Fetch order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "ID do pedido não encontrado."
        });
        navigate('/checkout');
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select('*, lista_paineis, plano_meses, data_inicio, data_fim, status, valor_total')
          .eq('id', orderId)
          .single();
          
        if (error) throw error;
        
        setOrderDetails(data);
        
        // If we have an order, update its status if needed
        if (data && data.status === 'pendente') {
          await supabase
            .from('pedidos')
            .update({ status: 'pago' })
            .eq('id', orderId);
        }
        
      } catch (error) {
        console.error('Error fetching order details:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os detalhes do pedido."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, toast, navigate]);
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadStatus('uploading');
    
    try {
      // Simulate upload for now (add real implementation later)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Upload concluído",
        description: "Seu vídeo foi enviado com sucesso!"
      });
      
      setUploadStatus('success');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Ocorreu um erro ao enviar o arquivo."
      });
      setUploadStatus('error');
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col items-center">
          <RefreshCw className="h-10 w-10 text-indexa-purple animate-spin" />
          <h2 className="text-xl font-medium mt-4">Carregando detalhes do pedido...</h2>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <motion.div
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        className="container mx-auto px-4 py-12"
      >
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Sua campanha está prestes a estrear
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              O próximo anúncio de sucesso começa agora. Confirme sua veiculação abaixo.
            </p>
          </div>
          
          {/* Order summary */}
          <Card className="p-6 mb-8 shadow-md">
            <h2 className="text-xl font-semibold flex items-center">
              <span className="mr-2">📋</span>
              Resumo do pedido
            </h2>
            
            <div className="mt-6 space-y-6">
              {/* Order details here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Plano Selecionado</h3>
                  <p className="text-lg font-medium">
                    {orderDetails?.plano_meses === 1 && 'Plano Básico (1 mês)'}
                    {orderDetails?.plano_meses === 3 && 'Plano Popular (3 meses)'}
                    {orderDetails?.plano_meses === 6 && 'Plano Profissional (6 meses)'}
                    {orderDetails?.plano_meses === 12 && 'Plano Empresarial (12 meses)'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Qtde. painéis</h3>
                  <p className="text-lg font-medium">
                    {orderDetails?.lista_paineis?.length || 0}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Período</h3>
                  <div>
                    <p className="text-md">
                      <span className="text-gray-700">Início:</span> {new Date(orderDetails?.data_inicio).toLocaleDateString()}
                    </p>
                    <p className="text-md">
                      <span className="text-gray-700">Término:</span> {new Date(orderDetails?.data_fim).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Valor</h3>
                  <p className="text-lg font-medium">
                    R$ {orderDetails?.valor_total?.toFixed(2)?.replace('.', ',') || '0,00'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* File upload */}
          <Card className="p-6 shadow-md border-2 border-indexa-purple/20">
            <h2 className="text-xl font-semibold flex items-center">
              <Upload className="mr-2 h-5 w-5 text-indexa-purple" />
              Enviar seu vídeo
            </h2>
            
            <p className="mt-2 text-gray-600">
              Agora você precisa enviar o vídeo que será exibido nos painéis selecionados.
            </p>
            
            <div className="mt-6">
              <div className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center">
                {uploadStatus === 'idle' && (
                  <>
                    <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Arraste e solte seu arquivo aqui, ou clique para selecionar
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      MP4, MOV ou AVI (máx. 1GB)
                    </p>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="video/mp4,video/quicktime,video/avi"
                      onChange={handleFileUpload}
                    />
                  </>
                )}
                
                {uploadStatus === 'uploading' && (
                  <div className="space-y-2">
                    <RefreshCw className="mx-auto h-12 w-12 text-indexa-purple animate-spin" />
                    <p className="text-indexa-purple">Enviando seu vídeo...</p>
                  </div>
                )}
                
                {uploadStatus === 'success' && (
                  <div className="space-y-2">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <p className="text-green-600">Upload concluído com sucesso!</p>
                  </div>
                )}
                
                {uploadStatus === 'error' && (
                  <div className="space-y-2">
                    <div className="mx-auto h-12 w-12 text-red-500">❌</div>
                    <p className="text-red-600">Erro no upload. Por favor tente novamente.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                className="px-6 py-2 bg-[#1E1B4B] hover:bg-[#1E1B4B]/90" 
                disabled={uploadStatus === 'uploading'}
              >
                Finalizar
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>
    </Layout>
  );
};

export default OrderConfirmation;
