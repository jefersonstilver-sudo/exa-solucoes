import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contrato_id } = await req.json();

    if (!contrato_id) {
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

    // ========== 2. Gerar HTML do Contrato ==========
    const contractHtml = generateContractHtml(contrato);
    const contractBase64 = btoa(unescape(encodeURIComponent(contractHtml)));

    // ========== 3. Upload do Documento (JSON:API format) ==========
    // Sanitizar filename removendo caracteres especiais (ClickSign rejeita hífens)
    const sanitizedFilename = contrato.numero_contrato.replace(/[^a-zA-Z0-9]/g, '_');
    console.log("📄 [CLICKSIGN] Filename sanitizado:", `Contrato_${sanitizedFilename}.html`);
    
    const documentPayload = {
      data: {
        type: "documents",
        attributes: {
          filename: `Contrato_${sanitizedFilename}.html`,
          content_base64: `data:text/html;base64,${contractBase64}`
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

    // ========== 4. Adicionar Signatário (JSON:API format) ==========
    const signerPayload = {
      data: {
        type: "signers",
        attributes: {
          name: contrato.cliente_nome,
          email: contrato.cliente_email,
          phone_number: contrato.cliente_telefone?.replace(/\D/g, "") || null,
          documentation: contrato.cliente_cpf?.replace(/\D/g, "") || contrato.cliente_cnpj?.replace(/\D/g, "") || null,
          has_documentation: !!contrato.cliente_cnpj || !!contrato.cliente_cpf,
          delivery: "email",
          authentication: "email"
        }
      }
    };

    console.log("Adicionando signatário...");
    const signerResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/signers`, {
      method: "POST",
      headers: clicksignHeaders,
      body: JSON.stringify(signerPayload)
    });

    if (!signerResponse.ok) {
      const errorText = await signerResponse.text();
      console.error("Erro ao adicionar signatário:", errorText);
      throw new Error(`Erro ClickSign (signer): ${errorText}`);
    }

    const signerData = await signerResponse.json();
    const signerKey = signerData.data?.id || signerData.data?.attributes?.key;
    console.log("Signatário adicionado:", signerKey);

    // ========== 5. Vincular Signatário ao Documento (JSON:API format) ==========
    const signaturePayload = {
      data: {
        type: "request_signatures",
        attributes: {
          signer_key: signerKey,
          sign_as: "sign",
          refusable: true
        }
      }
    };

    console.log("Vinculando signatário ao documento...");
    const signatureResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/documents/${documentKey}/request_signatures`, {
      method: "POST",
      headers: clicksignHeaders,
      body: JSON.stringify(signaturePayload)
    });

    if (!signatureResponse.ok) {
      const errorText = await signatureResponse.text();
      console.error("Erro ao vincular assinatura:", errorText);
      throw new Error(`Erro ClickSign (request_signature): ${errorText}`);
    }

    const signatureData = await signatureResponse.json();
    const requestSignatureKey = signatureData.data?.id || signatureData.data?.attributes?.key;
    console.log("Assinatura vinculada:", requestSignatureKey);

    // ========== 6. Ativar Envelope ==========
    console.log("Ativando envelope...");
    const activateResponse = await fetch(`https://app.clicksign.com/api/v3/envelopes/${envelopeId}/activate`, {
      method: "PATCH",
      headers: clicksignHeaders
    });

    if (!activateResponse.ok) {
      const errorText = await activateResponse.text();
      console.error("Erro ao ativar envelope:", errorText);
      throw new Error(`Erro ClickSign (activate): ${errorText}`);
    }

    console.log("Envelope ativado!");

    // ========== 7. Enviar Notificação (JSON:API format) ==========
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

    // ========== 8. Atualizar Banco de Dados ==========
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
        signer_key: signerKey
      }
    });

    console.log("Contrato enviado com sucesso!");

    return new Response(
      JSON.stringify({
        success: true,
        envelope_id: envelopeId,
        document_key: documentKey,
        signer_key: signerKey
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

// Função para gerar HTML do contrato
function generateContractHtml(contrato: any): string {
  console.log("🖨️ [CLICKSIGN] Gerando HTML do contrato...");
  
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
      11: 'onze', 12: 'doze'
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

  // Logo EXA em SVG inline (funciona em qualquer navegador/email)
  const logoSvg = `
    <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f0f0f0;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="90" height="90" rx="15" fill="url(#logoGrad)" stroke="#8B1A1A" stroke-width="3"/>
      <text x="50" y="65" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="38" font-weight="900" fill="#8B1A1A">EXA</text>
    </svg>
  `;

  const prediosHtml = listaPredios.map((p: any) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${p.nome || p.building_name}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${p.bairro}</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.quantidade_telas || 1}</td>
    </tr>
  `).join('');
  
  // Gerar HTML das parcelas
  const gerarParcelasHtml = () => {
    if (contrato.metodo_pagamento === 'custom' && parcelas.length > 0) {
      // Parcelas personalizadas
      return `
        <div style="background: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 4px; margin: 10px 0;">
          <p style="font-weight: bold; color: #166534;">📋 CONDIÇÃO PERSONALIZADA - Cronograma de Pagamento:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #dcfce7;">
                <th style="border: 1px solid #86efac; padding: 8px; text-align: left;">Parcela</th>
                <th style="border: 1px solid #86efac; padding: 8px; text-align: left;">Vencimento</th>
                <th style="border: 1px solid #86efac; padding: 8px; text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${parcelas.map((p: any, idx: number) => `
                <tr>
                  <td style="border: 1px solid #86efac; padding: 8px;">${p.installment || idx + 1}ª parcela</td>
                  <td style="border: 1px solid #86efac; padding: 8px;">${formatDateExtended(p.due_date)}</td>
                  <td style="border: 1px solid #86efac; padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(Number(p.amount))}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #bbf7d0; font-weight: bold;">
                <td colspan="2" style="border: 1px solid #86efac; padding: 8px; text-align: right;">TOTAL:</td>
                <td style="border: 1px solid #86efac; padding: 8px; text-align: right;">${formatCurrency(contrato.valor_total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    } else if (contrato.metodo_pagamento === 'pix_avista') {
      return `
        <div style="background: #ecfdf5; border: 1px solid #6ee7b7; padding: 15px; border-radius: 4px; margin: 10px 0;">
          <p style="font-weight: bold; color: #047857;">💰 PAGAMENTO ÚNICO VIA PIX</p>
          <p style="margin-top: 8px;">
            Valor total: <strong>${formatCurrency(contrato.valor_total)}</strong><br>
            Forma: Pagamento único via PIX, à vista, antes do início da exibição.
          </p>
        </div>
      `;
    } else if (contrato.metodo_pagamento === 'cartao') {
      return `
        <div style="background: #eff6ff; border: 1px solid #93c5fd; padding: 15px; border-radius: 4px; margin: 10px 0;">
          <p style="font-weight: bold; color: #1d4ed8;">💳 PAGAMENTO VIA CARTÃO DE CRÉDITO</p>
          <p style="margin-top: 8px;">
            Valor total: <strong>${formatCurrency(contrato.valor_total)}</strong><br>
            Forma: Processado via cartão de crédito.
          </p>
        </div>
      `;
    } else {
      // PIX ou Boleto Fidelidade - gerar todas as parcelas
      const metodoPagamento = contrato.metodo_pagamento === 'pix_fidelidade' ? '📱 PIX FIDELIDADE' : '📄 BOLETO FIDELIDADE';
      const planoMeses = contrato.plano_meses || 1;
      
      // Gerar cronograma de parcelas
      let parcelasRows = '';
      if (contrato.data_inicio && planoMeses > 0) {
        for (let i = 0; i < planoMeses; i++) {
          const inicio = new Date(contrato.data_inicio + 'T00:00:00');
          const dataVencimento = new Date(inicio.getFullYear(), inicio.getMonth() + i, contrato.dia_vencimento || 10);
          if (i === 0 && dataVencimento < inicio) {
            dataVencimento.setMonth(dataVencimento.getMonth() + 1);
          }
          parcelasRows += `
            <tr${i === 0 ? ' style="background: #fef9c3;"' : ''}>
              <td style="border: 1px solid #fcd34d; padding: 8px;">${i + 1}ª parcela${i === 0 ? ' (primeira)' : ''}</td>
              <td style="border: 1px solid #fcd34d; padding: 8px;">${formatDateExtended(dataVencimento.toISOString().split('T')[0])}</td>
              <td style="border: 1px solid #fcd34d; padding: 8px; text-align: right; font-weight: bold;">${formatCurrency(contrato.valor_mensal)}</td>
            </tr>
          `;
        }
      }

      return `
        <div style="background: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 4px; margin: 10px 0;">
          <p style="font-weight: bold; color: #92400e;">${metodoPagamento}</p>
          <p style="margin-top: 8px;">
            Pagamento em <strong>${planoMeses} (${getNumeroExtenso(planoMeses)}) parcela(s)</strong> de <strong>${formatCurrency(contrato.valor_mensal)}</strong><br>
            Vencimento: Dia <strong>${contrato.dia_vencimento || 10}</strong> de cada mês
          </p>
          ${parcelasRows ? `
            <p style="font-weight: bold; color: #92400e; margin-top: 15px;">📋 Cronograma Completo de Parcelas:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #fef3c7;">
                  <th style="border: 1px solid #fcd34d; padding: 8px; text-align: left;">Parcela</th>
                  <th style="border: 1px solid #fcd34d; padding: 8px; text-align: left;">Vencimento</th>
                  <th style="border: 1px solid #fcd34d; padding: 8px; text-align: right;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${parcelasRows}
              </tbody>
              <tfoot>
                <tr style="background: #fde68a; font-weight: bold;">
                  <td colspan="2" style="border: 1px solid #fcd34d; padding: 8px; text-align: right;">TOTAL:</td>
                  <td style="border: 1px solid #fcd34d; padding: 8px; text-align: right;">${formatCurrency(contrato.valor_total)}</td>
                </tr>
              </tfoot>
            </table>
          ` : ''}
        </div>
      `;
    }
  };

  if (contrato.tipo_contrato === 'sindico') {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #333; margin: 40px; }
          h1 { text-align: center; font-size: 16pt; text-transform: uppercase; margin-bottom: 30px; }
          h2 { font-size: 12pt; font-weight: bold; margin-top: 20px; }
          .parties { margin-bottom: 30px; }
          .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
          .signature-box { width: 45%; text-align: center; }
          .signature-line { border-top: 1px solid #333; padding-top: 10px; margin-top: 60px; }
        </style>
      </head>
      <body>
        <h1>Termo de Cessão de Espaço para Publicidade Digital<br>
        <small style="font-size: 10pt; color: #666;">Nº ${contrato.numero_contrato}</small></h1>
        
        <div class="parties">
          <p><strong>CEDENTE:</strong> ${contrato.cliente_razao_social || contrato.cliente_nome}${contrato.cliente_cnpj ? `, inscrito no CNPJ sob nº ${contrato.cliente_cnpj}` : ''}, representado por <strong>${contrato.cliente_nome}</strong>${contrato.cliente_cargo ? ` (${contrato.cliente_cargo})` : ''}, doravante denominado "CEDENTE".</p>
          <p><strong>CESSIONÁRIA:</strong> EXA SOLUÇÕES DIGITAIS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº 62.878.193/0001-35, com sede na Av. Paraná, nº 974, Sala 301, Centro, Foz do Iguaçu - PR, CEP 85852-000, doravante denominada "CESSIONÁRIA".</p>
        </div>
        
        <h2>CLÁUSULA 1ª - DO OBJETO</h2>
        <p>1.1. O presente termo tem por objeto a cessão gratuita de espaço no(s) elevador(es) do condomínio para instalação de painéis digitais da EXA MÍDIA, destinados à veiculação de conteúdo informativo e publicitário.</p>
        
        <h2>CLÁUSULA 2ª - DO LOCAL</h2>
        <p>2.1. Quantidade de telas: ${totalPaineis} unidade(s).</p>
        
        <h2>CLÁUSULA 3ª - DAS OBRIGAÇÕES DA CESSIONÁRIA</h2>
        <p>3.1. A CESSIONÁRIA compromete-se a fornecer e instalar os equipamentos sem qualquer custo ao CEDENTE, realizar manutenção preventiva e corretiva, e respeitar as normas do condomínio.</p>
        
        <h2>CLÁUSULA 4ª - DA VIGÊNCIA</h2>
        <p>4.1. O presente termo entra em vigor na data de sua assinatura e terá prazo indeterminado, podendo ser rescindido por qualquer das partes mediante comunicação prévia de 30 (trinta) dias.</p>
        
        ${contrato.clausulas_especiais ? `<h2>CLÁUSULA 5ª - CONDIÇÕES ESPECIAIS</h2><p>${contrato.clausulas_especiais}</p>` : ''}
        
        <p style="text-align: center; margin-top: 40px;">Foz do Iguaçu - PR, ${dataAtual}.</p>
        
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">
              <strong>${contrato.cliente_nome}</strong><br>
              <span style="font-size: 10pt; color: #666;">CEDENTE</span>
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line">
              <strong>EXA SOLUÇÕES DIGITAIS LTDA</strong><br>
              <span style="font-size: 10pt; color: #666;">CESSIONÁRIA</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Contrato Anunciante
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

  console.log("🖨️ [CLICKSIGN] Gerando HTML anunciante com parcelas detalhadas...");
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #333; margin: 40px; }
        h1 { text-align: center; font-size: 16pt; text-transform: uppercase; margin-bottom: 30px; }
        h2 { font-size: 12pt; font-weight: bold; margin-top: 20px; }
        .header { background: linear-gradient(to right, #8B1A1A, #A52020); color: white; padding: 20px; margin: -40px -40px 30px -40px; }
        .header-content { display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-text { font-size: 18pt; font-weight: bold; }
        .parties { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
        .highlight { background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 4px; margin: 10px 0; }
        .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-top: 1px solid #333; padding-top: 10px; margin-top: 60px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-content">
          <div class="logo">
            ${logoSvg}
            <div>
              <div class="logo-text">EXA MÍDIA</div>
              <div style="font-size: 10pt; opacity: 0.8;">Soluções Digitais em Elevadores</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold;">CONTRATO DE PUBLICIDADE</div>
            <div style="font-size: 10pt; opacity: 0.8;">Nº ${contrato.numero_contrato}</div>
          </div>
        </div>
      </div>
      
      <h1>Contrato de Publicidade em Mídia Digital</h1>
      
      <div class="parties">
        <p><strong>CONTRATANTE:</strong> ${contrato.cliente_razao_social || contrato.cliente_nome}${contrato.cliente_segmento ? ` (${contrato.cliente_segmento})` : ''}, ${contrato.cliente_endereco ? `com sede em ${contrato.cliente_endereco}` : `com sede em ${contrato.cliente_cidade || 'Foz do Iguaçu'}`}${contrato.cliente_cnpj ? `, inscrita no CNPJ sob o nº ${contrato.cliente_cnpj}` : ''}, neste ato representada por seu representante legal${contrato.cliente_nome ? `, Sr(a). ${contrato.cliente_nome}` : ''}${contrato.cliente_cargo ? ` (${contrato.cliente_cargo})` : ''}, doravante denominada "CONTRATANTE".</p>
        <p><strong>CONTRATADA:</strong> EXA SOLUÇÕES DIGITAIS LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob nº 62.878.193/0001-35, com sede na Av. Paraná, nº 974, Sala 301, Centro, Foz do Iguaçu - PR, CEP 85852-000, doravante denominada "CONTRATADA".</p>
      </div>
      
      <h2>CLÁUSULA 1ª - DO OBJETO</h2>
      <p>1.1. O presente contrato tem por objeto a veiculação de anúncios publicitários em vídeo com duração de até 15 (quinze) segundos, fornecidos pela CONTRATANTE, nos painéis digitais da EXA MÍDIA, localizados em prédios residenciais da cidade de Foz do Iguaçu - PR.</p>
      
      <div class="highlight">
        <h2>CLÁUSULA 2ª - DO PRAZO E VIGÊNCIA</h2>
        <p>2.1. Plano contratado: <strong>${planoNome(contrato.plano_meses || 1)}</strong> (${contrato.plano_meses || 1} mês(es))</p>
        <p>2.2. Data de início: <strong>${contrato.data_inicio || 'A definir após assinatura'}</strong></p>
        <p>2.3. Data de término: <strong>${contrato.data_fim || 'A definir após assinatura'}</strong></p>
      </div>
      
      <h2>CLÁUSULA 3ª - DOS LOCAIS CONTRATADOS</h2>
      <p>3.1. A contratação abrange ${totalPaineis} tela(s) nos seguintes edifícios:</p>
      ${listaPredios.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Edifício</th>
              <th>Bairro</th>
              <th style="text-align: center;">Telas</th>
            </tr>
          </thead>
          <tbody>
            ${prediosHtml}
          </tbody>
        </table>
      ` : ''}
      
      <div class="highlight">
        <h2>CLÁUSULA 4ª - DO VALOR E FORMA DE PAGAMENTO</h2>
        <p>4.1. <strong>Valor Total do Contrato:</strong> ${formatCurrency(contrato.valor_total)}</p>
        ${contrato.metodo_pagamento !== 'custom' && contrato.valor_mensal ? `<p>4.2. <strong>Valor Mensal:</strong> ${formatCurrency(contrato.valor_mensal)}</p>` : ''}
        <p>4.${contrato.metodo_pagamento === 'custom' ? '2' : '3'}. <strong>Forma de Pagamento:</strong> ${metodoPagamentoNome(contrato.metodo_pagamento)}</p>
        ${gerarParcelasHtml()}
      </div>
      <p>4.5. Após 10 (dez) dias de atraso no pagamento, a exibição será automaticamente suspensa até a regularização.</p>
      <p>4.6. Multa por atraso: 2% (dois por cento) + 1% (um por cento) de juros ao mês.</p>
      
      <h2>CLÁUSULA 5ª - DO CONTEÚDO PUBLICITÁRIO</h2>
      <p>5.1. A CONTRATANTE compromete-se a enviar vídeos conforme especificações técnicas da CONTRATADA (resolução 1920x1080, formato MP4, máximo 15 segundos).</p>
      <p>5.2. Os vídeos podem ser substituídos a qualquer momento, mediante solicitação prévia.</p>
      
      <h2>CLÁUSULA 6ª - DA CESSÃO DE DIREITOS DE IMAGEM</h2>
      <p>6.1. A CONTRATANTE autoriza expressamente a EXA MÍDIA a utilizar o material publicitário fornecido para veiculação nos painéis, materiais institucionais, portfólio, redes sociais e apresentações comerciais.</p>
      
      <h2>CLÁUSULA 7ª - DO CANCELAMENTO</h2>
      <p>7.1. O cancelamento antecipado por parte da CONTRATANTE gerará multa de 30% sobre o saldo devedor restante.</p>
      
      <h2>CLÁUSULA 8ª - DO FORO</h2>
      <p>8.1. Para dirimir eventuais dúvidas ou litígios, as partes elegem o foro da Comarca de Foz do Iguaçu - PR.</p>
      
      ${contrato.clausulas_especiais ? `<h2>CLÁUSULA 9ª - CONDIÇÕES ESPECIAIS</h2><p>${contrato.clausulas_especiais}</p>` : ''}
      
      <p style="text-align: center; margin-top: 40px;">Foz do Iguaçu - PR, ${dataAtual}.</p>
      
      <div class="signatures">
        <div class="signature-box">
          <div class="signature-line">
            <strong>${contrato.cliente_razao_social || contrato.cliente_nome}</strong><br>
            <span style="font-size: 10pt; color: #666;">CONTRATANTE</span>
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            <strong>EXA SOLUÇÕES DIGITAIS LTDA</strong><br>
            <span style="font-size: 10pt; color: #666;">CONTRATADA</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
