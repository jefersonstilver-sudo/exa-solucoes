// Shared helpers for the external AWS player API (master flag + client presence).
export const EXTERNAL_API_BASE = 'http://18.228.252.149:8000'

export function stripExt(value: string | null | undefined) {
  return (value || '').replace(/\.[^/.]+$/, '')
}

export function clientIdFromBuilding(buildingId: string) {
  return String(buildingId || '').replace(/-/g, '').substring(0, 4)
}

export type AwsClientPresence = 'exists' | 'missing' | 'unknown'

/** Read-only probe: a client exists on AWS when its Propagandas folder can be listed. */
export async function checkAwsClient(clientId: string): Promise<{ presence: AwsClientPresence; files: string[]; detail?: string }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 12000)
  try {
    const resp = await fetch(`${EXTERNAL_API_BASE}/geral/listar-arquivos/${encodeURIComponent(clientId)}/Propagandas`, { signal: ctrl.signal })
    const text = await resp.text()
    if (resp.ok) {
      let files: string[] = []
      try { files = JSON.parse(text)?.arquivos || [] } catch { /* ignore */ }
      return { presence: 'exists', files }
    }
    if (/Nenhuma pasta encontrada/i.test(text)) return { presence: 'missing', files: [], detail: text.slice(0, 200) }
    return { presence: 'unknown', files: [], detail: `HTTP ${resp.status}: ${text.slice(0, 200)}` }
  } catch (err: any) {
    return { presence: 'unknown', files: [], detail: err?.message || String(err) }
  } finally {
    clearTimeout(timer)
  }
}

export function extractTaskId(raw: string): string | null {
  try {
    const j = JSON.parse(raw)
    return j?.task_id || j?.taskId || j?.id || null
  } catch {
    return null
  }
}

/** A master update succeeds only when every building that exists on AWS accepted it. */
export function summarizeMasterResults(results: Array<{ ok: boolean; presence?: AwsClientPresence }>) {
  const failed = results.filter((r) => !r.ok && r.presence !== 'missing')
  const missing = results.filter((r) => r.presence === 'missing')
  return { success: failed.length === 0, failedCount: failed.length, missingCount: missing.length }
}
