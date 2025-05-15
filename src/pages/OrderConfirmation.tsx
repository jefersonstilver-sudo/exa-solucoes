import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Upload, Video, AlertTriangle, FileVideo, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserSession } from '@/hooks/useUserSession';

enum OrderStatus {
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  NOT_FOUND = 'not_found',
}

interface OrderData {
  id: string;
  status: string;
  created_at: string;
  data_inicio: string;
  data_fim: string;
  valor_total: number;
}

const OrderConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const status = searchParams.get('status') || 'approved';
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(OrderStatus.LOADING);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const { toast } = useToast();
  const { isLoggedIn, user } = useUserSession();
  
  // Estados para upload de vídeo
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!orderId) {
      setOrderStatus(OrderStatus.NOT_FOUND);
      return;
    }
    
    const fetchOrderDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (error || !data) {
          console.error('Error fetching order:', error);
          setOrderStatus(OrderStatus.NOT_FOUND);
          return;
        }
        
        setOrderData(data);
        
        if (status === 'approved' || data.status === 'pago') {
          setOrderStatus(OrderStatus.SUCCESS);
        } else if (status === 'rejected' || data.status === 'cancelado') {
          setOrderStatus(OrderStatus.ERROR);
        } else {
          // Implementar lógica para verificar status real com MercadoPago
          setOrderStatus(OrderStatus.SUCCESS); // Para testes, consideramos sucesso por padrão
        }
        
        // Verificar se o usuário já tem um vídeo
        if (user?.id) {
          const { data: videoData } = await supabase
            .from('videos')
            .select('*')
            .eq('client_id', user.id)
            .eq('status', 'ativo')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (videoData && videoData.length > 0) {
            setVideoUrl(videoData[0].url);
          }
        }
        
      } catch (error) {
        console.error('Error in order confirmation:', error);
        setOrderStatus(OrderStatus.ERROR);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, status, user]);
  
  // Função para lidar com upload de vídeo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Verificar se é um arquivo de vídeo
      if (!selectedFile.type.startsWith('video/')) {
        toast({
          variant: "destructive",
          title: "Formato não suportado",
          description: "Por favor, faça upload apenas de arquivos de vídeo.",
        });
        return;
      }
      
      // Verificar tamanho (limite de 100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é 100MB.",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleUpload = async () => {
    if (!file || !user) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Simular progresso para demonstração
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);
      
      // Em um ambiente real, aqui faria o upload para um Storage como S3 ou Supabase Storage
      // Simulando um delay para demonstração
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Finalizar progresso
      clearInterval(interval);
      setUploadProgress(100);
      
      // Simulando URL do vídeo
      const mockVideoUrl = 'https://example.com/videos/sample-video.mp4';
      
      // Registrar o vídeo no banco de dados
      const { data, error } = await supabase
        .from('videos')
        .insert([
          {
            client_id: user.id,
            url: mockVideoUrl,
            nome: file.name,
            status: 'ativo',
            origem: 'upload',
            duracao: 30 // Duração padrão em segundos
          }
        ])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Upload concluído",
        description: "Seu vídeo foi carregado com sucesso!",
      });
      
      setVideoUrl(mockVideoUrl);
      
      // Instead of using RPC, let's update campaigns directly
      if (orderId) {
        const { data: campaigns, error: campaignsFetchError } = await supabase
          .from('campanhas')
          .select('id')
          .eq('client_id', user.id)
          .is('video_id', null);
          
        if (campaignsFetchError) {
          console.error('Erro ao buscar campanhas:', campaignsFetchError);
          return;
        }
        
        if (campaigns && campaigns.length > 0) {
          const campaignIds = campaigns.map(c => c.id);
          const { error: updateError } = await supabase
            .from('campanhas')
            .update({ video_id: data.id })
            .in('id', campaignIds);
          
          if (updateError) {
            console.error('Erro ao atualizar campanhas:', updateError);
          }
        }
      }
      
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Ocorreu um problema ao fazer upload do seu vídeo.",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Renderização baseada no status
  const renderOrderStatus = () => {
    switch (orderStatus) {
      case OrderStatus.LOADING:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-indexa-purple border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-semibold">Carregando informações do pedido...</h2>
          </div>
        );
        
      case OrderStatus.SUCCESS:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Pedido Confirmado!</h2>
              <p className="text-gray-600 mb-4">
                Seu pedido foi processado com sucesso.
              </p>
              <div className="bg-gray-50 w-full p-4 rounded-md mb-4">
                <div className="text-sm text-gray-500">Número do Pedido:</div>
                <div className="font-mono font-medium">{orderId}</div>
              </div>
              
              {orderData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm text-gray-500">Data da Compra:</div>
                    <div className="font-medium">
                      {new Date(orderData.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm text-gray-500">Valor Total:</div>
                    <div className="font-medium">
                      R$ {Number(orderData.valor_total).toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm text-gray-500">Início da Veiculação:</div>
                    <div className="font-medium">
                      {new Date(orderData.data_inicio).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="text-sm text-gray-500">Fim da Veiculação:</div>
                    <div className="font-medium">
                      {new Date(orderData.data_fim).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-8 mt-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Video className="w-5 h-5 mr-2 text-indexa-purple" />
                Vídeo da Campanha
              </h3>
              
              {videoUrl ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <FileVideo className="w-6 h-6 text-indexa-purple mr-3" />
                    <div className="flex-grow">
                      <div className="font-medium">Vídeo já cadastrado</div>
                      <div className="text-sm text-gray-500">Seu vídeo será usado nas campanhas</div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/campanhas">Ver campanhas</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-6 rounded-md text-center">
                  <div className="mb-4">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto" />
                  </div>
                  
                  {isUploading ? (
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Enviando vídeo...</div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-indexa-purple h-2.5 rounded-full" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-xs text-gray-500">{uploadProgress}% concluído</div>
                    </div>
                  ) : file ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <FileVideo className="w-5 h-5 text-indexa-purple" />
                        <span className="font-medium text-sm truncate max-w-xs">{file.name}</span>
                      </div>
                      
                      <Button onClick={handleUpload} className="w-full sm:w-auto">
                        Enviar vídeo
                      </Button>
                      
                      <div>
                        <button 
                          onClick={() => setFile(null)} 
                          className="text-sm text-gray-500 hover:text-red-500"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-gray-600">
                        Envie seu vídeo para começar sua campanha
                      </p>
                      
                      <p className="text-gray-500 text-sm">
                        Formatos aceitos: MP4, MOV, AVI (máx. 100MB)
                      </p>
                      
                      <div className="mt-2">
                        <label className="bg-indexa-purple text-white py-2 px-4 rounded cursor-pointer hover:bg-indexa-purple/90">
                          Selecionar vídeo
                          <input 
                            type="file"
                            accept="video/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                <p>Você pode enviar seu vídeo agora ou depois através da seção "Campanhas" em sua conta.</p>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" asChild>
                <Link to="/campanhas">
                  Ver minhas campanhas
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link to="/paineis-digitais/loja">
                  Voltar à loja
                </Link>
              </Button>
            </div>
          </motion.div>
        );
        
      case OrderStatus.ERROR:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Problema no Pagamento</h2>
              <p className="text-gray-600 mb-4">
                Houve um problema ao processar seu pagamento. Por favor, tente novamente.
              </p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-md mb-6 flex items-start">
              <AlertTriangle className="text-red-500 w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800">
                  Seu pedido foi criado, mas o pagamento não foi concluído. Se você acredita que isso
                  é um erro, entre em contato com nossa equipe de suporte.
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" asChild>
                <Link to={`/checkout?id=${orderId}`}>
                  Tentar novamente
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link to="/paineis-digitais/loja">
                  Voltar à loja
                </Link>
              </Button>
            </div>
          </motion.div>
        );
        
      case OrderStatus.NOT_FOUND:
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-amber-600 mb-2">Pedido não encontrado</h2>
              <p className="text-gray-600 mb-4">
                Não conseguimos localizar informações sobre este pedido.
              </p>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Button variant="default" asChild>
                <Link to="/paineis-digitais/loja">
                  Voltar à loja
                </Link>
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center">Confirmação de Pedido</h1>
        </div>
        
        {renderOrderStatus()}
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
