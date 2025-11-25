-- Atualizar knowledge items com formato UNIFICADO E SIMPLES

-- 1. Atualizar "Template WhatsApp - Apresentação de Prédios"
UPDATE agent_knowledge_items
SET content = '📋 TEMPLATE DE APRESENTAÇÃO DE PRÉDIOS

SEMPRE usar este formato ao mostrar prédios:

🏢 [NOME DO PRÉDIO]
👥 Público: [público_estimado] pessoas/mês | Exibições: [visualizacoes_mes]/mês
💰 R$ [preco_base]/mês

✅ EXEMPLO CERTO:
"Tenho 3 ótimos pontos em Moema:

🏢 Edifício Gran Moema
👥 Público: 12000 pessoas/mês | Exibições: 45000/mês
💰 R$ 1200/mês

🏢 Residencial Ibirapuera Park
👥 Público: 8500 pessoas/mês | Exibições: 32000/mês
💰 R$ 950/mês

Qual te interessa mais?"

❌ ERRADO:
Listar sem formato ou só nome dos prédios

🚨 REGRAS:
• Máximo 5 prédios por mensagem
• Sempre perguntar depois
• Endereço completo só se pedir
• Números SEM separador de milhares: 14400 (não 14.400)
• Se status = "instalação", adicionar "(em instalação)" após o nome',
updated_at = now()
WHERE id = '0eee8178-bc38-44ed-899d-3f1205b41831';

-- 2. Atualizar "Como Formatar: Lista de Prédios por Exibições"
UPDATE agent_knowledge_items
SET content = '**Formato de apresentação - OBRIGATÓRIO:**

ATENÇÃO: Você DEVE seguir EXATAMENTE este formato.

REGRAS CRÍTICAS DE FORMATAÇÃO:

1. **Para lista de múltiplos prédios:**
   - Um prédio por bloco, com linha em branco entre cada prédio
   - Use emojis: 🏢 👥 💰
   - Números SEM separador de milhares: 14400 (não 14.400) — evita quebra no WhatsApp
   - Preço formatado: R$ 254/mês
   
2. **Estrutura exata por prédio:**
🏢 [Nome do Prédio]
👥 Público: [publico_estimado] pessoas/mês | Exibições: [visualizacoes_mes]/mês
💰 R$ [preco_base]/mês

(linha em branco entre prédios)

3. **Ordem de apresentação:**
- SEMPRE ordenar por visualizacoes_mes (maior → menor)
- Máximo 5 prédios por mensagem

4. **Finalizar com:**
- Call-to-action
- Exemplo: "💬 Quer detalhes sobre algum prédio específico?"

⚠️ NUNCA misture campos na mesma linha de forma confusa
⚠️ NUNCA quebre números no meio (ex: "14." em uma linha e "400" em outra)
⚠️ Se status = "instalação", adicionar "(em instalação)" após o nome',
updated_at = now()
WHERE id = 'f63482e3-ee96-44be-b703-4cb2c059d140';