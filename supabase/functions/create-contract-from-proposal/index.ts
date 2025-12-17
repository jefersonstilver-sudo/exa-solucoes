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
      
      // Produto - USA O TIPO DA PROPOSTA
      tipo_produto: proposal.tipo_produto || 'horizontal',
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

    // 7. Buscar TODOS signatários EXA ativos (Jeferson E Natália)
    const { data: exaSignatarios } = await supabase
      .from("signatarios_exa")
      .select("*")
      .eq("is_active", true)
      .order('is_default', { ascending: false }); // Default primeiro

    if (exaSignatarios && exaSignatarios.length > 0) {
      console.log(`🏢 Adicionando ${exaSignatarios.length} signatários EXA`);
      
      for (let i = 0; i < exaSignatarios.length; i++) {
        const sig = exaSignatarios[i];
        console.log(`  → Signatário ${i + 1}: ${sig.nome} (${sig.cargo})`);
        await supabase
          .from("contrato_signatarios")
          .insert({
            contrato_id: contrato.id,
            tipo: 'exa',
            nome: sig.primeiro_nome || sig.nome.split(' ')[0],
            sobrenome: sig.sobrenome || sig.nome.split(' ').slice(1).join(' '),
            email: sig.email,
            cpf: sig.cpf,
            data_nascimento: sig.data_nascimento,
            cargo: sig.cargo,
            ordem: 2 + i  // Cliente é ordem 1, EXAs começam em 2
          });
      }
    } else {
      console.warn("⚠️ Nenhum signatário EXA ativo encontrado");
    }

  // 8. Buscar especificações técnicas da página de Produtos
    console.log("📋 Buscando especificações técnicas de produtos_exa...");
    const { data: produtosExa } = await supabase
      .from("produtos_exa")
      .select("*");
    
    const { data: configExibicao } = await supabase
      .from("configuracoes_exibicao")
      .select("*")
      .single();

    // 9. Gerar HTML do contrato para preview (com TODOS signatários EXA)
    const contractHtml = generateContractHtml(contrato, exaSignatarios || [], produtosExa || [], configExibicao);

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

