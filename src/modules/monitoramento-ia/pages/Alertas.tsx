import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EXAAlertsHeader } from '../components/exa-alerts/EXAAlertsHeader';
import { DirectorsSection } from '../components/exa-alerts/DirectorsSection';
import { PeriodsSection } from '../components/exa-alerts/PeriodsSection';
import { TemplatesSection } from '../components/exa-alerts/TemplatesSection';
import { HistorySection } from '../components/exa-alerts/HistorySection';
import { supabase } from '@/integrations/supabase/client';

export const AlertasPage = () => {
  const [stats, setStats] = useState({
    totalDirectors: 0,
    alertsToday: 0,
    successRate: 0
  });

  useEffect(() => {
    loadStats();
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

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Stats */}
      <EXAAlertsHeader stats={stats} />

      {/* Tabs Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs defaultValue="directors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 bg-white/50 backdrop-blur-sm p-1 rounded-2xl border border-gray-200">
            <TabsTrigger 
              value="directors" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9C1E1E] data-[state=active]:to-[#D72638] data-[state=active]:text-white py-3"
            >
              📞 Diretores
            </TabsTrigger>
            <TabsTrigger 
              value="periods"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9C1E1E] data-[state=active]:to-[#D72638] data-[state=active]:text-white py-3"
            >
              ⏰ Períodos
            </TabsTrigger>
            <TabsTrigger 
              value="templates"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9C1E1E] data-[state=active]:to-[#D72638] data-[state=active]:text-white py-3"
            >
              📝 Templates
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#9C1E1E] data-[state=active]:to-[#D72638] data-[state=active]:text-white py-3"
            >
              📊 Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directors" className="space-y-6">
            <DirectorsSection />
          </TabsContent>

          <TabsContent value="periods" className="space-y-6">
            <PeriodsSection />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <TemplatesSection />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistorySection />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};
