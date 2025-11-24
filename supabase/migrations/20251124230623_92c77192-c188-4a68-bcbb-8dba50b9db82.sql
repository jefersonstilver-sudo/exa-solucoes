-- FASE 1 - CORREÇÃO COMPLETA: Remover duplicatas, preencher instructions e potencializar conhecimentos

-- 1. REMOVER DUPLICATAS INSTITUCIONAIS
-- Manter apenas "EXA Mídia — Institucional" (o menor e mais recente)
DELETE FROM agent_knowledge_items 
WHERE agent_id = 'sofia' 
AND id IN (
  '4e403a6e-330f-4647-945b-4b94358792ff',  -- Institucional gigante (12k)
  '452fcbae-9ebe-4a4e-956b-052671ae68eb'   -- EXA Mídia — informações (2.6k)
);

-- 2. POTENCIALIZAR "Manual do Anunciante"
UPDATE agent_knowledge_items SET
  content = '📘 MANUAL DO ANUNCIANTE — COMO FUNCIONA

🎯 PROCESSO COMPLETO:

1️⃣ ESCOLHA OS PRÉDIOS
Sofia te mostra os melhores pontos para seu público

2️⃣ ENVIE SEU VÍDEO
• Formato: MP4/MOV vertical (9:16)
• Duração: 15-30 segundos
• Tamanho: até 100MB

3️⃣ APROVAÇÃO TÉCNICA
Nossa equipe analisa em até 24h

4️⃣ VEICULAÇÃO
Vídeo sobe em até 48h após aprovação

5️⃣ ACOMPANHAMENTO
Dashboard em tempo real com todas as métricas

💬 EXEMPLO CERTO:
Cliente: "Como faço pra anunciar?"
Sofia: "É simples: você escolhe os prédios, envia o vídeo, aprovamos e sobe. Aí você acompanha tudo em tempo real. Quer ver os pontos disponíveis?"

❌ ERRADO:
"Leia o manual completo aqui..." (muito texto)',
  instruction = 'Usar quando cliente perguntar "como funciona" ou "como anunciar" ou pedir explicação do processo completo',
  keywords = ARRAY['manual', 'como funciona', 'processo', 'anunciar', 'passo a passo', 'tutorial']
WHERE id = 'fdc68493-887d-4f76-94ff-8a4d61200902';

-- 3. POTENCIALIZAR "Produto EXA"
UPDATE agent_knowledge_items SET
  content = '📱 PRODUTO EXA — TELAS NOS ELEVADORES

🎯 O QUE É:
Telas digitais instaladas dentro dos elevadores dos prédios

📊 DIFERENCIAIS:
• Público cativo (3-5 min de atenção garantida)
• Alto impacto (impossível ignorar)
• Segmentação precisa (bairro + perfil)
• Atualização em tempo real

🏢 ONDE ESTÃO:
• Prédios residenciais classe A/B
• Prédios corporativos
• Condomínios comerciais
• +500 pontos ativos

💡 POR QUE FUNCIONA:
Pessoa parada no elevador = 100% de atenção
Sem distração de celular
Repetição (vai e volta todo dia)

💬 EXEMPLO CERTO:
Cliente: "Como são as telas?"
Sofia: "São telas digitais dentro dos elevadores. A pessoa fica 3-5 min parada olhando, impossível ignorar. Funciona muito bem. Quer ver onde temos pontos?"

❌ ERRADO:
Descrever especificações técnicas das telas',
  instruction = 'Usar quando cliente perguntar sobre o produto, as telas, como funciona tecnicamente ou o que é mídia indoor',
  keywords = ARRAY['produto', 'tela', 'mídia', 'indoor', 'elevador', 'o que é']
WHERE id = '35e446d4-0931-4176-8129-fce6eb260b94';

-- 4. POTENCIALIZAR "Template WhatsApp"
UPDATE agent_knowledge_items SET
  content = '📋 TEMPLATE DE APRESENTAÇÃO DE PRÉDIOS

SEMPRE usar este formato ao mostrar prédios:

🏢 [NOME DO PRÉDIO]
📍 [Bairro]
👥 Público: [público_estimado] pessoas/mês
📺 Exibições: [visualizacoes_mes]/mês
🏗️ [numero_elevadores] elevadores
💰 R$ [preco_base]/mês

✅ EXEMPLO CERTO:
"Tenho 3 ótimos pontos em Moema:

🏢 Edifício Gran Moema
📍 Moema
👥 12.000 pessoas/mês
📺 45.000 exibições/mês
🏗️ 4 elevadores
💰 R$ 1.200/mês

🏢 Residencial Ibirapuera Park
📍 Moema
👥 8.500 pessoas/mês
📺 32.000 exibições/mês
🏗️ 3 elevadores
💰 R$ 950/mês

Qual te interessa mais?"

❌ ERRADO:
Listar sem formato ou só nome dos prédios

🚨 REGRAS:
• Máximo 5 prédios por mensagem
• Sempre perguntar depois
• Endereço só se pedir',
  instruction = 'Usar SEMPRE que for apresentar lista de prédios ao cliente. Este é o template oficial obrigatório.',
  keywords = ARRAY['template', 'formato', 'apresentar', 'mostrar', 'listar', 'prédios']
WHERE id = '0eee8178-bc38-44ed-899d-3f1205b41831';

-- 5. PREENCHER INSTRUCTION VAZIA: "Como Formatar: Lista de Prédios por Exibições"
UPDATE agent_knowledge_items SET
  instruction = 'Usar quando cliente pedir prédios ordenados por número de visualizações ou exibições (mais vistos primeiro)'
WHERE id = 'f63482e3-ee96-44be-b703-4cb2c059d140';

-- 6. PREENCHER INSTRUCTION VAZIA: "Como Responder: Ranking por Exibições"
UPDATE agent_knowledge_items SET
  instruction = 'Usar quando cliente pedir ranking ou "top" prédios com mais visualizações'
WHERE id = '91012d66-b19a-4c3b-97b6-b8a5c9fe2149';

-- Atualizar timestamp para forçar refresh
UPDATE agent_knowledge_items 
SET updated_at = NOW() 
WHERE agent_id = 'sofia';