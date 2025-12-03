import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ForceSyncResult {
  success: boolean;
  error?: string;
  stats: {
    recuperadas: number;
    outbound: number;
    inbound: number;
    duplicatas: number;
    erros: number;
    zapi_logs_total: number;
    debug_messages: string[];
  };
  conversation: {
    id: string;
    contact_name: string;
    contact_phone: string;
    total_messages: number;
    outbound_count: number;
    inbound_count: number;
  };
}

interface SingleConversationSyncButtonProps {
  conversationId: string;
  contactPhone?: string;
  contactName?: string;
  onSyncComplete?: () => void;
  className?: string;
}

export const SingleConversationSyncButton: React.FC<SingleConversationSyncButtonProps> = ({
  conversationId,
  contactPhone,
  contactName,
  onSyncComplete,
  className
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<ForceSyncResult | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);

    try {
      console.log('[FORCE-SYNC] Sincronizando conversa:', conversationId);
      
      // Chama force-sync-zapi-conversation que usa zapi_logs (funciona com multi-device)
      const { data, error } = await supabase.functions.invoke('force-sync-zapi-conversation', {
        body: { conversationId }
      });

      if (error) throw error;

      console.log('[FORCE-SYNC] Resultado:', data);
      setResult(data);
      setShowResult(true);
      onSyncComplete?.();
    } catch (error) {
      console.error('[FORCE-SYNC] Erro:', error);
      setResult({
        success: false,
        error: String(error),
        stats: {
          recuperadas: 0,
          outbound: 0,
          inbound: 0,
          duplicatas: 0,
          erros: 1,
          zapi_logs_total: 0,
          debug_messages: [String(error)]
        },
        conversation: {
          id: conversationId,
          contact_name: contactName || '',
          contact_phone: contactPhone || '',
          total_messages: 0,
          outbound_count: 0,
          inbound_count: 0
        }
      });
      setShowResult(true);
    } finally {
      setIsSyncing(false);
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
        title={isSyncing ? 'Sincronizando esta conversa...' : 'Sincronizar esta conversa'}
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
              <motion.div
                className="absolute inset-1 rounded-full border-2 border-primary/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-1 rounded-full border-t-2 border-primary"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              <RefreshCw className="w-4 h-4 text-primary animate-spin" />
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

      {/* Modal de Resultado */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-sm bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-border/30 shadow-2xl">
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
                  Conversa Sincronizada
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
              {/* Info do contato */}
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-sm font-medium">{result.conversation?.contact_name || contactName || 'Contato'}</p>
                <p className="text-xs text-muted-foreground">{result.conversation?.contact_phone || contactPhone}</p>
              </div>

              {/* Stats principais */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/10 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ArrowDownCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xl font-bold">{result.stats.inbound}</p>
                  <p className="text-xs text-muted-foreground">Recebidas</p>
                </div>
                <div className="bg-green-500/10 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ArrowUpCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-xl font-bold">{result.stats.outbound}</p>
                  <p className="text-xs text-muted-foreground">Enviadas</p>
                </div>
              </div>

              {/* Detalhes */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recuperadas</span>
                  <span className="font-semibold text-green-600">+{result.stats.recuperadas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Conversa</span>
                  <span>{result.conversation?.total_messages || 0} msgs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Logs Z-API</span>
                  <span>{result.stats.zapi_logs_total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duplicatas</span>
                  <span>{result.stats.duplicatas}</span>
                </div>
              </div>

              {/* Erros */}
              {(result.stats.erros > 0 || result.stats.debug_messages.length > 0) && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-xs font-medium text-red-500 mb-1">Avisos:</p>
                  {result.stats.debug_messages.map((msg, i) => (
                    <p key={i} className="text-xs text-red-400 truncate">{msg}</p>
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
