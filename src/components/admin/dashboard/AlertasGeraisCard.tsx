import React, { useState, useEffect } from 'react';
import { Bell, Video, Gift, MessageSquare, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCardConfig } from '@/hooks/useCardConfig';
import CardConfigPopover from './CardConfigPopover';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface AlertasStats {
  videosParaAprovar: number;
  vouchersParaEnviar: number;
  conversasSemResposta: number;
  contatosPorTipo: Record<string, number>;
  totalContatos: number;
}

const AlertasGeraisCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/super_admin') ? '/super_admin' : '/admin';
  const { value: timeoutMinutes, updateValue } = useCardConfig('dashboard_conversations_timeout_minutes', 3);
  const [stats, setStats] = useState<AlertasStats>({
    videosParaAprovar: 0,
    vouchersParaEnviar: 0,
    conversasSemResposta: 0,
    contatosPorTipo: {},
    totalContatos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlertStats = async () => {
      try {
        // 1. Vídeos aguardando aprovação
        const { count: videosCount } = await supabase
          .from('pedido_videos')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'pending');

        // 2. Vouchers para enviar (escolha feita mas sem gift_code)
        const { count: vouchersCount } = await supabase
          .from('provider_benefits')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'choice_made')
          .is('gift_code', null);

        // 3. Conversas sem resposta (usando awaiting_response)
        const { count: conversasCount } = await supabase
          .from('conversations')
          .select('id', { count: 'exact', head: true })
          .eq('awaiting_response', true);

        // 4. Contatos por tipo (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: contatosData } = await supabase
          .from('conversations')
          .select('contact_type')
          .gte('created_at', thirtyDaysAgo.toISOString());

        const contatosPorTipo: Record<string, number> = {};
        let totalContatos = 0;

        contatosData?.forEach(c => {
          const tipo = c.contact_type || 'Sem tipo';
          contatosPorTipo[tipo] = (contatosPorTipo[tipo] || 0) + 1;
          totalContatos++;
        });

        setStats({
          videosParaAprovar: videosCount || 0,
          vouchersParaEnviar: vouchersCount || 0,
          conversasSemResposta: conversasCount || 0,
          contatosPorTipo,
          totalContatos
        });
      } catch (err) {
        console.error('[AlertasGeraisCard] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlertStats();

    // Subscribe to changes
    const channels = [
      supabase
        .channel('videos_alerts_monitor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pedido_videos' }, fetchAlertStats)
        .subscribe(),
      supabase
        .channel('vouchers_alerts_monitor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_benefits' }, fetchAlertStats)
        .subscribe(),
      supabase
        .channel('conversations_alerts_monitor')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchAlertStats)
        .subscribe()
    ];

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [timeoutMinutes]);

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-gray-200 rounded w-28" />
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  const hasAlerts = stats.videosParaAprovar > 0 || stats.vouchersParaEnviar > 0 || stats.conversasSemResposta > 0;

  return (
    <Card className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-out flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm md:text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-purple-500" />
            Alertas de Ação
            {hasAlerts && (
              <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white">
                {stats.videosParaAprovar + stats.vouchersParaEnviar + stats.conversasSemResposta}
              </Badge>
            )}
          </div>
          <CardConfigPopover
            label="Timeout de conversa sem resposta"
            unit="min"
            value={timeoutMinutes}
            onSave={updateValue}
            min={1}
            max={60}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1 flex flex-col">
        {/* Grid 2x2 de alertas */}
        <div className="grid grid-cols-2 gap-2">
          {/* Vídeos para aprovar */}
          <div 
            className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
              stats.videosParaAprovar > 0 
                ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' 
                : 'bg-gray-50 border-gray-200'
            }`}
            onClick={() => navigate('/admin/aprovacoes')}
          >
            <div className="flex items-center gap-2 mb-1">
              <Video className={`h-4 w-4 ${stats.videosParaAprovar > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
              <span className={`text-[10px] font-medium ${stats.videosParaAprovar > 0 ? 'text-orange-700' : 'text-gray-500'}`}>
                Vídeos
              </span>
            </div>
            <p className={`text-xl font-bold ${stats.videosParaAprovar > 0 ? 'text-orange-700' : 'text-gray-400'}`}>
              {stats.videosParaAprovar}
            </p>
            <p className="text-[9px] text-muted-foreground">para aprovar</p>
          </div>

          {/* Vouchers para enviar */}
          <div 
            className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
              stats.vouchersParaEnviar > 0 
                ? 'bg-pink-50 border-pink-200 hover:bg-pink-100' 
                : 'bg-gray-50 border-gray-200'
            }`}
            onClick={() => navigate('/admin/beneficio-prestadores')}
          >
            <div className="flex items-center gap-2 mb-1">
              <Gift className={`h-4 w-4 ${stats.vouchersParaEnviar > 0 ? 'text-pink-600' : 'text-gray-400'}`} />
              <span className={`text-[10px] font-medium ${stats.vouchersParaEnviar > 0 ? 'text-pink-700' : 'text-gray-500'}`}>
                Vouchers
              </span>
            </div>
            <p className={`text-xl font-bold ${stats.vouchersParaEnviar > 0 ? 'text-pink-700' : 'text-gray-400'}`}>
              {stats.vouchersParaEnviar}
            </p>
            <p className="text-[9px] text-muted-foreground">para enviar</p>
          </div>

          {/* Conversas sem resposta */}
          <div 
            className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
              stats.conversasSemResposta > 0 
                ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                : 'bg-gray-50 border-gray-200'
            }`}
            onClick={() => navigate(`${basePath}/crm-chat`)}
          >
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className={`h-4 w-4 ${stats.conversasSemResposta > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className={`text-[10px] font-medium ${stats.conversasSemResposta > 0 ? 'text-blue-700' : 'text-gray-500'}`}>
                Conversas
              </span>
            </div>
            <p className={`text-xl font-bold ${stats.conversasSemResposta > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
              {stats.conversasSemResposta}
            </p>
            <p className="text-[9px] text-muted-foreground">aguardando</p>
          </div>

          {/* Contatos (com hover para detalhes por tipo) */}
          <HoverCard openDelay={100}>
            <HoverCardTrigger asChild>
              <div className="p-2.5 rounded-lg border bg-emerald-50 border-emerald-200 cursor-pointer hover:bg-emerald-100 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="text-[10px] font-medium text-emerald-700">Contatos</span>
                </div>
                <p className="text-xl font-bold text-emerald-700">{stats.totalContatos}</p>
                <p className="text-[9px] text-muted-foreground">últimos 30 dias</p>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-48 p-3" side="top">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-900">Contatos por Tipo</h4>
                <div className="space-y-1">
                  {Object.entries(stats.contatosPorTipo)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([tipo, count]) => (
                      <div key={tipo} className="flex justify-between text-xs">
                        <span className="text-muted-foreground truncate">{tipo}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        {!hasAlerts && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">✅ Nenhum alerta pendente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AlertasGeraisCard;
