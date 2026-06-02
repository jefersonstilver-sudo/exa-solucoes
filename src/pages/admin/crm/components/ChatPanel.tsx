import React from 'react';
import { Search, Phone, Video, MoreVertical, Paperclip, Smile, Send, Mic } from 'lucide-react';
import type { CollaboratorRow } from './CollaboratorCard';
import { cn } from '@/lib/utils';

interface Props {
  collaborator: CollaboratorRow;
}

// Mock data — UI only
const MOCK_CONVERSATIONS = [
  { id: '1', name: 'Maria Souza', last: 'Boa, fechado então!', time: '14:32', unread: 2, online: true },
  { id: '2', name: 'Condomínio Aurora', last: 'Pode enviar a proposta', time: '13:10', unread: 0, online: false },
  { id: '3', name: 'João — Síndico', last: 'Vou conversar com o conselho', time: '12:04', unread: 5, online: true },
  { id: '4', name: 'Lucas (RH)', last: 'Documento recebido ✅', time: 'Ontem', unread: 0, online: false },
  { id: '5', name: 'Ana Mendes', last: 'Obrigada pelo retorno!', time: 'Ontem', unread: 0, online: false },
  { id: '6', name: 'Edifício Solaris', last: 'Tudo certo para amanhã', time: 'Seg', unread: 0, online: false },
];

const MOCK_MESSAGES = [
  { id: 'm1', from: 'them', text: 'Oi, tudo bem?', time: '14:20' },
  { id: 'm2', from: 'them', text: 'Consegue me passar mais detalhes sobre a proposta?', time: '14:20' },
  { id: 'm3', from: 'me', text: 'Oi Maria! Tudo ótimo, e contigo?', time: '14:22' },
  { id: 'm4', from: 'me', text: 'Claro, vou te mandar agora um resumo executivo.', time: '14:22' },
  { id: 'm5', from: 'them', text: 'Perfeito, obrigada!', time: '14:25' },
  { id: 'm6', from: 'me', text: 'Segue o documento em PDF, qualquer dúvida me chama.', time: '14:30' },
  { id: 'm7', from: 'them', text: 'Boa, fechado então!', time: '14:32' },
];

export const ChatPanel: React.FC<Props> = ({ collaborator }) => {
  const [active, setActive] = React.useState(MOCK_CONVERSATIONS[0].id);
  const activeConv = MOCK_CONVERSATIONS.find((c) => c.id === active) ?? MOCK_CONVERSATIONS[0];

  const initials = (name: string) =>
    name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Owner bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[#7D1818] to-[#9C1E1E] text-white">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
          {initials(collaborator.collaborator_name)}
        </div>
        <div className="text-sm">
          Conversas de <strong>{collaborator.collaborator_name}</strong>
        </div>
        <span className="ml-auto text-[10px] uppercase tracking-wider opacity-80">
          mockup
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] h-[520px]">
        {/* Conversations list */}
        <aside className="border-r border-gray-200 flex flex-col bg-gray-50/50">
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar conversa..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-gray-100 border-0 focus:outline-none focus:ring-2 focus:ring-[#9C1E1E]/30 placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {MOCK_CONVERSATIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-white transition-colors border-b border-gray-100',
                  active === c.id && 'bg-white',
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
                    {initials(c.name)}
                  </div>
                  {c.online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{c.time}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{c.last}</p>
                    {c.unread > 0 && (
                      <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#9C1E1E] text-white text-[10px] font-semibold flex items-center justify-center">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <section className="flex flex-col bg-[#f4ede4]/40">
          {/* Chat header */}
          <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
              {initials(activeConv.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{activeConv.name}</p>
              <p className="text-xs text-gray-500">
                {activeConv.online ? 'online' : 'visto por último hoje'}
              </p>
            </div>
            <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <Video className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <Phone className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <MoreVertical className="w-4 h-4" />
            </button>
          </header>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-2"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }}
          >
            {MOCK_MESSAGES.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex',
                  m.from === 'me' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm text-sm',
                    m.from === 'me'
                      ? 'bg-[#9C1E1E] text-white rounded-br-sm'
                      : 'bg-white text-gray-900 rounded-bl-sm',
                  )}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  <p
                    className={cn(
                      'text-[10px] mt-0.5 text-right',
                      m.from === 'me' ? 'text-white/70' : 'text-gray-400',
                    )}
                  >
                    {m.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-200">
            <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <Smile className="w-5 h-5" />
            </button>
            <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              placeholder="Digite uma mensagem... (mockup)"
              disabled
              className="flex-1 px-3 py-2 text-sm rounded-full bg-gray-100 border-0 focus:outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
            />
            <button className="w-10 h-10 rounded-full bg-[#9C1E1E] hover:bg-[#7D1818] text-white flex items-center justify-center transition-colors">
              <Send className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChatPanel;
