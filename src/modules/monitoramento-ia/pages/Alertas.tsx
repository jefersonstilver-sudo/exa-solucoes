import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EXAAlertsHeader } from '../components/exa-alerts/EXAAlertsHeader';
import { AlertaCEOCard } from '../components/exa-alerts/AlertaCEOCard';
import { AlertaPropostasCard } from '../components/exa-alerts/AlertaPropostasCard';
import { AlertCard } from '../components/exa-alerts/AlertCard';
import { AddAlertDialog } from '../components/exa-alerts/AddAlertDialog';
import { supabase } from '@/integrations/supabase/client';

interface AlertRule {
  id: string;
  nome: string;
  tipo: string;
  descricao?: string;
  template_mensagem?: string;
  ativo: boolean;
}

export const AlertasPage = () => {
  const [stats, setStats] = useState({
    totalDirectors: 0,
    alertsToday: 0,
    successRate: 0
  });
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [addAlertOpen, setAddAlertOpen] = useState(false);

  useEffect(() => {
    loadStats();
    loadAlerts();
  }, []);

  const loadStats = async () => {
    try {
      // Get directors count
      const { count: directorsCount } = await supabase
        .from('exa_alerts_directors')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      // Get today's alerts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: alertsCount } = await supabase
        .from('exa_alerts_history')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Calculate success rate
      const { data: todayAlerts } = await supabase
        .from('exa_alerts_history')
        .select('status')
        .gte('created_at', today.toISOString());

      const successCount = todayAlerts?.filter(a => 
        ['entregue', 'lido', 'respondido'].includes(a.status)
      ).length || 0;
      
      const successRate = todayAlerts?.length 
        ? Math.round((successCount / todayAlerts.length) * 100) 
        : 100;

      setStats({
        totalDirectors: directorsCount || 0,
        alertsToday: alertsCount || 0,
        successRate
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('exa_alerts_rules')
        .select('*')
        .neq('tipo', 'ceo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const handleToggleAlert = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exa_alerts_rules')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadAlerts();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este alerta?')) return;
    
    try {
      const { error } = await supabase
        .from('exa_alerts_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-6 md:pb-8 px-4 md:px-0">
      {/* Header with Stats - Mobile Responsive */}
      <div className="flex flex-col gap-4">
        <div className="w-full">
          <EXAAlertsHeader stats={stats} />
        </div>
        <Button 
          onClick={() => setAddAlertOpen(true)}
          size="lg"
          className="w-full md:w-auto bg-gradient-to-r from-[#9C1E1E] to-[#D72638] hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 h-12 md:h-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Alerta
        </Button>
      </div>

      {/* Alerts Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 md:space-y-6"
      >
        {/* CEO Alert Card (Special) */}
        <AlertaCEOCard />

        {/* Proposals Alert Card */}
        <AlertaPropostasCard />

        {/* Other Alerts Grid */}
        {alerts.length > 0 && (
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                nome={alert.nome}
                tipo={alert.tipo}
                descricao={alert.descricao}
                template={alert.template_mensagem}
                ativo={alert.ativo}
                onToggle={() => handleToggleAlert(alert.id, alert.ativo)}
                onEdit={() => {}}
                onDelete={() => handleDeleteAlert(alert.id)}
                onPreview={() => {}}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {alerts.length === 0 && (
          <div className="text-center py-12 bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md rounded-xl lg:rounded-2xl border border-white/20 dark:border-white/10 shadow-lg">
            <p className="text-muted-foreground">Nenhum alerta configurado ainda.</p>
          </div>
        )}
      </motion.div>

      {/* Add Alert Dialog */}
      <AddAlertDialog open={addAlertOpen} onOpenChange={setAddAlertOpen} />
    </div>
  );
};
