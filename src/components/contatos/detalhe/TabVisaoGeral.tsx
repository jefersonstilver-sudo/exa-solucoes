import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Phone, Mail, MapPin, Calendar, Clock, 
  MessageCircle, FileText, Package, DollarSign 
} from 'lucide-react';
import { Contact, CATEGORIAS_CONFIG, ORIGEM_CONFIG } from '@/types/contatos';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TabVisaoGeralProps {
  contact: Contact;
}

export const TabVisaoGeral: React.FC<TabVisaoGeralProps> = ({ contact }) => {
  const categoriaConfig = CATEGORIAS_CONFIG[contact.categoria];

  return (
    <div className="space-y-4">
      {/* Resumo Executivo */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Resumo do Contato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Calendar className="w-5 h-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold">
                {contact.created_at 
                  ? Math.floor((Date.now() - new Date(contact.created_at).getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">Dias no sistema</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <DollarSign className="w-5 h-5 mx-auto text-green-600 mb-1" />
              <p className="text-lg font-bold">
                {contact.total_investido 
                  ? `R$ ${contact.total_investido.toLocaleString('pt-BR')}`
                  : 'R$ 0'}
              </p>
              <p className="text-xs text-muted-foreground">Total investido</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <MessageCircle className="w-5 h-5 mx-auto text-blue-600 mb-1" />
              <p className="text-lg font-bold">{contact.dias_sem_contato || 0}</p>
              <p className="text-xs text-muted-foreground">Dias sem contato</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Package className="w-5 h-5 mx-auto text-amber-600 mb-1" />
              <p className="text-lg font-bold">0</p>
              <p className="text-xs text-muted-foreground">Pedidos ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados de Identidade */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Dados de Identidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Empresa</p>
                  <p className="font-medium">{contact.empresa || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="font-medium">{contact.telefone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{contact.email || '-'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Localização</p>
                  <p className="font-medium">
                    {contact.bairro && contact.cidade 
                      ? `${contact.bairro}, ${contact.cidade} - ${contact.estado || 'PR'}`
                      : contact.cidade || '-'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">CNPJ</p>
                <p className="font-medium">{contact.cnpj || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tipo de Negócio</p>
                <p className="font-medium">{contact.tipo_negocio || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Origem</p>
              {contact.origem ? (
                <Badge variant="outline" className="mt-1 text-xs">
                  {ORIGEM_CONFIG[contact.origem]?.label || contact.origem}
                </Badge>
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Categoria</p>
              <Badge className={`mt-1 text-xs ${categoriaConfig.bgColor} text-white`}>
                {categoriaConfig.label}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Criado em</p>
              <p className="font-medium mt-1">
                {contact.created_at 
                  ? format(new Date(contact.created_at), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Última atualização</p>
              <p className="font-medium mt-1">
                {contact.updated_at 
                  ? formatDistanceToNow(new Date(contact.updated_at), { addSuffix: true, locale: ptBR })
                  : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabVisaoGeral;
