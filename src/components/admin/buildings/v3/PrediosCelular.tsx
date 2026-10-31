/**
 * Prédios no celular: lista leve e tocável. Toque no prédio abre as ações (ver, editar, fotos,
 * playlist, sincronizar, link público, excluir). Filtros secundários ficam numa folha de baixo.
 */
import React, { useMemo, useState } from 'react';
import { Plus, SlidersHorizontal, RefreshCw, Eye, Pencil, Image as ImageIcon, ListVideo, Link2, Trash2, FileText, Building2, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { syncBuildingWithExternalAPI } from '@/services/buildingSyncService';
import { useBuildingsVideoCount } from '@/hooks/useBuildingsVideoCount';
import { BuildingVideoPlaylistPreview } from '../BuildingVideoPlaylistPreview';
import {
  PaginaCelular, TopoCelular, BotaoRedondo, BotaoPrincipal, Kpis, BuscaCelular, Pilulas, CartaoCelular,
  Selo, SELO, Vazio, FolhaCelular, AcaoFolha, GrupoFiltro,
} from '@/components/admin/celular/kit';
import { DEFAULT_BUILDINGS_FILTERS, type BuildingsFiltersState, type SortKey } from './BuildingsFilters3';

type Props = {
  todos: any[];
  lista: any[];
  stats: { total: number; active: number; inactive: number; totalPanels: number };
  busca: string;
  setBusca: (v: string) => void;
  filtros: BuildingsFiltersState;
  setFiltros: (f: BuildingsFiltersState) => void;
  ordem: SortKey;
  setOrdem: (s: SortKey) => void;
  atualizar: () => void;
  onNovo: () => void;
  onVer: (b: any) => void;
  onEditar: (b: any) => void;
  onFotos: (b: any) => void;
  onExcluir: (b: any) => void;
};

const foto = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from('building-images').getPublicUrl(path).data.publicUrl;
};
const sem = (s?: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const seloStatus = (s?: string) => {
  const n = sem(s);
  if (n === 'ativo') return { ...SELO.verde, r: 'Ativo' };
  if (n === 'interno') return { ...SELO.roxo, r: 'Interno' };
  if (n === 'manutencao') return { ...SELO.ambar, r: 'Manutenção' };
  if (n === 'instalacao') return { ...SELO.azul, r: 'Instalação' };
  return { ...SELO.cinza, r: s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Sem status' };
};

export default function PrediosCelular(p: Props) {
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [acoes, setAcoes] = useState<any | null>(null);
  const [playlist, setPlaylist] = useState<any | null>(null);
  const [sincronizando, setSincronizando] = useState(false);
  const { counts } = useBuildingsVideoCount(useMemo(() => p.lista.map((b) => b.id), [p.lista]));

  const conta = (st: string) => p.todos.filter((b) => sem(b.status) === st).length;
  const statusOpcoes = [
    { valor: 'all', rotulo: 'Todos', n: p.todos.length },
    { valor: 'ativo', rotulo: 'Ativos', n: conta('ativo') },
    { valor: 'interno', rotulo: 'Internos', n: conta('interno') },
    { valor: 'instalacao', rotulo: 'Instalação', n: conta('instalacao') },
    { valor: 'manutencao', rotulo: 'Manutenção', n: conta('manutencao') },
    { valor: 'inativo', rotulo: 'Inativos', n: conta('inativo') },
  ].filter((o) => o.valor === 'all' || o.n > 0);
  const filtrosExtras = (['padrao_publico', 'paineis', 'device', 'airbnb'] as const).filter((k) => p.filtros[k] !== 'all').length + (p.ordem !== 'updated_desc' ? 1 : 0);
  const offline = p.todos.filter((b) => b.device_status === 'offline').length;

  const sincronizar = async (b: any) => {
    setSincronizando(true);
    try {
      const r = await syncBuildingWithExternalAPI(b.id);
      if (r.totalOrders === 0) toast.info('Nenhum pedido ativo neste prédio');
      else if (r.failed === 0) toast.success(`Sincronizado: ${r.synced} pedido(s)`);
      else toast.warning(`Parcial: ${r.synced} ok, ${r.failed} com erro`);
    } catch (e: any) { toast.error(`Erro ao sincronizar: ${e?.message || e}`); }
    finally { setSincronizando(false); }
  };

  return (
    <PaginaCelular>
      <TopoCelular
        titulo="Prédios"
        sub={`${p.stats.active} ativos · ${p.stats.totalPanels} telas`}
        acoes={
          <>
            <BotaoRedondo rotulo="Atualizar" onClick={p.atualizar}><RefreshCw className="h-[18px] w-[18px]" /></BotaoRedondo>
            <BotaoPrincipal onClick={p.onNovo}><Plus className="h-[18px] w-[18px]" strokeWidth={2.6} /> Novo</BotaoPrincipal>
          </>
        }
      />

      <Kpis
        colunas={4}
        itens={[
          { rotulo: 'Total', valor: p.stats.total, onClick: () => p.setFiltros({ ...p.filtros, status: 'all' }), ativo: p.filtros.status === 'all' },
          { rotulo: 'Ativos', valor: p.stats.active, cor: '#1E6B47', onClick: () => p.setFiltros({ ...p.filtros, status: 'ativo' }), ativo: p.filtros.status === 'ativo' },
          { rotulo: 'Telas', valor: p.stats.totalPanels, cor: '#2B4C8C' },
          { rotulo: 'Offline', valor: offline, cor: offline ? '#B0261D' : '#1E6B47', onClick: () => p.setFiltros({ ...p.filtros, device: p.filtros.device === 'offline' ? 'all' : 'offline' }), ativo: p.filtros.device === 'offline' },
        ]}
      />

      <div className="flex gap-2">
        <BuscaCelular valor={p.busca} onChange={p.setBusca} placeholder="Nome, endereço ou bairro" className="flex-1" />
        <BotaoRedondo rotulo="Filtros" onClick={() => setFiltrosAbertos(true)} ativo={filtrosExtras > 0} className="h-12 w-12 rounded-2xl">
          <SlidersHorizontal className="h-[18px] w-[18px]" />
          {filtrosExtras > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#9C1E1E] px-1 text-[11px] font-extrabold text-white">{filtrosExtras}</span>}
        </BotaoRedondo>
      </div>

      <Pilulas opcoes={statusOpcoes} valor={p.filtros.status} onChange={(v) => p.setFiltros({ ...p.filtros, status: v })} />

      {!p.lista.length ? (
        <Vazio icone={<Building2 className="h-6 w-6" />} titulo="Nenhum prédio encontrado" texto="Ajuste a busca ou os filtros." />
      ) : (
        <CartaoCelular className="divide-y divide-black/[0.05] overflow-hidden">
          {p.lista.map((b) => {
            const st = seloStatus(b.status);
            const img = foto(b.imagem_principal);
            const vids = counts[b.id] ?? 0;
            const dev = b.device_status;
            return (
              <button key={b.id} type="button" onClick={() => setAcoes(b)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left active:bg-black/[0.03]">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-black/[0.05]">
                  {img ? <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Building2 className="m-auto mt-4 h-6 w-6 text-[#B5B6BA]" />}
                  {dev === 'online' && <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#2E9B62]" />}
                  {dev === 'offline' && <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#D93A2B]" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[15.5px] font-extrabold">{b.nome}</span>
                    <Selo fundo={st.fundo} cor={st.cor}>{st.r}</Selo>
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-[#5E5F63]">
                    {[b.bairro, b.codigo_predio ? `#${b.codigo_predio}` : null].filter(Boolean).join(' · ') || 'Sem bairro'}
                  </span>
                  <span className="mt-1 flex items-center gap-3 text-[12.5px] font-semibold text-[#6A6B70]">
                    <span className="inline-flex items-center gap-1"><Monitor className="h-3.5 w-3.5" />{b.numero_elevadores || 0} {(b.numero_elevadores || 0) === 1 ? 'tela' : 'telas'}</span>
                    <span>{(b.publico_estimado || 0).toLocaleString('pt-BR')} pessoas</span>
                    <span className={vids ? 'text-[#1E6B47]' : ''}>{vids} {vids === 1 ? 'vídeo' : 'vídeos'}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </CartaoCelular>
      )}

      {/* Ações do prédio */}
      <FolhaCelular aberta={!!acoes} onFechar={() => setAcoes(null)} titulo={acoes?.nome || ''}>
        {acoes && (
          <div className="space-y-0.5">
            <AcaoFolha icone={<Eye className="h-5 w-5" />} rotulo="Ver detalhes" onClick={() => { const b = acoes; setAcoes(null); p.onVer(b); }} />
            <AcaoFolha icone={<Pencil className="h-5 w-5" />} rotulo="Editar prédio" onClick={() => { const b = acoes; setAcoes(null); p.onEditar(b); }} />
            <AcaoFolha icone={<ImageIcon className="h-5 w-5" />} rotulo="Fotos" onClick={() => { const b = acoes; setAcoes(null); p.onFotos(b); }} />
            <AcaoFolha icone={<ListVideo className="h-5 w-5" />} rotulo="Playlist do prédio" onClick={() => { const b = acoes; setAcoes(null); setPlaylist(b); }} />
            <AcaoFolha icone={<RefreshCw className={`h-5 w-5 ${sincronizando ? 'animate-spin' : ''}`} />} rotulo={sincronizando ? 'Sincronizando…' : 'Sincronizar pedidos (API)'} disabled={sincronizando} onClick={() => sincronizar(acoes)} />
            <AcaoFolha icone={<Link2 className="h-5 w-5" />} rotulo="Abrir página pública" onClick={() => window.open(`/painel-comercial/${acoes.id}`, '_blank')} />
            <div className="my-1 h-px bg-black/[0.06]" />
            <AcaoFolha icone={<Trash2 className="h-5 w-5" />} rotulo="Excluir prédio" perigo onClick={() => { const b = acoes; setAcoes(null); p.onExcluir(b); }} />
          </div>
        )}
      </FolhaCelular>

      {/* Filtros */}
      <FolhaCelular aberta={filtrosAbertos} onFechar={() => setFiltrosAbertos(false)} titulo="Filtros e ordem">
        <GrupoFiltro titulo="Ordenar por" valor={p.ordem} onChange={(v) => p.setOrdem(v as SortKey)} opcoes={[
          { valor: 'updated_desc', rotulo: 'Atualizado' }, { valor: 'name_asc', rotulo: 'Nome' }, { valor: 'audience_desc', rotulo: 'Público' },
          { valor: 'panels_desc', rotulo: 'Telas' }, { valor: 'created_desc', rotulo: 'Mais novos' },
        ]} />
        <GrupoFiltro titulo="Painel" valor={p.filtros.device} onChange={(v) => p.setFiltros({ ...p.filtros, device: v as any })} opcoes={[
          { valor: 'all', rotulo: 'Todos' }, { valor: 'online', rotulo: 'Online' }, { valor: 'offline', rotulo: 'Offline' }, { valor: 'none', rotulo: 'Sem painel' },
        ]} />
        <GrupoFiltro titulo="Telas ativas" valor={p.filtros.paineis} onChange={(v) => p.setFiltros({ ...p.filtros, paineis: v as any })} opcoes={[
          { valor: 'all', rotulo: 'Todos' }, { valor: 'with', rotulo: 'Com telas' }, { valor: 'without', rotulo: 'Sem telas' },
        ]} />
        <GrupoFiltro titulo="Padrão do público" valor={p.filtros.padrao_publico} onChange={(v) => p.setFiltros({ ...p.filtros, padrao_publico: v })} opcoes={[
          { valor: 'all', rotulo: 'Todos' }, { valor: 'alto', rotulo: 'Alto' }, { valor: 'medio', rotulo: 'Médio' }, { valor: 'normal', rotulo: 'Normal' },
        ]} />
        <GrupoFiltro titulo="Airbnb" valor={p.filtros.airbnb} onChange={(v) => p.setFiltros({ ...p.filtros, airbnb: v as any })} opcoes={[
          { valor: 'all', rotulo: 'Todos' }, { valor: 'with', rotulo: 'Com Airbnb' }, { valor: 'without', rotulo: 'Sem Airbnb' },
        ]} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { p.setFiltros({ ...DEFAULT_BUILDINGS_FILTERS, status: p.filtros.status }); p.setOrdem('updated_desc'); }} className="h-12 rounded-2xl border border-black/[0.08] bg-white text-[15px] font-bold">Limpar</button>
          <button type="button" onClick={() => setFiltrosAbertos(false)} className="h-12 rounded-2xl bg-[#17181A] text-[15px] font-bold text-white">Ver {p.lista.length}</button>
        </div>
        <button type="button" onClick={() => window.open('/super_admin/relatorio-playlist', '_blank', 'noopener,noreferrer')} className="mt-3 flex h-11 w-full items-center justify-center gap-2 text-[14px] font-bold text-[#9C1E1E]">
          <FileText className="h-4 w-4" /> Relatório de playlists
        </button>
      </FolhaCelular>

      {playlist && (
        <BuildingVideoPlaylistPreview
          buildingId={playlist.id}
          buildingName={playlist.nome}
          buildingCode={playlist.codigo_predio || '000'}
          isOpen={!!playlist}
          onClose={() => setPlaylist(null)}
        />
      )}
    </PaginaCelular>
  );
}
