
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft, Calendar, Monitor, Play, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

const CampaignDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userProfile, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-indexa-purple" />
        <p className="ml-2 text-lg">Carregando detalhes da campanha...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/anunciante/campanhas')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detalhes da Campanha</h1>
          <p className="text-gray-600 mt-1">Campanha #{id?.substring(0, 8)}</p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status da Campanha</span>
            <Badge className="bg-green-100 text-green-800">Ativa</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">Período</p>
                <p className="text-sm text-gray-600">01/12/2024 - 31/12/2024</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Monitor className="h-8 w-8 text-purple-500" />
              <div>
                <p className="font-medium">Painéis</p>
                <p className="text-sm text-gray-600">3 painéis ativos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Eye className="h-8 w-8 text-green-500" />
              <div>
                <p className="font-medium">Visualizações</p>
                <p className="text-sm text-gray-600">12.450 impressões</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo em Desenvolvimento */}
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto bg-indexa-purple/10 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-4">
            <Play className="h-8 w-8 text-indexa-purple" />
          </div>
          <h3 className="text-xl font-medium mb-2">Detalhes Avançados em Desenvolvimento</h3>
          <p className="text-gray-500 mb-6">
            Em breve você terá acesso a relatórios detalhados, métricas avançadas e controles granulares da sua campanha.
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/anunciante/campanhas')}>
              Ver Todas as Campanhas
            </Button>
            <Button onClick={() => navigate('/anunciante/relatorios')} className="bg-indexa-purple hover:bg-indexa-purple/90">
              Ver Relatórios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignDetails;
