import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Função para converter ArrayBuffer para Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║ 🚀 [CLICKSIGN] EDGE FUNCTION INVOCADA                        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("📅 Timestamp:", new Date().toISOString());
  console.log("📍 Method:", req.method);
  console.log("📍 URL:", req.url);
  
  if (req.method === "OPTIONS") {
    console.log("✅ [CLICKSIGN] Preflight OPTIONS - retornando 200");
    return new Response(null, { headers: corsHeaders });
  }

  let rawBody = "";
  
  try {
    rawBody = await req.text();
    console.log("📥 [CLICKSIGN] Raw body length:", rawBody.length);
    console.log("📥 [CLICKSIGN] Raw body preview:", rawBody.substring(0, 200));
    
    const body = JSON.parse(rawBody);
    const { contrato_id, pdf_base64: pdfFromFrontend } = body;
    console.log("📋 [CLICKSIGN] contrato_id parsed:", contrato_id);
    console.log("📋 [CLICKSIGN] PDF do frontend recebido:", pdfFromFrontend ? `SIM (${pdfFromFrontend.length} chars)` : "NÃO");

    if (!contrato_id) {
      console.error("❌ [CLICKSIGN] contrato_id não fornecido");
      return new Response(
        JSON.stringify({ error: "contrato_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clicksignToken = Deno.env.get("CLICKSIGN_ACCESS_TOKEN");

    if (!clicksignToken) {
      console.error("CLICKSIGN_ACCESS_TOKEN não configurado");
      return new Response(
        JSON.stringify({ error: "ClickSign não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar contrato
    const { data: contrato, error: contratoError } = await supabase
      .from("contratos_legais")
      .select("*")
      .eq("id", contrato_id)
      .single();

    if (contratoError || !contrato) {
      console.error("Contrato não encontrado:", contratoError);
      return new Response(
        JSON.stringify({ error: "Contrato não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("========================================");
    console.log("🚀 [CLICKSIGN] INICIANDO PROCESSAMENTO");
    console.log("========================================");
    console.log("📋 Contrato ID:", contrato_id);
    console.log("📋 Número:", contrato.numero_contrato);
    console.log("👤 Cliente:", contrato.cliente_nome);
    console.log("📧 Email:", contrato.cliente_email);
    console.log("📱 Telefone:", contrato.cliente_telefone);
    console.log("💰 Valor Total:", contrato.valor_total);
    console.log("💳 Método Pagamento:", contrato.metodo_pagamento);
    console.log("📅 Plano (meses):", contrato.plano_meses);
    console.log("🏢 Prédios:", JSON.stringify(contrato.lista_predios?.length || 0));
    console.log("📄 Parcelas:", JSON.stringify(contrato.parcelas || []));
    console.log("========================================");

    // Headers padrão para ClickSign API v3 (JSON:API spec)
    const clicksignHeaders = {
      "Content-Type": "application/vnd.api+json",
      "Accept": "application/vnd.api+json",
      "Authorization": clicksignToken  // SEM "Bearer" - ClickSign usa token direto
    };

    console.log("🔑 [CLICKSIGN] Token (primeiros 10 chars):", clicksignToken.substring(0, 10) + "...");

    // ========== 1. Criar Envelope (JSON:API format) ==========
    const envelopePayload = {
      data: {
        type: "envelopes",
        attributes: {
          name: `Contrato ${contrato.numero_contrato} - ${contrato.cliente_nome}`,
          locale: "pt-BR",
          auto_close: true,
          remind_interval: 3,
          block_after_refusal: true
        }
      }
    };
    
    console.log("📤 [CLICKSIGN] Payload envelope:", JSON.stringify(envelopePayload));

    console.log("Criando envelope no ClickSign...");
    const envelopeResponse = await fetch("https://app.clicksign.com/api/v3/envelopes", {
      method: "POST",
      headers: clicksignHeaders,
      body: JSON.stringify(envelopePayload)
    });

    if (!envelopeResponse.ok) {
      const errorText = await envelopeResponse.text();
      console.error("Erro ao criar envelope:", errorText);
      throw new Error(`Erro ClickSign (envelope): ${errorText}`);
    }

    const envelopeData = await envelopeResponse.json();
    const envelopeId = envelopeData.data?.id;
    console.log("Envelope criado:", envelopeId);

    // ========== 2. Buscar Signatários da tabela contrato_signatarios ==========
    console.log("🔍 [CLICKSIGN] Buscando signatários do contrato...");
    const { data: contratoSignatarios, error: signatariosDbError } = await supabase
      .from("contrato_signatarios")
      .select("*")
      .eq("contrato_id", contrato_id)
      .order("ordem");

    if (signatariosDbError) {
      console.warn("⚠️ [CLICKSIGN] Erro ao buscar signatários:", signatariosDbError);
    } else {
      console.log("✅ [CLICKSIGN] Signatários encontrados:", contratoSignatarios?.length || 0);
      contratoSignatarios?.forEach((s: any) => console.log("   - ", s.tipo, ":", s.nome, s.sobrenome, "(", s.email, ")"));
    }

    // Separar signatários por tipo
    const clienteSignatarios = contratoSignatarios?.filter((s: any) => s.tipo === 'cliente') || [];
    const exaSignatarios = contratoSignatarios?.filter((s: any) => s.tipo === 'exa') || [];
    const testemunhaSignatarios = contratoSignatarios?.filter((s: any) => s.tipo === 'testemunha') || [];

    // Fallback: buscar signatários EXA da tabela legada se não houver no contrato
    let signatariosExa = exaSignatarios;
    if (exaSignatarios.length === 0) {
      console.log("🔍 [CLICKSIGN] Nenhum signatário EXA no contrato, buscando da tabela signatarios_exa...");
      const { data: signatariosExaLegacy, error: signatarioError } = await supabase
        .from("signatarios_exa")
        .select("*")
        .eq("is_active", true)
        .order("is_default", { ascending: false });

      if (!signatarioError && signatariosExaLegacy?.length) {
        signatariosExa = signatariosExaLegacy.map((s: any) => ({
          ...s,
          sobrenome: s.nome.split(' ').slice(1).join(' ') || '',
          nome: s.nome.split(' ')[0] || s.nome
        }));
        console.log("✅ [CLICKSIGN] Signatários EXA (legado) encontrados:", signatariosExa.length);
      }
    }

    // ========== 3. Buscar especificações técnicas de produtos_exa ==========
    console.log("📋 [CLICKSIGN] Buscando especificações técnicas...");
    const { data: produtosExa } = await supabase
      .from("produtos_exa")
      .select("*");
    
    const { data: configExibicao } = await supabase
      .from("configuracoes_exibicao")
      .select("*")
      .single();

    // ========== 4. Gerar HTML do Contrato ==========
    const contractHtml = generateContractHtml(contrato, signatariosExa || [], produtosExa || [], configExibicao);
    console.log("📄 [CLICKSIGN] HTML gerado, tamanho:", contractHtml.length, "chars");

    // ========== 4. Usar PDF do Frontend ou Gerar ==========
    console.log("🔄 [CLICKSIGN] Processando PDF...");
    
    let pdfBase64: string;
    
    // PRIORIDADE: Usar PDF do frontend se disponível
    if (pdfFromFrontend && pdfFromFrontend.length > 100) {
      pdfBase64 = pdfFromFrontend;
      console.log("✅ [CLICKSIGN] Usando PDF gerado no frontend, tamanho:", pdfBase64.length, "chars");
    } else {
      console.log("⚠️ [CLICKSIGN] PDF do frontend não disponível, tentando APIs externas...");
      
      let pdfConversionSuccess = false;
      
      try {
        // Opção 1: Usar API do PDF.co
        const pdfCoResponse = await fetch("https://api.pdf.co/v1/pdf/convert/from/html", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "FREE"
          },
          body: JSON.stringify({
            html: contractHtml,
            name: `contrato_${contrato.numero_contrato}.pdf`,
            margins: "10mm"
          })
        });

        if (pdfCoResponse.ok) {
          const pdfCoData = await pdfCoResponse.json();
          if (pdfCoData.url) {
            const pdfDownload = await fetch(pdfCoData.url);
            if (pdfDownload.ok) {
              const pdfBuffer = await pdfDownload.arrayBuffer();
              pdfBase64 = arrayBufferToBase64(pdfBuffer);
              pdfConversionSuccess = true;
              console.log("✅ [CLICKSIGN] PDF gerado via pdf.co, tamanho:", pdfBase64.length, "chars");
            }
          }
        }

        if (!pdfConversionSuccess) {
          console.log("⚠️ [CLICKSIGN] pdf.co falhou, tentando html2pdf.app...");
          const pdfResponse = await fetch("https://api.html2pdf.app/v1/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              html: contractHtml,
              options: { format: "A4", margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" } }
            })
          });

          if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.arrayBuffer();
            pdfBase64 = arrayBufferToBase64(pdfBuffer);
            pdfConversionSuccess = true;
            console.log("✅ [CLICKSIGN] PDF gerado via html2pdf.app");
          }
        }

        if (!pdfConversionSuccess) {
          console.error("❌ [CLICKSIGN] TODAS APIs DE PDF FALHARAM - ABORTANDO");
          throw new Error("Não foi possível gerar PDF. Envie o PDF do frontend.");
        }
      } catch (conversionError) {
        console.error("❌ [CLICKSIGN] Erro crítico na conversão PDF:", conversionError);
        throw new Error("Falha ao gerar PDF. Certifique-se de que o frontend está gerando o PDF corretamente.");
      }
    }

    // ========== 5. Upload do Documento (JSON:API format) ==========
    const sanitizedFilename = contrato.numero_contrato.replace(/[^a-zA-Z0-9]/g, '_');
    console.log("📄 [CLICKSIGN] Filename sanitizado:", `Contrato_${sanitizedFilename}.pdf`);
    
    const documentPayload = {
      data: {
        type: "documents",
        attributes: {
          filename: `Contrato_${sanitizedFilename}.pdf`,
          content_base64: `data:application/pdf;base64,${pdfBase64}`
        }
      }
    };

    console.log("Fazendo upload do documento...");
    const documentResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/documents`, {
      method: "POST",
      headers: clicksignHeaders,
      body: JSON.stringify(documentPayload)
    });

    if (!documentResponse.ok) {
      const errorText = await documentResponse.text();
      console.error("Erro ao fazer upload:", errorText);
      throw new Error(`Erro ClickSign (document): ${errorText}`);
    }

    const documentData = await documentResponse.json();
    const documentKey = documentData.data?.id || documentData.data?.attributes?.key;
    console.log("Documento criado:", documentKey);

    // ========== 6. Adicionar Signatário(s) CLIENTE ==========
    const allSignerKeys: { key: string; tipo: string }[] = [];
    
    // Usar dados da tabela contrato_signatarios se disponível
    const clienteData = clienteSignatarios.length > 0 
      ? clienteSignatarios[0] 
      : { 
          nome: contrato.cliente_nome?.split(' ')[0] || contrato.cliente_nome, 
          sobrenome: contrato.cliente_nome?.split(' ').slice(1).join(' ') || '',
          email: contrato.cliente_email,
          data_nascimento: contrato.cliente_data_nascimento
        };
    
    const clientFullName = `${clienteData.nome} ${clienteData.sobrenome || ''}`.trim();
    
    const clientSignerPayload = {
      data: {
        type: "signers",
        attributes: {
          name: clientFullName,
          email: clienteData.email,
          ...(clienteData.data_nascimento && { birthday: clienteData.data_nascimento })
        }
      }
    };

    console.log("📤 [CLICKSIGN] Payload signatário cliente:", JSON.stringify(clientSignerPayload));
    console.log("👤 [CLICKSIGN] Adicionando signatário CLIENTE...");
    const clientSignerResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/signers`, {
      method: "POST",
      headers: clicksignHeaders,
      body: JSON.stringify(clientSignerPayload)
    });

    if (!clientSignerResponse.ok) {
      const errorText = await clientSignerResponse.text();
      console.error("❌ [CLICKSIGN] Erro ao adicionar signatário cliente:", errorText);
      throw new Error(`Erro ClickSign (client signer): ${errorText}`);
    }

    const clientSignerData = await clientSignerResponse.json();
    const clientSignerKey = clientSignerData.data?.id || clientSignerData.data?.attributes?.key;
    console.log("✅ [CLICKSIGN] Signatário CLIENTE adicionado:", clientSignerKey);
    allSignerKeys.push({ key: clientSignerKey, tipo: 'cliente' });

    // ========== 7. Adicionar Signatários EXA ==========
    const exaSignerKeys: string[] = [];
    if (signatariosExa && signatariosExa.length > 0) {
      for (const signatario of signatariosExa) {
        const exaFullName = signatario.sobrenome 
          ? `${signatario.nome} ${signatario.sobrenome}`.trim()
          : signatario.nome;
        
        const exaSignerPayload = {
          data: {
            type: "signers",
            attributes: {
              name: exaFullName,
              email: signatario.email,
              ...(signatario.data_nascimento && { birthday: signatario.data_nascimento })
            }
          }
        };

        console.log(`🏢 [CLICKSIGN] Adicionando signatário EXA: ${exaFullName}...`);
        const exaSignerResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/signers`, {
          method: "POST",
          headers: clicksignHeaders,
          body: JSON.stringify(exaSignerPayload)
        });

        if (!exaSignerResponse.ok) {
          const errorText = await exaSignerResponse.text();
          console.warn(`⚠️ [CLICKSIGN] Erro ao adicionar signatário EXA ${exaFullName}:`, errorText);
        } else {
          const exaSignerData = await exaSignerResponse.json();
          const exaSignerKey = exaSignerData.data?.id || exaSignerData.data?.attributes?.key;
          exaSignerKeys.push(exaSignerKey);
          allSignerKeys.push({ key: exaSignerKey, tipo: 'exa' });
          console.log(`✅ [CLICKSIGN] Signatário EXA ${exaFullName} adicionado:`, exaSignerKey);
        }
      }
    }

    // ========== 7b. Adicionar Testemunhas (se houver) ==========
    const testemunhaSignerKeys: string[] = [];
    if (testemunhaSignatarios && testemunhaSignatarios.length > 0) {
      for (const testemunha of testemunhaSignatarios) {
        const testemunhaFullName = `${testemunha.nome} ${testemunha.sobrenome || ''}`.trim();
        
        const testemunhaSignerPayload = {
          data: {
            type: "signers",
            attributes: {
              name: testemunhaFullName,
              email: testemunha.email,
              ...(testemunha.data_nascimento && { birthday: testemunha.data_nascimento })
            }
          }
        };

        console.log(`👥 [CLICKSIGN] Adicionando testemunha: ${testemunhaFullName}...`);
        const testemunhaSignerResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/signers`, {
          method: "POST",
          headers: clicksignHeaders,
          body: JSON.stringify(testemunhaSignerPayload)
        });

        if (!testemunhaSignerResponse.ok) {
          const errorText = await testemunhaSignerResponse.text();
          console.warn(`⚠️ [CLICKSIGN] Erro ao adicionar testemunha ${testemunhaFullName}:`, errorText);
        } else {
          const testemunhaSignerData = await testemunhaSignerResponse.json();
          const testemunhaSignerKey = testemunhaSignerData.data?.id || testemunhaSignerData.data?.attributes?.key;
          testemunhaSignerKeys.push(testemunhaSignerKey);
          allSignerKeys.push({ key: testemunhaSignerKey, tipo: 'testemunha' });
          console.log(`✅ [CLICKSIGN] Testemunha ${testemunhaFullName} adicionada:`, testemunhaSignerKey);
        }
      }
    }

    // ========== 8. Criar Requirement CLIENTE (action: "agree" + role: "sign") ==========
    const clientRequirementPayload = {
      data: {
        type: "requirements",
        attributes: {
          action: "agree",
          role: "sign"
        },
        relationships: {
          document: {
            data: { type: "documents", id: documentKey }
          },
          signer: {
            data: { type: "signers", id: clientSignerKey }
          }
        }
      }
    };

    console.log("🔗 [CLICKSIGN] Criando requirement CLIENTE com action: agree...");
    console.log("📤 [CLICKSIGN] Payload requirement:", JSON.stringify(clientRequirementPayload));
    
    const clientRequirementResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/requirements`, {
      method: "POST",
      headers: clicksignHeaders,
      body: JSON.stringify(clientRequirementPayload)
    });

    if (!clientRequirementResponse.ok) {
      const errorText = await clientRequirementResponse.text();
      console.error("❌ [CLICKSIGN] Erro ao criar requirement cliente:", errorText);
      throw new Error(`Erro ClickSign (client requirement): ${errorText}`);
    }

    const clientRequirementData = await clientRequirementResponse.json();
    const clientRequirementKey = clientRequirementData.data?.id;
    console.log("✅ [CLICKSIGN] Requirement qualificação CLIENTE criado:", clientRequirementKey);

    // ========== 8b. Criar Requirement de EVIDÊNCIA/AUTENTICAÇÃO CLIENTE ==========
    const clientEvidencePayload = {
      data: {
        type: "requirements",
        attributes: {
          action: "provide_evidence",
          auth: "email"
        },
        relationships: {
          document: {
            data: { type: "documents", id: documentKey }
          },
          signer: {
            data: { type: "signers", id: clientSignerKey }
          }
        }
      }
    };

    console.log("🔐 [CLICKSIGN] Criando requirement evidência CLIENTE com auth: email...");
    const clientEvidenceResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/requirements`, {
      method: "POST",
      headers: clicksignHeaders,
      body: JSON.stringify(clientEvidencePayload)
    });

    if (!clientEvidenceResponse.ok) {
      const errorText = await clientEvidenceResponse.text();
      console.warn("⚠️ [CLICKSIGN] Erro ao criar requirement evidência cliente:", errorText);
    } else {
      const clientEvidenceData = await clientEvidenceResponse.json();
      console.log("✅ [CLICKSIGN] Requirement evidência CLIENTE criado:", clientEvidenceData.data?.id);
    }

    // ========== 9. Criar Requirements para TODOS os Signatários EXA ==========
    const exaRequirementKeys: string[] = [];
    for (const exaSignerKey of exaSignerKeys) {
      const exaRequirementPayload = {
        data: {
          type: "requirements",
          attributes: {
            action: "agree",
            role: "sign"
          },
          relationships: {
            document: {
              data: { type: "documents", id: documentKey }
            },
            signer: {
              data: { type: "signers", id: exaSignerKey }
            }
          }
        }
      };

      console.log(`🔗 [CLICKSIGN] Criando requirement EXA para signer ${exaSignerKey}...`);
      const exaRequirementResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/requirements`, {
        method: "POST",
        headers: clicksignHeaders,
        body: JSON.stringify(exaRequirementPayload)
      });

      if (!exaRequirementResponse.ok) {
        const errorText = await exaRequirementResponse.text();
        console.warn(`⚠️ [CLICKSIGN] Erro ao criar requirement EXA:`, errorText);
      } else {
        const exaRequirementData = await exaRequirementResponse.json();
        const exaRequirementKey = exaRequirementData.data?.id;
        exaRequirementKeys.push(exaRequirementKey);
        console.log(`✅ [CLICKSIGN] Requirement qualificação EXA criado:`, exaRequirementKey);

        // Criar requirement de evidência para EXA
        const exaEvidencePayload = {
          data: {
            type: "requirements",
            attributes: {
              action: "provide_evidence",
              auth: "email"
            },
            relationships: {
              document: {
                data: { type: "documents", id: documentKey }
              },
              signer: {
                data: { type: "signers", id: exaSignerKey }
              }
            }
          }
        };

        console.log(`🔐 [CLICKSIGN] Criando requirement evidência EXA para signer ${exaSignerKey}...`);
        const exaEvidenceResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/requirements`, {
          method: "POST",
          headers: clicksignHeaders,
          body: JSON.stringify(exaEvidencePayload)
        });

        if (!exaEvidenceResponse.ok) {
          const errorText = await exaEvidenceResponse.text();
          console.warn(`⚠️ [CLICKSIGN] Erro ao criar requirement evidência EXA:`, errorText);
        } else {
          const exaEvidenceData = await exaEvidenceResponse.json();
          console.log(`✅ [CLICKSIGN] Requirement evidência EXA criado:`, exaEvidenceData.data?.id);
        }
      }
    }

    // ========== 9b. Criar Requirements para TESTEMUNHAS ==========
    const testemunhaRequirementKeys: string[] = [];
    for (const testemunhaSignerKey of testemunhaSignerKeys) {
      const testemunhaRequirementPayload = {
        data: {
          type: "requirements",
          attributes: {
            action: "agree",
            role: "witness"
          },
          relationships: {
            document: {
              data: { type: "documents", id: documentKey }
            },
            signer: {
              data: { type: "signers", id: testemunhaSignerKey }
            }
          }
        }
      };

      console.log(`🔗 [CLICKSIGN] Criando requirement TESTEMUNHA para signer ${testemunhaSignerKey}...`);
      const testemunhaRequirementResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/requirements`, {
        method: "POST",
        headers: clicksignHeaders,
        body: JSON.stringify(testemunhaRequirementPayload)
      });

      if (!testemunhaRequirementResponse.ok) {
        const errorText = await testemunhaRequirementResponse.text();
        console.warn(`⚠️ [CLICKSIGN] Erro ao criar requirement testemunha:`, errorText);
      } else {
        const testemunhaRequirementData = await testemunhaRequirementResponse.json();
        const testemunhaRequirementKey = testemunhaRequirementData.data?.id;
        testemunhaRequirementKeys.push(testemunhaRequirementKey);
        console.log(`✅ [CLICKSIGN] Requirement qualificação TESTEMUNHA criado:`, testemunhaRequirementKey);

        // Criar requirement de evidência para TESTEMUNHA
        const testemunhaEvidencePayload = {
          data: {
            type: "requirements",
            attributes: {
              action: "provide_evidence",
              auth: "email"
            },
            relationships: {
              document: {
                data: { type: "documents", id: documentKey }
              },
              signer: {
                data: { type: "signers", id: testemunhaSignerKey }
              }
            }
          }
        };

        console.log(`🔐 [CLICKSIGN] Criando requirement evidência TESTEMUNHA para signer ${testemunhaSignerKey}...`);
        const testemunhaEvidenceResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/requirements`, {
          method: "POST",
          headers: clicksignHeaders,
          body: JSON.stringify(testemunhaEvidencePayload)
        });

        if (!testemunhaEvidenceResponse.ok) {
          const errorText = await testemunhaEvidenceResponse.text();
          console.warn(`⚠️ [CLICKSIGN] Erro ao criar requirement evidência testemunha:`, errorText);
        } else {
          const testemunhaEvidenceData = await testemunhaEvidenceResponse.json();
          console.log(`✅ [CLICKSIGN] Requirement evidência TESTEMUNHA criado:`, testemunhaEvidenceData.data?.id);
        }
      }
    }

    // Usar clientSignerKey como principal para manter compatibilidade
    const signerKey = clientSignerKey;
    const requestSignatureKey = clientRequirementKey;

    // ========== 10. Ativar Envelope ==========
    console.log("Ativando envelope...");
    const activatePayload = {
      data: {
        id: envelopeId,
        type: "envelopes",
        attributes: {
          status: "running"
        }
      }
    };

    console.log("📤 [CLICKSIGN] Payload ativação:", JSON.stringify(activatePayload));

    const activateResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}`, {
      method: "PATCH",
      headers: clicksignHeaders,
      body: JSON.stringify(activatePayload)
    });

    if (!activateResponse.ok) {
      const errorText = await activateResponse.text();
      console.error("Erro ao ativar envelope:", errorText);
      throw new Error(`Erro ClickSign (activate): ${errorText}`);
    }

    console.log("✅ Envelope ativado com status 'running'!");

    // ========== 11. Enviar Notificação ==========
    console.log("Enviando notificação...");
    const notifyPayload = {
      data: {
        type: "notifications",
        attributes: {
          message: `Olá ${contrato.cliente_nome}, você recebeu o contrato ${contrato.numero_contrato} da EXA Mídia para assinatura eletrônica.`
        }
      }
    };

    const notifyResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/notifications`, {
      method: "POST",
      headers: clicksignHeaders,
      body: JSON.stringify(notifyPayload)
    });

    if (!notifyResponse.ok) {
      console.warn("Aviso: Notificação não enviada, mas envelope está ativo");
    } else {
      console.log("Notificação enviada!");
    }

    // ========== 12. Atualizar Banco de Dados ==========
    const { error: updateError } = await supabase
      .from("contratos_legais")
      .update({
        clicksign_envelope_id: envelopeId,
        clicksign_document_key: documentKey,
        clicksign_signer_key: signerKey,
        clicksign_request_signature_key: requestSignatureKey,
        status: "enviado",
        enviado_em: new Date().toISOString()
      })
      .eq("id", contrato_id);

    if (updateError) {
      console.error("Erro ao atualizar contrato:", updateError);
    }

    // Registrar log
    await supabase.from("contratos_legais_logs").insert({
      contrato_id,
      acao: "enviado_clicksign",
      detalhes: {
        envelope_id: envelopeId,
        document_key: documentKey,
        signer_key: signerKey,
        exa_signers_count: exaSignerKeys.length,
        exa_signer_keys: exaSignerKeys
      }
    });

    console.log("Contrato enviado com sucesso!");

    return new Response(
      JSON.stringify({
        success: true,
        envelope_id: envelopeId,
        document_key: documentKey,
        signer_key: signerKey,
        exa_signers_count: exaSignerKeys.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Função para gerar HTML do contrato com template profissional - Manual Técnico v3.0
function generateContractHtml(contrato: any, signatariosExa: any[], produtosExa: any[] = [], configExibicao: any = null): string {
  console.log("🖨️ [CLICKSIGN] Gerando HTML do contrato PROFISSIONAL com 12 cláusulas...");
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDateExtended = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                     'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const getNumeroExtenso = (num: number) => {
    const extenso: Record<number, string> = {
      1: 'um', 2: 'dois', 3: 'três', 4: 'quatro', 5: 'cinco',
      6: 'seis', 7: 'sete', 8: 'oito', 9: 'nove', 10: 'dez',
      11: 'onze', 12: 'doze', 13: 'treze'
    };
    return extenso[num] || String(num);
  };

  const listaPredios = Array.isArray(contrato.lista_predios) ? contrato.lista_predios : [];
  const totalPaineis = contrato.total_paineis || listaPredios.reduce((acc: number, p: any) => acc + (p.quantidade_telas || 1), 0);
  const parcelas = Array.isArray(contrato.parcelas) ? contrato.parcelas : [];

  const dataAtual = new Date().toLocaleDateString('pt-BR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // ========== ESPECIFICAÇÕES TÉCNICAS DO MANUAL v3.0 ==========
  const isVerticalPremium = contrato.tipo_produto === 'vertical_premium';
  
  // Configurações de exibição (padrão Manual v3.0)
  const horasOperacao = configExibicao?.horas_operacao_dia || 21;
  const diasMes = configExibicao?.dias_mes || 30;
  const segundosDia = horasOperacao * 3600; // 75.600 segundos

  // Buscar produto específico ou usar defaults do Manual v3.0
  const produtoHorizontal = produtosExa?.find((p: any) => p.tipo === 'horizontal') || {
    duracao_segundos: 10,
    resolucao: '1440x1080',
    proporcao: '4:3',
    max_clientes_painel: 15
  };
  
  const produtoVertical = produtosExa?.find((p: any) => p.tipo === 'vertical_premium') || {
    duracao_segundos: 15,
    resolucao: '1080x1920',
    proporcao: '9:16',
    max_clientes_painel: 3
  };

  // Cálculo do ciclo (Manual v3.0: 45s vertical + 150s horizontal = 195s)
  const tempoVerticalCiclo = (produtoVertical.max_clientes_painel || 3) * (produtoVertical.duracao_segundos || 15);
  const tempoHorizontalCiclo = (produtoHorizontal.max_clientes_painel || 15) * (produtoHorizontal.duracao_segundos || 10);
  const tempoCicloTotal = tempoVerticalCiclo + tempoHorizontalCiclo;
  
  // Ciclos por dia = 75.600 / 195 ≈ 387
  const ciclosPorDia = Math.floor(segundosDia / tempoCicloTotal);
  const exibicoesPorMes = ciclosPorDia * diasMes;

  // Especificações baseadas no tipo de produto
  const especificacoesTecnicas = isVerticalPremium ? {
    formato: `Vídeo vertical (${produtoVertical.resolucao || '1080x1920'} pixels)`,
    proporcao: produtoVertical.proporcao || '9:16',
    duracao: `${produtoVertical.duracao_segundos || 15} segundos`,
    exibicoesDia: ciclosPorDia,
    exibicoesMes: exibicoesPorMes,
    descricao: 'Vertical Premium - Tela Cheia',
    tipoExibicao: 'Tela Cheia (Full Screen)'
  } : {
    formato: `Vídeo horizontal (${produtoHorizontal.resolucao || '1440x1080'} pixels)`,
    proporcao: produtoHorizontal.proporcao || '4:3',
    duracao: `${produtoHorizontal.duracao_segundos || 10} segundos`,
    exibicoesDia: ciclosPorDia,
    exibicoesMes: exibicoesPorMes,
    descricao: 'Horizontal Tradicional - Carrossel',
    tipoExibicao: 'Carrossel Compartilhado'
  };

  // ANEXO I - Tabela de prédios com cálculos de exibição
  const prediosHtml = listaPredios.map((p: any) => {
    const telas = p.quantidade_telas || 1;
    const exibDia = ciclosPorDia * telas;
    const exibMes = exibicoesPorMes * telas;
    return `
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 11px;">${p.nome || p.building_name}</td>
      <td style="border: 1px solid #e5e7eb; padding: 10px; font-size: 11px;">${p.bairro || p.endereco || '-'}</td>
      <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; font-size: 11px;">${telas}</td>
      <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; font-size: 11px;">≈${exibDia.toLocaleString('pt-BR')}</td>
      <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; font-size: 11px;">≈${exibMes.toLocaleString('pt-BR')}</td>
    </tr>
  `;
  }).join('');

  // Totais gerais
  const totalExibDia = ciclosPorDia * totalPaineis;
  const totalExibMes = exibicoesPorMes * totalPaineis;

  const metodoPagamentoNome = (metodo: string) => {
    switch (metodo) {
      case 'pix_avista': return 'PIX À VISTA';
      case 'pix_fidelidade': return 'PIX FIDELIDADE';
      case 'boleto_fidelidade': return 'BOLETO FIDELIDADE';
      case 'cartao': return 'CARTÃO DE CRÉDITO';
      case 'custom': return 'CONDIÇÃO PERSONALIZADA';
      default: return (metodo || 'A DEFINIR').replace(/_/g, ' ').toUpperCase();
    }
  };

  const planoNome = (meses: number) => {
    switch (meses) {
      case 1: return 'Mensal';
      case 3: return 'Trimestral';
      case 6: return 'Semestral';
      case 12: return 'Anual';
      default: return `${meses} meses`;
    }
  };

  // Signatário EXA ÚNICO - Jeferson Stilver (sem fallback de Natália)
  const signatarioExa = signatariosExa.find(s => s.cpf === '055.031.279-00') || {
    nome: 'Jeferson Stilver Rodrigues Encina',
    rg: '8.812.269-0',
    cpf: '055.031.279-00'
  };

  // Template para contrato de síndico (Comodato)
  if (contrato.tipo_contrato === 'sindico') {
    return generateSindicoContractHtml(contrato, signatarioExa, dataAtual, totalPaineis);
  }

  // Template para contrato de anunciante (Publicidade) - COM 12 CLÁUSULAS COMPLETAS
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contrato ${contrato.numero_contrato}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          line-height: 1.6;
          color: #1f2937;
          background: #ffffff;
        }
        
        /* HEADER OFICIAL EXA - Full Width */
        .header-container {
          width: calc(100% + 80px);
          margin: 0 -40px 30px -40px;
          display: block;
        }
        
        .header-image {
          width: 100%;
          height: auto;
          display: block;
        }
        
        .container {
          padding: 0 40px 40px 40px;
          max-width: 100%;
        }
        
        .document-title {
          text-align: center;
          margin-bottom: 25px;
        }
        
        .document-title h2 {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 5px;
        }
        
        .document-title .subtitle {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .section {
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 12px;
          font-weight: 700;
          color: #8B1A1A;
          margin-bottom: 8px;
          padding-bottom: 5px;
          border-bottom: 2px solid #fee2e2;
        }
        
        .parties-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
        }
        
        .party {
          margin-bottom: 15px;
        }
        
        .party:last-child {
          margin-bottom: 0;
        }
        
        .party-label {
          font-size: 10px;
          font-weight: 700;
          color: #8B1A1A;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }
        
        .party-content {
          font-size: 11px;
          color: #374151;
          line-height: 1.5;
        }
        
        .clause {
          margin-bottom: 18px;
        }
        
        .clause-title {
          font-size: 11px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .clause-content {
          font-size: 11px;
          color: #4b5563;
          text-align: justify;
        }
        
        .clause-item {
          margin-bottom: 6px;
          padding-left: 10px;
        }
        
        .highlight-box {
          background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
          border: 1px solid #fecaca;
          border-left: 4px solid #8B1A1A;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 11px;
        }
        
        th {
          background: #f3f4f6;
          color: #374151;
          font-weight: 600;
          padding: 10px;
          text-align: left;
          border: 1px solid #e5e7eb;
        }
        
        td {
          padding: 10px;
          border: 1px solid #e5e7eb;
        }
        
        .signatures-section {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #e5e7eb;
        }
        
        .signatures-title {
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 40px;
        }
        
        .signatures-grid {
          display: flex;
          justify-content: space-between;
          gap: 40px;
        }
        
        .signature-box {
          flex: 1;
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #1f2937;
          padding-top: 15px;
          margin-top: 80px;
        }
        
        .signature-name {
          font-size: 11px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 3px;
        }
        
        .signature-role {
          font-size: 10px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .signature-docs {
          font-size: 9px;
          color: #9ca3af;
          margin-top: 5px;
        }
        
        .exa-representatives {
          margin-top: 30px;
        }
        
        .exa-rep-title {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .exa-reps-grid {
          display: flex;
          justify-content: center;
          gap: 60px;
        }
        
        .exa-rep-box {
          text-align: center;
          min-width: 200px;
        }
        
        .date-location {
          text-align: center;
          margin-top: 30px;
          font-size: 11px;
          color: #6b7280;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 9px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <!-- HEADER OFICIAL EXA - Full Width -->
      <div class="header-container">
        <img
          class="header-image"
          src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/exa-contract-header.png"
          alt="EXA Header"
          crossorigin="anonymous"
        />
      </div>
      
      <div class="container">
        <!-- TÍTULO DO DOCUMENTO -->
        <div class="document-title">
          <h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PUBLICIDADE DIGITAL — EXA</h2>
          <div class="subtitle">Mídia: Painéis Indoor — Elevadores & Áreas Internas</div>
        </div>
        
        <!-- IDENTIFICAÇÃO DAS PARTES -->
        <div class="parties-box">
          <div class="party">
            <div class="party-label">CONTRATADA</div>
            <div class="party-content">
              <strong>INDEXA MIDIA LTDA</strong> (marca ExaMídia), pessoa jurídica inscrita no CNPJ nº 38.142.638/0001-30, com sede à Avenida Paraná, 974 — Sala 301 — Centro — Foz do Iguaçu/PR. Representante legal: <strong>${signatarioExa.nome}</strong> (RG ${signatarioExa.rg || '8.812.269-0'} / CPF ${signatarioExa.cpf}).
            </div>
          </div>
          <div class="party">
            <div class="party-label">CONTRATANTE</div>
            <div class="party-content">
              <strong>${contrato.cliente_razao_social || contrato.cliente_nome}</strong>${contrato.cliente_cnpj ? ` — CNPJ: ${contrato.cliente_cnpj}` : ''}; Endereço: ${contrato.cliente_endereco || contrato.cliente_cidade || 'Foz do Iguaçu — PR'}. Representante: Sr(a). <strong>${contrato.cliente_nome}</strong>${contrato.cliente_cargo ? ` (${contrato.cliente_cargo})` : ''}.
            </div>
          </div>
        </div>
        
        <!-- CLÁUSULA 1 — DO OBJETO -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 1 — DO OBJETO</div>
          <div class="clause-content">
            <div class="clause-item">1.1. Veiculação de conteúdo publicitário fornecido pela CONTRATANTE nas telas digitais operadas pela EXA, instaladas em ${listaPredios.length} (${getNumeroExtenso(listaPredios.length)}) prédio(s).</div>
            <div class="clause-item">1.2. Inclui gestão de playlist, aprovação de criativos, administração de horários e relatórios de exibição via plataforma EXA Cloud.</div>
          </div>
        </div>
        
        <!-- CLÁUSULA 2 — DO PRAZO -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 2 — DO PRAZO</div>
          <div class="clause-content">
            <div class="clause-item">2.1. Prazo: ${contrato.plano_meses || 1} (${getNumeroExtenso(contrato.plano_meses || 1)}) mês(es) a partir da data de início da veiculação. Renovação mediante acordo entre as partes ou encerramento ao término do prazo.</div>
            ${contrato.data_inicio ? `<div class="clause-item">2.2. Data de início: ${formatDateExtended(contrato.data_inicio)}</div>` : ''}
            ${contrato.data_fim ? `<div class="clause-item">2.3. Data de término: ${formatDateExtended(contrato.data_fim)}</div>` : ''}
          </div>
        </div>
        
        <!-- CLÁUSULA 3 — DO VALOR E PAGAMENTO -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 3 — DO VALOR E PAGAMENTO</div>
          <div class="highlight-box">
            <div class="clause-content">
              <div class="clause-item">3.1. Valor: <strong>${formatCurrency(contrato.valor_mensal || contrato.valor_total)}</strong> ${contrato.valor_mensal ? 'mensais' : 'total'}, por ${contrato.plano_meses || 1} mês(es). Total: <strong>${formatCurrency(contrato.valor_total)}</strong></div>
              <div class="clause-item">3.2. Forma de Pagamento: <strong>${metodoPagamentoNome(contrato.metodo_pagamento)}</strong>${contrato.dia_vencimento ? `, vencimento dia ${contrato.dia_vencimento} de cada mês` : ''}. Emissão e registro no portal www.examidia.com.br.</div>
              <div class="clause-item">3.3. Atrasos: multa de 2%, juros de 1% ao mês e correção. Atraso >10 dias pode suspender veiculação; >30 dias autoriza rescisão e aplicação de multa contratual.</div>
            </div>
          </div>
        </div>
        
        <!-- CLÁUSULA 4 — DO CONTEÚDO E ESPECIFICAÇÕES TÉCNICAS -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 4 — DO CONTEÚDO E ESPECIFICAÇÕES TÉCNICAS</div>
          <div class="clause-content">
            <div class="clause-item">4.1. <strong>Tipo de Produto:</strong> ${especificacoesTecnicas.descricao}</div>
            <div class="clause-item">4.2. <strong>Especificações técnicas:</strong> Resolução ${especificacoesTecnicas.formato}, proporção ${especificacoesTecnicas.proporcao}, duração máxima de ${especificacoesTecnicas.duracao}, formato MP4. Tipo de exibição: ${especificacoesTecnicas.tipoExibicao}.</div>
            <div class="clause-item">4.3. Prazo de aprovação do moderador: até 1 (uma) hora em dias úteis; após aprovação, inserção na playlist conforme cronograma.</div>
            <div class="clause-item">4.4. Conteúdos proibidos: político/eleitoral, pornográfico, ilegal, discriminatório ou que viole direitos. Conteúdo inadequado será removido sem prejuízo do faturamento.</div>
          </div>
        </div>
        
        <!-- CLÁUSULA 5 — ENTREGA, FREQUÊNCIA E SLA -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 5 — ENTREGA, FREQUÊNCIA E SLA</div>
          <div class="clause-content">
            <div class="clause-item">5.1. <strong>Exibições estimadas:</strong> ≈${especificacoesTecnicas.exibicoesDia.toLocaleString('pt-BR')} exibições por painel/dia e ≈${especificacoesTecnicas.exibicoesMes.toLocaleString('pt-BR')} exibições por painel/mês (baseado em ${horasOperacao}h de operação diária e ciclo de ${tempoCicloTotal}s — Manual Técnico v3.0).</div>
            <div class="clause-item">5.2. Relatório mensal será gerado e disponibilizado no painel administrativo.</div>
            <div class="clause-item">5.3. SLA operacional: disponibilidade média mínima de 90% da rede. Falhas técnicas imputáveis à EXA serão tratadas em até 72 horas úteis.</div>
          </div>
        </div>
        
        <!-- CLÁUSULA 6 — RESPONSABILIDADES -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 6 — RESPONSABILIDADES</div>
          <div class="clause-content">
            <div class="clause-item">6.1. Responsabilidades da EXA: operação, manutenção, monitoramento, backup de logs, emissão de relatórios e suporte técnico.</div>
            <div class="clause-item">6.2. Responsabilidades do CONTRATANTE: envio de material em conformidade, garantia de direitos autorais, pagamento em dia e cooperação em auditorias técnicas.</div>
          </div>
        </div>
        
        <!-- CLÁUSULA 7 — DIREITOS AUTORAIS -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 7 — DIREITOS AUTORAIS</div>
          <div class="clause-content">
            <div class="clause-item">7.1. O CONTRATANTE declara possuir todos os direitos sobre o material e indenizará a EXA por reivindicações de terceiros.</div>
            <div class="clause-item">7.2. A CONTRATANTE autoriza expressamente a EXA MÍDIA a utilizar o material publicitário fornecido para veiculação nos painéis, materiais institucionais, portfólio, redes sociais e apresentações comerciais.</div>
          </div>
        </div>
        
        <!-- CLÁUSULA 8 — RESCISÃO E MULTA -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 8 — RESCISÃO E MULTA</div>
          <div class="clause-content">
            <div class="clause-item">8.1. Rescisão antecipada pelo CONTRATANTE: multa de 20% sobre o saldo remanescente, salvo outras condições previamente acordadas por escrito.</div>
            <div class="clause-item">8.2. Rescisão por culpa da EXA: devolução proporcional de valores não utilizados.</div>
          </div>
        </div>
        
        <!-- CLÁUSULA 9 — REAJUSTE -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 9 — REAJUSTE</div>
          <div class="clause-content">
            <div class="clause-item">9.1. Reajuste anual pelo IPCA ou índice que venha a substituí-lo.</div>
          </div>
        </div>
        
        <!-- CLÁUSULA 10 — SEGURANÇA, PRIVACIDADE E AUTENTICAÇÃO -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 10 — SEGURANÇA, PRIVACIDADE E AUTENTICAÇÃO</div>
          <div class="clause-content">
            <div class="clause-item">10.1. <strong>Segurança Operacional:</strong> A EXA manterá políticas e controles de segurança razoáveis para proteger a plataforma, incluindo firewall, autenticação multifatorial para acessos administrativos, segregação de ambientes (produção / homologação), backups periódicos e monitoramento de integridade dos assets.</div>
            <div class="clause-item">10.2. <strong>Proteção de Dados e Privacidade:</strong> Ambas as partes concordam em cumprir a legislação aplicável de proteção de dados (incl. LGPD). A EXA tratará dados pessoais apenas conforme instruções do CONTRATANTE e somente para execução do serviço. Vazamentos ou incidentes que envolvam dados pessoais serão comunicados em até 48 horas úteis após detecção.</div>
            <div class="clause-item">10.3. <strong>Controle de Acesso e Tokens:</strong> A validação de propostas via QR Code será realizada por tokens únicos e de curta validade. Quaisquer tentativas de uso indevido serão registradas em logs de auditoria.</div>
            <div class="clause-item">10.4. <strong>Logs, Auditoria e Retenção:</strong> A EXA manterá registros de logs de execução, exibição e ações administrativas por no mínimo 12 meses para fins de auditoria.</div>
            <div class="clause-item">10.5. <strong>Segurança do Conteúdo:</strong> Materiais submetidos passam por verificação automatizada e humana (moderação). A EXA aplicará controles para prevenir execução de conteúdo malicioso.</div>
            <div class="clause-item">10.6. <strong>Continuidade e Resposta a Incidentes:</strong> A EXA possui plano de resposta a incidentes. Em caso de indisponibilidade crítica, as partes concordam em executar o plano de contingência e comunicar stakeholders relevantes em até 24 horas úteis.</div>
            <div class="clause-item">10.7. <strong>Confidencialidade:</strong> As partes comprometem-se a manter confidenciais termos comerciais, preços, relatórios e acessos técnicos. Informação confidencial não será divulgada sem autorização escrita, salvo obrigação legal.</div>
            <div class="clause-item">10.8. <strong>Segurança Física:</strong> Equipamentos e painéis físicos são gerenciados por manutenção periódica; a EXA se responsabiliza por manutenções preventivas quando acordado contratualmente.</div>
          </div>
        </div>
        
        <!-- CLÁUSULA 11 — DISPOSIÇÕES GERAIS -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 11 — DISPOSIÇÕES GERAIS</div>
          <div class="clause-content">
            <div class="clause-item">11.1. Comunicações oficiais via portal, e-mail corporativo ou notificações do sistema EXA.</div>
            <div class="clause-item">11.2. Alterações ao contrato somente por escrito e assinadas por representantes autorizados.</div>
          </div>
        </div>
        
        <!-- CLÁUSULA 12 — FORO -->
        <div class="clause">
          <div class="clause-title">CLÁUSULA 12 — FORO</div>
          <div class="clause-content">
            <div class="clause-item">12.1. Elegem as partes o foro da comarca de Foz do Iguaçu/PR para dirimir controvérsias, com renúncia a qualquer outro.</div>
          </div>
        </div>
        
        ${contrato.clausulas_especiais ? `
        <div class="clause">
          <div class="clause-title">CONDIÇÕES ESPECIAIS</div>
          <div class="clause-content">
            <div class="clause-item">${contrato.clausulas_especiais}</div>
          </div>
        </div>
        ` : ''}
        
        <!-- LOCAIS CONTRATADOS (PRÉDIOS) -->
        ${listaPredios.length > 0 ? `
        <div class="section">
          <div class="section-title">ANEXO I — LOCAIS CONTRATADOS</div>
          <table>
            <thead>
              <tr>
                <th>Edifício</th>
                <th>Bairro/Endereço</th>
                <th style="text-align: center;">Telas</th>
                <th style="text-align: center;">Exib./Dia</th>
                <th style="text-align: center;">Exib./Mês</th>
              </tr>
            </thead>
            <tbody>
              ${prediosHtml}
            </tbody>
            <tfoot>
              <tr style="background: #f3f4f6; font-weight: 600;">
                <td colspan="2" style="border: 1px solid #e5e7eb; padding: 10px;">TOTAIS (${listaPredios.length} local${listaPredios.length > 1 ? 'is' : ''})</td>
                <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center;">${totalPaineis}</td>
                <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; color: #8B1A1A;">≈${totalExibDia.toLocaleString('pt-BR')}</td>
                <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; color: #8B1A1A;">≈${totalExibMes.toLocaleString('pt-BR')}</td>
              </tr>
            </tfoot>
          </table>
          <p style="font-size: 10px; color: #6b7280; margin-top: 8px;">Valores calculados conforme Manual Técnico v3.0 — ${horasOperacao}h operação/dia, ciclo ${tempoCicloTotal}s.</p>
        </div>
        ` : ''}
        
        <!-- LOCAL E DATA -->
        <div class="date-location">
          Foz do Iguaçu — PR, ${dataAtual}.
        </div>
        
        <!-- ASSINATURAS -->
        <div class="signatures-section">
          <div class="signatures-title">ASSINATURAS DAS PARTES</div>
          
          <div class="signatures-grid">
            <!-- CONTRATANTE -->
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-name">${contrato.cliente_razao_social || contrato.cliente_nome}</div>
                <div class="signature-role">CONTRATANTE</div>
                ${contrato.cliente_cnpj ? `<div class="signature-docs">CNPJ: ${contrato.cliente_cnpj}</div>` : ''}
                <div class="signature-docs">Representante: ${contrato.cliente_nome}</div>
              </div>
            </div>
            
            <!-- CONTRATADA (EXA) -->
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-name">INDEXA MIDIA LTDA (ExaMídia)</div>
                <div class="signature-role">CONTRATADA</div>
                <div class="signature-docs">CNPJ: 38.142.638/0001-30</div>
              </div>
            </div>
          </div>
          
          <!-- REPRESENTANTE LEGAL EXA -->
          <div class="exa-representatives">
            <div class="exa-rep-title">Representante Legal da CONTRATADA:</div>
            <div class="exa-reps-grid">
              <div class="exa-rep-box">
                <div class="signature-line">
                  <div class="signature-name">${signatarioExa.nome}</div>
                  <div class="signature-docs">RG ${signatarioExa.rg || '8.812.269-0'} / CPF ${signatarioExa.cpf}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- FOOTER -->
        <div class="footer">
          <p>ExaMídia — Operada por Indexa Midia LTDA</p>
          <p>Avenida Paraná, 974 — Sala 301 — Centro — Foz do Iguaçu/PR — CNPJ 38.142.638/0001-30</p>
          <p>www.examidia.com.br | contato@examidia.com.br</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template para contrato de síndico (Comodato) - ÚNICO SIGNATÁRIO EXA
function generateSindicoContractHtml(contrato: any, signatarioExa: any, dataAtual: string, totalPaineis: number): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Contrato de Comodato ${contrato.numero_contrato}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          line-height: 1.6;
          color: #1f2937;
          background: #ffffff;
        }
        
        /* HEADER OFICIAL EXA - Full Width */
        .header-container {
          width: calc(100% + 80px);
          margin: 0 -40px 30px -40px;
          display: block;
        }
        
        .header-image {
          width: 100%;
          height: auto;
          display: block;
        }
        
        .container {
          padding: 0 40px 40px 40px;
        }
        
        .document-title {
          text-align: center;
          margin-bottom: 25px;
        }
        
        .document-title h2 {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .parties-box {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 25px;
        }
        
        .party {
          margin-bottom: 15px;
        }
        
        .party-label {
          font-size: 10px;
          font-weight: 700;
          color: #8B1A1A;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        
        .clause {
          margin-bottom: 18px;
        }
        
        .clause-title {
          font-size: 11px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }
        
        .clause-content {
          font-size: 11px;
          color: #4b5563;
          text-align: justify;
        }
        
        .signatures-section {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #e5e7eb;
        }
        
        .signatures-grid {
          display: flex;
          justify-content: space-between;
          gap: 40px;
        }
        
        .signature-box {
          flex: 1;
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #1f2937;
          padding-top: 15px;
          margin-top: 80px;
        }
        
        .signature-name {
          font-size: 11px;
          font-weight: 600;
        }
        
        .signature-role {
          font-size: 10px;
          color: #6b7280;
        }
        
        .signature-docs {
          font-size: 9px;
          color: #9ca3af;
          margin-top: 5px;
        }
        
        .exa-representatives {
          margin-top: 30px;
        }
        
        .exa-rep-title {
          font-size: 10px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .exa-reps-grid {
          display: flex;
          justify-content: center;
          gap: 60px;
        }
        
        .date-location {
          text-align: center;
          margin-top: 30px;
          font-size: 11px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <!-- HEADER OFICIAL EXA - Full Width -->
      <div class="header-container">
        <img
          class="header-image"
          src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/exa-contract-header.png"
          alt="EXA Header"
          crossorigin="anonymous"
        />
      </div>
      
      <div class="container">
        <div class="document-title">
          <h2>Termo de Cessão de Espaço para Publicidade Digital</h2>
        </div>
        
        <div class="parties-box">
          <div class="party">
            <div class="party-label">CEDENTE</div>
            <div class="party-content">
              <strong>${contrato.cliente_razao_social || contrato.cliente_nome}</strong>${contrato.cliente_cnpj ? `, inscrito no CNPJ sob nº ${contrato.cliente_cnpj}` : ''}, representado por <strong>${contrato.cliente_nome}</strong>${contrato.cliente_cargo ? ` (${contrato.cliente_cargo})` : ''}.
            </div>
          </div>
          <div class="party">
            <div class="party-label">CESSIONÁRIA</div>
            <div class="party-content">
              <strong>INDEXA MIDIA LTDA</strong> (marca ExaMídia), pessoa jurídica de direito privado, inscrita no CNPJ sob nº 38.142.638/0001-30, com sede na Avenida Paraná, 974 — Sala 301 — Centro — Foz do Iguaçu/PR. Representante legal: <strong>${signatarioExa.nome}</strong> (RG ${signatarioExa.rg || '8.812.269-0'} / CPF ${signatarioExa.cpf}).
            </div>
          </div>
        </div>
        
        <div class="clause">
          <div class="clause-title">CLÁUSULA 1ª — DO OBJETO</div>
          <div class="clause-content">
            O presente termo tem por objeto a cessão gratuita de espaço no(s) elevador(es) do condomínio para instalação de painéis digitais da EXA MÍDIA, destinados à veiculação de conteúdo informativo e publicitário.
          </div>
        </div>
        
        <div class="clause">
          <div class="clause-title">CLÁUSULA 2ª — DO LOCAL</div>
          <div class="clause-content">
            ${contrato.predio_nome ? `Local: ${contrato.predio_nome}${contrato.predio_endereco ? `, ${contrato.predio_endereco}` : ''}.` : ''} Quantidade de telas: ${totalPaineis || contrato.numero_telas_instaladas || 1} unidade(s).
          </div>
        </div>
        
        <div class="clause">
          <div class="clause-title">CLÁUSULA 3ª — DAS OBRIGAÇÕES DA CESSIONÁRIA</div>
          <div class="clause-content">
            A CESSIONÁRIA compromete-se a fornecer e instalar os equipamentos sem qualquer custo ao CEDENTE, realizar manutenção preventiva e corretiva, e respeitar as normas do condomínio.
          </div>
        </div>
        
        <div class="clause">
          <div class="clause-title">CLÁUSULA 4ª — DA VIGÊNCIA</div>
          <div class="clause-content">
            O presente termo entra em vigor na data de sua assinatura e terá prazo indeterminado, podendo ser rescindido por qualquer das partes mediante comunicação prévia de ${contrato.prazo_aviso_rescisao || 30} (${contrato.prazo_aviso_rescisao === 60 ? 'sessenta' : contrato.prazo_aviso_rescisao === 90 ? 'noventa' : 'trinta'}) dias.
          </div>
        </div>
        
        ${contrato.clausulas_especiais ? `
        <div class="clause">
          <div class="clause-title">CLÁUSULA 5ª — CONDIÇÕES ESPECIAIS</div>
          <div class="clause-content">${contrato.clausulas_especiais}</div>
        </div>
        ` : ''}
        
        <div class="clause">
          <div class="clause-title">CLÁUSULA ${contrato.clausulas_especiais ? '6' : '5'}ª — DO FORO</div>
          <div class="clause-content">
            Elegem as partes o foro da comarca de Foz do Iguaçu/PR para dirimir controvérsias, com renúncia a qualquer outro.
          </div>
        </div>
        
        <div class="date-location">
          Foz do Iguaçu — PR, ${dataAtual}.
        </div>
        
        <div class="signatures-section">
          <div class="signatures-grid">
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-name">${contrato.cliente_nome}</div>
                <div class="signature-role">CEDENTE</div>
              </div>
            </div>
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-name">INDEXA MIDIA LTDA (ExaMídia)</div>
                <div class="signature-role">CESSIONÁRIA</div>
                <div class="signature-docs">CNPJ: 38.142.638/0001-30</div>
              </div>
            </div>
          </div>
          
          <div class="exa-representatives">
            <div class="exa-rep-title">Representante Legal da COMODANTE:</div>
            <div style="text-align: center; margin-top: 20px;">
              <div class="signature-line">
                <div class="signature-name">${signatarioExa.nome}</div>
                <div class="signature-docs">RG ${signatarioExa.rg || '8.812.269-0'} / CPF ${signatarioExa.cpf}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
