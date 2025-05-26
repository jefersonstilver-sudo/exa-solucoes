
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import CheckoutProgress from '@/components/checkout/CheckoutProgress';

const CheckoutFinish = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadNow = async () => {
    setIsUploading(true);
    // Simular upload - aqui você integraria com o sistema de upload real
    setTimeout(() => {
      navigate('/client/uploads');
    }, 2000);
  };

  const handleFinishLater = () => {
    // Salvar pedido para finalizar depois
    localStorage.setItem('pendingUpload', 'true');
    navigate('/anunciante');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Timeline Progress */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6 mb-8"
          >
            <CheckoutProgress currentStep={4} />
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Confirmado!
            </h1>
            <p className="text-lg text-gray-600">
              Sua campanha foi criada com sucesso. Agora você pode fazer o upload do seu material.
            </p>
          </motion.div>

          {/* Upload Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Now */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-2 border-[#3C1361] bg-gradient-to-br from-[#3C1361]/5 to-[#00FFAB]/5 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-[#3C1361] rounded-full mb-4">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Fazer Upload Agora
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Envie seu material publicitário imediatamente e inicie sua campanha.
                  </p>
                  <Button
                    onClick={handleUploadNow}
                    disabled={isUploading}
                    className="w-full bg-[#3C1361] hover:bg-[#3C1361]/90"
                  >
                    {isUploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        Iniciar Upload
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Finish Later */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <Clock className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Finalizar Mais Tarde
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Acesse seu painel do anunciante quando estiver pronto para o upload.
                  </p>
                  <Button
                    onClick={handleFinishLater}
                    variant="outline"
                    className="w-full border-gray-300 hover:bg-gray-50"
                  >
                    Ir para Painel
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Information Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6"
          >
            <h4 className="font-semibold text-blue-900 mb-2">
              💡 Informações Importantes
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Você pode fazer upload a qualquer momento através do seu painel</li>
              <li>• Formatos aceitos: MP4, MOV, JPG, PNG (máximo 100MB)</li>
              <li>• Sua campanha iniciará após aprovação do material</li>
              <li>• Você receberá notificações sobre o status da sua campanha</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutFinish;
