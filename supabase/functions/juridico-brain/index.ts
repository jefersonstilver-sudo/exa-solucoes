import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JuridicoBrainRequest {
  input_type: 'text' | 'audio_url' | 'document_text';
  content: string;
  context?: {
    predio_id?: string;
    predio_nome?: string;
    parceiro_nome?: string;
    tipo_contrato_sugerido?: string;
  };
}

interface GatilhoCondicional {
  condicao: string;
  acao: string;
  prazo?: string;
}

interface RiscoDetectado {
  nivel: 'baixo' | 'medio' | 'alto' | 'critico';
  descricao: string;
  sugestao: string;
}

interface ClausulaGerada {
  titulo: string;
  conteudo: string;
}

interface JuridicoBrainResponse {
  success: boolean;
  tipo_contrato: string;
  parceiro: {
    nome: string;
    tipo_pessoa: 'PF' | 'PJ';
    documento: string;
  };
  objeto: string;
  obrigacoes_indexa: string[];
  obrigacoes_parceiro: string[];
  gatilhos_condicionais: GatilhoCondicional[];
  riscos_detectados: RiscoDetectado[];
  valor_financeiro: number | null;
  prazo_meses: number;
  clausulas_geradas: ClausulaGerada[];
  html_preview: string;
  health_score: number;
  contexto_ia: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: JuridicoBrainRequest = await req.json();
    const { input_type, content, context } = body;

    console.log('[JURIDICO-BRAIN] 🧠 Processing request:', { input_type, contentLength: content?.length });

    // 1. Se for áudio, transcrever primeiro
    // Sanitize content for Indexa 2026 compliance
    let processedContent = sanitizeToIndexa2026(content);
    
