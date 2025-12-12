// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

// In-memory locks por client_id para evitar concorrência
const clientLocks = new Map<string, Promise<void>>();

// Função para adquirir lock exclusivo por client_id
async function acquireLock(clientId: string): Promise<() => void> {
  // Espera qualquer lock existente para este client_id
  while (clientLocks.has(clientId)) {
    await clientLocks.get(clientId);
  }
  
  // Cria um novo lock
  let releaseLock: () => void;
  const lockPromise = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  
  clientLocks.set(clientId, lockPromise);
  
  return () => {
    clientLocks.delete(clientId);
    releaseLock!();
  };
}

// Função para fazer chamada HTTP com timeout
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

interface ToggleRequest {
  titulos: string[];
  wait_for?: string;
}

interface DeactivationResult {
  titulo: string;
  status: "ok" | "error";
  http_status?: number;
  detail?: string;
}

interface ToggleResponse {
  ok: boolean;
  client_id: string;
  activated: string | null;
  activated_result: {
    status: "ok" | "error";
    http_status?: number;
    detail?: string;
  };
  deactivation_results: DeactivationResult[];
}

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Extrair client_id da URL
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const clientId = pathParts[pathParts.length - 1];

  console.log(`🔄 [GLOBAL-TOGGLE] Requisição recebida para client_id: ${clientId}`);

  if (!clientId || clientId.length < 1) {
    console.error('❌ [GLOBAL-TOGGLE] client_id inválido');
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'client_id inválido ou ausente na URL' 
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  let body: ToggleRequest;
  try {
    body = await req.json();
  } catch {
    console.error('❌ [GLOBAL-TOGGLE] Erro ao parsear JSON do body');
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'Body JSON inválido' 
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Validar titulos
  const { titulos, wait_for } = body;
  
  if (!titulos || !Array.isArray(titulos) || titulos.length === 0) {
    console.error('❌ [GLOBAL-TOGGLE] titulos deve ser array não-vazio');
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'titulos deve ser um array não-vazio de strings' 
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Validar cada título
  for (let i = 0; i < titulos.length; i++) {
    if (typeof titulos[i] !== 'string' || titulos[i].trim() === '') {
      console.error(`❌ [GLOBAL-TOGGLE] titulo[${i}] inválido:`, titulos[i]);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: `titulo[${i}] deve ser uma string não-vazia` 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
  }

  // URL base para chamadas - substituir {client_id}
  const baseUrl = (wait_for || 'http://15.228.8.3:8000/ativo/{client_id}')
    .replace('{client_id}', clientId);

  console.log(`🔗 [GLOBAL-TOGGLE] URL base: ${baseUrl}`);
  console.log(`📋 [GLOBAL-TOGGLE] Títulos a processar: ${titulos.length}`);
  console.log(`   ✅ Ativar: ${titulos[0]}`);
  console.log(`   ❌ Desativar: ${titulos.slice(1).join(', ') || '(nenhum)'}`);

  // Adquirir lock exclusivo para este client_id
  console.log(`🔒 [GLOBAL-TOGGLE] Adquirindo lock para client_id: ${clientId}`);
  const releaseLock = await acquireLock(clientId);
  console.log(`🔓 [GLOBAL-TOGGLE] Lock adquirido para client_id: ${clientId}`);

  const response: ToggleResponse = {
    ok: false,
    client_id: clientId,
    activated: null,
    activated_result: { status: "error" },
    deactivation_results: []
  };

  try {
    // PASSO 1: Ativar o primeiro título (ativo=true)
    const tituloAtivo = titulos[0];
    console.log(`🟢 [GLOBAL-TOGGLE] Ativando título principal: ${tituloAtivo}`);

    try {
      const activateResponse = await fetchWithTimeout(baseUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: tituloAtivo, ativo: true })
      }, 10000);

      const activateText = await activateResponse.text().catch(() => '');
      
      console.log(`${activateResponse.ok ? '✅' : '❌'} [GLOBAL-TOGGLE] Resultado ativação:`, {
        status: activateResponse.status,
        body: activateText
      });

      response.activated = tituloAtivo;
      response.activated_result = {
        status: activateResponse.ok ? "ok" : "error",
        http_status: activateResponse.status,
        detail: activateText
      };

      // Se falhou ao ativar o primeiro, não continua
      if (!activateResponse.ok) {
        console.error('❌ [GLOBAL-TOGGLE] Falha ao ativar título principal, abortando');
        response.ok = false;
        return new Response(JSON.stringify(response), {
          status: 200,
          headers: corsHeaders
        });
      }

    } catch (activateError: any) {
      console.error('💥 [GLOBAL-TOGGLE] Erro ao ativar título principal:', activateError);
      response.activated = tituloAtivo;
      response.activated_result = {
        status: "error",
        detail: activateError?.name === 'AbortError' 
          ? 'Timeout (10s) ao ativar título' 
          : (activateError?.message || 'Erro desconhecido')
      };
      response.ok = false;
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: corsHeaders
      });
    }

    // PASSO 2: Desativar os demais títulos sequencialmente
    const titulosParaDesativar = titulos.slice(1);
    
    for (const titulo of titulosParaDesativar) {
      console.log(`🔴 [GLOBAL-TOGGLE] Desativando título: ${titulo}`);
      
      const result: DeactivationResult = {
        titulo,
        status: "error"
      };

      try {
        const deactivateResponse = await fetchWithTimeout(baseUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, ativo: false })
        }, 10000);

        const deactivateText = await deactivateResponse.text().catch(() => '');
        
        console.log(`${deactivateResponse.ok ? '✅' : '⚠️'} [GLOBAL-TOGGLE] Resultado desativação ${titulo}:`, {
          status: deactivateResponse.status,
          body: deactivateText
        });

        result.status = deactivateResponse.ok ? "ok" : "error";
        result.http_status = deactivateResponse.status;
        result.detail = deactivateText;

      } catch (deactivateError: any) {
        console.error(`💥 [GLOBAL-TOGGLE] Erro ao desativar ${titulo}:`, deactivateError);
        result.status = "error";
        result.detail = deactivateError?.name === 'AbortError' 
          ? 'Timeout (10s) ao desativar título' 
          : (deactivateError?.message || 'Erro desconhecido');
      }

      response.deactivation_results.push(result);
    }

    // Verificar se tudo deu certo
    const allDeactivationsOk = response.deactivation_results.every(r => r.status === "ok");
    response.ok = response.activated_result.status === "ok" && 
                  (titulosParaDesativar.length === 0 || allDeactivationsOk);

    console.log(`🏁 [GLOBAL-TOGGLE] Processamento concluído:`, {
      ok: response.ok,
      activated: response.activated,
      deactivations_total: response.deactivation_results.length,
      deactivations_ok: response.deactivation_results.filter(r => r.status === "ok").length,
      deactivations_error: response.deactivation_results.filter(r => r.status === "error").length
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: corsHeaders
    });

  } finally {
    // Sempre liberar o lock
    console.log(`🔓 [GLOBAL-TOGGLE] Liberando lock para client_id: ${clientId}`);
    releaseLock();
  }
});
