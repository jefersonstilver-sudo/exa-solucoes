
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Calendar, DollarSign, RefreshCw, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApprovedVideo {
  id: string;
  created_at: string;
  valor_total: number;
  lista_paineis: string[];
  plano_meses: number;
  data_inicio: string;
  data_fim: string;
  client_id: string;
  client_email?: string;
  log_pagamento?: any;
}

interface ApprovedVideosSectionProps {
  loading: boolean;
  onRefresh: () => void;
}

const ApprovedVideosSection: React.FC<ApprovedVideosSectionProps> = ({ loading, onRefresh }) => {
  const [approvedVideos, setApprovedVideos] = useState<ApprovedVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  const fetchApprovedVideos = async () => {
    try {
      setLoadingVideos(true);
      console.log('✅ Buscando vídeos aprovados recentemente...');
      
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .eq('status', 'video_aprovado')
        .order('created_at', { ascending: false })
        .limit(20); // Mostrar apenas os 20 mais recentes

      if (error) {
        console.error('❌ Erro ao buscar vídeos aprovados:', error);
        throw error;
      }

      console.log('✅ Vídeos aprovados encontrados:', data?.length || 0);
      
      // Enriquecer com dados do cliente
      const enrichedVideos = await Promise.all(
        (data || []).map(async (video) => {
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('email')
              .eq('id', video.client_id)
              .single();

            return {
              ...video,
              client_email: userData?.email || 'Email não encontrado'
            };
          } catch (error) {
            console.warn(`Erro ao buscar dados do cliente ${video.client_id}:`, error);
            return {
              ...video,
              client_email: 'Email não encontrado'
            };
          }
        })
      );

      setApprovedVideos(enrichedVideos);
    } catch (error) {
      console.error('💥 Erro ao carregar vídeos aprovados:', error);
      toast.error('Erro ao carregar vídeos aprovados');
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchApprovedVideos();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getApprovalDate = (video: ApprovedVideo) => {
    return video.log_pagamento?.approved_at 
      ? formatDateTime(video.log_pagamento.approved_at)
      : 'Data não disponível';
  };

  const getCampaignStatus = (video: ApprovedVideo) => {
    const today = new Date();
    const startDate = new Date(video.data_inicio);
    const endDate = new Date(video.data_fim);

    if (today < startDate) {
      return { label: 'Agendada', color: 'bg-blue-100 text-blue-800' };
    } else if (today >= startDate && today <= endDate) {
      return { label: 'Ativa', color: 'bg-green-100 text-green-800' };
    } else {
      return { label: 'Finalizada', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loadingVideos || loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#9C1E1E]" />
            <span className="ml-3 text-gray-600">Carregando vídeos aprovados...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Vídeos Aprovados Recentemente
          </CardTitle>
          <CardDescription>
            Histórico dos últimos vídeos aprovados e campanhas ativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {approvedVideos.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum vídeo aprovado recentemente
              </h3>
              <p className="text-gray-500">
                Os vídeos aprovados aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedVideos.map((video) => {
                const campaignStatus = getCampaignStatus(video);
                
                return (
                  <Card key={video.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-green-100 text-green-800">
                          Aprovado ✓
                        </Badge>
                        <Badge className={campaignStatus.color}>
                          {campaignStatus.label}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-medium">{video.client_email}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm font-bold text-green-600">
                            {formatCurrency(video.valor_total)}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Play className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">
                            {video.lista_paineis?.length || 0} painéis • {video.plano_meses} meses
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-sm">
                            {formatDate(video.data_inicio)} - {formatDate(video.data_fim)}
                          </span>
                        </div>
                        
                        <div className="pt-3 border-t border-green-200">
                          <p className="text-xs text-gray-600">
                            <strong>Aprovado em:</strong><br />
                            {getApprovalDate(video)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovedVideosSection;
