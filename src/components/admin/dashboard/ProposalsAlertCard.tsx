import React, { useState, useEffect } from 'react';
import { FileText, Clock, AlertTriangle, CheckCircle, ArrowRight, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCardConfig } from '@/hooks/useCardConfig';
import CardConfigPopover from './CardConfigPopover';

interface ProposalStats {
  aceitas: number;
  pendentesConfirmacao: number;
  enviadas: number;
  visualizadas: number;
  expirando: number;
  expiradas: number;
}

const ProposalsAlertCard: React.FC = () => {
  const navigate = useNavigate();
  const { value: expiringDays, updateValue } = useCardConfig('dashboard_proposals_expiring_days', 3);
  const [stats, setStats] = useState<ProposalStats>({
    aceitas: 0,
    pendentesConfirmacao: 0,
    enviadas: 0,
    visualizadas: 0,
    expirando: 0,
    expiradas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposalStats = async () => {
      try {
        const now = new Date();
        const expiringDate = new Date(now.getTime() + expiringDays * 24 * 60 * 60 * 1000);

        // Buscar todas as propostas relevantes
        const { data, error } = await supabase
          .from('proposals')
          .select('id, status, expires_at')
          .in('status', ['enviada', 'visualizada', 'aceita', 'pendente_confirmacao']);

        if (error) {
          console.error('[ProposalsAlertCard] Error:', error);
          return;
        }

        let aceitas = 0;
        let pendentesConfirmacao = 0;
        let enviadas = 0;
        let visualizadas = 0;
        let expirando = 0;
        let expiradas = 0;

        data?.forEach(proposal => {
          // Contagem por status
          if (proposal.status === 'aceita') {
            aceitas++;
          } else if (proposal.status === 'pendente_confirmacao') {
            pendentesConfirmacao++;
          } else if (proposal.status === 'enviada') {
            enviadas++;
            // Verificar expiração
            if (proposal.expires_at) {
              const expiresAt = new Date(proposal.expires_at);
              if (expiresAt < now) {
                expiradas++;
              } else if (expiresAt < expiringDate) {
                expirando++;
              }
            }
          } else if (proposal.status === 'visualizada') {
            visualizadas++;
            // Verificar expiração
            if (proposal.expires_at) {
              const expiresAt = new Date(proposal.expires_at);
              if (expiresAt < now) {
                expiradas++;
              } else if (expiresAt < expiringDate) {
                expirando++;
              }
            }
          }
        });

        setStats({
          aceitas,
          pendentesConfirmacao,
          enviadas,
          visualizadas,
          expirando,
          expiradas
        });
      } catch (err) {
        console.error('[ProposalsAlertCard] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProposalStats();

    // Subscribe to changes
    const channel = supabase
      .channel('proposals_dashboard_monitor')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'proposals'
      }, () => {
        fetchProposalStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [expiringDays]);

  const totalPendentes = stats.enviadas + stats.visualizadas;
  const totalAguardando = stats.aceitas + stats.pendentesConfirmacao;

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-gray-200 rounded w-24" />
        </CardHeader>
        <CardContent>
          <div className="h-16 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.005] transition-all duration-300 ease-out">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm md:text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-500" />
            Propostas
          </div>
          <CardConfigPopover
            label="Dias para alerta de expiração"
            unit="dias"
            value={expiringDays}
            onSave={updateValue}
            min={1}
            max={30}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Seção 1: Aceitas/Pendentes Confirmação (TOPO - verde) */}
        {totalAguardando > 0 && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Aguardando confirmação</span>
              </div>
              <span className="text-xl font-bold text-emerald-700">{totalAguardando}</span>
            </div>
            <div className="flex gap-2 mt-1.5">
              {stats.aceitas > 0 && (
                <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-300">
                  {stats.aceitas} aceitas
                </Badge>
              )}
              {stats.pendentesConfirmacao > 0 && (
                <Badge variant="outline" className="text-[10px] bg-blue-100 text-blue-700 border-blue-300">
                  {stats.pendentesConfirmacao} pendentes
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Seção 2: Enviadas/Visualizadas (MEIO - amber) */}
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Aguardando resposta</span>
            </div>
            <span className="text-xl font-bold text-amber-700">{totalPendentes}</span>
          </div>
          <div className="flex gap-2 mt-1.5">
            {stats.enviadas > 0 && (
              <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">
                {stats.enviadas} enviadas
              </Badge>
            )}
            {stats.visualizadas > 0 && (
              <Badge variant="outline" className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-300">
                {stats.visualizadas} visualizadas
              </Badge>
            )}
          </div>
          
          {/* Alertas de expiração */}
          {(stats.expirando > 0 || stats.expiradas > 0) && (
            <div className="flex gap-2 mt-2">
              {stats.expirando > 0 && (
                <Badge className="text-[10px] bg-orange-100 text-orange-700 border-orange-300">
                  <Clock className="h-3 w-3 mr-1" />
                  {stats.expirando} expirando
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Seção 3: Expiradas (EMBAIXO - vermelho sutil) */}
        {stats.expiradas > 0 && (
          <div className="p-2.5 rounded-lg bg-red-50/70 border border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700">Expiradas</span>
              </div>
              <span className="text-xl font-bold text-red-700">{stats.expiradas}</span>
            </div>
            <p className="text-[10px] text-red-600 mt-1">
              Propostas que passaram do prazo sem resposta
            </p>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => navigate('/admin/proposals')}
        >
          Ver propostas
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProposalsAlertCard;