    if (input_type === 'audio_url') {
      console.log('[JURIDICO-BRAIN] 🎤 Transcribing audio...');
      const transcribeResponse = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          audioUrl: content,
          language: 'pt',
          prompt: 'Contexto jurídico e comercial sobre contratos, parcerias, síndicos, prédios, mídia em elevadores.'
        }),
      });

      if (!transcribeResponse.ok) {
        const errorText = await transcribeResponse.text();
        console.error('[JURIDICO-BRAIN] ❌ Transcription failed:', errorText);
        throw new Error('Failed to transcribe audio');
      }

      const transcription = await transcribeResponse.json();
      processedContent = transcription.text;
      console.log('[JURIDICO-BRAIN] ✅ Transcription result:', processedContent?.substring(0, 100));
    }

    // 2. Buscar prompt do banco
    const { data: promptData, error: promptError } = await supabase
      .from('juridico_prompts')
      .select('*')
      .eq('codigo', 'juridico_brain')
      .eq('is_active', true)
      .single();

    if (promptError || !promptData) {
      console.error('[JURIDICO-BRAIN] ❌ Prompt not found:', promptError);
      throw new Error('System prompt not configured');
    }

    // 3. Construir contexto adicional
    let additionalContext = '';
    if (context?.predio_id) {
      const { data: buildingData } = await supabase
        .from('buildings')
        .select('nome, endereco, bairro, nome_sindico, contato_sindico, cnpj_condominio')
        .eq('id', context.predio_id)
        .single();

      if (buildingData) {
        additionalContext = `
DADOS DO PRÉDIO:
- Nome: ${buildingData.nome}
- Endereço: ${buildingData.endereco}, ${buildingData.bairro}
- Síndico: ${buildingData.nome_sindico || 'Não informado'}
- Contato: ${buildingData.contato_sindico || 'Não informado'}
- CNPJ: ${buildingData.cnpj_condominio || 'Não informado'}
`;
      }
    }

    // 4. Construir mensagens para GPT
    const fewShotExamples = promptData.few_shot_examples || [];
    const fewShotMessages: any[] = [];
    
    for (const example of fewShotExamples) {
      fewShotMessages.push({ role: 'user', content: example.input });
      fewShotMessages.push({ role: 'assistant', content: JSON.stringify(example.output, null, 2) });
    }

    const userMessage = `${additionalContext}

ENTRADA DO USUÁRIO:
${processedContent}

${context?.tipo_contrato_sugerido ? `TIPO SUGERIDO: ${context.tipo_contrato_sugerido}` : ''}
${context?.parceiro_nome ? `PARCEIRO SUGERIDO: ${context.parceiro_nome}` : ''}

Analise o contexto acima e retorne APENAS um JSON válido com a estrutura especificada no system prompt.`;

    // 5. Chamar OpenAI GPT-4o
    console.log('[JURIDICO-BRAIN] 🔄 Calling OpenAI...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: promptData.modelo || 'gpt-4o',
        temperature: Number(promptData.temperatura) || 0.2,
        messages: [
          { role: 'system', content: promptData.system_prompt },
          ...fewShotMessages,
          { role: 'user', content: userMessage }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('[JURIDICO-BRAIN] ❌ OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('Empty response from OpenAI');
    }

    console.log('[JURIDICO-BRAIN] ✅ OpenAI response received');

    // 6. Parse JSON response
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(assistantMessage);
    } catch (parseError) {
      console.error('[JURIDICO-BRAIN] ❌ JSON parse error:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    // 7. Gerar HTML preview
    const htmlPreview = generateHtmlPreview(parsedResponse);

    // 8. Calcular health score se não fornecido
    const healthScore = parsedResponse.health_score || calculateHealthScore(parsedResponse);

    // 9. Construir resposta final
    const response: JuridicoBrainResponse = {
      success: true,
      tipo_contrato: parsedResponse.tipo_contrato || 'anunciante',
      parceiro: parsedResponse.parceiro || { nome: '', tipo_pessoa: 'PJ', documento: '' },
      objeto: parsedResponse.objeto || '',
      obrigacoes_indexa: parsedResponse.obrigacoes_indexa || [],
      obrigacoes_parceiro: parsedResponse.obrigacoes_parceiro || [],
      gatilhos_condicionais: parsedResponse.gatilhos_condicionais || [],
      riscos_detectados: parsedResponse.riscos_detectados || [],
      valor_financeiro: parsedResponse.valor_financeiro || null,
      prazo_meses: parsedResponse.prazo_meses || 12,
      clausulas_geradas: parsedResponse.clausulas_geradas || [],
      html_preview: htmlPreview,
      health_score: healthScore,
      contexto_ia: processedContent,
    };

    console.log('[JURIDICO-BRAIN] ✅ Processing complete, health_score:', healthScore);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[JURIDICO-BRAIN] ❌ Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        health_score: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Validate CNPJ format
function isValidCNPJ(cnpj: string): boolean {
  const cleaned = (cnpj || '').replace(/\D/g, '');
  return cleaned.length === 14;
}

// Sanitize old company data to Indexa 2026 compliance
function sanitizeToIndexa2026(text: string): string {
  const replacements = [
    { old: /EXA\s*Soluções\s*(Digitais)?/gi, new: 'INDEXA MIDIA LTDA' },
    { old: /51\.925\.922\/0001-50/g, new: '38.142.638/0001-30' },
    { old: /Natália\s*[A-Za-z\s]*/gi, new: 'Jeferson Stilver Rodrigues Encina' },
  ];
  
  let result = text;
  for (const r of replacements) {
    result = result.replace(r.old, r.new);
  }
  return result;
}

// Calculate health score - Exact Indexa 2026 algorithm
function calculateHealthScore(data: any): number {
  let score = 0;
  
  // +15%: Parceiro identificado (CNPJ válido)
  if (data.parceiro?.documento && isValidCNPJ(data.parceiro.documento)) {
    score += 15;
  }
  
  // +25%: Objeto >50 caracteres
  if (data.objeto && data.objeto.length > 50) {
    score += 25;
  }
  
  // +20%: Contrapartida clara (valor R$ ou obrigação de permuta)
  if (data.valor_financeiro || (data.obrigacoes_parceiro?.length > 0)) {
    score += 20;
  }
  
  // +10%: Prazo definido
  if (data.prazo_meses && data.prazo_meses > 0) {
    score += 10;
  }
  
  // +30%: Validação de risco (sem cláusulas abusivas críticas)
  const criticalRisks = data.riscos_detectados?.filter((r: any) => r.nivel === 'critico') || [];
  if (criticalRisks.length === 0) {
    score += 30;
  }
  
  return Math.min(score, 100);
}

function generateHtmlPreview(data: any): string {
  const today = new Date().toLocaleDateString('pt-BR');
  
  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'termo_aceite': 'TERMO DE ACEITE E AUTORIZAÇÃO',
      'comodato': 'CONTRATO DE COMODATO',
      'anunciante': 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MÍDIA',
      'parceria_clt': 'CONTRATO DE PARCERIA (CLT)',
      'parceria_pj': 'CONTRATO DE PARCERIA (PJ)',
      'permuta': 'CONTRATO DE PERMUTA',
    };
    return labels[tipo] || 'CONTRATO';
  };

  const clausulasHtml = (data.clausulas_geradas || [])
    .map((c: any, i: number) => `
      <div style="margin-bottom: 16px;">
        <strong>CLÁUSULA ${i + 1}ª - ${c.titulo}</strong>
        <p style="margin-top: 8px; text-align: justify;">${c.conteudo}</p>
      </div>
    `)
    .join('');

  const riscosHtml = (data.riscos_detectados || [])
    .map((r: any) => `
      <div style="background: ${r.nivel === 'critico' ? '#fee2e2' : r.nivel === 'alto' ? '#fef3c7' : '#e0f2fe'}; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
        <strong>⚠️ ${r.nivel.toUpperCase()}: ${r.descricao}</strong>
        <p style="margin-top: 4px; font-size: 14px;">Sugestão: ${r.sugestao}</p>
      </div>
    `)
    .join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #9C1E1E; padding-bottom: 20px; }
    .logo { color: #9C1E1E; font-size: 24px; font-weight: bold; }
    .title { font-size: 18px; font-weight: bold; margin: 20px 0; text-align: center; }
    .parties { margin: 20px 0; padding: 20px; background: #f8f8f8; border-radius: 8px; }
    .signature { margin-top: 60px; display: flex; justify-content: space-around; }
    .signature-block { text-align: center; width: 40%; }
    .signature-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 8px; }
    .risks { margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">INDEXA MÍDIA</div>
    <p style="font-size: 12px; color: #666;">CNPJ: 38.142.638/0001-30</p>
    <p style="font-size: 12px; color: #666;">Avenida Paraná, 974 - Sala 301, Centro, Foz do Iguaçu - PR</p>
  </div>

  <div class="title">${getTipoLabel(data.tipo_contrato)}</div>

  <div class="parties">
    <p><strong>CONTRATADA:</strong> INDEXA MIDIA LTDA, inscrita no CNPJ sob nº 38.142.638/0001-30, 
    com sede na Avenida Paraná, 974 - Sala 301, Centro, Foz do Iguaçu - PR, CEP 85851-180, 
    neste ato representada por <strong>Jeferson Stilver Rodrigues Encina</strong>, CPF 055.031.279-00.</p>
    
    <p><strong>CONTRATANTE:</strong> ${data.parceiro?.nome || '[NOME DO PARCEIRO]'}, 
    ${data.parceiro?.tipo_pessoa === 'PJ' ? 'inscrita no CNPJ sob nº' : 'inscrita no CPF sob nº'} 
    ${data.parceiro?.documento || '[DOCUMENTO]'}.</p>
  </div>

  <p><strong>OBJETO:</strong> ${data.objeto || '[OBJETO DO CONTRATO]'}</p>

  ${riscosHtml ? `<div class="risks"><strong>⚠️ RISCOS DETECTADOS:</strong>${riscosHtml}</div>` : ''}

  ${clausulasHtml}

  <p><strong>PRAZO:</strong> ${data.prazo_meses || 12} meses a partir da assinatura.</p>

  <p><strong>FORO:</strong> Fica eleito o foro da Comarca de Foz do Iguaçu/PR para dirimir quaisquer controvérsias.</p>

  <p style="margin-top: 20px;">Foz do Iguaçu, ${today}</p>

  <div class="signature">
    <div class="signature-block">
      <div class="signature-line">
        <strong>INDEXA MIDIA LTDA</strong><br>
        Jeferson Stilver Rodrigues Encina<br>
        CPF: 055.031.279-00
      </div>
    </div>
    <div class="signature-block">
      <div class="signature-line">
        <strong>${data.parceiro?.nome || '[CONTRATANTE]'}</strong><br>
        ${data.parceiro?.documento || '[DOCUMENTO]'}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
