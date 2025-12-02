import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, MessageSquare, Users, ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SyncResult {
  success: boolean;
  timestamp: string;
  duration_ms: number;
  stats: {
    zapi_logs_total: number;
    messages_total: number;
    conversations_total: number;
    messages_recovered: number;
    messages_inbound_recovered: number;
    messages_outbound_recovered: number;
    conversations_created: number;
    duplicates_fixed: number;
    orphan_logs_found: number;
    errors: string[];
  };
  agents: {
    sofia: { conversations: number; messages: number; recovered: number };
    eduardo: { conversations: number; messages: number; recovered: number };
    others: { conversations: number; messages: number; recovered: number };
  };
  zapiHistory?: {
    contacts_processed: number;
    messages_fetched_from_zapi: number;
    messages_synced: number;
    messages_outbound_synced: number;
    messages_inbound_synced: number;
    duplicates_skipped: number;
  };
}

interface SyncMessagesButtonProps {
  onSyncComplete?: () => void;
  className?: string;
}

export const SyncMessagesButton: React.FC<SyncMessagesButtonProps> = ({ 
  onSyncComplete,
  className 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncPhase, setSyncPhase] = useState<'idle' | 'logs' | 'history'>('idle');
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);
    setSyncPhase('logs');

    try {
      // FASE 1: Sincronizar do zapi_logs
      console.log('🔄 [SYNC] Fase 1: Sincronizando logs...');
      const { data: logsData, error: logsError } = await supabase.functions.invoke('sync-all-messages', {});

      if (logsError) throw logsError;

      // FASE 2: Buscar histórico direto do Z-API
      setSyncPhase('history');
      console.log('🔄 [SYNC] Fase 2: Buscando histórico do Z-API...');
      
      let zapiHistoryData = null;
      try {
        const { data: historyData, error: historyError } = await supabase.functions.invoke('fetch-zapi-history', {});
        if (!historyError && historyData) {
          zapiHistoryData = historyData.stats;
          console.log('✅ [SYNC] Histórico Z-API recuperado:', zapiHistoryData);
        }
      } catch (historyErr) {
        console.warn('⚠️ [SYNC] Erro ao buscar histórico Z-API (não crítico):', historyErr);
      }

      // Combinar resultados
      const combinedResult: SyncResult = {
        ...logsData,
        zapiHistory: zapiHistoryData,
        stats: {
          ...logsData.stats,
          messages_recovered: logsData.stats.messages_recovered + (zapiHistoryData?.messages_synced || 0),
          messages_outbound_recovered: logsData.stats.messages_outbound_recovered + (zapiHistoryData?.messages_outbound_synced || 0),
          messages_inbound_recovered: logsData.stats.messages_inbound_recovered + (zapiHistoryData?.messages_inbound_synced || 0),
        }
      };

      setResult(combinedResult);
      setShowResult(true);
      onSyncComplete?.();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      setResult({
        success: false,
        timestamp: new Date().toISOString(),
        duration_ms: 0,
        stats: {
          zapi_logs_total: 0,
          messages_total: 0,
          conversations_total: 0,
          messages_recovered: 0,
          messages_inbound_recovered: 0,
          messages_outbound_recovered: 0,
          conversations_created: 0,
          duplicates_fixed: 0,
          orphan_logs_found: 0,
          errors: [String(error)]
        },
        agents: {
          sofia: { conversations: 0, messages: 0, recovered: 0 },
          eduardo: { conversations: 0, messages: 0, recovered: 0 },
          others: { conversations: 0, messages: 0, recovered: 0 }
        }
      });
      setShowResult(true);
    } finally {
      setIsSyncing(false);
      setSyncPhase('idle');
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "relative h-9 w-9 hover:bg-muted/80 transition-all duration-300",
          isSyncing && "bg-primary/10",
          className
        )}
        onClick={handleSync}
        disabled={isSyncing}
        title={isSyncing ? (syncPhase === 'logs' ? 'Sincronizando logs...' : 'Buscando histórico Z-API...') : 'Sincronizar todas as mensagens'}
      >
        <AnimatePresence mode="wait">
          {isSyncing ? (
            <motion.div
              key="syncing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {/* Círculo de progresso animado estilo Apple */}
              <motion.div
                className="absolute inset-1 rounded-full border-2 border-primary/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className={cn(
                  "absolute inset-1 rounded-full border-t-2",
                  syncPhase === 'logs' ? "border-primary" : "border-purple-500"
                )}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              {syncPhase === 'history' ? (
                <History className="w-4 h-4 text-purple-500 animate-pulse" />
              ) : (
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Modal de Resultado - Apple Glassmorphism Style - OPACIDADE AUMENTADA */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-border/30 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              {result?.success ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </motion.div>
                  Sincronização Completa
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Erro na Sincronização
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Stats Principais */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="Mensagens Recuperadas"
                  value={result.stats.messages_recovered}
                  highlight={result.stats.messages_recovered > 0}
                />
                <StatCard
                  icon={<Users className="w-4 h-4" />}
                  label="Conversas Criadas"
                  value={result.stats.conversations_created}
                  highlight={result.stats.conversations_created > 0}
                />
              </div>

              {/* Detalhes de Direção */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={<ArrowDownCircle className="w-4 h-4 text-blue-500" />}
                  label="Recebidas"
                  value={result.stats.messages_inbound_recovered}
                  variant="blue"
                />
                <StatCard
                  icon={<ArrowUpCircle className="w-4 h-4 text-green-500" />}
                  label="Enviadas"
                  value={result.stats.messages_outbound_recovered}
                  variant="green"
                />
              </div>

              {/* Divisor */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Stats Z-API History */}
              {result.zapiHistory && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3 h-3" />
                    Histórico Z-API
                  </p>
                  <div className="bg-purple-500/10 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contatos processados</span>
                      <span className="font-semibold">{result.zapiHistory.contacts_processed}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Msgs do WhatsApp</span>
                      <span className="font-semibold">{result.zapiHistory.messages_fetched_from_zapi}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sincronizadas</span>
                      <span className="font-semibold text-green-500">+{result.zapiHistory.messages_synced}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Duplicatas ignoradas</span>
                      <span>{result.zapiHistory.duplicates_skipped}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Divisor */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Stats por Agente */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Por Agente
                </p>
                <div className="space-y-2">
                  <AgentRow 
                    name="Sofia" 
                    emoji="🤖" 
                    conversations={result.agents.sofia.conversations}
                    messages={result.agents.sofia.messages}
                    recovered={result.agents.sofia.recovered}
                  />
                  <AgentRow 
                    name="Eduardo" 
                    emoji="👤" 
                    conversations={result.agents.eduardo.conversations}
                    messages={result.agents.eduardo.messages}
                    recovered={result.agents.eduardo.recovered}
                  />
                  {result.agents.others.conversations > 0 && (
                    <AgentRow 
                      name="Outros" 
                      emoji="📱" 
                      conversations={result.agents.others.conversations}
                      messages={result.agents.others.messages}
                      recovered={result.agents.others.recovered}
                    />
                  )}
                </div>
              </div>

              {/* Totais Finais */}
              <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total de Conversas</span>
                  <span className="font-semibold">{result.stats.conversations_total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total de Mensagens</span>
                  <span className="font-semibold">{result.stats.messages_total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Logs Z-API</span>
                  <span className="font-semibold">{result.stats.zapi_logs_total}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tempo de execução</span>
                  <span>{(result.duration_ms / 1000).toFixed(2)}s</span>
                </div>
              </div>

              {/* Erros se houver */}
              {result.stats.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-xs font-medium text-red-500 mb-1">Erros encontrados:</p>
                  {result.stats.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400">{err}</p>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Componentes auxiliares
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
  variant?: 'default' | 'blue' | 'green';
}> = ({ icon, label, value, highlight, variant = 'default' }) => {
  const bgColor = {
    default: highlight ? 'bg-primary/10' : 'bg-muted/50',
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10'
  }[variant];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-xl p-3 transition-all duration-300",
        bgColor
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn(
        "text-2xl font-bold",
        highlight && "text-primary"
      )}>
        {value}
      </p>
    </motion.div>
  );
};

const AgentRow: React.FC<{
  name: string;
  emoji: string;
  conversations: number;
  messages: number;
  recovered: number;
}> = ({ name, emoji, conversations, messages, recovered }) => (
  <div className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
    <div className="flex items-center gap-2">
      <span className="text-lg">{emoji}</span>
      <span className="font-medium text-sm">{name}</span>
    </div>
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>{conversations} conversas</span>
      <span>{messages} msgs</span>
      {recovered > 0 && (
        <span className="text-green-500 font-medium">+{recovered}</span>
      )}
    </div>
  </div>
);

export default SyncMessagesButton;
