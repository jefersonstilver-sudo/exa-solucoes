import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AsaasPayment {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  netValue?: number;
  status: string;
  dueDate: string;
  dateCreated: string;
  paymentDate?: string;
  description?: string;
  externalReference?: string;
  transactionReceiptUrl?: string;
  nossoNumero?: string;
  bankSlipUrl?: string;
  invoiceUrl?: string;
  pixTransaction?: {
    id: string;
    qrCode: string;
    payload: string;
  };
  originalValue?: number;
  confirmedDate?: string;
  creditDate?: string;
}

interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ASAAS_API_KEY) {
      throw new Error("ASAAS_API_KEY não configurada");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const asaasBaseUrl = "https://api.asaas.com/v3";

    console.log("🔄 [sync-asaas-transactions] Iniciando sincronização...");

    // Parse request body for optional filters
    let dateFilter = "";
    let statusFilter = "";
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.startDate) {
          dateFilter = `&dateCreated[ge]=${body.startDate}`;
        }
        if (body.status) {
          statusFilter = `&status=${body.status}`;
        }
      } catch {
        // No body, use defaults
      }
    }

    // Fetch payments from ASAAS with pagination
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let totalSynced = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    
    // Cache for customer data
    const customerCache: Record<string, AsaasCustomer> = {};

    while (hasMore) {
      const url = `${asaasBaseUrl}/payments?offset=${offset}&limit=${limit}${dateFilter}${statusFilter}`;
      console.log(`📡 Fetching: ${url}`);

      const response = await fetch(url, {
        headers: {
          "access_token": ASAAS_API_KEY,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ ASAAS API error:", errorText);
        throw new Error(`ASAAS API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const payments: AsaasPayment[] = data.data || [];

      console.log(`📦 Recebidos ${payments.length} pagamentos (offset: ${offset})`);

      if (payments.length === 0) {
        hasMore = false;
        break;
      }

      // Process each payment
      for (const payment of payments) {
        // Get customer info (cached)
        let customer = customerCache[payment.customer];
        if (!customer && payment.customer) {
          try {
            const custResponse = await fetch(`${asaasBaseUrl}/customers/${payment.customer}`, {
              headers: {
                "access_token": ASAAS_API_KEY,
                "Content-Type": "application/json",
              },
            });
            if (custResponse.ok) {
              customer = await custResponse.json();
              customerCache[payment.customer] = customer;
            }
          } catch (e) {
            console.warn(`⚠️ Erro ao buscar cliente ${payment.customer}:`, e);
          }
        }

        // Calculate fee (netValue is what we receive after ASAAS fees)
        const taxaAsaas = payment.netValue 
          ? Number((payment.value - payment.netValue).toFixed(2))
          : null;

        // Prepare upsert data
        const transactionData = {
          payment_id: payment.id,
          billing_type: payment.billingType,
          status: payment.status,
          valor: payment.value,
          valor_liquido: payment.netValue || null,
          taxa_asaas: taxaAsaas,
          data_criacao: payment.dateCreated,
          data_vencimento: payment.dueDate,
          data_pagamento: payment.paymentDate || payment.confirmedDate || null,
          customer_id: payment.customer,
          customer_name: customer?.name || null,
          customer_email: customer?.email || null,
          customer_cpf_cnpj: customer?.cpfCnpj || null,
          description: payment.description || null,
          external_reference: payment.externalReference || null,
          pix_transaction_id: payment.pixTransaction?.id || null,
          pix_qr_code: payment.pixTransaction?.qrCode || null,
          pix_copy_paste: payment.pixTransaction?.payload || null,
          boleto_url: payment.bankSlipUrl || null,
          boleto_barcode: null, // ASAAS doesn't return barcode in list
          boleto_nosso_numero: payment.nossoNumero || null,
          raw_data: payment as unknown,
          synced_at: new Date().toISOString(),
        };

        // Upsert: insert or update if exists
        const { data: existing } = await supabase
          .from("transacoes_asaas")
          .select("id, status")
          .eq("payment_id", payment.id)
          .single();

        if (existing) {
          // Update only if status changed
          if (existing.status !== payment.status) {
            const { error } = await supabase
              .from("transacoes_asaas")
              .update(transactionData)
              .eq("payment_id", payment.id);

            if (error) {
              console.error(`❌ Erro ao atualizar ${payment.id}:`, error);
            } else {
              totalUpdated++;
              console.log(`✅ Atualizado: ${payment.id} (${existing.status} → ${payment.status})`);
            }
          } else {
            totalSkipped++;
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from("transacoes_asaas")
            .insert(transactionData);

          if (error) {
            console.error(`❌ Erro ao inserir ${payment.id}:`, error);
          } else {
            totalSynced++;
            console.log(`🆕 Inserido: ${payment.id} (${payment.billingType} - R$ ${payment.value})`);
          }
        }
      }

      // Check if more pages
      hasMore = data.hasMore === true;
      offset += limit;

      // Rate limiting - wait 200ms between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Fetch summary after sync
    const { data: summary } = await supabase
      .from("transacoes_asaas")
      .select("status, billing_type, valor")
      .order("created_at", { ascending: false });

    const stats = {
      total_records: summary?.length || 0,
      by_status: {} as Record<string, { count: number; total: number }>,
      by_type: {} as Record<string, { count: number; total: number }>,
    };

    summary?.forEach((t: any) => {
      // By status
      if (!stats.by_status[t.status]) {
        stats.by_status[t.status] = { count: 0, total: 0 };
      }
      stats.by_status[t.status].count++;
      stats.by_status[t.status].total += Number(t.valor);

      // By type
      if (!stats.by_type[t.billing_type]) {
        stats.by_type[t.billing_type] = { count: 0, total: 0 };
      }
      stats.by_type[t.billing_type].count++;
      stats.by_type[t.billing_type].total += Number(t.valor);
    });

    console.log("✅ [sync-asaas-transactions] Sincronização concluída:", {
      synced: totalSynced,
      updated: totalUpdated,
      skipped: totalSkipped,
    });

    return new Response(
      JSON.stringify({
        success: true,
        synced: totalSynced,
        updated: totalUpdated,
        skipped: totalSkipped,
        stats,
        last_sync: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [sync-asaas-transactions] Erro:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});