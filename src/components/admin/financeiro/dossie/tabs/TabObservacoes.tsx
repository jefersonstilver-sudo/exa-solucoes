/**
 * TabObservacoes - Notas e observações do lançamento
 * Timeline de comentários com autor e timestamp
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageSquare, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Observacao } from '../types';

interface TabObservacoesProps {
  observacoes: Observacao[];
  onAdd: (conteudo: string) => Promise<boolean>;
}

const TabObservacoes: React.FC<TabObservacoesProps> = ({
  observacoes,
  onAdd
}) => {
  const [novaObservacao, setNovaObservacao] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!novaObservacao.trim()) return;
    
    setSending(true);
    const success = await onAdd(novaObservacao);
    if (success) {
      setNovaObservacao('');
    }
    setSending(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* New observation form */}
      <div className="space-y-3">
        <Textarea
          value={novaObservacao}
          onChange={(e) => setNovaObservacao(e.target.value)}
          placeholder="Adicione uma observação, justificativa ou contexto..."
          className="min-h-[100px] bg-white resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Cmd/Ctrl + Enter para enviar
          </p>
          <Button 
            onClick={handleSubmit}
            disabled={!novaObservacao.trim() || sending}
            size="sm"
          >
            <Send className="h-4 w-4 mr-1.5" />
            {sending ? 'Enviando...' : 'Adicionar'}
          </Button>
        </div>
      </div>

      {/* Observations timeline */}
      {observacoes.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">
            Histórico de Observações ({observacoes.length})
          </h3>
          
          <div className="space-y-3">
            {observacoes.map((obs, index) => (
              <div
                key={obs.id}
                className="relative pl-6 pb-4"
              >
                {/* Timeline line */}
                {index < observacoes.length - 1 && (
                  <div className="absolute left-[9px] top-6 bottom-0 w-px bg-gray-200" />
                )}
                
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>

                {/* Content */}
                <div className="bg-gray-50 rounded-lg p-4 ml-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {obs.autor_nome || 'Usuário'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(obs.created_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {obs.conteudo}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhuma observação registrada</p>
          <p className="text-xs text-gray-400 mt-1">
            Adicione notas, justificativas ou contexto
          </p>
        </div>
      )}
    </div>
  );
};

export default TabObservacoes;
