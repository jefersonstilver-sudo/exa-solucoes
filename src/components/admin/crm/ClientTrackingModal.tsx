import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  User, Mail, Phone, FileText, MapPin, ShoppingCart, 
  Calendar, Clock, CreditCard, Building, Target, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatters';
import { PhoneWithActions } from './PhoneWithActions';

interface ClientTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    id: string;
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    client_cpf?: string;
    valor_total?: number;
    created_at: string;
    status: string;
    lista_paineis?: string[];
    plano_meses?: number;
    selected_buildings?: Array<{
      nome: string;
      bairro: string;
      endereco?: string;
    }>;
    client_id?: string;
  };
}

export function ClientTrackingModal({ isOpen, onClose, orderData }: ClientTrackingModalProps) {
  const createdDate = new Date(orderData.created_at);
  const timeElapsed = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60));
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Rastreabilidade e Inteligência do Cliente
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            
            {/* Informações Básicas do Cliente */}
            <section>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Dados do Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                {orderData.client_name && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Nome Completo</p>
                      <p className="font-medium">{orderData.client_name}</p>
                    </div>
                  </div>
                )}
                
                {orderData.client_email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">E-mail</p>
                      <p className="font-medium text-sm">{orderData.client_email}</p>
                    </div>
                  </div>
                )}
                
                {orderData.client_phone && (
                  <div className="flex items-start gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Telefone / WhatsApp</p>
                      <PhoneWithActions phone={orderData.client_phone} />
                    </div>
                  </div>
                )}
                
                {orderData.client_cpf && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">CPF</p>
                      <p className="font-medium">{orderData.client_cpf}</p>
                    </div>
                  </div>
                )}
                
                {orderData.client_id && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">ID do Cliente</p>
                      <p className="font-mono text-xs">{orderData.client_id}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* Informações do Pedido/Tentativa */}
            <section>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                Detalhes do Pedido
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Criação</p>
                    <p className="font-medium">
                      {format(createdDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tempo Desde Criação</p>
                    <p className="font-medium">
                      {timeElapsed < 24 
                        ? `${timeElapsed} horas` 
                        : `${Math.floor(timeElapsed / 24)} dias`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="font-bold text-lg text-green-600">
                      {formatCurrency(orderData.valor_total || 0)}
                    </p>
                  </div>
                </div>
                
                {orderData.plano_meses && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Plano</p>
                      <p className="font-medium">{orderData.plano_meses} meses</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Status Atual</p>
                    <Badge variant="outline" className="mt-1">
                      {orderData.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Itens do Carrinho / Painéis Selecionados */}
            {orderData.lista_paineis && orderData.lista_paineis.length > 0 && (
              <>
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                    Painéis no Carrinho
                    <Badge variant="secondary">{orderData.lista_paineis.length}</Badge>
                  </h3>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-1 gap-2">
                      {orderData.lista_paineis.map((painel, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-background rounded">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Painel {index + 1}</span>
                          <span className="text-xs text-muted-foreground ml-auto font-mono">
                            {painel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
                <Separator />
              </>
            )}

            {/* Localização / Endereços de Interesse */}
            {orderData.selected_buildings && orderData.selected_buildings.length > 0 && (
              <>
                <section>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-red-600" />
                    Localizações de Interesse
                    <Badge variant="secondary">{orderData.selected_buildings.length}</Badge>
                  </h3>
                  <div className="space-y-3">
                    {orderData.selected_buildings.map((building, index) => (
                      <div key={`building-${index}`} className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Building className="h-5 w-5 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <p className="font-semibold">{building.nome}</p>
                            <p className="text-sm text-muted-foreground">{building.bairro}</p>
                            {building.endereco && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {building.endereco}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <Separator />
              </>
            )}

            {/* Insights para Estratégia de Contato */}
            <section>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Insights para Estratégia de Contato
              </h3>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-purple-600 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Urgência de Contato</p>
                    <p className="text-xs text-muted-foreground">
                      {timeElapsed < 24 
                        ? '🔥 ALTA - Cliente criou pedido recentemente, melhor momento para contato!'
                        : timeElapsed < 72
                        ? '⚠️ MÉDIA - Ainda há interesse, mas precisa de estímulo para conversão'
                        : '❌ BAIXA - Pedido antigo, pode ter desistido. Necessita abordagem de recuperação'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-purple-600 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Ticket Médio</p>
                    <p className="text-xs text-muted-foreground">
                      {orderData.valor_total && orderData.valor_total > 500
                        ? '💎 Cliente Premium - Valor alto, priorizar atendimento personalizado'
                        : '📊 Cliente Padrão - Valor dentro da média, contato via WhatsApp'}
                    </p>
                  </div>
                </div>
                
                {orderData.lista_paineis && orderData.lista_paineis.length > 1 && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-purple-600 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Potencial de Vendas</p>
                      <p className="text-xs text-muted-foreground">
                        🎯 Alto interesse - Selecionou múltiplos painéis, indicando comprometimento
                      </p>
                    </div>
                  </div>
                )}
                
                {orderData.selected_buildings && orderData.selected_buildings.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-purple-600 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Região de Interesse</p>
                      <p className="text-xs text-muted-foreground">
                        📍 Cliente pesquisou em: {orderData.selected_buildings.map(b => b.bairro).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Próximas Ações Sugeridas */}
            <section>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Próximas Ações Recomendadas
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded border-l-4 border-green-500">
                  <p className="text-sm font-medium">1. Contato Imediato via WhatsApp</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mencionar os painéis específicos que ele selecionou para personalizar a abordagem
                  </p>
                </div>
                
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-500">
                  <p className="text-sm font-medium">2. Enviar Proposta Personalizada</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Incluir simulação de resultados com base nas localizações de interesse
                  </p>
                </div>
                
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded border-l-4 border-orange-500">
                  <p className="text-sm font-medium">3. Oferecer Desconto por Tempo Limitado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Criar senso de urgência para acelerar decisão de compra
                  </p>
                </div>
              </div>
            </section>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
