// EXA (07/11/2026) — linha de prédio no kit de vidro (substitui o BuildingCard3 no desktop): foto, nome, bairro, telas,
// painel online/offline, contrato, público e preços; ações discretas (ver, editar, fotos, playlist, link público, excluir).
import React, { useState } from 'react';
import { Eye, Pencil, Image as ImageIcon, Play, Link2, Trash2, MoreHorizontal, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { syncBuildingWithExternalAPI } from '@/services/buildingSyncService';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BuildingVideoPlaylistPreview } from '../BuildingVideoPlaylistPreview';
import { Chip, TOM } from '@/components/admin/ui/exa';

const preco = (v?: number | null) => (v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) : '—');
const img = (path?: string | null) => (!path ? null : path.startsWith('http') ? path : supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl);
const STATUS: Record<string, keyof typeof TOM> = { ativo: 'verde', 'manutenção': 'ambar', manutencao: 'ambar', 'instalação': 'azul', instalacao: 'azul', interno: 'roxo', inativo: 'cinza' };

export const PredioLinha: React.FC<{
  b: any; videos: number; contrato?: { contrato: boolean; pedido: string | null } | null;
  onVer: (b: any) => void; onEditar: (b: any) => void; onFotos: (b: any) => void; onExcluir: (b: any) => void;
}> = ({ b, videos, contrato, onVer, onEditar, onFotos, onExcluir }) => {
  const [playlist, setPlaylist] = useState(false);
  const [sync, setSync] = useState(false);
  const foto = img(b.imagem_principal);
  const ativo = b.status === 'ativo';
  const painel: 'online' | 'offline' | 'sem' = b.device_status === 'offline' ? 'offline' : b.device_status === 'online' || ativo ? 'online' : 'sem';
  const sincronizar = async () => {
    setSync(true);
    try {
      const r = await syncBuildingWithExternalAPI(b.id);
      toast[r.failed ? 'warning' : 'success'](r.totalOrders === 0 ? 'Nenhum pedido ativo neste prédio' : `${r.synced} pedido(s) sincronizado(s)${r.failed ? `, ${r.failed} com erro` : ''}`);
    } catch (e: any) { toast.error('Erro ao sincronizar: ' + e.message); } finally { setSync(false); }
  };
  return (
    <li className={`group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/70 md:px-4 ${!ativo ? 'opacity-70' : ''}`}>
      <BuildingVideoPlaylistPreview buildingId={b.id} buildingName={b.nome} buildingCode={b.codigo_predio || '000'} isOpen={playlist} onClose={() => setPlaylist(false)} />
      <button type="button" onClick={() => onVer(b)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-black/[0.05]">
          {foto ? <img src={foto} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImageIcon className="absolute inset-0 m-auto h-5 w-5 text-black/20" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-[14px] font-bold">{b.nome}</span>
            {b.codigo_predio && <span className="font-mono text-[11px] text-[#8A8B90]">#{b.codigo_predio}</span>}
            {!ativo && <Chip {...TOM[STATUS[b.status] || 'cinza']}>{b.status}</Chip>}
            {ativo && painel === 'offline' && <Chip {...TOM.vermelho} title={b.device_last_online_at ? `offline desde ${new Date(b.device_last_online_at).toLocaleString('pt-BR')}` : 'painel offline'}>painel offline</Chip>}
            {ativo && painel === 'online' && <Chip {...TOM.verde}>online</Chip>}
            {contrato !== undefined && ativo && (contrato?.contrato
              ? <Chip {...TOM.verde}>contrato ✓</Chip>
              : contrato?.pedido ? <Chip {...TOM.ambar}>{contrato.pedido === 'enviado' ? 'contrato em assinatura' : 'contrato pedido'}</Chip>
              : <Chip {...TOM.vermelho}>sem contrato</Chip>)}
            {b.tem_airbnb && <Chip {...TOM.roxo}>airbnb</Chip>}
          </span>
          <span className="block truncate text-[12.5px] text-[#6A6B70]">
            {[b.bairro, `${b.numero_elevadores || b.quantidade_telas || 0} tela${(b.numero_elevadores || b.quantidade_telas || 0) === 1 ? '' : 's'}`, `${b.publico_estimado || 0} pessoas`, videos ? `${videos} vídeo${videos === 1 ? '' : 's'} no ar` : 'sem vídeos', b.nome_sindico ? `síndico ${b.nome_sindico}` : ''].filter(Boolean).join(' · ')}
          </span>
        </span>
      </button>
      <span className="hidden shrink-0 items-center gap-3 text-right text-[12px] tabular-nums text-[#6A6B70] lg:flex" title="Preço por mês: 1 · 3 · 6 · 12 meses">
        <span><b className="text-[#1E6B47]">{preco(b.preco_base)}</b><span className="text-[#8A8B90]"> /1m</span></span>
        <span>{preco(b.preco_trimestral ? b.preco_trimestral / 3 : null)}<span className="text-[#8A8B90]"> /3m</span></span>
        <span>{preco(b.preco_semestral ? b.preco_semestral / 6 : null)}<span className="text-[#8A8B90]"> /6m</span></span>
        <span>{preco(b.preco_anual ? b.preco_anual / 12 : null)}<span className="text-[#8A8B90]"> /12m</span></span>
      </span>
      <div className="flex shrink-0 items-center">
        <button type="button" onClick={() => onEditar(b)} title="Editar" className="hidden h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05] md:grid"><Pencil className="h-4 w-4" /></button>
        <button type="button" onClick={() => onFotos(b)} title="Fotos" className="hidden h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05] md:grid"><ImageIcon className="h-4 w-4" /></button>
        {videos > 0 && <button type="button" onClick={() => setPlaylist(true)} title="Ver playlist" className="hidden h-9 w-9 place-items-center rounded-xl text-[#1E6B47] hover:bg-[#EAF5EF] md:grid"><Play className="h-4 w-4" /></button>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-xl text-[#45464A] hover:bg-black/[0.05]" aria-label="Mais ações"><MoreHorizontal className="h-4 w-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 rounded-xl bg-white">
            <DropdownMenuItem onClick={() => onVer(b)}><Eye className="mr-2 h-3.5 w-3.5" />Ver tudo (contrato, telas, pedidos)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPlaylist(true)}><Play className="mr-2 h-3.5 w-3.5" />Ver playlist</DropdownMenuItem>
            {b.codigo_predio && <DropdownMenuItem onClick={() => window.open(`/painel-comercial/${b.id}`, '_blank')}><Link2 className="mr-2 h-3.5 w-3.5" />Página pública</DropdownMenuItem>}
            <DropdownMenuItem onClick={sincronizar} disabled={sync}><RefreshCw className={`mr-2 h-3.5 w-3.5 ${sync ? 'animate-spin' : ''}`} />Sincronizar pedidos (AWS)</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onExcluir(b)} className="text-[#B0261D] focus:text-[#B0261D]"><Trash2 className="mr-2 h-3.5 w-3.5" />Excluir prédio</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
};

export default PredioLinha;
