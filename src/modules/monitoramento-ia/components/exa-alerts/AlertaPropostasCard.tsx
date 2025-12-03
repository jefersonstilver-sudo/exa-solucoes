import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, FileText, Send, Eye, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProposalStats {
  total: number;
  enviadas: number;
  visualizadas: number;
  aceitas: number;
  recusadas: number;
}

export const AlertaPropostasCard = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [stats, setStats] = useState<ProposalStats>({
    total: 0,
    enviadas: 0,
    visualizadas: 0,
    aceitas: 0,
    recusadas: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get proposal stats
      const { data: proposals, error } = await supabase
        .from('proposals')
        .select('status');

      if (error) throw error;

      const statusCounts = proposals?.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setStats({
        total: proposals?.length || 0,
        enviadas: statusCounts['enviada'] || 0,
        visualizadas: statusCounts['visualizada'] || 0,
        aceitas: statusCounts['aceita'] || 0,
        recusadas: statusCounts['recusada'] || 0
      });
    } catch (error) {
      console.error('Error loading proposal stats:', error);
    }
  };

  const statItems = [
    { icon: Send, label: 'Enviadas', value: stats.enviadas, color: 'text-blue-500' },
    { icon: Eye, label: 'Visualizadas', value: stats.visualizadas, color: 'text-amber-500' },
    { icon: CheckCircle, label: 'Aceitas', value: stats.aceitas, color: 'text-emerald-500' },
    { icon: XCircle, label: 'Recusadas', value: stats.recusadas, color: 'text-red-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card 
        className="group bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md border-2 border-blue-500/30 dark:border-blue-500/30 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-xl lg:rounded-2xl transition-all cursor-pointer hover:shadow-xl shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  Alertas de Propostas
                </h3>
                <p className="text-xs text-muted-foreground">
                  Notificações de propostas comerciais
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="text-xs bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/30 dark:border-blue-500/30 hidden sm:inline-flex"
              >
                📄 {stats.total} propostas
              </Badge>
              <Switch 
                checked={ativo} 
                onCheckedChange={(checked) => {
                  setAtivo(checked);
                }}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-blue-600"
              />
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-4 pt-0" onClick={(e) => e.stopPropagation()}>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {statItems.map((item, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-muted/50 rounded-lg text-center"
                  >
                    <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.color}`} />
                    <p className="text-lg font-bold">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Alert Types */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  📬 Tipos de Alertas
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-medium">Proposta Aceita</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium">Proposta Visualizada</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600">
                      Ativo
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">Proposta Recusada</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-red-500/30 text-red-600">
                      Ativo
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-xs text-muted-foreground">
                  💡 Os alertas de propostas são enviados automaticamente via WhatsApp para os diretores 
                  cadastrados quando uma proposta é visualizada, aceita ou recusada pelo cliente.
                </p>
              </div>
            </CardContent>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
};
