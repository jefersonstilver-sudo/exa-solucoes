
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, CheckCircle, Clock, ArrowRight, ChevronLeft } from 'lucide-react';
import CheckoutLayout from '@/components/checkout/CheckoutLayout';

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

  const handleBack = () => {
    navigate('/selecionar-plano');
  };

  return (
    <CheckoutLayout currentStep={4} maxWidth="4xl">
      <div className="mt-6 sm:mt-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4 -ml-2"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar para Pagamento
        </Button>

        {/* Success Message */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Pagamento Confirmado!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Sua campanha foi criada com sucesso. Agora você pode fazer o upload do seu material.
          </p>
        </div>

        {/* Upload Options */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Upload Now */}
        <div>
          <Card className="border-2 border-[#9C1E1E] bg-gradient-to-br from-[#9C1E1E]/5 to-[#9C1E1E]/10 hover:shadow-2xl transition-shadow h-full rounded-2xl">
            <CardContent className="p-4 sm:p-6 text-center h-full flex flex-col">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-[#9C1E1E] rounded-full mb-4">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Fazer Upload Agora
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 flex-grow">
                Envie seu material publicitário imediatamente e inicie sua campanha.
              </p>
              <Button
                onClick={handleUploadNow}
                disabled={isUploading}
                className="w-full bg-[#9C1E1E] hover:bg-[#7A1818]"
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
        </div>

        {/* Finish Later */}
        <div>
          <Card className="border-2 border-gray-200 hover:border-gray-300 hover:shadow-2xl transition-all h-full rounded-2xl">
            <CardContent className="p-4 sm:p-6 text-center h-full flex flex-col">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full mb-4">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Finalizar Mais Tarde
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 flex-grow">
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
        </div>
      </div>

        {/* Information Box */}
        <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <h4 className="font-semibold text-blue-900 mb-2">
            💡 Informações Importantes
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Você pode fazer upload a qualquer momento através do seu painel</li>
            <li>• Formatos aceitos: MP4, MOV, JPG, PNG (máximo 100MB)</li>
            <li>• Sua campanha iniciará após aprovação do material</li>
            <li>• Você receberá notificações sobre o status da sua campanha</li>
          </ul>
        </div>
      </div>
    </CheckoutLayout>
  );
};

export default CheckoutFinish;
