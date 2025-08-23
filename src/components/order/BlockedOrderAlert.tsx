import { AlertTriangle, Phone, Mail, MessageCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface BlockedOrderAlertProps {
  reason?: string;
  blockedAt?: string;
}
export const BlockedOrderAlert = ({
  reason,
  blockedAt
}: BlockedOrderAlertProps) => {
  const supportWhatsApp = "5511999999999"; // Número do WhatsApp do suporte
  const supportEmail = "suporte@indexadigital.com.br";
  const supportPhone = "(11) 9999-9999";
  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(`Olá! Meu pedido foi bloqueado e preciso de ajuda para resolver esta situação. Por favor, me auxiliem com mais informações.`);
    window.open(`https://wa.me/${supportWhatsApp}?text=${message}`, '_blank');
  };
  const handleEmailContact = () => {
    const subject = encodeURIComponent('Pedido Bloqueado - Solicitação de Suporte');
    const body = encodeURIComponent(`Olá,\n\nMeu pedido foi bloqueado e gostaria de entender os motivos e como proceder para resolver esta situação.\n\nAguardo retorno.\n\nObrigado(a).`);
    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`, '_blank');
  };
  return <div className="space-y-6">
      {/* Alert Principal */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p className="font-semibold text-lg">
              🚫 Seu pedido foi bloqueado por questões de segurança
            </p>
            <p>
              Este pedido não pode ser visualizado ou modificado no momento. 
              Por favor, entre em contato com nosso suporte para mais informações.
            </p>
            {reason && <p className="text-sm bg-red-100 p-2 rounded border">
                <strong>Motivo:</strong> {reason}
              </p>}
            {blockedAt && <p className="text-xs text-red-600">
                <strong>Bloqueado em:</strong> {new Date(blockedAt).toLocaleString('pt-BR')}
              </p>}
          </div>
        </AlertDescription>
      </Alert>

      {/* Card de Contato */}
      <Card className="border-blue-200">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Phone className="h-5 w-5" />
            Como Proceder
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-gray-700">
              Para resolver esta situação, entre em contato conosco através de um dos canais abaixo:
            </p>
            
            <div className="grid gap-4 md:grid-cols-1">
              {/* WhatsApp */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-green-50 transition-colors">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">WhatsApp</p>
                    <p className="text-sm text-gray-600">Atendimento mais rápido</p>
                  </div>
                </div>
                <Button onClick={handleWhatsAppContact} className="bg-green-600 hover:bg-green-700">
                  Conversar
                </Button>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800">E-mail</p>
                    <p className="text-sm text-gray-600">{supportEmail}</p>
                  </div>
                </div>
                <Button onClick={handleEmailContact} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Enviar E-mail
                </Button>
              </div>

              {/* Telefone */}
              
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-800 mb-2">
                📋 Informações Importantes
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Tenha em mãos o ID do seu pedido ao entrar em contato</li>
                <li>• Nossa equipe está disponível de segunda a sexta, das 9h às 18h</li>
                <li>• Responderemos sua solicitação em até 24 horas úteis</li>
                <li>• Todos os dados e informações serão analisados com cuidado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
};