// Generate FULL professional contract HTML for preview and printing - Manual Técnico v3.0
function generateContractHtml(contrato: any, exaSignatarios: any[] = [], produtosExa: any[] = [], configExibicao: any = null): string {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return '-';
    const clean = cpf.replace(/\D/g, '');
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return '-';
    const clean = cnpj.replace(/\D/g, '');
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  // Dados da EXA - Conforme página "Quem Somos"
  const exaData = {
    razaoSocial: 'EXA Soluções Digitais LTDA',
    cnpj: '62.878.193/0001-35',
    endereco: 'Avenida Paraná, 974 – Sala 301, Centro',
    cidade: 'Foz do Iguaçu',
    estado: 'PR',
    cep: '85852-000'
  };

  // Lista de prédios formatada
  const predios = contrato.lista_predios || [];
  const totalTelas = predios.reduce((sum: number, p: any) => sum + (p.quantidade_telas || 1), 0);

  // ========== ESPECIFICAÇÕES TÉCNICAS DO MANUAL v3.0 ==========
  // Buscar dinamicamente da tabela produtos_exa
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
  const tempoVerticalCiclo = (produtoVertical.max_clientes_painel || 3) * (produtoVertical.duracao_segundos || 15); // 45s
  const tempoHorizontalCiclo = (produtoHorizontal.max_clientes_painel || 15) * (produtoHorizontal.duracao_segundos || 10); // 150s
  const tempoCicloTotal = tempoVerticalCiclo + tempoHorizontalCiclo; // 195s
  
  // Ciclos por dia = 75.600 / 195 ≈ 387
  const ciclosPorDia = Math.floor(segundosDia / tempoCicloTotal);
  const exibicoesPorMes = ciclosPorDia * diasMes; // 387 × 30 = 11.610

  // Especificações baseadas no tipo de produto
  const especificacoesTecnicas = isVerticalPremium ? {
    formato: `Vídeo vertical (${produtoVertical.resolucao || '1080x1920'} pixels)`,
    proporcao: produtoVertical.proporcao || '9:16',
    duracao: `${produtoVertical.duracao_segundos || 15} segundos`,
    exibicoesDia: ciclosPorDia,
    exibicoesMes: exibicoesPorMes,
    descricao: 'Vertical Premium - Exibição em tela cheia',
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
  const prediosListHtml = predios.map((p: any, idx: number) => {
    const telas = p.quantidade_telas || 1;
    const exibDia = ciclosPorDia * telas;
    const exibMes = exibicoesPorMes * telas;
    return `
    <tr>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${idx + 1}</td>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${p.building_name || p.nome || 'Não informado'}</td>
      <td style="padding: 10px; border: 1px solid #e5e7eb;">${p.endereco || '-'}</td>
      <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">${telas}</td>
      <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">≈${exibDia.toLocaleString('pt-BR')}</td>
      <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center;">≈${exibMes.toLocaleString('pt-BR')}</td>
    </tr>
  `;
  }).join('');

  // Totais gerais
  const totalExibDia = ciclosPorDia * totalTelas;
  const totalExibMes = exibicoesPorMes * totalTelas;

  // Parcelas formatadas (ANEXO II)
  const parcelas = contrato.parcelas || [];
  const isCustomPayment = parcelas.length > 0;
  
  let parcelasHtml = '';
  if (isCustomPayment && parcelas.length > 0) {
    parcelasHtml = `
      <div class="section no-break">
        <div class="section-title">ANEXO II — CRONOGRAMA DE PAGAMENTOS</div>
        <table>
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; width: 80px;">Parcela</th>
              <th style="padding: 12px; border: 1px solid #e5e7eb;">Vencimento</th>
              <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${parcelas.map((p: any, idx: number) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: center; font-weight: 600;">${idx + 1}ª</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${formatDateShort(p.due_date)}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-weight: 500;">${formatCurrency(p.amount)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f3f4f6;">
              <td colspan="2" style="padding: 12px; border: 1px solid #e5e7eb; font-weight: 700;">TOTAL DO CONTRATO</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #8B1A1A;">${formatCurrency(contrato.valor_total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // Calcular valor mensal
  const valorMensal = contrato.valor_mensal || (contrato.valor_total / (contrato.plano_meses || 1));

  // Verificar se é cortesia
  const isCortesia = contrato.valor_total === 0;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contrato ${contrato.numero_contrato} - EXA Mídia</title>
      <style>
        @page {
          size: A4;
          margin: 12mm 15mm;
        }
        
        @media print {
          html, body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            background: white !important;
          }
          .page-break { 
            page-break-before: always; 
          }
          .no-break { 
            page-break-inside: avoid; 
          }
          /* Remove URL/data do rodapé de impressão */
          @page { 
            margin: 12mm 15mm;
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.65; 
          color: #1a1a1a; 
          max-width: 210mm;
          margin: 0 auto; 
          padding: 15px 20px;
          font-size: 10.5pt;
          background: #fff;
        }
        
        .header {
          background: linear-gradient(135deg, #8B1A1A 0%, #A52020 50%, #8B1A1A 100%);
          color: white;
          padding: 20px 25px;
          margin: -15px -20px 25px -20px;
          text-align: center;
          border-radius: 0 0 6px 6px;
          border-bottom: 3px solid #5a0f0f;
        }
        
        .header-logo {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 4px;
          margin-bottom: 3px;
        }
        
        .header-subtitle {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          opacity: 0.9;
        }
        
        .contract-title {
          text-align: center;
          margin: 30px 0;
        }
        
        .contract-title h1 {
          color: #8B1A1A;
          font-size: 18pt;
          margin: 0 0 10px 0;
          font-weight: 600;
        }
        
        .contract-number {
          font-size: 12pt;
          color: #666;
        }
        
        .section {
          margin: 25px 0;
        }
        
        .section-title {
          background: linear-gradient(90deg, #8B1A1A, #A52020);
          color: white;
          padding: 10px 15px;
          font-size: 12pt;
          font-weight: 600;
          margin-bottom: 15px;
          border-radius: 4px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 15px 0;
        }
        
        .info-card {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
        }
        
        .info-card-title {
          font-weight: 600;
          color: #8B1A1A;
          margin-bottom: 10px;
          font-size: 11pt;
          border-bottom: 2px solid #8B1A1A;
          padding-bottom: 5px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dotted #ddd;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          color: #666;
          font-size: 10pt;
        }
        
        .info-value {
          font-weight: 500;
          color: #1a1a1a;
          text-align: right;
          font-size: 10pt;
        }
        
        .clause {
          margin: 20px 0;
          text-align: justify;
          line-height: 1.8;
        }
        
        .clause-title {
          font-weight: 600;
          color: #8B1A1A;
        }
        
        .clause-content {
          margin-top: 5px;
        }
        
        .clause ul {
          margin: 10px 0 10px 20px;
          padding: 0;
        }
        
        .clause li {
          margin: 8px 0;
          line-height: 1.6;
        }
        
        .highlight-box {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .highlight-box.cortesia {
          background: #d4edda;
          border-color: #28a745;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        th {
          background: #f5f5f5;
          padding: 10px;
          border: 1px solid #ddd;
          text-align: left;
          font-weight: 600;
          color: #333;
        }
        
        td {
          padding: 8px 10px;
          border: 1px solid #ddd;
        }
        
        .signature-section {
          margin-top: 60px;
          page-break-inside: avoid;
        }
        
        .signature-intro {
          text-align: center;
          margin-bottom: 30px;
          font-style: italic;
          color: #666;
        }
        
        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 30px;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 70px;
          padding-top: 10px;
        }
        
        .signature-name {
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .signature-role {
          font-size: 10pt;
          color: #666;
          margin-top: 3px;
        }
        
        .signature-doc {
          font-size: 9pt;
          color: #888;
          margin-top: 3px;
        }
        
        .witnesses-section {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 1px dashed #ccc;
        }
        
        .witnesses-title {
          text-align: center;
          font-weight: 600;
          color: #666;
          margin-bottom: 30px;
        }
        
        .witnesses-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        
        .witness-box {
          text-align: center;
        }
        
        .witness-line {
          border-top: 1px solid #999;
          margin-top: 50px;
          padding-top: 8px;
        }
        
        .witness-label {
          font-size: 10pt;
          color: #666;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #8B1A1A;
          text-align: center;
          font-size: 9pt;
          color: #666;
        }
        
        .footer-company {
          font-weight: 600;
          color: #8B1A1A;
          margin-bottom: 5px;
        }
        
        .footer-info {
          line-height: 1.5;
        }
        
        .tech-specs {
          background: #e3f2fd;
          border: 1px solid #90caf9;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .tech-specs-title {
          font-weight: 600;
          color: #1565c0;
          margin-bottom: 10px;
        }
        
        .penalty-box {
          background: #ffebee;
          border: 1px solid #ef9a9a;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
        }
        
        /* ========== CSS RESPONSIVO MOBILE ========== */
        @media (max-width: 768px) {
          body {
            padding: 10px 12px;
            font-size: 9pt;
          }
          
          .header {
            margin: -10px -12px 20px -12px;
            padding: 15px 12px;
          }
          
          .header-logo {
            font-size: 22px;
            letter-spacing: 2px;
          }
          
          .header-subtitle {
            font-size: 9px;
          }
          
          .contract-title h1 {
            font-size: 14pt;
          }
          
          .contract-number {
            font-size: 10pt;
          }
          
          .section-title {
            font-size: 10pt;
            padding: 8px 10px;
          }
          
          .info-grid {
            display: block !important;
          }
          
          .info-card {
            margin-bottom: 12px;
            padding: 10px;
          }
          
          .info-card-title {
            font-size: 10pt;
          }
          
          .info-row {
            flex-direction: column;
            gap: 2px;
          }
          
          .info-label, .info-value {
            font-size: 9pt;
            text-align: left;
          }
          
          .clause {
            line-height: 1.6;
          }
          
          .clause ul {
            margin-left: 10px;
          }
          
          table {
            display: block;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            font-size: 8pt;
          }
          
          th, td {
            padding: 6px 8px;
            white-space: nowrap;
            min-width: 50px;
          }
          
          .signatures-grid,
          .witnesses-grid {
            display: block !important;
          }
          
          .signature-box,
          .witness-box {
            margin-bottom: 25px;
          }
          
          .signature-line {
            margin-top: 50px;
          }
          
          .highlight-box,
          .tech-specs,
          .penalty-box {
            padding: 10px;
          }
          
          .footer {
            font-size: 8pt;
          }
        }
        
        @media (max-width: 480px) {
          body {
            padding: 8px;
            font-size: 8pt;
          }
          
          .header-logo {
            font-size: 18px;
          }
          
          .contract-title h1 {
            font-size: 12pt;
          }
          
          .section-title {
            font-size: 9pt;
            padding: 6px 8px;
          }
          
          th, td {
            padding: 4px 6px;
            font-size: 7pt;
          }
        }
      </style>
    </head>
    <body>
      <!-- HEADER COM GRADIENTE EXA -->
      <div class="header">
        <div class="header-logo">EXA MÍDIA</div>
        <div class="header-subtitle">Publicidade em Elevadores</div>
      </div>

      <!-- TÍTULO DO CONTRATO -->
      <div class="contract-title">
        <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE PUBLICIDADE</h1>
        <div class="contract-number">
          Contrato nº <strong>${contrato.numero_contrato}</strong>
        </div>
      </div>

      <!-- CLÁUSULA 1: DAS PARTES -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 1ª - DAS PARTES</div>
        
        <div class="info-grid">
          <div class="info-card">
            <div class="info-card-title">CONTRATADA</div>
            <div class="info-row">
              <span class="info-label">Razão Social:</span>
              <span class="info-value">${exaData.razaoSocial}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CNPJ:</span>
              <span class="info-value">${exaData.cnpj}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Endereço:</span>
              <span class="info-value">${exaData.endereco}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Cidade/UF:</span>
              <span class="info-value">${exaData.cidade} - ${exaData.estado}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CEP:</span>
              <span class="info-value">${exaData.cep}</span>
            </div>
            ${exaSignatarios && exaSignatarios.length > 0 ? `
            <div class="info-row">
              <span class="info-label">Representantes Legais:</span>
              <span class="info-value">
                ${exaSignatarios.map(s => `${s.nome} - ${s.cargo || 'Sócio(a)'}`).join('<br>')}
              </span>
            </div>
            ` : ''}
          </div>

          <div class="info-card">
            <div class="info-card-title">CONTRATANTE</div>
            <div class="info-row">
              <span class="info-label">Nome:</span>
              <span class="info-value">${contrato.cliente_nome}</span>
            </div>
            ${contrato.cliente_razao_social ? `
            <div class="info-row">
              <span class="info-label">Razão Social:</span>
              <span class="info-value">${contrato.cliente_razao_social}</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">${contrato.cliente_cnpj ? 'CNPJ' : 'CPF'}:</span>
              <span class="info-value">${contrato.cliente_cnpj ? formatCNPJ(contrato.cliente_cnpj) : formatCPF(contrato.cliente_cpf)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">E-mail:</span>
              <span class="info-value">${contrato.cliente_email || '-'}</span>
            </div>
            ${contrato.cliente_telefone ? `
            <div class="info-row">
              <span class="info-label">Telefone:</span>
              <span class="info-value">${contrato.cliente_telefone}</span>
            </div>
            ` : ''}
            ${contrato.cliente_endereco ? `
            <div class="info-row">
              <span class="info-label">Endereço:</span>
              <span class="info-value">${contrato.cliente_endereco}</span>
            </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- CLÁUSULA 2: DO OBJETO -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 2ª - DO OBJETO</div>
        <div class="clause">
          <p><span class="clause-title">2.1.</span> O presente instrumento tem por objeto a prestação de serviços de publicidade em painéis digitais instalados em elevadores, mediante veiculação de material publicitário audiovisual do CONTRATANTE nos locais especificados neste contrato.</p>
          
          <p><span class="clause-title">2.2.</span> A CONTRATADA disponibilizará espaço publicitário em seus painéis digitais de alta definição, instalados em elevadores de condomínios residenciais e comerciais, para exibição do conteúdo publicitário do CONTRATANTE.</p>
          
          <p><span class="clause-title">2.3.</span> O serviço inclui:
            <ul>
              <li>Acesso à plataforma digital para upload e gestão do conteúdo publicitário;</li>
              <li>Suporte técnico para adequação do material às especificações técnicas;</li>
              <li>Monitoramento remoto do funcionamento dos equipamentos;</li>
              <li>Relatórios de exibição quando solicitados.</li>
            </ul>
          </p>
        </div>
      </div>

      <!-- CLÁUSULA 3: DOS LOCAIS CONTRATADOS -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 3ª - DOS LOCAIS CONTRATADOS</div>
        <div class="clause">
          <p><span class="clause-title">3.1.</span> O material publicitário do CONTRATANTE será veiculado nos seguintes locais:</p>
          
          <table>
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="width: 40px; padding: 10px; border: 1px solid #e5e7eb;">#</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb;">Edifício</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb;">Endereço</th>
                <th style="width: 60px; padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Telas</th>
                <th style="width: 100px; padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Exib./Dia</th>
                <th style="width: 100px; padding: 10px; border: 1px solid #e5e7eb; text-align: center;">Exib./Mês</th>
              </tr>
            </thead>
            <tbody>
              ${prediosListHtml || '<tr><td colspan="6" style="text-align: center; padding: 15px; border: 1px solid #e5e7eb;">Nenhum local especificado</td></tr>'}
            </tbody>
            <tfoot>
              <tr style="background: #f3f4f6; font-weight: 700;">
                <td colspan="3" style="padding: 12px; border: 1px solid #e5e7eb;">TOTAIS (${predios.length} local${predios.length > 1 ? 'is' : ''})</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${totalTelas}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #8B1A1A;">≈${totalExibDia.toLocaleString('pt-BR')}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #8B1A1A;">≈${totalExibMes.toLocaleString('pt-BR')}</td>
              </tr>
            </tfoot>
          </table>

          <p><span class="clause-title">3.2.</span> A CONTRATADA reserva-se o direito de substituir temporariamente algum local por outro de características similares, em caso de manutenção ou impossibilidade técnica, comunicando previamente o CONTRATANTE.</p>
          
          <p><span class="clause-title">3.3.</span> Os valores de exibição são calculados por cliente, baseados no ciclo completo de ${tempoCicloTotal} segundos, operação de ${horasOperacao} horas/dia e ${diasMes} dias/mês.</p>
        </div>
      </div>

      <!-- CLÁUSULA 4: DO PRAZO DE VIGÊNCIA -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 4ª - DO PRAZO DE VIGÊNCIA</div>
        <div class="clause">
          <p><span class="clause-title">4.1.</span> O presente contrato terá vigência de <strong>${contrato.plano_meses} (${contrato.plano_meses === 1 ? 'um' : contrato.plano_meses === 3 ? 'três' : contrato.plano_meses === 6 ? 'seis' : 'doze'}) ${contrato.plano_meses === 1 ? 'mês' : 'meses'}</strong>, com início em <strong>${formatDate(contrato.data_inicio)}</strong> e término em <strong>${formatDate(contrato.data_fim)}</strong>.</p>
          
          <p><span class="clause-title">4.2.</span> O contrato poderá ser renovado por igual período mediante acordo entre as partes, formalizado por escrito com antecedência mínima de 30 (trinta) dias do término da vigência.</p>
          
          <p><span class="clause-title">4.3.</span> A veiculação do material publicitário terá início em até 48 (quarenta e oito) horas úteis após a confirmação do pagamento e aprovação do conteúdo pela CONTRATADA.</p>
        </div>
      </div>

      <!-- CLÁUSULA 5: DO VALOR E FORMA DE PAGAMENTO -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 5ª - DO VALOR E FORMA DE PAGAMENTO</div>
        <div class="clause">
          ${isCortesia ? `
            <div class="highlight-box cortesia">
              <strong>🎁 CONTRATO DE CORTESIA</strong><br>
              Este contrato é firmado a título de cortesia, sem ônus para o CONTRATANTE, conforme acordo comercial estabelecido entre as partes.
            </div>
            <p><span class="clause-title">5.1.</span> O presente contrato é firmado a título de <strong>CORTESIA</strong>, não havendo valores a serem cobrados do CONTRATANTE durante a vigência deste instrumento.</p>
          ` : `
            <p><span class="clause-title">5.1.</span> Pela prestação dos serviços objeto deste contrato, o CONTRATANTE pagará à CONTRATADA o valor total de <strong>${formatCurrency(contrato.valor_total)}</strong> (${valorPorExtenso(contrato.valor_total)}).</p>
            
            ${isCustomPayment ? `
              <p><span class="clause-title">5.2.</span> O pagamento será realizado conforme o seguinte plano de parcelas:</p>
              ${parcelasHtml}
            ` : `
              <p><span class="clause-title">5.2.</span> O pagamento será realizado ${contrato.plano_meses === 1 ? 'em parcela única' : `em ${contrato.plano_meses} parcelas mensais de ${formatCurrency(valorMensal)}`} via PIX ou boleto bancário, conforme escolha do CONTRATANTE.</p>
            `}
            
            <p><span class="clause-title">5.3.</span> O não pagamento até a data de vencimento implicará na suspensão automática da veiculação do material publicitário, sem prejuízo das demais penalidades previstas neste contrato.</p>
          `}
        </div>
      </div>

      <!-- CLÁUSULA 6: DAS ESPECIFICAÇÕES TÉCNICAS -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 6ª - DAS ESPECIFICAÇÕES TÉCNICAS</div>
        <div class="clause">
          <div class="tech-specs">
            <div class="tech-specs-title">📺 Especificações do Material Publicitário — ${especificacoesTecnicas.descricao}</div>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Resolução:</strong> ${especificacoesTecnicas.formato}</li>
              <li><strong>Proporção:</strong> ${especificacoesTecnicas.proporcao}</li>
              <li><strong>Duração máxima:</strong> ${especificacoesTecnicas.duracao}</li>
              <li><strong>Tipo de exibição:</strong> ${especificacoesTecnicas.tipoExibicao}</li>
              <li><strong>Áudio:</strong> Não permitido (exibição sem som)</li>
              <li><strong>Exibições por tela/dia:</strong> ≈${especificacoesTecnicas.exibicoesDia.toLocaleString('pt-BR')} vezes</li>
              <li><strong>Exibições por tela/mês:</strong> ≈${especificacoesTecnicas.exibicoesMes.toLocaleString('pt-BR')} vezes</li>
              <li><strong>Formato de arquivo:</strong> MP4, MOV ou AVI</li>
              <li><strong>Codec recomendado:</strong> H.264</li>
              <li><strong>Taxa de bits:</strong> Mínimo 5 Mbps</li>
            </ul>
          </div>

          <p><span class="clause-title">6.1.</span> O CONTRATANTE é responsável por fornecer o material publicitário em conformidade com as especificações técnicas acima descritas.</p>
          
          <p><span class="clause-title">6.2.</span> Materiais que não atendam às especificações técnicas serão devolvidos para adequação, podendo acarretar atraso no início da veiculação.</p>
          
          <p><span class="clause-title">6.3.</span> A CONTRATADA poderá recusar a veiculação de materiais que contenham conteúdo ilícito, ofensivo, discriminatório, político-partidário ou que viole direitos de terceiros.</p>
          
          <p><span class="clause-title">6.4.</span> Os valores de exibições são estimados com base em ${horasOperacao} horas de operação diária e ${diasMes} dias por mês, conforme Manual Técnico v3.0 da EXA Mídia.</p>
        </div>
      </div>

      <div class="page-break"></div>

      <!-- CLÁUSULA 7: DOS DIREITOS DE IMAGEM E AUTORAIS -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 7ª - DOS DIREITOS DE IMAGEM E AUTORAIS</div>
        <div class="clause">
          <p><span class="clause-title">7.1.</span> O CONTRATANTE declara e garante ser o legítimo proprietário ou possuir autorização expressa para uso de todo o conteúdo veiculado, incluindo, mas não se limitando a:
            <ul>
              <li>Imagens, fotografias e vídeos;</li>
              <li>Textos, slogans e marcas;</li>
              <li>Músicas, trilhas sonoras e efeitos sonoros;</li>
              <li>Logotipos, símbolos e elementos gráficos;</li>
              <li>Direitos de imagem de pessoas físicas eventualmente retratadas.</li>
            </ul>
          </p>
          
          <p><span class="clause-title">7.2.</span> O CONTRATANTE assume integral responsabilidade por quaisquer reclamações, ações judiciais ou administrativas relacionadas a direitos autorais, marcas, patentes ou direitos de imagem do conteúdo veiculado, isentando a CONTRATADA de qualquer responsabilidade.</p>
          
          <p><span class="clause-title">7.3.</span> Em caso de demanda judicial ou extrajudicial envolvendo o conteúdo veiculado, o CONTRATANTE deverá assumir a defesa e arcar com todos os custos, honorários e eventuais condenações.</p>
          
          <p><span class="clause-title">7.4.</span> O CONTRATANTE <strong>autoriza expressamente</strong> a CONTRATADA a utilizar o material publicitário veiculado para fins de divulgação institucional, incluindo, mas não se limitando a:
            <ul>
              <li>Materiais internos de apresentação comercial e portfólio;</li>
              <li>Cases de sucesso e exemplos de trabalhos realizados;</li>
              <li>Publicações em redes sociais (Instagram, Facebook, LinkedIn, YouTube, TikTok e outras);</li>
              <li>Website institucional da EXA Mídia;</li>
              <li>Apresentações comerciais a potenciais anunciantes e parceiros.</li>
            </ul>
          </p>
          
          <p><span class="clause-title">7.5.</span> A utilização do material pela CONTRATADA será sempre de forma profissional e institucional, podendo incluir a identificação do CONTRATANTE como cliente, salvo solicitação expressa em contrário formalizada por escrito.</p>
        </div>
      </div>

      <!-- CLÁUSULA 8: DAS OBRIGAÇÕES DA CONTRATADA -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 8ª - DAS OBRIGAÇÕES DA CONTRATADA</div>
        <div class="clause">
          <p><span class="clause-title">8.1.</span> São obrigações da CONTRATADA:</p>
          <ul>
            <li><strong>a)</strong> Disponibilizar os painéis digitais nos locais especificados neste contrato em perfeito estado de funcionamento;</li>
            <li><strong>b)</strong> Garantir o funcionamento dos equipamentos durante as <strong>${horasOperacao} horas diárias</strong> de operação, conforme configuração estabelecida para cada local;</li>
            <li><strong>c)</strong> Realizar manutenção preventiva e corretiva dos equipamentos, no prazo máximo de 72 (setenta e duas) horas úteis após identificação de falhas;</li>
            <li><strong>d)</strong> Disponibilizar plataforma online para upload, gestão e agendamento do conteúdo publicitário;</li>
            <li><strong>e)</strong> Fornecer suporte técnico para dúvidas relacionadas ao uso da plataforma;</li>
            <li><strong>f)</strong> Aprovar ou rejeitar o conteúdo publicitário em até 24 (vinte e quatro) horas úteis após o envio;</li>
            <li><strong>g)</strong> Comunicar o CONTRATANTE sobre eventuais problemas técnicos que afetem a veiculação.</li>
          </ul>
          
          <p><span class="clause-title">8.2.</span> A CONTRATADA não se responsabiliza por interrupções decorrentes de casos fortuitos, força maior, ou falhas nos serviços de energia elétrica e internet dos condomínios.</p>
        </div>
      </div>

      <!-- CLÁUSULA 9: DAS OBRIGAÇÕES DO CONTRATANTE -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 9ª - DAS OBRIGAÇÕES DO CONTRATANTE</div>
        <div class="clause">
          <p><span class="clause-title">9.1.</span> São obrigações do CONTRATANTE:</p>
          <ul>
            <li><strong>a)</strong> Efetuar o pagamento dos valores acordados nas datas de vencimento;</li>
            <li><strong>b)</strong> Fornecer material publicitário em conformidade com as especificações técnicas estabelecidas;</li>
            <li><strong>c)</strong> Garantir que o conteúdo veiculado não viole leis, regulamentos ou direitos de terceiros;</li>
            <li><strong>d)</strong> Comunicar à CONTRATADA qualquer alteração em seus dados cadastrais;</li>
            <li><strong>e)</strong> Utilizar a plataforma de gestão de conteúdo de forma adequada e responsável;</li>
            <li><strong>f)</strong> Não compartilhar credenciais de acesso à plataforma com terceiros não autorizados.</li>
          </ul>
        </div>
      </div>

      <!-- CLÁUSULA 10: DA MULTA E PENALIDADES -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 10ª - DA MULTA E PENALIDADES</div>
        <div class="clause">
          ${isCortesia ? `
            <p><span class="clause-title">10.1.</span> Por tratar-se de contrato de cortesia, não haverá aplicação de multas por inadimplemento financeiro.</p>
            <p><span class="clause-title">10.2.</span> A CONTRATADA reserva-se o direito de rescindir este contrato a qualquer momento, mediante comunicação prévia de 15 (quinze) dias.</p>
          ` : `
            <div class="penalty-box">
              <strong>⚠️ Atenção às penalidades por atraso:</strong><br>
              Multa de 2% + Juros de 1% ao mês sobre o valor em atraso
            </div>
            
            <p><span class="clause-title">10.1.</span> O atraso no pagamento de qualquer parcela implicará na incidência de:
              <ul>
                <li>Multa de <strong>2% (dois por cento)</strong> sobre o valor da parcela em atraso;</li>
                <li>Juros moratórios de <strong>1% (um por cento) ao mês</strong>, calculados pro rata die;</li>
                <li>Correção monetária pelo IPCA/IBGE ou índice que vier a substituí-lo.</li>
              </ul>
            </p>
            
            <p><span class="clause-title">10.2.</span> Após <strong>10 (dez) dias</strong> de atraso, a veiculação do material publicitário será automaticamente suspensa, sem aviso prévio adicional.</p>
            
            <p><span class="clause-title">10.3.</span> A reativação da veiculação após suspensão por inadimplência ficará condicionada à quitação integral dos valores em atraso, acrescidos das penalidades previstas.</p>
            
            <p><span class="clause-title">10.4.</span> A suspensão da veiculação por inadimplência não prorroga o prazo contratual nem gera direito a ressarcimento ou desconto.</p>
          `}
        </div>
      </div>

      <!-- CLÁUSULA 11: DA RESCISÃO CONTRATUAL -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 11ª - DA RESCISÃO CONTRATUAL</div>
        <div class="clause">
          <p><span class="clause-title">11.1.</span> O presente contrato poderá ser rescindido:
            <ul>
              <li><strong>a)</strong> Por mútuo acordo entre as partes, formalizado por escrito;</li>
              <li><strong>b)</strong> Por inadimplemento de qualquer das partes, após notificação com prazo de 15 (quinze) dias para regularização;</li>
              <li><strong>c)</strong> Por caso fortuito ou força maior que impossibilite a continuidade da prestação dos serviços;</li>
              <li><strong>d)</strong> Por determinação judicial ou administrativa.</li>
            </ul>
          </p>
          
          ${!isCortesia ? `
            <p><span class="clause-title">11.2.</span> Em caso de rescisão antecipada por iniciativa do CONTRATANTE, sem justa causa, será devida multa rescisória correspondente a <strong>20% (vinte por cento)</strong> do valor restante do contrato.</p>
            
            <p><span class="clause-title">11.3.</span> Em caso de rescisão por culpa da CONTRATADA, esta deverá restituir ao CONTRATANTE os valores pagos proporcionalmente ao período não usufruído.</p>
          ` : `
            <p><span class="clause-title">11.2.</span> Por tratar-se de cortesia, qualquer das partes poderá rescindir o contrato mediante comunicação prévia de 15 (quinze) dias, sem aplicação de multas.</p>
          `}
        </div>
      </div>

      <!-- CLÁUSULA 12: DA CONFIDENCIALIDADE -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 12ª - DA CONFIDENCIALIDADE</div>
        <div class="clause">
          <p><span class="clause-title">12.1.</span> As partes comprometem-se a manter em <strong>absoluto sigilo</strong> todas as informações comerciais, valores, condições e acordos estabelecidos neste contrato, não podendo divulgá-los a terceiros sem prévia autorização por escrito.</p>
          
          <p><span class="clause-title">12.2.</span> São consideradas informações confidenciais:
            <ul>
              <li>Valores, descontos e condições comerciais acordadas;</li>
              <li>Estratégias comerciais, de marketing e operacionais;</li>
              <li>Dados estatísticos de performance e métricas de exibição;</li>
              <li>Informações técnicas e operacionais dos sistemas;</li>
              <li>Quaisquer informações não públicas compartilhadas entre as partes.</li>
            </ul>
          </p>
          
          <p><span class="clause-title">12.3.</span> O dever de confidencialidade <strong>permanecerá em vigor por prazo indeterminado</strong>, mesmo após o término ou rescisão deste contrato.</p>
          
          <p><span class="clause-title">12.4.</span> A parte que violar o dever de confidencialidade responderá pelos danos causados à outra parte, sem prejuízo das sanções legais cabíveis.</p>
          
          <p><span class="clause-title">12.5.</span> Não será considerada violação de confidencialidade:
            <ul>
              <li>Informações que se tornarem públicas por meios lícitos;</li>
              <li>Divulgações exigidas por ordem judicial ou determinação de autoridade competente;</li>
              <li>Informações previamente autorizadas por escrito pela outra parte.</li>
            </ul>
          </p>
        </div>
      </div>

      <!-- CLÁUSULA 13: DO FORO E DISPOSIÇÕES GERAIS -->
      <div class="section no-break">
        <div class="section-title">CLÁUSULA 13ª - DO FORO E DISPOSIÇÕES GERAIS</div>
        <div class="clause">
          <p><span class="clause-title">13.1.</span> As partes elegem o <strong>Foro da Comarca de Foz do Iguaçu, Estado do Paraná</strong>, para dirimir quaisquer questões oriundas deste contrato, com exclusão de qualquer outro, por mais privilegiado que seja.</p>
          
          <p><span class="clause-title">13.2.</span> O presente contrato é firmado em caráter irrevogável e irretratável, obrigando as partes e seus sucessores a qualquer título.</p>
          
          <p><span class="clause-title">13.3.</span> A tolerância de qualquer das partes quanto ao descumprimento de cláusulas deste contrato não constituirá renúncia nem criará precedente invocável.</p>
          
          <p><span class="clause-title">13.4.</span> Qualquer alteração neste contrato somente terá validade se formalizada por escrito e assinada por ambas as partes.</p>
          
          <p><span class="clause-title">13.5.</span> Os dados pessoais fornecidos pelas partes serão tratados em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).</p>
          
          <p><span class="clause-title">13.6.</span> Este contrato representa o acordo integral entre as partes, substituindo quaisquer entendimentos anteriores, verbais ou escritos.</p>
        </div>
      </div>

      <!-- ÁREA DE ASSINATURAS -->
      <div class="signature-section">
        <div class="signature-intro">
          E por estarem assim justas e contratadas, as partes firmam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença das testemunhas abaixo.
        </div>
        
        <p style="text-align: center; margin: 20px 0;">
          <strong>Foz do Iguaçu - PR, ${formatDate(new Date().toISOString())}</strong>
        </p>

        <div class="signatures-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 25px;">
          <!-- SIGNATÁRIOS EXA (Jeferson E Natália) -->
          ${exaSignatarios && exaSignatarios.length > 0 ? exaSignatarios.map(sig => `
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-name">${sig.nome}</div>
                <div class="signature-role">${sig.cargo || 'Sócio(a)'} - EXA Soluções Digitais LTDA</div>
                <div class="signature-doc">CPF: ${formatCPF(sig.cpf)}</div>
                <div style="margin-top: 5px; font-weight: 600; color: #8B1A1A;">CONTRATADA</div>
              </div>
            </div>
          `).join('') : `
            <div class="signature-box">
              <div class="signature-line">
                <div class="signature-name">Representante Legal</div>
                <div class="signature-role">EXA Soluções Digitais LTDA</div>
                <div class="signature-doc">CNPJ: ${exaData.cnpj}</div>
                <div style="margin-top: 5px; font-weight: 600; color: #8B1A1A;">CONTRATADA</div>
              </div>
            </div>
          `}
          
          <!-- CONTRATANTE (cliente) -->
          <div class="signature-box">
            <div class="signature-line">
              <div class="signature-name">${contrato.cliente_nome}</div>
              <div class="signature-role">${contrato.cliente_cargo || 'Representante Legal'}</div>
              <div class="signature-doc">${contrato.cliente_cnpj ? 'CNPJ: ' + formatCNPJ(contrato.cliente_cnpj) : 'CPF: ' + formatCPF(contrato.cliente_cpf)}</div>
              <div style="margin-top: 5px; font-weight: 600; color: #8B1A1A;">CONTRATANTE</div>
            </div>
          </div>
        </div>

        <!-- TESTEMUNHAS -->
        <div class="witnesses-section">
          <div class="witnesses-title">TESTEMUNHAS</div>
          <div class="witnesses-grid">
            <div class="witness-box">
              <div class="witness-line">
                <div class="witness-label">Testemunha 1</div>
                <div style="font-size: 9pt; color: #888; margin-top: 3px;">Nome: _______________________</div>
                <div style="font-size: 9pt; color: #888;">CPF: _______________________</div>
              </div>
            </div>
            <div class="witness-box">
              <div class="witness-line">
                <div class="witness-label">Testemunha 2</div>
                <div style="font-size: 9pt; color: #888; margin-top: 3px;">Nome: _______________________</div>
                <div style="font-size: 9pt; color: #888;">CPF: _______________________</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RODAPÉ -->
      <div class="footer">
        <div class="footer-company">EXA Soluções Digitais LTDA</div>
        <div class="footer-info">
          CNPJ: ${exaData.cnpj}<br>
          ${exaData.endereco} - ${exaData.cidade}/${exaData.estado} - CEP: ${exaData.cep}<br>
          www.examidia.com.br | contato@examidia.com.br
        </div>
        <div style="margin-top: 15px; font-size: 8pt; color: #999;">
          Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}<br>
          Este contrato será assinado digitalmente via plataforma ClickSign
        </div>
      </div>
    </body>
    </html>
  `;
}

// Helper function to convert number to words (Portuguese)
function valorPorExtenso(valor: number): string {
  if (valor === 0) return 'zero reais';
  
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const especiais = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  
  const parteInteira = Math.floor(valor);
  const centavos = Math.round((valor - parteInteira) * 100);
  
  let resultado = '';
  
  if (parteInteira >= 1000) {
    const milhares = Math.floor(parteInteira / 1000);
    if (milhares === 1) {
      resultado += 'mil ';
    } else {
      resultado += unidades[milhares] + ' mil ';
    }
  }
  
  const resto = parteInteira % 1000;
  
  if (resto >= 100) {
    const c = Math.floor(resto / 100);
    if (resto === 100) {
      resultado += 'cem ';
    } else {
      resultado += centenas[c] + ' e ';
    }
  }
  
  const dezena = resto % 100;
  
  if (dezena >= 10 && dezena < 20) {
    resultado += especiais[dezena - 10] + ' ';
  } else {
    if (dezena >= 20) {
      resultado += dezenas[Math.floor(dezena / 10)] + ' ';
      if (dezena % 10 > 0) {
        resultado += 'e ' + unidades[dezena % 10] + ' ';
      }
    } else if (dezena > 0) {
      resultado += unidades[dezena] + ' ';
    }
  }
  
  resultado += parteInteira === 1 ? 'real' : 'reais';
  
  if (centavos > 0) {
    resultado += ' e ' + centavos + (centavos === 1 ? ' centavo' : ' centavos');
  }
  
  return resultado.trim();
}