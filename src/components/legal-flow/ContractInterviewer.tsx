import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { LegalFlowData } from '@/hooks/useLegalFlow';
import { VoiceRecordButton } from './VoiceRecordButton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

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
  content: 'Olá! Vamos criar seu contrato. Qual o tipo?',
  timestamp: new Date(),
  actions: [
    { label: 'Anunciante', value: 'anunciante', icon: Building2 },
    { label: 'Síndico/Comodato', value: 'comodato', icon: Users },
    { label: 'Parceria/Permuta', value: 'permuta', icon: Handshake },
  ]
};

// Action Card Component - Premium Grid Style
function ActionCard({ 
  icon: Icon, 
  label, 
  subtitle, 
  onClick,
  disabled 
}: { 
  icon: React.ElementType; 
  label: string; 
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300",
        "bg-white hover:bg-gradient-to-br hover:from-[#9C1E1E]/5 hover:to-transparent",
        "border-gray-200 hover:border-[#9C1E1E]/40 hover:shadow-lg",
        "group cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300",
        "bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-[#9C1E1E]/10 group-hover:to-[#9C1E1E]/5",
        "shadow-sm group-hover:shadow-md"
      )}>
        <Icon className="h-7 w-7 text-gray-500 group-hover:text-[#9C1E1E] transition-colors" />
      </div>
      <span className="font-bold text-gray-900 text-base group-hover:text-[#9C1E1E] transition-colors">
        {label}
      </span>
      <span className="text-xs text-gray-500 mt-1">{subtitle}</span>
    </button>
  );
}

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
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-[#9C1E1E]">$1</code>');
  };

  const allMessages = messages.length === 0 ? [INITIAL_MESSAGE] : messages;
  const showInitialCards = messages.length === 0;

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
          {/* Initial Action Cards - Premium Grid */}
          {showInitialCards && (
            <div className="space-y-4">
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] text-white shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="inline-block p-3 rounded-2xl text-sm shadow-sm bg-white border border-gray-100 text-gray-800 rounded-tl-sm">
                    <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatMessageContent(INITIAL_MESSAGE.content)) }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {INITIAL_MESSAGE.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              {/* Premium Action Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <ActionCard
                  icon={Building2}
                  label="Anunciante"
                  subtitle="Venda de Mídia"
                  onClick={() => onActionClick('anunciante')}
                  disabled={isProcessing}
                />
                <ActionCard
                  icon={Users}
                  label="Síndico"
                  subtitle="Comodato de Tela"
                  onClick={() => onActionClick('comodato')}
                  disabled={isProcessing}
                />
                <ActionCard
                  icon={Handshake}
                  label="Parceria"
                  subtitle="Permuta Estratégica"
                  onClick={() => onActionClick('permuta')}
                  disabled={isProcessing}
                />
              </div>
            </div>
          )}

          {/* Regular Messages */}
          {!showInitialCards && allMessages.map((message) => (
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
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatMessageContent(message.content)) }}
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
                          className="bg-white hover:bg-[#9C1E1E]/5 hover:border-[#9C1E1E]/30 hover:text-[#9C1E1E] transition-all rounded-xl"
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
          {currentData.tipo_contrato && !isProcessing && messages.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-emerald-800">
                Tipo detectado: <strong>{currentData.tipo_contrato}</strong>
                {currentData.parceiro_nome && <> • Parceiro: <strong>{currentData.parceiro_nome}</strong></>}
              </span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area - Premium Capsule Design */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-t from-white via-white to-transparent">
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

        {/* CAPSULE INPUT BAR - Flutuante unificada */}
        <div className={cn(
          "flex items-center gap-2 p-2 rounded-full",
          "bg-white border border-gray-200 shadow-lg",
          "focus-within:border-[#9C1E1E]/40 focus-within:shadow-xl focus-within:shadow-[#9C1E1E]/5",
          "transition-all duration-300"
        )}>
          {/* File upload button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-10 w-10 rounded-full text-gray-400 hover:text-[#9C1E1E] hover:bg-[#9C1E1E]/10"
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

          {/* Voice button */}
          <VoiceRecordButton
            onTranscriptionComplete={(text) => {
              setInputValue(text);
              inputRef.current?.focus();
            }}
            disabled={isProcessing}
            variant="inline"
          />

          {/* Text input - grows to fill */}
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o contrato ou faça perguntas..."
            className={cn(
              "flex-1 min-h-[40px] max-h-24 py-2 px-1 resize-none",
              "bg-transparent border-none outline-none focus:ring-0",
              "text-gray-800 placeholder:text-gray-400",
              "text-sm leading-relaxed"
            )}
            disabled={isProcessing}
            rows={1}
          />

          {/* Send button - perfect circle */}
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className={cn(
              "flex-shrink-0 h-10 w-10 rounded-full shadow-lg transition-all duration-300",
              inputValue.trim() 
                ? "bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] hover:from-[#8B1A1A] hover:to-[#6D1414] hover:scale-105" 
                : "bg-gray-200 cursor-not-allowed"
            )}
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <Send className={cn("h-4 w-4", inputValue.trim() ? "text-white" : "text-gray-400")} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
