import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface QrLog {
  cliente_id?: string;
  nome_cliente?: string;
  titulo?: string;
  link?: string;
  data_hora?: string;
}

const API_BASE = 'http://18.228.252.149:8000/qrcode/logs';

const formatDateBR = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const QrCodesRastreaveis: React.FC = () => {
  const { userProfile } = useAuth();
  const clienteId = userProfile?.id;
  const [titulo, setTitulo] = useState('');
  const [logs, setLogs] = useState<QrLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clienteId) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${API_BASE}/${clienteId}`);
        if (titulo.trim()) url.searchParams.set('titulo', titulo.trim());
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
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
  }, [clienteId, titulo]);

  return (
    <div className="min-h-screen p-6 space-y-4">
      <h1 className="text-2xl font-semibold">QR Codes Rastreáveis</h1>
      <p className="text-sm text-muted-foreground">cliente_id: {clienteId || '...'}</p>

      <input
        type="text"
        placeholder="Buscar por título..."
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full max-w-md border rounded px-3 py-2"
      />

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
