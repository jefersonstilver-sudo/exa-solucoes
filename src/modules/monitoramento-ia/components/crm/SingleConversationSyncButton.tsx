import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SingleSyncResult {
  success: boolean;
  conversation_id: string;
  contact_name: string;
  contact_phone: string;
  stats: {
    messages_before: number;
    messages_after: number;
    messages_synced: number;
    messages_outbound_synced: number;
    messages_inbound_synced: number;
    duplicates_skipped: number;
    zapi_messages_fetched: number;
    errors: string[];
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
  const [result, setResult] = useState<SingleSyncResult | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);

    try {
      console.log('[SINGLE-SYNC] Sincronizando conversa:', conversationId);
      
      const { data, error } = await supabase.functions.invoke('sync-single-conversation', {
        body: { conversationId, phone: contactPhone }
      });

      if (error) throw error;

      console.log('[SINGLE-SYNC] Resultado:', data);
      setResult(data);
      setShowResult(true);
      onSyncComplete?.();
    } catch (error) {
      console.error('[SINGLE-SYNC] Erro:', error);
      setResult({
        success: false,
        conversation_id: conversationId,
        contact_name: contactName || '',
        contact_phone: contactPhone || '',
        stats: {
          messages_before: 0,
          messages_after: 0,
          messages_synced: 0,
          messages_outbound_synced: 0,
          messages_inbound_synced: 0,
          duplicates_skipped: 0,
          zapi_messages_fetched: 0,
          errors: [String(error)]
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
                <p className="text-sm font-medium">{result.contact_name || 'Contato'}</p>
                <p className="text-xs text-muted-foreground">{result.contact_phone}</p>
              </div>

              {/* Stats principais */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/10 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ArrowDownCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-xl font-bold">{result.stats.messages_inbound_synced}</p>
                  <p className="text-xs text-muted-foreground">Recebidas</p>
                </div>
                <div className="bg-green-500/10 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <ArrowUpCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-xl font-bold">{result.stats.messages_outbound_synced}</p>
                  <p className="text-xs text-muted-foreground">Enviadas</p>
                </div>
              </div>

              {/* Detalhes */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Antes</span>
                  <span>{result.stats.messages_before} msgs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Depois</span>
                  <span className="font-semibold text-green-600">{result.stats.messages_after} msgs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Do Z-API</span>
                  <span>{result.stats.zapi_messages_fetched}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duplicatas</span>
                  <span>{result.stats.duplicates_skipped}</span>
                </div>
              </div>

              {/* Erros */}
              {result.stats.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-xs font-medium text-red-500 mb-1">Avisos:</p>
                  {result.stats.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-400 truncate">{err}</p>
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
