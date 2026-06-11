/**
 * Utilitários compartilhados para a feature de QR Codes Rastreáveis.
 * A API externa (AWS) responde com `data_hora` em horário local de Brasília
 * porém rotulado como UTC — `parseScanDate` corrige isso.
 */

export interface QrScanLog {
  cliente_id?: string;
  nome_cliente?: string;
  titulo?: string;
  link?: string;
  data_hora?: string;
}

/** CID = primeiros 4 chars do UUID sem hífens (contrato com AWS). */
export const deriveClienteId = (buildingUuid: string): string =>
  (buildingUuid || '').replace(/-/g, '').substring(0, 4);

export const normalize = (s?: string) => (s || '').toLowerCase().trim();

/**
 * Interpreta `data_hora` como horário local de Brasília
 * (a API externa rotula como +00:00 mas grava local).
 */
export const parseScanDate = (iso?: string): Date | null => {
  if (!iso) return null;
  const naive = iso.replace(/(?:Z|[+-]\d{2}:?\d{2})$/, '');
  const d = new Date(naive);
  return isNaN(d.getTime()) ? null : d;
};

const pad = (n: number) => String(n).padStart(2, '0');

export const formatDateBR = (iso?: string): string => {
  if (!iso) return '-';
  const d = parseScanDate(iso);
  if (!d) return iso || '-';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const timeAgo = (iso?: string): string => {
  if (!iso) return '—';
  const d = parseScanDate(iso);
  if (!d) return '—';
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} mês${months > 1 ? 'es' : ''}`;
  const years = Math.floor(months / 12);
  return `há ${years} ano${years > 1 ? 's' : ''}`;
};

/** Chave estável para deduplicar um scan. */
export const scanKey = (s: QrScanLog): string =>
  `${s.cliente_id || ''}|${normalize(s.titulo)}|${s.data_hora || ''}|${s.link || ''}`;

/** Converte uma lista de objetos em CSV (RFC 4180). */
export const toCSV = (rows: Record<string, any>[], headers?: string[]): string => {
  if (rows.length === 0) return '';
  const cols = headers || Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: any): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = cols.join(';');
  const body = rows.map((r) => cols.map((c) => escape(r[c])).join(';')).join('\n');
  return `${head}\n${body}`;
};

export const downloadCSV = (filename: string, csv: string) => {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
