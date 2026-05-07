import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface QrLog {
  cliente_id?: string;
  nome_cliente?: string;
  titulo?: string;
  link?: string;
  data_hora?: string;
}

const SUPABASE_URL = 'https://aakenoljsycyrcrchgxj.supabase.co';
const PROXY_URL = `${SUPABASE_URL}/functions/v1/qrcode-logs-proxy`;

const buildProxyUrl = (cid: string, titulo: string) => {
  const url = new URL(PROXY_URL);
  url.searchParams.set('cliente_id', cid);
  if (titulo.trim()) url.searchParams.set('titulo', titulo.trim());
  return url.toString();
};

const formatDateBR = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const deriveClienteId = (buildingUuid: string) =>
  buildingUuid.replace(/-/g, '').substring(0, 4);

const QrCodesRastreaveis: React.FC = () => {
  const { userProfile } = useAuth();
  const userId = userProfile?.id;

  const [clienteIds, setClienteIds] = useState<string[]>([]);
  const [titulo, setTitulo] = useState('');
  const [logs, setLogs] = useState<QrLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrega prédios do cliente -> deriva cliente_ids (4 primeiros dígitos do UUID do prédio)
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const { data: pedidos, error: err } = await supabase
          .from('pedidos')
          .select('lista_predios')
          .eq('client_id', userId);
        if (err) throw err;
        const buildingIds = new Set<string>();
        (pedidos || []).forEach((p: any) => {
          (p.lista_predios || []).forEach((id: string) => buildingIds.add(id));
        });
        const ids = Array.from(buildingIds).map(deriveClienteId);
        setClienteIds(Array.from(new Set(ids)));
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar prédios');
      }
    })();
  }, [userId]);

  // Busca logs para cada cliente_id
  useEffect(() => {
    if (clienteIds.length === 0) {
      setLogs([]);
      return;
    }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await Promise.all(
          clienteIds.map(async (cid) => {
            const url = new URL(`${API_BASE}/${cid}`);
            if (titulo.trim()) url.searchParams.set('titulo', titulo.trim());
            const res = await fetch(url.toString(), { signal: controller.signal });
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data) ? data : [];
          })
        );
        setLogs(results.flat());
      } catch (e: any) {
        if (e.name !== 'AbortError') setError(e.message || 'Erro ao buscar logs');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(t);
    };
  }, [clienteIds, titulo]);

  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-2xl font-semibold">QR Codes Rastreáveis</h1>
      <p className="text-xs text-muted-foreground">
        cliente_ids: {clienteIds.join(', ') || '(carregando...)'}
      </p>

      <div className="flex gap-2 max-w-2xl">
        <input
          type="text"
          placeholder="Buscar por título..."
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          type="button"
          onClick={async () => {
            const t = window.prompt('Título para teste na API (busca em todos os cliente_ids):', titulo);
            if (t === null) return;
            setLoading(true);
            setError(null);
            try {
              const ids = clienteIds.length > 0 ? clienteIds : [''];
              const results = await Promise.all(
                ids.map(async (cid) => {
                  const url = new URL(`${API_BASE}/${cid}`);
                  if (t.trim()) url.searchParams.set('titulo', t.trim());
                  console.log('[QR TEST] GET', url.toString());
                  const res = await fetch(url.toString());
                  const data = await res.json().catch(() => []);
                  console.log('[QR TEST] response', cid, res.status, data);
                  return Array.isArray(data) ? data : [];
                })
              );
              setLogs(results.flat());
              setTitulo(t);
            } catch (e: any) {
              setError(e.message || 'Erro no teste');
            } finally {
              setLoading(false);
            }
          }}
          className="px-4 py-2 bg-[#C7141A] text-white rounded hover:bg-[#B40D1A]"
        >
          Testar API
        </button>
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-600">Erro: {error}</p>}

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2">Nome Cliente</th>
              <th className="text-left p-2">Título</th>
              <th className="text-left p-2">Data/Hora</th>
              <th className="text-left p-2">Link</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && !loading ? (
              <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhum resultado</td></tr>
            ) : logs.map((l, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{l.nome_cliente || '-'}</td>
                <td className="p-2">{l.titulo || '-'}</td>
                <td className="p-2">{formatDateBR(l.data_hora)}</td>
                <td className="p-2">
                  {l.link ? <a href={l.link} target="_blank" rel="noreferrer" className="text-blue-600 underline">{l.link}</a> : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">JSON bruto</summary>
        <pre className="bg-muted p-2 overflow-auto">{JSON.stringify(logs, null, 2)}</pre>
      </details>
    </div>
  );
};

export default QrCodesRastreaveis;
