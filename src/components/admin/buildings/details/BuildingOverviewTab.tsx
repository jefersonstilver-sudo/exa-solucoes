
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Activity,
  Users,
  Eye,
  DollarSign,
  Monitor,
  Shield,
  Phone,
  UserCheck
} from 'lucide-react';

interface BuildingOverviewTabProps {
  building: any;
  panels: any[];
  contactInfo?: any;
  canAccessContacts?: boolean;
}

const BuildingOverviewTab: React.FC<BuildingOverviewTabProps> = ({
  building,
  panels,
  contactInfo,
  canAccessContacts
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <strong>Endereço:</strong>
            <p className="text-gray-600">{building.endereco}</p>
          </div>
          <div>
            <strong>Bairro:</strong>
            <Badge variant="outline">{building.bairro}</Badge>
          </div>
          {building.latitude && building.longitude && (
            <div>
              <strong>Coordenadas:</strong>
              <p className="text-gray-600 text-sm">
                {building.latitude}, {building.longitude}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Métricas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{building.numero_unidades}</div>
              <div className="text-xs text-blue-600">Unidades</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Eye className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{building.publico_estimado}</div>
              <div className="text-xs text-purple-600">Público</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 mx-auto mb-1 text-green-600" />
              <div className="text-lg font-bold text-green-600">{formatPrice(building.preco_base)}</div>
              <div className="text-xs text-green-600">Preço Base</div>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <Monitor className="h-6 w-6 mx-auto mb-1 text-indigo-600" />
              <div className="text-2xl font-bold text-indigo-600">{panels.length}</div>
              <div className="text-xs text-indigo-600">Painéis</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information - Only for Super Admins */}
      {canAccessContacts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-amber-500" />
              Informações de Contato
              <Badge variant="outline" className="ml-2 text-xs border-amber-500 text-amber-600">
                Acesso Restrito
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contactInfo.nome_sindico && (
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
                      <strong className="text-sm">Síndico</strong>
                    </div>
                    <p className="text-sm">{contactInfo.nome_sindico}</p>
                    {contactInfo.contato_sindico && (
                      <div className="flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="text-xs text-gray-600">{contactInfo.contato_sindico}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {contactInfo.nome_vice_sindico && (
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                      <strong className="text-sm">Vice-Síndico</strong>
                    </div>
                    <p className="text-sm">{contactInfo.nome_vice_sindico}</p>
                    {contactInfo.contato_vice_sindico && (
                      <div className="flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="text-xs text-gray-600">{contactInfo.contato_vice_sindico}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {contactInfo.nome_contato_predio && (
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center mb-2">
                      <Phone className="h-4 w-4 mr-2 text-purple-600" />
                      <strong className="text-sm">Contato do Prédio</strong>
                    </div>
                    <p className="text-sm">{contactInfo.nome_contato_predio}</p>
                    {contactInfo.numero_contato_predio && (
                      <div className="flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1 text-gray-500" />
                        <span className="text-xs text-gray-600">{contactInfo.numero_contato_predio}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nenhuma informação de contato disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!canAccessContacts && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="text-center py-6">
            <Shield className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">
              Informações de contato restritas a Super Administradores
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BuildingOverviewTab;
