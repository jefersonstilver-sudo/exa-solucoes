// EXA (07/11/2026) — Segurança refeita (escolha do Claude, autorizada pelo Jeferson): sem "nível de ameaça", mapas e gráficos.
// O que importa de verdade: quem entrou e de onde (log_eventos_sistema), o que foi excluído com motivo (admin_auditoria_log),
// eventos do sistema (pedidos, cobrança, Lívia) e o estado das contas (bloqueadas, super admins, e-mail pendente).
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Shield, LogIn, Trash2, Activity, UserX, Crown, RefreshCw, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Pagina, Cabecalho, Kpi, Chip, TOM, Pilulas, Secao, Carregando, Vazio, BOTAO2, vidro } from '@/components/admin/ui/exa';

interface Evento { id: string; tipo_evento: string; descricao: string | null; ip: string | null; user_agent: string | null; created_at: string; usuario_id?: string | null }
interface Exclusao { id: string; tabela: string; registro_id: string; acao: string; motivo: string; dados: any; por_email: string | null; em: string }

const quando = (iso: string) => {
  const d = new Date(iso); const h = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const hoje = new Date().toDateString() === d.toDateString();
  const ontem = new Date(Date.now() - 86400e3).toDateString() === d.toDateString();
  return hoje ? `hoje ${h}` : ontem ? `ontem ${h}` : `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${h}`;
};
const aparelho = (ua?: string | null) => {
  const u = ua || '';
  const so = /iPhone/.test(u) ? 'iPhone' : /Android/.test(u) ? 'Android' : /Windows/.test(u) ? 'Windows' : /Mac OS/.test(u) ? 'Mac' : /Linux/.test(u) ? 'Linux' : '';
  const nav = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : /Firefox\//.test(u) ? 'Firefox' : '';
  return [so, nav].filter(Boolean).join(' · ');
};
const lugar = (d?: string | null) => String(d || '').split('|')[0].replace(/^🌍\s*/, '').trim();
const TIPO: Record<string, { r: string; tom: keyof typeof TOM }> = {
  USER_SESSION_START: { r: 'acesso', tom: 'verde' }, USER_BLOCKED: { r: 'bloqueio', tom: 'vermelho' }, USER_UNBLOCKED: { r: 'desbloqueio', tom: 'verde' },
  PEDIDO_MODIFICATION: { r: 'pedido alterado', tom: 'azul' }, PEDIDO_ASAAS_CANCELADO: { r: 'cobrança cancelada', tom: 'ambar' },
  AUDITORIA_COBRANCA_CLIENTE_GEROU: { r: 'cobrança gerada', tom: 'azul' }, AUDITORIA_COBRANCA_CLIENTE_FALHOU: { r: 'cobrança falhou', tom: 'vermelho' },
  AUDITORIA_COBRANCA_PIX_CANCELADO: { r: 'pix cancelado', tom: 'ambar' }, LIVIA_ASAAS_WEBHOOK: { r: 'Lívia · Asaas', tom: 'roxo' }, LIVIA_WEBHOOK_SETUP: { r: 'Lívia', tom: 'roxo' },
};
const TABELA: Record<string, string> = { contacts: 'contato', proposals: 'proposta', sindicos_interessados: 'síndico interessado', sofia_contacts: 'contato da Sofia' };
const nomeDe = (d: any) => d?.nome_fantasia || d?.client_company_name || d?.client_name || [d?.nome, d?.sobrenome].filter(Boolean).join(' ') || d?.name || d?.nome_predio || d?.empresa || d?.email || '—';

const SecurityDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [aba, setAba] = useState<'acessos' | 'exclusoes' | 'eventos' | 'contas'>('acessos');
  const eventos = useQuery({
    queryKey: ['seguranca-eventos'], staleTime: 30_000, refetchInterval: 60_000,
    queryFn: async () => { const { data, error } = await supabase.from('log_eventos_sistema').select('id, tipo_evento, descricao, ip, user_agent, created_at').order('created_at', { ascending: false }).limit(600); if (error) throw error; return (data || []) as Evento[]; },
  });
  const exclusoes = useQuery({
    queryKey: ['seguranca-exclusoes'], staleTime: 30_000,
    queryFn: async () => { const { data, error } = await (supabase as any).from('admin_auditoria_log').select('id, tabela, registro_id, acao, motivo, dados, por_email, em').order('em', { ascending: false }).limit(200); if (error) throw error; return (data || []) as Exclusao[]; },
  });
  const contas = useQuery({
    queryKey: ['seguranca-contas'], staleTime: 60_000,
    queryFn: async () => { const { data, error } = await supabase.from('users').select('id, nome, email, role, is_blocked, blocked_at, blocked_reason, email_verified_at, two_factor_enabled').in('role', ['super_admin', 'admin', 'admin_marketing', 'admin_financeiro', 'comercial']).order('role'); if (error) throw error; return (data || []) as any[]; },
  });
  const bloqueados = useQuery({
    queryKey: ['seguranca-bloqueados'], staleTime: 60_000,
    queryFn: async () => { const { data } = await supabase.from('users').select('id, nome, email, role, blocked_at, blocked_reason').eq('is_blocked', true); return (data || []) as any[]; },
  });

  const acessos = useMemo(() => (eventos.data || []).filter((e) => e.tipo_evento === 'USER_SESSION_START'), [eventos.data]);
  const outros = useMemo(() => (eventos.data || []).filter((e) => e.tipo_evento !== 'USER_SESSION_START'), [eventos.data]);
  const dia = Date.now() - 86400e3;
  const acessos24 = acessos.filter((e) => new Date(e.created_at).getTime() > dia);
  const ipsDistintos = new Set(acessos24.map((e) => e.ip || '')).size;
  const foraDoBrasil = acessos24.filter((e) => e.descricao && !/Brazil|Brasil/i.test(e.descricao)).length;
  const exclusoes30 = (exclusoes.data || []).filter((x) => Date.now() - new Date(x.em).getTime() < 30 * 86400e3).length;
  const refetchTudo = () => { eventos.refetch(); exclusoes.refetch(); contas.refetch(); bloqueados.refetch(); };

  return (
    <Pagina>
      <Cabecalho
        titulo="Segurança"
        sub="Quem entrou e de onde, o que foi excluído com motivo, eventos do sistema e o estado das contas da equipe."
        aoVivo={eventos.data ? `atualiza a cada minuto` : false}
        acoes={<button type="button" className={BOTAO2} onClick={refetchTudo}><RefreshCw className={`h-4 w-4 ${eventos.isFetching ? 'animate-spin' : ''}`} /> Atualizar</button>}
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Kpi rotulo="Acessos em 24h" valor={acessos24.length} sub={`${ipsDistintos} endereço${ipsDistintos === 1 ? '' : 's'} diferente${ipsDistintos === 1 ? '' : 's'}`} icone={LogIn} cor="#1E6B47" onClick={() => setAba('acessos')} />
        <Kpi rotulo="Fora do Brasil" valor={foraDoBrasil} sub="acessos em 24h" icone={Shield} cor={foraDoBrasil ? '#B0261D' : '#17181A'} onClick={() => setAba('acessos')} />
        <Kpi rotulo="Exclusões com motivo" valor={exclusoes30} sub="nos últimos 30 dias" icone={Trash2} cor="#9A5300" onClick={() => setAba('exclusoes')} />
        <Kpi rotulo="Contas bloqueadas" valor={bloqueados.data?.length ?? '—'} sub="sem acesso ao sistema" icone={UserX} cor={bloqueados.data?.length ? '#B0261D' : '#17181A'} onClick={() => setAba('contas')} />
      </div>

      <Pilulas valor={aba} onChange={(v) => setAba(v as any)} opcoes={[
        { valor: 'acessos', rotulo: 'Acessos', n: acessos.length }, { valor: 'exclusoes', rotulo: 'Exclusões', n: exclusoes.data?.length }, { valor: 'eventos', rotulo: 'Eventos do sistema', n: outros.length }, { valor: 'contas', rotulo: 'Contas da equipe', n: contas.data?.length },
      ]} />

      {aba === 'acessos' && (eventos.isLoading ? <Carregando /> : !acessos.length ? <Vazio icone={<LogIn className="h-5 w-5" />} titulo="Nenhum acesso registrado" /> : (
        <div className={`${vidro} overflow-hidden rounded-[22px]`}>
          <ul className="divide-y divide-black/[0.06]">
            {acessos.slice(0, 150).map((e) => {
              const fora = e.descricao && !/Brazil|Brasil/i.test(e.descricao);
              return (
                <li key={e.id} className="flex items-center gap-3 px-3 py-2.5 md:px-4">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${fora ? 'bg-[#FDECEC] text-[#B0261D]' : 'bg-[#EAF5EF] text-[#1E6B47]'}`}><LogIn className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="truncate text-[14px] font-bold">{lugar(e.descricao) || 'Local desconhecido'}</span>{fora && <Chip {...TOM.vermelho}>fora do Brasil</Chip>}</span>
                    <span className="block truncate text-[12.5px] text-[#6A6B70]">{[aparelho(e.user_agent), e.ip].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="shrink-0 text-[12px] tabular-nums text-[#8A8B90]">{quando(e.created_at)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {aba === 'exclusoes' && (exclusoes.isLoading ? <Carregando /> : !exclusoes.data?.length ? <Vazio icone={<Trash2 className="h-5 w-5" />} titulo="Nada foi excluído com motivo ainda" /> : (
        <div className={`${vidro} overflow-hidden rounded-[22px]`}>
          <ul className="divide-y divide-black/[0.06]">
            {exclusoes.data.map((x) => (
              <li key={x.id} className="flex items-start gap-3 px-3 py-2.5 md:px-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#FFF4E5] text-[#9A5300]"><Trash2 className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="truncate text-[14px] font-bold">{nomeDe(x.dados)}</span><Chip {...TOM.cinza}>{TABELA[x.tabela] || x.tabela}</Chip></span>
                  <span className="block text-[12.5px] text-[#45464A]">“{x.motivo}”</span>
                  <span className="block truncate text-[12px] text-[#8A8B90]">por {x.por_email || '—'} · o registro inteiro ficou guardado no log</span>
                </span>
                <span className="shrink-0 text-[12px] tabular-nums text-[#8A8B90]">{quando(x.em)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {aba === 'eventos' && (eventos.isLoading ? <Carregando /> : !outros.length ? <Vazio icone={<Activity className="h-5 w-5" />} titulo="Sem eventos além dos acessos" /> : (
        <div className={`${vidro} overflow-hidden rounded-[22px]`}>
          <ul className="divide-y divide-black/[0.06]">
            {outros.slice(0, 200).map((e) => {
              const t = TIPO[e.tipo_evento] || { r: e.tipo_evento.toLowerCase().replace(/_/g, ' '), tom: 'cinza' as const };
              return (
                <li key={e.id} className="flex items-start gap-3 px-3 py-2.5 md:px-4">
                  <span className="mt-0.5 shrink-0"><Chip {...TOM[t.tom]}>{t.r}</Chip></span>
                  <span className="min-w-0 flex-1 text-[13px] text-[#45464A]" style={{ overflowWrap: 'anywhere' }}>{(e.descricao || '').slice(0, 300)}</span>
                  <span className="shrink-0 text-[12px] tabular-nums text-[#8A8B90]">{quando(e.created_at)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {aba === 'contas' && (contas.isLoading ? <Carregando /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Secao titulo={<><Crown className="mr-1 inline h-3.5 w-3.5" />Equipe com acesso ao admin</>} acao={{ rotulo: 'Usuários', to: '/super_admin/usuarios' }}>
            <ul className="divide-y divide-black/[0.06]">
              {(contas.data || []).map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2"><span className="truncate text-[13.5px] font-bold">{u.nome || u.email}</span>
                      <Chip {...(u.role === 'super_admin' ? TOM.ambar : TOM.azul)}>{u.role.replace('admin_', '').replace('_', ' ')}</Chip>
                      {u.two_factor_enabled && <Chip {...TOM.verde}>2FA</Chip>}
                      {u.is_blocked && <Chip {...TOM.vermelho}>bloqueado</Chip>}
                      {!u.email_verified_at && <Chip {...TOM.ambar}>e-mail pendente</Chip>}
                    </span>
                    <span className="block truncate text-[12px] text-[#8A8B90]">{u.email}</span>
                  </span>
                  <button type="button" className="text-[12.5px] font-bold text-[#9C1E1E] hover:underline" onClick={() => navigate(`/super_admin/usuarios?user=${u.id}`)}>abrir</button>
                </li>
              ))}
            </ul>
          </Secao>
          <Secao titulo={<><Lock className="mr-1 inline h-3.5 w-3.5" />Contas bloqueadas</>}>
            {!bloqueados.data?.length ? <p className="py-4 text-sm text-[#6A6B70]">Nenhuma conta bloqueada. Para bloquear, abra o usuário em Usuários → Zona de perigo.</p> : (
              <ul className="divide-y divide-black/[0.06]">
                {bloqueados.data.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold">{u.nome || u.email}</span>
                      <span className="block truncate text-[12px] text-[#8A8B90]">{u.email} · {u.blocked_at ? `desde ${new Date(u.blocked_at).toLocaleDateString('pt-BR')}` : ''}{u.blocked_reason ? ` · ${u.blocked_reason}` : ''}</span>
                    </span>
                    <button type="button" className="text-[12.5px] font-bold text-[#9C1E1E] hover:underline" onClick={() => navigate(`/super_admin/usuarios?user=${u.id}`)}>abrir</button>
                  </li>
                ))}
              </ul>
            )}
          </Secao>
        </div>
      ))}
    </Pagina>
  );
};

export default SecurityDashboard;
