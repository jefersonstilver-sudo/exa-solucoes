import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractClientData {
  primeiro_nome: string;
  sobrenome: string;
  data_nascimento: string;
  cpf: string;
  email: string;
  telefone?: string;
}

serve(async (req) => {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║ 📝 CREATE-CONTRACT-FROM-PROPOSAL - INÍCIO                    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { proposalId, clientData } = body as { proposalId: string; clientData: ContractClientData };

    console.log("📋 ProposalId:", proposalId);
    console.log("👤 ClientData:", JSON.stringify(clientData, null, 2));

    if (!proposalId) {
      throw new Error("proposalId é obrigatório");
    }

    if (!clientData || !clientData.primeiro_nome || !clientData.cpf || !clientData.data_nascimento) {
      throw new Error("Dados do cliente incompletos (nome, CPF e data de nascimento são obrigatórios)");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar proposta completa
    console.log("🔍 Buscando proposta...");
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error("❌ Proposta não encontrada:", proposalError);
      throw new Error("Proposta não encontrada");
    }

    console.log("✅ Proposta encontrada:", proposal.number);

    // 2. Preparar dados do contrato
    const selectedBuildings = Array.isArray(proposal.selected_buildings) 
      ? proposal.selected_buildings 
      : [];

    const isCustomPayment = proposal.payment_type === 'custom';
    const customInstallments = Array.isArray(proposal.custom_installments) 
      ? proposal.custom_installments 
      : [];

    // Calcular valor total
    const valorTotal = isCustomPayment
      ? customInstallments.reduce((sum: number, inst: any) => sum + Number(inst.amount || 0), 0)
      : proposal.cash_total_value || (proposal.fidel_monthly_value * proposal.duration_months);

    // Calcular datas
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (proposal.duration_months || 1));

    // 3. Gerar número do contrato único
    const contratoNumber = `CTR-${Date.now().toString().slice(-8)}`;

    // 4. Preparar lista de prédios para o contrato
    const listaPredios = selectedBuildings.map((b: any) => ({
      building_id: b.building_id,
      building_name: b.building_name || b.nome,
      quantidade_telas: b.quantidade_telas || 1,
      endereco: b.endereco || ''
    }));

    // 5. Criar contrato no banco (status rascunho)
    console.log("📝 Criando contrato...");
    
    const contratoData = {
      numero_contrato: contratoNumber,
      proposta_id: proposalId,
      tipo_contrato: 'anunciante',
      status: 'rascunho',
      
      // Dados do cliente
      cliente_nome: `${clientData.primeiro_nome} ${clientData.sobrenome}`.trim(),
      cliente_sobrenome: clientData.sobrenome,
      cliente_email: clientData.email || proposal.client_email,
      cliente_telefone: clientData.telefone || proposal.client_phone,
      cliente_cpf: clientData.cpf.replace(/\D/g, ''),
      cliente_data_nascimento: clientData.data_nascimento,
      cliente_razao_social: proposal.client_company_name,
      cliente_cnpj: proposal.client_cnpj,
      
      // Dados comerciais
      valor_total: valorTotal,
      valor_mensal: proposal.fidel_monthly_value || (valorTotal / (proposal.duration_months || 1)),
      plano_meses: proposal.duration_months || 1,
      data_inicio: startDate.toISOString().split('T')[0],
      data_fim: endDate.toISOString().split('T')[0],
      
      // Prédios e painéis
      lista_predios: listaPredios,
      total_paineis: selectedBuildings.reduce((sum: number, b: any) => sum + (b.quantidade_telas || 1), 0),
      
      // Pagamento
      metodo_pagamento: isCustomPayment ? 'personalizado' : 'pix',
      parcelas: isCustomPayment ? customInstallments : null,
      
      // Produto
      tipo_produto: 'horizontal',
      objeto: 'Contratação de espaço publicitário em painéis digitais de elevadores'
    };

    const { data: contrato, error: contratoError } = await supabase
      .from("contratos_legais")
      .insert(contratoData)
      .select()
      .single();

    if (contratoError) {
      console.error("❌ Erro ao criar contrato:", contratoError);
      throw new Error(`Erro ao criar contrato: ${contratoError.message}`);
    }

    console.log("✅ Contrato criado:", contrato.id);

    // 6. Criar signatário do cliente
    console.log("👤 Criando signatário cliente...");
    const { error: signatarioError } = await supabase
      .from("contrato_signatarios")
      .insert({
        contrato_id: contrato.id,
        tipo: 'cliente',
        nome: clientData.primeiro_nome,
        sobrenome: clientData.sobrenome,
        email: clientData.email || proposal.client_email,
        cpf: clientData.cpf.replace(/\D/g, ''),
        data_nascimento: clientData.data_nascimento,
        ordem: 1
      });

    if (signatarioError) {
      console.warn("⚠️ Erro ao criar signatário (não crítico):", signatarioError);
    }

    // 7. Buscar signatário EXA padrão
    const { data: exaSignatario } = await supabase
      .from("signatarios_exa")
      .select("*")
      .eq("is_active", true)
      .eq("is_default", true)
      .single();

    if (exaSignatario) {
      console.log("🏢 Adicionando signatário EXA:", exaSignatario.nome);
      await supabase
        .from("contrato_signatarios")
        .insert({
          contrato_id: contrato.id,
          tipo: 'exa',
          nome: exaSignatario.nome.split(' ')[0],
          sobrenome: exaSignatario.nome.split(' ').slice(1).join(' '),
          email: exaSignatario.email,
          cpf: exaSignatario.cpf,
          data_nascimento: exaSignatario.data_nascimento,
          cargo: exaSignatario.cargo,
          ordem: 2
        });
    }

    // 8. Gerar HTML do contrato para preview
    const contractHtml = generateContractHtml(contrato, exaSignatario);

    // 9. Atualizar proposta com referência ao contrato
    await supabase
      .from("proposals")
      .update({
        metadata: {
          ...proposal.metadata,
          contract_id: contrato.id,
          contract_number: contratoNumber,
          contract_created_at: new Date().toISOString()
        }
      })
      .eq("id", proposalId);

    // 10. Log do evento
    await supabase.from("proposal_logs").insert({
      proposal_id: proposalId,
      action: 'contrato_criado',
      details: {
        contrato_id: contrato.id,
        contrato_numero: contratoNumber,
        timestamp: new Date().toISOString()
      }
    });

    console.log("========================================");
    console.log("✅ CONTRATO CRIADO COM SUCESSO");
    console.log("========================================");

    return new Response(
      JSON.stringify({
        success: true,
        contrato: {
          id: contrato.id,
          numero: contratoNumber,
          status: contrato.status,
          valor_total: valorTotal,
          plano_meses: proposal.duration_months,
          data_inicio: startDate.toISOString(),
          data_fim: endDate.toISOString(),
          lista_predios: listaPredios,
          parcelas: isCustomPayment ? customInstallments : null
        },
        contractHtml
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error: any) {
    console.error("❌ ERRO:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Generate contract HTML for preview
function generateContractHtml(contrato: any, exaSignatario: any): string {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const prediosList = (contrato.lista_predios || [])
    .map((p: any) => `<li>${p.building_name} (${p.quantidade_telas || 1} tela${(p.quantidade_telas || 1) > 1 ? 's' : ''})</li>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 3px solid #9C1E1E; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { color: #9C1E1E; font-size: 28px; font-weight: bold; }
        h1 { color: #9C1E1E; font-size: 22px; margin-top: 0; }
        h2 { color: #444; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 25px; }
        .info-box { background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
        .info-label { color: #666; }
        .info-value { font-weight: bold; color: #333; }
        .clause { margin: 15px 0; text-align: justify; }
        .clause-title { font-weight: bold; color: #9C1E1E; }
        ul { margin: 10px 0; padding-left: 20px; }
        li { margin: 5px 0; }
        .signature-area { margin-top: 50px; display: flex; justify-content: space-around; }
        .signature-box { text-align: center; width: 40%; }
        .signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 10px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">EXA MÍDIA</div>
        <h1>CONTRATO DE PUBLICIDADE EM PAINÉIS DIGITAIS</h1>
        <p>Contrato nº: <strong>${contrato.numero_contrato}</strong></p>
      </div>

      <h2>1. PARTES</h2>
      <div class="info-box">
        <p><strong>CONTRATANTE:</strong></p>
        <div class="info-row">
          <span class="info-label">Nome:</span>
          <span class="info-value">${contrato.cliente_nome}</span>
        </div>
        ${contrato.cliente_empresa ? `
        <div class="info-row">
          <span class="info-label">Empresa:</span>
          <span class="info-value">${contrato.cliente_empresa}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">CPF/CNPJ:</span>
          <span class="info-value">${contrato.cliente_cnpj || contrato.cliente_cpf || '-'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">E-mail:</span>
          <span class="info-value">${contrato.cliente_email}</span>
        </div>
      </div>

      <div class="info-box">
        <p><strong>CONTRATADA:</strong></p>
        <div class="info-row">
          <span class="info-label">Razão Social:</span>
          <span class="info-value">EXA MÍDIA LTDA</span>
        </div>
        <div class="info-row">
          <span class="info-label">CNPJ:</span>
          <span class="info-value">XX.XXX.XXX/0001-XX</span>
        </div>
      </div>

      <h2>2. OBJETO</h2>
      <div class="clause">
        <span class="clause-title">Cláusula 1ª.</span> O presente contrato tem por objeto a contratação de espaço publicitário em painéis digitais de elevadores, para veiculação de vídeo publicitário do CONTRATANTE nos endereços abaixo especificados.
      </div>

      <h2>3. LOCAIS CONTRATADOS</h2>
      <div class="info-box">
        <ul>${prediosList}</ul>
        <p><strong>Total de Telas:</strong> ${contrato.total_telas}</p>
      </div>

      <h2>4. PERÍODO E VALORES</h2>
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Período:</span>
          <span class="info-value">${contrato.plano_meses} meses</span>
        </div>
        <div class="info-row">
          <span class="info-label">Início:</span>
          <span class="info-value">${formatDate(contrato.data_inicio)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Término:</span>
          <span class="info-value">${formatDate(contrato.data_fim)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Valor Total:</span>
          <span class="info-value">${formatCurrency(contrato.valor_total)}</span>
        </div>
      </div>

      <h2>5. ESPECIFICAÇÕES TÉCNICAS</h2>
      <div class="clause">
        <span class="clause-title">Cláusula 2ª.</span> O material publicitário deverá seguir as seguintes especificações:
        <ul>
          <li>Formato: Vídeo horizontal (1920x1080 pixels - Full HD)</li>
          <li>Duração máxima: 10 segundos</li>
          <li>Áudio: Não permitido (exibição sem som)</li>
          <li>Exibições diárias: 792 vezes por tela</li>
        </ul>
      </div>

      <h2>6. DIREITOS DE IMAGEM</h2>
      <div class="clause">
        <span class="clause-title">Cláusula 3ª.</span> O CONTRATANTE declara ser o legítimo proprietário ou possuir autorização expressa para uso de todo o conteúdo veiculado, incluindo imagens, textos, marcas e demais elementos, isentando a CONTRATADA de qualquer responsabilidade relacionada a direitos autorais ou de propriedade intelectual.
      </div>

      <h2>7. OBRIGAÇÕES DAS PARTES</h2>
      <div class="clause">
        <span class="clause-title">Cláusula 4ª.</span> São obrigações da CONTRATADA:
        <ul>
          <li>Disponibilizar os painéis digitais nos locais especificados</li>
          <li>Garantir o funcionamento dos equipamentos durante o horário comercial</li>
          <li>Realizar a manutenção preventiva e corretiva dos equipamentos</li>
          <li>Disponibilizar plataforma para upload e gestão do conteúdo</li>
        </ul>
      </div>
      
      <div class="clause">
        <span class="clause-title">Cláusula 5ª.</span> São obrigações do CONTRATANTE:
        <ul>
          <li>Efetuar o pagamento nas datas acordadas</li>
          <li>Fornecer material publicitário dentro das especificações técnicas</li>
          <li>Garantir que o conteúdo não viole leis ou direitos de terceiros</li>
        </ul>
      </div>

      <h2>8. PAGAMENTO</h2>
      <div class="clause">
        <span class="clause-title">Cláusula 6ª.</span> O pagamento deverá ser realizado conforme condições acordadas. O não pagamento até a data de vencimento implica na suspensão imediata da veiculação do material publicitário, sem direito a prorrogação do prazo contratual.
      </div>

      <h2>9. DISPOSIÇÕES GERAIS</h2>
      <div class="clause">
        <span class="clause-title">Cláusula 7ª.</span> Este contrato é firmado em caráter irrevogável e irretratável, obrigando as partes e seus sucessores.
      </div>
      <div class="clause">
        <span class="clause-title">Cláusula 8ª.</span> As partes elegem o foro da Comarca de Foz do Iguaçu/PR para dirimir quaisquer questões oriundas deste contrato.
      </div>

      <div class="signature-area">
        <div class="signature-box">
          <div class="signature-line">
            <strong>${contrato.cliente_nome}</strong><br>
            CONTRATANTE
          </div>
        </div>
        <div class="signature-box">
          <div class="signature-line">
            <strong>${exaSignatario?.nome || 'Representante Legal'}</strong><br>
            ${exaSignatario?.cargo || 'EXA MÍDIA LTDA'}<br>
            CONTRATADA
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        <p>Este documento será assinado digitalmente via ClickSign</p>
      </div>
    </body>
    </html>
  `;
}
