import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle2, XCircle, Loader2, Calendar, MapPin, User, Mail, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import exaLogo from '@/assets/exa-logo.png';

interface ValidatedOrder {
  id: string;
  created_at: string;
  status: string;
  valor_total: number;
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  client_name: string;
  client_email: string;
  panels: Array<{
    nome: string;
    endereco: string;
    bairro: string;
  }>;
}

const ValidateOrder = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order');
  
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [orderData, setOrderData] = useState<ValidatedOrder | null>(null);

  const formatCpf = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
    if (match) {
      return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
    }
    return cleaned;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setCpf(formatCpf(value));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string, text: string, label: string }> = {
      'pago_pendente_video': { bg: 'bg-orange-500', text: 'text-white', label: 'Aguardando Vídeo' },
      'video_enviado': { bg: 'bg-blue-500', text: 'text-white', label: 'Vídeo Enviado' },
      'video_aprovado': { bg: 'bg-green-500', text: 'text-white', label: 'Vídeo Aprovado' },
      'pago': { bg: 'bg-green-500', text: 'text-white', label: 'Pago' },
      'ativo': { bg: 'bg-green-500', text: 'text-white', label: 'Ativo' },
      'pendente': { bg: 'bg-gray-500', text: 'text-white', label: 'Pendente' },
      'cancelado': { bg: 'bg-red-500', text: 'text-white', label: 'Cancelado' },
    };
    return configs[status] || { bg: 'bg-gray-500', text: 'text-white', label: status };
  };

  const handleValidate = async () => {
    if (!orderId) {
      toast.error('ID do pedido não fornecido');
      return;
    }

    if (!cpf || cpf.replace(/\D/g, '').length !== 11) {
      toast.error('Por favor, insira um CPF válido');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('validate-order', {
        body: {
          order_id: orderId,
          cpf: cpf
        }
      });

      if (error) throw error;

      if (data.success) {
        setOrderData(data.order);
        setValidated(true);
        toast.success('Pedido validado com sucesso!');
      } else {
        toast.error(data.message || 'Erro ao validar pedido');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Erro ao validar pedido. Verifique o CPF e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-center">ID do Pedido Inválido</CardTitle>
            <CardDescription className="text-center">
              O link de validação está incompleto ou inválido.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={exaLogo} alt="EXA" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Validação de Pedido</h1>
          <p className="text-gray-600">Sistema de Verificação de Autenticidade</p>
        </div>

        {!validated ? (
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] p-3 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Verificar Autenticidade do Documento</CardTitle>
                  <CardDescription>
                    Para validar este pedido, informe o CPF do titular
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">ID do Pedido:</p>
                <p className="font-mono text-lg font-bold text-gray-900">#{orderId.substring(0, 8).toUpperCase()}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">CPF do Titular</label>
                <Input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">Digite o CPF cadastrado no pedido</p>
              </div>

              <Button
                onClick={handleValidate}
                disabled={loading || !cpf}
                className="w-full bg-gradient-to-r from-[#9C1E1E] to-[#DC2626] hover:from-[#7A1818] hover:to-[#B91C1C] text-white font-semibold py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Validar Pedido
                  </>
                )}
              </Button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Sobre a Validação</p>
                    <p>
                      Este sistema garante a autenticidade dos documentos emitidos pela EXA.
                      O CPF é usado apenas para verificação e não é armazenado.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Success Header */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="bg-green-500 p-3 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-900">Pedido Validado!</h2>
                    <p className="text-green-700">Este documento é autêntico e foi emitido pela EXA</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            {orderData && (
              <>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Informações do Pedido</span>
                      <Badge className={`${getStatusConfig(orderData.status).bg} ${getStatusConfig(orderData.status).text}`}>
                        {getStatusConfig(orderData.status).label}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Cliente</p>
                          <p className="font-semibold text-gray-900">{orderData.client_name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">E-mail</p>
                          <p className="font-semibold text-gray-900">{orderData.client_email}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Data de Criação</p>
                          <p className="font-semibold text-gray-900">{formatDate(orderData.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CreditCard className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Valor Total</p>
                          <p className="font-semibold text-gray-900 text-lg">{formatCurrency(orderData.valor_total)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Plano</p>
                          <p className="font-semibold text-gray-900">{orderData.plano_meses} meses</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Vigência</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(orderData.data_inicio)} até {formatDate(orderData.data_fim)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {orderData.panels && orderData.panels.length > 0 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Locais Contratados ({orderData.panels.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {orderData.panels.map((panel, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <p className="font-semibold text-gray-900 mb-1">{panel.nome}</p>
                            <p className="text-sm text-gray-600">{panel.endereco}</p>
                            <p className="text-sm text-gray-500">{panel.bairro}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 text-center">
                  Documento validado em {new Date().toLocaleString('pt-BR')} • 
                  Sistema de Verificação EXA
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>EXA - Publicidade Inteligente</p>
          <p>www.examidia.com.br</p>
        </div>
      </div>
    </div>
  );
};

export default ValidateOrder;