import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Mic, 
  Paperclip, 
  Bot, 
  User, 
  Loader2,
  Building2,
  Users,
  Handshake,
  Sparkles,
  CheckCircle2,
  Copy,
  Bug,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { LegalFlowData } from '@/hooks/useLegalFlow';
import { VoiceRecordButton } from './VoiceRecordButton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  actions?: { label: string; value: string; icon?: React.ElementType }[];
  isTyping?: boolean;
}

interface ContractInterviewerProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onActionClick: (value: string) => void;
  onVoiceInput: (audioBlob: Blob) => void;
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  currentData: LegalFlowData;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial',
  role: 'assistant',
  content: 'Olá Jeferson. Vamos iniciar a criação do contrato. É um contrato de **Anunciante**, **Síndico/Comodato** ou uma **Parceria Estratégica**?',
  timestamp: new Date(),
  actions: [
    { label: 'Anunciante', value: 'anunciante', icon: Building2 },
    { label: 'Síndico/Comodato', value: 'comodato', icon: Users },
    { label: 'Parceria/Permuta', value: 'permuta', icon: Handshake },
  ]
};

export function ContractInterviewer({
  messages,
  onSendMessage,
  onActionClick,
  onVoiceInput,
  onFileUpload,
  isProcessing,
  currentData
}: ContractInterviewerProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isProcessing) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, isProcessing, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  const formatMessageContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
  };

  const allMessages = messages.length === 0 ? [INITIAL_MESSAGE] : messages;

  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Capture console logs for debugging
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: string, ...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString('pt-BR');
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      setDebugLogs(prev => [...prev.slice(-99), `[${timestamp}] [${type}] ${message}`]);
    };

    console.log = (...args) => { addLog('LOG', ...args); originalLog.apply(console, args); };
    console.error = (...args) => { addLog('ERROR', ...args); originalError.apply(console, args); };
    console.warn = (...args) => { addLog('WARN', ...args); originalWarn.apply(console, args); };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const copyMessageToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('📋 Mensagem copiada!');
  };

  const copyAllConversation = () => {
    const conversation = allMessages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(conversation);
    toast.success('📋 Conversa completa copiada!');
  };

  const copyDebugLogs = () => {
    const logsText = debugLogs.join('\n');
    const fullDebug = JSON.stringify({
      timestamp: new Date().toISOString(),
      route: window.location.pathname,
      currentData,
      messages: allMessages,
      consoleLogs: debugLogs,
    }, null, 2);
    navigator.clipboard.writeText(fullDebug);
    toast.success('🐛 Logs de debug copiados para análise!');
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] rounded-xl shadow-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Assistente Jurídico IA</h3>
            <p className="text-xs text-gray-500">Converse naturalmente para criar o contrato</p>
          </div>
          
          {/* Debug & Copy buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={copyAllConversation}
              className="h-8 w-8 text-gray-500 hover:text-[#9C1E1E] hover:bg-[#9C1E1E]/10"
              title="Copiar conversa"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className={cn(
                "h-8 w-8 hover:bg-[#9C1E1E]/10",
                showDebugPanel ? "text-[#9C1E1E] bg-[#9C1E1E]/10" : "text-gray-500 hover:text-[#9C1E1E]"
              )}
              title="Ver logs de debug"
            >
              <Bug className="h-4 w-4" />
            </Button>
          </div>

          {isProcessing && (
            <Badge variant="secondary" className="animate-pulse bg-[#9C1E1E]/10 text-[#9C1E1E]">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Processando...
            </Badge>
          )}
        </div>
      </div>

      {/* Debug Panel */}
      {showDebugPanel && (
        <div className="flex-shrink-0 border-b bg-gray-900 text-green-400 max-h-48 overflow-hidden">
          <div className="flex items-center justify-between p-2 border-b border-gray-700">
            <span className="text-xs font-mono flex items-center gap-2">
              <Bug className="h-3 w-3" />
              Debug Console ({debugLogs.length} logs)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyDebugLogs}
                className="h-6 text-xs text-green-400 hover:text-green-300 hover:bg-gray-800"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar Tudo
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDebugPanel(false)}
                className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-32 p-2">
            <pre className="text-[10px] font-mono whitespace-pre-wrap">
              {debugLogs.length > 0 ? debugLogs.join('\n') : 'Nenhum log capturado ainda...'}
            </pre>
          </ScrollArea>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-full">
          {allMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm',
                message.role === 'assistant' 
                  ? 'bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] text-white' 
                  : 'bg-gradient-to-br from-slate-600 to-slate-700 text-white'
              )}>
                {message.role === 'assistant' ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
              </div>

              {/* Content */}
              <div className={cn(
                'flex-1 max-w-[85%]',
                message.role === 'user' ? 'text-right' : ''
              )}>
                <div className="group relative">
                  <div
                    className={cn(
                      'inline-block p-3 rounded-2xl text-sm shadow-sm',
                      message.role === 'assistant'
                        ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm'
                        : 'bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-tr-sm'
                    )}
                  >
                    {message.isTyping ? (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      <div 
                        dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                        className="whitespace-pre-wrap select-text cursor-text"
                      />
                    )}
                  </div>
                  
                  {/* Copy button on hover */}
                  {!message.isTyping && (
                    <button
                      onClick={() => copyMessageToClipboard(message.content)}
                      className={cn(
                        "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-gray-800/80 text-white hover:bg-gray-700",
                        message.role === 'user' ? 'left-1' : 'right-1'
                      )}
                      title="Copiar mensagem"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Action buttons */}
                {message.actions && message.actions.length > 0 && !isProcessing && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {message.actions.map((action, idx) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() => onActionClick(action.value)}
                          className="bg-white hover:bg-[#9C1E1E]/5 hover:border-[#9C1E1E]/30 hover:text-[#9C1E1E] transition-all"
                        >
                          {Icon && <Icon className="h-3.5 w-3.5 mr-1.5" />}
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>
                )}

                {/* Timestamp */}
                <p className={cn(
                  'text-[10px] text-gray-400 mt-1',
                  message.role === 'user' ? 'text-right' : ''
                )}>
                  {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Detected scenario hints */}
          {currentData.tipo_contrato && !isProcessing && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-green-800">
                Tipo detectado: <strong>{currentData.tipo_contrato}</strong>
                {currentData.parceiro_nome && <> • Parceiro: <strong>{currentData.parceiro_nome}</strong></>}
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Redesenhado */}
      <div className="flex-shrink-0 p-4 border-t bg-white">
        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            'Portal da Cidade - permuta',
            'SECOVI - institucional',
            'Comodato com síndico',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputValue(prompt);
                inputRef.current?.focus();
              }}
              className="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-[#9C1E1E]/10 text-gray-600 hover:text-[#9C1E1E] rounded-full transition-colors flex items-center gap-1"
              disabled={isProcessing}
            >
              <Sparkles className="h-3 w-3" />
              {prompt}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex items-end gap-2">
          {/* File upload button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-10 w-10 text-gray-500 hover:text-[#9C1E1E] hover:bg-[#9C1E1E]/10"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Voice button - Texto vai para o campo para revisão */}
          <VoiceRecordButton
            onTranscriptionComplete={(text) => {
              setInputValue(text);
              inputRef.current?.focus();
            }}
            disabled={isProcessing}
            variant="inline"
          />

          {/* Text input */}
          <div className="flex-1">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva o contrato ou faça perguntas..."
              className="min-h-[44px] max-h-32 resize-none rounded-xl border-gray-200 focus:border-[#9C1E1E]/30 focus:ring-[#9C1E1E]/20"
              disabled={isProcessing}
              rows={1}
            />
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] hover:from-[#8B1A1A] hover:to-[#6D1414] shadow-lg"
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
