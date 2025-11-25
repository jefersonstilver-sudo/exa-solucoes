-- ==========================================
-- CORREÇÕES DA SOFIA - SEÇÕES E KNOWLEDGE
-- ==========================================

-- 1. SEÇÃO 1: Trocar "10 prédios ativos" por "[X] prédios disponíveis"
UPDATE agent_sections
SET content = REPLACE(
  REPLACE(content, 
    'Oi! Temos 10 prédios ativos hoje 🏢',
    'Oi! Temos [X] prédios disponíveis hoje 🏢'
  ),
  'Que bom falar com você! A EXA possui diversos prédios disponíveis para anúncio em nossa plataforma. Atualmente contamos com 10 prédios ativos',
  'Que bom falar com você! A EXA possui diversos prédios disponíveis para anúncio em nossa plataforma. Atualmente contamos com [X] prédios disponíveis'
),
updated_at = NOW()
WHERE id = '02641c16-a4a4-4e1c-ad73-59b4a1b52cdc';

-- 2. SEÇÃO 2: Trocar "10 prédios ativos", adicionar regra sobre consulta e status "instalação"
UPDATE agent_sections
SET content = REPLACE(
  REPLACE(
    REPLACE(content,
      '• Mostra 10 prédios ativos da região',
      '• Mostra [X] prédios disponíveis da região (status "ativo" + "instalação")'
    ),
    'status = "ativo"',
    'status IN ("ativo", "instalação")'
  ),
  '🚨 CRÍTICO: Sofia não inventa nada',
  '🚨 CRÍTICO: Sofia não inventa nada. NUNCA use números dos exemplos — SEMPRE consulte o banco real para contagens atuais!'
),
updated_at = NOW()
WHERE id = '4308b131-3add-4459-b0be-a806107c19e9';

-- 3. SEÇÃO 4: Adicionar referência ao novo knowledge item de endereço
UPDATE agent_sections
SET content = content || E'\n\n📍 ENDEREÇO E CONTATO DA EXA:\nQuando cliente perguntar "onde vocês ficam?" ou "qual o endereço?", consulte o knowledge item "Endereço e Contato Oficial da EXA".',
updated_at = NOW()
WHERE id = '3fae2ea6-673e-4580-a470-5e5ae594b9c5';

-- 4. KNOWLEDGE ITEM: Template WhatsApp - Remover separador de milhares
UPDATE agent_knowledge_items
SET content = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(content,
        '👥 12.000 pessoas/mês',
        '👥 12000 pessoas/mês'
      ),
      '📺 45.000 exibições/mês',
      '📺 45000 exibições/mês'
    ),
    '👥 8.500 pessoas/mês',
    '👥 8500 pessoas/mês'
  ),
  '📺 32.000 exibições/mês',
  '📺 32000 exibições/mês'
),
updated_at = NOW()
WHERE id = '0eee8178-bc38-44ed-899d-3f1205b41831';

-- 5. KNOWLEDGE ITEM: Como Formatar Lista - Inverter regra de separador
UPDATE agent_knowledge_items
SET content = REPLACE(content,
  'Números SEMPRE com separador de milhares: 14.400 (não 14400)',
  'Números SEM separador de milhares: 14400 (não 14.400) — evita quebra no WhatsApp'
),
updated_at = NOW()
WHERE id = 'f63482e3-ee96-44be-b703-4cb2c059d140';

-- 6. KNOWLEDGE ITEM: EXA Institucional - Clarificar rede nacional
UPDATE agent_knowledge_items
SET content = REPLACE(content,
  '📊 NÚMEROS:
• +500 prédios ativos
• +1.000 elevadores',
  '📊 NÚMEROS DA REDE NACIONAL:
• +500 prédios ativos (rede nacional)
• +1.000 elevadores (rede nacional)
• Em Foz do Iguaçu: [consultar banco para número exato]'
),
updated_at = NOW()
WHERE id = '31909338-ea89-4d2e-b900-d6564494aec3';

-- 7. KNOWLEDGE ITEM: Produto EXA - Clarificar rede nacional
UPDATE agent_knowledge_items
SET content = REPLACE(content,
  '• +500 pontos ativos',
  '• +500 pontos ativos (rede nacional) — Em Foz do Iguaçu: [consultar banco]'
),
updated_at = NOW()
WHERE id = '35e446d4-0931-4176-8129-fce6eb260b94';

-- 8. CRIAR NOVO KNOWLEDGE ITEM: Endereço e Contato Oficial da EXA
INSERT INTO agent_knowledge_items (
  agent_id,
  title,
  content,
  content_type,
  description,
  keywords,
  active
) VALUES (
  'sofia',
  'Endereço e Contato Oficial da EXA',
  '📍 ENDEREÇO E CONTATO DA EXA MÍDIA

🏢 ENDEREÇO COMPLETO:
Av. Paraná, 974 – Sala 301
Centro, Foz do Iguaçu – PR
CEP: 85852-000

📞 CONTATOS:
• WhatsApp: [número do WhatsApp]
• E-mail: contato@examidia.com.br
• Instagram: @examidia

🏢 CNPJ: [a ser fornecido]

💬 COMO A SOFIA DEVE RESPONDER:

Cliente: "Onde vocês ficam?"
Sofia: "Estamos na Av. Paraná, 974 – Sala 301, aqui no Centro de Foz 😊
Se quiser vir conhecer, é só avisar!"

Cliente: "Qual o endereço completo?"
Sofia: "Claro!

📍 Av. Paraná, 974 – Sala 301
Centro, Foz do Iguaçu – PR
CEP: 85852-000

Qualquer coisa, é só chamar aqui no WhatsApp também!"',
  'text',
  'Endereço físico completo da EXA, contatos oficiais e CNPJ para quando cliente solicitar',
  ARRAY['endereço', 'onde fica', 'localização', 'cnpj', 'contato', 'telefone', 'whatsapp', 'email'],
  true
);