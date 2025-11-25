-- Corrigir Knowledge Item "Template WhatsApp" - Remover quebras de linha e corrigir formatação
UPDATE agent_knowledge_items
SET 
  content = '📋 TEMPLATE DE APRESENTAÇÃO DE PRÉDIOS

SEMPRE usar este formato ao mostrar prédios:

🏢 [NOME DO PRÉDIO]
👥 Público: [público_estimado] pessoas/mês | Exibições: [visualizacoes_mes]/mês
💰 R$ [preco_base]/mês

✅ EXEMPLO CERTO:
"Tenho 3 ótimos pontos em Moema:

🏢 Edifício Gran Moema
👥 Público: 12000 pessoas/mês | Exibições: 4500/mês
💰 R$ 1200/mês

🏢 Residencial Ibirapuera Park
👥 Público: 8500 pessoas/mês | Exibições: 3200/mês
💰 R$ 950/mês

Qual te interessa mais?"

❌ ERRADO:
- Quebrar linha no meio (ex: "pessoas/mês" em linha separada)
- Usar separador de milhares (14.400 ou 14 400)
- Usar asteriscos (*texto*)

🚨 REGRAS CRÍTICAS:
• TUDO em uma linha: "Público: X pessoas/mês | Exibições: Y/mês"
• Números SEM separador: 14400 (não 14.400, não 14 400)
• Máximo 5 prédios por mensagem
• Se status = "instalação", adicionar "(em instalação)" após o nome',
  updated_at = now()
WHERE id = '0eee8178-bc38-44ed-899d-3f1205b41831';