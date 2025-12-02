import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, MessageSquare, Users, ArrowDownCircle, ArrowUpCircle, History, MessageCircle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
  chatsSync?: {
    chats_from_zapi: number;
    conversations_created: number;
    conversations_updated: number;
    messages_synced: number;
    messages_outbound_synced: number;
    messages_inbound_synced: number;
    duplicates_skipped: number;
  };
}

interface SyncAllConversationsButtonProps {
  onSyncComplete?: () => void;
  className?: string;
}

export const SyncAllConversationsButton: React.FC<SyncAllConversationsButtonProps> = ({ 
  onSyncComplete,
  className 
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncPhase, setSyncPhase] = useState<'idle' | 'logs' | 'chats' | 'history'>('idle');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  const handleConfirm = () => {
    setShowConfirm(false);
    handleSync();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);
    setSyncPhase('logs');

    try {
      // FASE 1: Sincronizar do zapi_logs
      console.log('🔄 [SYNC-ALL] Fase 1: Sincronizando logs...');
      const { data: logsData, error: logsError } = await supabase.functions.invoke('sync-all-messages', {});

      if (logsError) throw logsError;

      // FASE 2: Sincronizar lista de chats do Z-API
      setSyncPhase('chats');
      console.log('🔄 [SYNC-ALL] Fase 2: Sincronizando chats do Z-API...');
      
      let chatsData = null;
      try {
        const { data: chatsResult, error: chatsError } = await supabase.functions.invoke('sync-whatsapp-chats', {});
        if (!chatsError && chatsResult) {
          chatsData = chatsResult.stats;
          console.log('✅ [SYNC-ALL] Chats Z-API sincronizados:', chatsData);
        }
      } catch (chatsErr) {
        console.warn('⚠️ [SYNC-ALL] Erro ao sincronizar chats (não crítico):', chatsErr);
      }

      // FASE 3: Buscar histórico direto do Z-API (fallback)
      setSyncPhase('history');
      console.log('🔄 [SYNC-ALL] Fase 3: Buscando histórico do Z-API...');
      
      let zapiHistoryData = null;
      try {
        const { data: historyData, error: historyError } = await supabase.functions.invoke('fetch-zapi-history', {});
        if (!historyError && historyData) {
          zapiHistoryData = historyData.stats;
          console.log('✅ [SYNC-ALL] Histórico Z-API recuperado:', zapiHistoryData);
        }
      } catch (historyErr) {
        console.warn('⚠️ [SYNC-ALL] Erro ao buscar histórico Z-API (não crítico):', historyErr);
      }

      // Combinar resultados
      const combinedResult: SyncResult = {
        ...logsData,
        zapiHistory: zapiHistoryData,
        chatsSync: chatsData,
        stats: {
          ...logsData.stats,
          messages_recovered: logsData.stats.messages_recovered + (zapiHistoryData?.messages_synced || 0) + (chatsData?.messages_synced || 0),
          messages_outbound_recovered: logsData.stats.messages_outbound_recovered + (zapiHistoryData?.messages_outbound_synced || 0) + (chatsData?.messages_outbound_synced || 0),
          messages_inbound_recovered: logsData.stats.messages_inbound_recovered + (zapiHistoryData?.messages_inbound_synced || 0) + (chatsData?.messages_inbound_synced || 0),
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
        variant="outline"
        size="sm"
        className={cn(
          "h-9 px-3 text-sm font-medium gap-2 transition-all duration-300",
          isSyncing && "bg-primary/10 border-primary/30",
          className
        )}
        onClick={() => setShowConfirm(true)}
        disabled={isSyncing}
      >
        <AnimatePresence mode="wait">
          {isSyncing ? (
            <motion.div
              key="syncing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              {syncPhase === 'logs' && <Database className="w-4 h-4 animate-pulse text-primary" />}
              {syncPhase === 'chats' && <MessageCircle className="w-4 h-4 animate-pulse text-green-500" />}
              {syncPhase === 'history' && <History className="w-4 h-4 animate-pulse text-purple-500" />}
              <span className="text-xs">
                {syncPhase === 'logs' && 'Logs...'}
                {syncPhase === 'chats' && 'Chats...'}
                {syncPhase === 'history' && 'Histórico...'}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync Completo</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Sincronização Completa
            </DialogTitle>
            <DialogDescription className="text-sm">
              Este processo sincroniza <strong>todas</strong> as conversas e pode demorar alguns minutos.
              Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="bg-primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Iniciar Sync
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Resultado */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-border/30 shadow-2xl max-h-[85vh] overflow-y-auto">
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
                  label="Msgs Recuperadas"
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

              {/* Stats Z-API Chats */}
              {result.chatsSync && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    Chats WhatsApp
                  </p>
                  <div className="bg-green-500/10 rounded-xl p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chats</span>
                      <span className="font-semibold">{result.chatsSync.chats_from_zapi}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Msgs sync</span>
                      <span className="font-semibold text-green-500">+{result.chatsSync.messages_synced}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Z-API History */}
              {result.zapiHistory && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <History className="w-3 h-3" />
                    Histórico Z-API
                  </p>
                  <div className="bg-purple-500/10 rounded-xl p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contatos</span>
                      <span className="font-semibold">{result.zapiHistory.contacts_processed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Msgs sync</span>
                      <span className="font-semibold text-green-500">+{result.zapiHistory.messages_synced}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Totais Finais */}
              <div className="bg-muted/50 rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Conversas</span>
                  <span className="font-semibold">{result.stats.conversations_total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Mensagens</span>
                  <span className="font-semibold">{result.stats.messages_total}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tempo</span>
                  <span>{(result.duration_ms / 1000).toFixed(2)}s</span>
                </div>
              </div>

              {/* Erros */}
              {result.stats.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-xs font-medium text-red-500 mb-1">Erros:</p>
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

// Componente auxiliar
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
      className={cn("rounded-xl p-3 transition-all duration-300", bgColor)}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </motion.div>
  );
};
