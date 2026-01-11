import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  const resp = await fetch(url, { headers });
  const text = await resp.text();
  return { ok: resp.ok, status: resp.status, text, json: text ? safeJson(text) : null };
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ASAAS_API_KEY) throw new Error("ASAAS_API_KEY não configurada");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const asaasBaseUrl = "https://api.asaas.com/v3";

    let startDate: string | null = null;
    let endDate: string | null = null;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.startDate) startDate = String(body.startDate);
        if (body?.endDate) endDate = String(body.endDate);
      } catch {
        // ignore
      }
    }

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
            raw_data: row.raw_data as any,
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

    let synced = 0;

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
        const { ok, status, text, json } = await fetchAsaasJson(url, commonHeaders);
        if (!ok) throw new Error(`ASAAS /transfers erro ${status}: ${text}`);

        const parsed = (json || {}) as AsaasListResponse<AsaasTransfer>;
        const transfers = parsed.data || [];

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

        hasMore = parsed.hasMore === true;
        offset += limit;
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

        let lastErr: { status: number; text: string } | null = null;
        let parsed: AsaasListResponse<AsaasBillPayment> | null = null;

        for (const url of candidates) {
          const { ok, status, text, json } = await fetchAsaasJson(url, commonHeaders);
          if (ok) {
            parsed = (json || {}) as AsaasListResponse<AsaasBillPayment>;
            lastErr = null;
            break;
          }
          // tenta o próximo endpoint se for 404; senão já falha
          if (status !== 404) {
            throw new Error(`ASAAS bill erro ${status}: ${text}`);
          }
          lastErr = { status, text };
        }

        if (!parsed) {
          throw new Error(`ASAAS bill erro ${lastErr?.status || 500}: ${lastErr?.text || "endpoint não encontrado"}`);
        }

        const bills = parsed.data || [];

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

        hasMore = parsed.hasMore === true;
        offset += limit;
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced,
        window: { startDate, endDate },
        last_sync: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [sync-asaas-outflows] Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
