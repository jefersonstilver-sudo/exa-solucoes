import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Bot, 
  User, 
  Loader2,
  Building2,
  Users,
  Handshake,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { LegalFlowData } from '@/hooks/useLegalFlow';
import { VoiceRecordButton } from './VoiceRecordButton';
import { cn } from '@/lib/utils';

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
  const [isRecording, setIsRecording] = useState(false);
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

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Assistente Jurídico IA</h3>
            <p className="text-xs text-gray-500">Converse naturalmente para criar o contrato</p>
          </div>
          {isProcessing && (
            <Badge variant="secondary" className="ml-auto animate-pulse">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Processando...
            </Badge>
          )}
        </div>
      </div>

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
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                message.role === 'assistant' 
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white' 
                  : 'bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] text-white'
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
                <div
                  className={cn(
                    'inline-block p-3 rounded-2xl text-sm',
                    message.role === 'assistant'
                      ? 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'
                      : 'bg-gradient-to-br from-[#9C1E1E] to-[#7D1818] text-white rounded-tr-sm'
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
                      className="whitespace-pre-wrap"
                    />
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
                          className="bg-white hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all"
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

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t bg-white/80 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          {/* File upload button */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-10 w-10 text-gray-500 hover:text-purple-600"
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

          {/* Text input */}
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva o contrato ou faça perguntas..."
              className="min-h-[44px] max-h-32 resize-none pr-12 rounded-2xl border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              disabled={isProcessing}
              rows={1}
            />
            
            {/* Voice button inside input */}
            <div className="absolute right-2 bottom-2">
              <VoiceRecordButton
                onTranscriptionComplete={(text) => {
                  // When transcription is ready, process it as voice input
                  onSendMessage(text);
                }}
                disabled={isProcessing}
                variant="inline"
              />
            </div>
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg"
            size="icon"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            'Portal da Cidade - permuta de mídia',
            'SECOVI - parceria institucional',
            'Comodato com isenção de energia',
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputValue(prompt);
                inputRef.current?.focus();
              }}
              className="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-700 rounded-full transition-colors"
              disabled={isProcessing}
            >
              <Sparkles className="h-3 w-3 inline mr-1" />
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
