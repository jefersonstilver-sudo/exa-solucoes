import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2.117.2/cors?target=deno';

type AsaasListResponse<T> = {
  object?: string;
  hasMore?: boolean;
  totalCount?: number;
  limit?: number;
  offset?: number;
  data?: T[];
};

// https://docs.asaas.com/reference/list-transfers
type AsaasTransfer = {
  id: string;
  value: number;
  status?: string;
  dateCreated?: string;
  transferDate?: string;
  description?: string;
  externalReference?: string;
};

// https://docs.asaas.com/reference/list-bill-payments
type AsaasBillPayment = {
  id: string;
  status?: string;
  value: number;
  dueDate?: string;
  scheduleDate?: string;
  paymentDate?: string;
  fee?: number;
  description?: string;
  companyName?: string;
  externalReference?: string;
  transactionReceiptUrl?: string;
};

function toIsoDate(value?: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function fetchAsaasJson(url: string, headers: Record<string, string>) {
  const resp = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, json: text ? safeJson(text) : null };
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });

  let runId: string | undefined;
  let pages = 0, synced = 0;
  let markFailed: ((reason: string) => Promise<void>) | undefined;

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase configuration missing");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    markFailed = async (reason: string) => {
      if (!runId) return;
      await supabase.from('sync_runs').update({ state: 'failed', finished_at: new Date().toISOString(), pages_count: pages, items_count: synced, processed_count: synced, errors: [{ reason }] }).eq('id', runId);
    };
    const bearer = req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!bearer) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: { user }, error: authError } = await supabase.auth.getUser(bearer);
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: role, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', user.id).in('role', ['super_admin', 'admin_financeiro', 'admin']).limit(1);
    if (roleError || !role?.length) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    const asaasBaseUrl = "https://api.asaas.com/v3";

    let startDate: string | null = null;
    let endDate: string | null = null;

    const body = await req.json().catch(() => ({}));
    const validDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
    if ((body.startDate && !validDate(body.startDate)) || (body.endDate && !validDate(body.endDate))) return new Response(JSON.stringify({ error: "Invalid dates" }), { status: 400, headers: corsHeaders });
    if (body.startDate) startDate = body.startDate;
    if (body.endDate) endDate = body.endDate;
    const { data: run, error: runError } = await supabase.from("sync_runs").insert({ source: "asaas_outflows", state: "running", started_at: new Date().toISOString(), window_start: startDate, window_end: endDate }).select("id").single();
    if (runError || !run) throw new Error("Cannot persist sync run");
    runId = run.id;

    const commonHeaders = {
      "access_token": ASAAS_API_KEY,
      "Content-Type": "application/json",
    };

    const upsertOutflow = async (row: {
      asaas_id: string;
      asaas_tipo: string;
      data: string;
      descricao: string;
      valor: number;
      valor_liquido: number | null;
      status: string | null;
      status_original: string | null;
      cliente: string | null;
      metodo_pagamento: string | null;
      external_reference: string | null;
      raw_data: unknown;
    }) => {
      const { error } = await supabase
        .from("asaas_saidas")
        .upsert(
          {
            asaas_id: row.asaas_id,
            asaas_tipo: row.asaas_tipo,
            data: row.data,
            descricao: row.descricao,
            valor: row.valor,
            valor_liquido: row.valor_liquido,
            status: row.status,
            status_original: row.status_original,
            cliente: row.cliente,
            metodo_pagamento: row.metodo_pagamento,
            external_reference: row.external_reference,
            raw_data: row.raw_data,
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "asaas_id" }
        );

      if (error) throw error;
    };

    const shouldKeepByDate = (isoDate: string): boolean => {
      if (!startDate && !endDate) return true;
      if (startDate && isoDate < startDate) return false;
      if (endDate && isoDate > endDate) return false;
      return true;
    };


    const saveProgress = async () => {
      const { error } = await supabase.from("sync_runs").update({ pages_count: pages, items_count: synced, processed_count: synced, updated_at: new Date().toISOString() }).eq("id", runId);
      if (error) throw new Error("Cannot persist sync progress");
    };

    // ------------------------------
    // TRANSFERS
    // ------------------------------
    {
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const qs = new URLSearchParams({ offset: String(offset), limit: String(limit) });
        if (startDate) qs.set("dateCreated[ge]", startDate);
        if (endDate) qs.set("dateCreated[le]", endDate);

        const url = `${asaasBaseUrl}/transfers?${qs.toString()}`;
        const { ok, status, json } = await fetchAsaasJson(url, commonHeaders);
        if (!ok) throw new Error(`ASAAS /transfers HTTP ${status}`);

        const parsed = (json || {}) as AsaasListResponse<AsaasTransfer>;
        if (!Array.isArray(parsed.data) || typeof parsed.hasMore !== "boolean") throw new Error("Invalid transfers page");
        const transfers = parsed.data;
        pages++;

        for (const tr of transfers) {
          const data = toIsoDate(tr.transferDate || tr.dateCreated) || new Date().toISOString().slice(0, 10);
          if (!shouldKeepByDate(data)) continue;

          await upsertOutflow({
            asaas_id: tr.id,
            asaas_tipo: "transfer",
            data,
            descricao: tr.description || "Transferência ASAAS",
            valor: Number(tr.value || 0),
            valor_liquido: null,
            status: tr.status ? String(tr.status).toLowerCase() : null,
            status_original: tr.status ? String(tr.status) : null,
            cliente: null,
            metodo_pagamento: "TRANSFER",
            external_reference: tr.externalReference ? String(tr.externalReference) : null,
            raw_data: tr,
          });

          synced++;
        }

        await saveProgress();
        hasMore = parsed.hasMore === true;
        if (hasMore && transfers.length === 0) throw new Error("Empty transfers page with hasMore");
        offset += transfers.length;
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    // ------------------------------
    // BILL PAYMENTS
    // ------------------------------
    {
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const qs = new URLSearchParams({ offset: String(offset), limit: String(limit) });

        // Alguns ambientes retornam 404 em /billPayments; fallback para /bill (mesma feature na API v3)
        const candidates = [
          `${asaasBaseUrl}/billPayments?${qs.toString()}`,
          `${asaasBaseUrl}/bill?${qs.toString()}`,
        ];

        let lastErr: number | null = null;
        let parsed: AsaasListResponse<AsaasBillPayment> | null = null;

        for (const url of candidates) {
          const { ok, status, json } = await fetchAsaasJson(url, commonHeaders);
          if (ok) {
            parsed = (json || {}) as AsaasListResponse<AsaasBillPayment>;
            lastErr = null;
            break;
          }
          // tenta o próximo endpoint se for 404; senão já falha
          if (status !== 404) {
            throw new Error(`ASAAS bill HTTP ${status}`);
          }
          lastErr = status;
        }

        if (!parsed) {
          throw new Error(`ASAAS bill HTTP ${lastErr || 500}`);
        }

        if (!Array.isArray(parsed.data) || typeof parsed.hasMore !== "boolean") throw new Error("Invalid bills page");
        const bills = parsed.data;
        pages++;

        for (const bp of bills) {
          const data =
            toIsoDate(bp.paymentDate) ||
            toIsoDate(bp.scheduleDate) ||
            toIsoDate(bp.dueDate) ||
            new Date().toISOString().slice(0, 10);

          if (!shouldKeepByDate(data)) continue;

          const fee = bp.fee != null ? Number(bp.fee) : null;
          const value = Number(bp.value || 0);
          const net = fee != null ? Number((value - fee).toFixed(2)) : null;

          await upsertOutflow({
            asaas_id: bp.id,
            asaas_tipo: "bill_payment",
            data,
            descricao: bp.description || bp.companyName || "Pagamento de Boleto (ASAAS)",
            valor: value,
            valor_liquido: net,
            status: bp.status ? String(bp.status).toLowerCase() : null,
            status_original: bp.status ? String(bp.status) : null,
            cliente: bp.companyName ? String(bp.companyName) : null,
            metodo_pagamento: "BILL_PAYMENT",
            external_reference: bp.externalReference ? String(bp.externalReference) : null,
            raw_data: bp,
          });

          synced++;
        }

        await saveProgress();
        hasMore = parsed.hasMore === true;
        if (hasMore && bills.length === 0) throw new Error("Empty bills page with hasMore");
        offset += bills.length;
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const finished = new Date().toISOString();
    const { error: finishError } = await supabase.from("sync_runs").update({ state: "completed", finished_at: finished, last_success_at: finished, pages_count: pages, items_count: synced, processed_count: synced }).eq("id", runId);
    if (finishError) throw new Error("Cannot persist completed run");
    return new Response(
      JSON.stringify({
        success: true, run_id: runId, pages,
        synced,
        window: { startDate, endDate },
        last_sync: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Asaas outflow sync failed", { run_id: runId, pages, synced, reason: error instanceof Error ? error.message : "unknown" });
    if (markFailed) await markFailed(error instanceof Error ? error.message : 'unknown');
    return new Response(
      JSON.stringify({ success: false, run_id: runId, error: "Synchronization failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
