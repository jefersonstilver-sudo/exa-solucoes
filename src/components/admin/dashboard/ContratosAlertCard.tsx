import React, { useState, useEffect } from 'react';
import { FileText, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePrivacyModeStore } from '@/hooks/usePrivacyMode';

interface PropostaPendente {
  id: string;
  clientName: string;
  companyName: string | null;
  valorDisplay: number;
  isMonthly: boolean;
  daysUntilExpire: number;
  expired: boolean;
}

const ContratosAlertCard: React.FC = () => {
  const navigate = useNavigate();
  const [propostas, setPropostas] = useState<PropostaPendente[]>([]);
  const [loading, setLoading] = useState(true);
  const { isPrivate } = usePrivacyModeStore();

  useEffect(() => {
    const fetchPropostasPendentes = async () => {
      try {
        const { data, error } = await supabase
          .from('proposals')
          .select(`
            id,
            client_name,
            client_company_name,
            expires_at,
            is_custom_days,
            custom_days,
            payment_type,
            fidel_monthly_value,
            cash_total_value,
            custom_installments
          `)
          .in('status', ['enviada', 'atualizada', 'visualizada'])
          .order('expires_at', { ascending: true });

        if (error) {
          console.error('[ContratosAlertCard] Error:', error);
          return;
        }

        const now = new Date();
        
        const propostasList: PropostaPendente[] = (data || []).map(p => {
          const expiresAt = p.expires_at ? new Date(p.expires_at) : null;
          const diffMs = expiresAt ? expiresAt.getTime() - now.getTime() : 0;
          const daysUntilExpire = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const expired = expiresAt ? expiresAt < now : false;

          // Calcular valor a exibir baseado em is_custom_days
          let valorDisplay = 0;
          let isMonthly = false;

          if (p.is_custom_days) {
            // Período em DIAS: mostrar valor TOTAL
            const customInstallments = p.custom_installments as any[] | null;
            if (customInstallments && Array.isArray(customInstallments)) {
              valorDisplay = customInstallments.reduce((sum, inst) => sum + (inst.amount || 0), 0);
            } else {
              valorDisplay = p.cash_total_value || 0;
            }
            isMonthly = false;
          } else {
            // Período MENSAL
            if (p.payment_type === 'pix_avista' || p.payment_type === 'cartao') {
              valorDisplay = p.cash_total_value || 0;
              isMonthly = false;
            } else {
              valorDisplay = p.fidel_monthly_value || 0;
              isMonthly = true;
            }
          }

          return {
            id: p.id,
            clientName: p.client_name || 'Cliente',
            companyName: p.client_company_name,
            valorDisplay,
            isMonthly,
            daysUntilExpire,
            expired
          };
        });

        setPropostas(propostasList);
      } catch (err) {
        console.error('[ContratosAlertCard] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPropostasPendentes();

    // Subscribe to changes
    const channel = supabase
      .channel('propostas_pendentes_dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'proposals'
      }, () => {
        fetchPropostasPendentes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderCurrency = (value: number) => {
    return isPrivate ? '•••••' : formatCurrency(value);
  };

  const getExpirationBadge = (days: number, expired: boolean) => {
    if (expired) {
      return (
        <Badge className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-700 border-red-300 whitespace-nowrap">
          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
          Expirada
        </Badge>
      );
    }
    if (days <= 3) {
      return (
        <Badge className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-700 border-orange-300 whitespace-nowrap">
          <Clock className="h-2.5 w-2.5 mr-0.5" />
          {days}d
        </Badge>
      );
    }
    return (
      <Badge className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 border-green-300 whitespace-nowrap">
        <Clock className="h-2.5 w-2.5 mr-0.5" />
        {days}d
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-5 bg-gray-200 rounded w-32" />
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.2)] hover:scale-[1.01] hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm md:text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Propostas Aguardando
          </div>
          <Badge variant="secondary" className="text-xs">
            {propostas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-0">
        {propostas.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center py-4">
            <p className="text-sm text-muted-foreground">
              Nenhuma proposta pendente
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-2 px-2" style={{ maxHeight: '180px' }}>
            <div className="space-y-2">
              {propostas.map((proposta) => (
                <div 
                  key={proposta.id}
                  className="p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/propostas/${proposta.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {proposta.companyName || proposta.clientName}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-semibold">
                        {renderCurrency(proposta.valorDisplay)}
                        {proposta.isMonthly && !isPrivate && <span className="text-[9px] text-muted-foreground font-normal">/mês</span>}
                      </p>
                    </div>
                    {getExpirationBadge(proposta.daysUntilExpire, proposta.expired)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={() => navigate('/admin/propostas')}
        >
          Ver propostas
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContratosAlertCard;
