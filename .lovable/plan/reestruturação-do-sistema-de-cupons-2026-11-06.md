# Reestruturação do sistema de cupons

## O que encontrei hoje (falhas reais)
1. **Sem restrição de produto**: o cupom vale igual para Horizontal e Vertical Premium.
2. **Sem restrição de prédios**: não dá para limitar o cupom a prédios ou quantidade.
3. **Uso contado em dobro**: soma +1 ao aplicar e +1 de novo por um gatilho automático — o limite acaba antes da hora.
4. **Valores em reais sem centavos**: "Preço final", "Desconto fixo" e "Valor por mês" são guardados como número inteiro (R$ 199,90 vira 199).
5. **Validação diferente em cada etapa**: tela do cliente, criação do pedido e conferência de preço usam regras diferentes (uma procura uma data de expiração com nome errado). Um cupom pode passar numa etapa e falhar em outra.
6. **Códigos fixos escondidos** ("573040" = pedido a R$ 0,05 e "CORTESIA_ADMIN" = 100%) aceitos na conferência de preço para qualquer pessoa — risco de fraude.
7. Uso por cliente conta pedidos cancelados e o uso não é devolvido de forma consistente.

## Tudo configurável por cupom
- **Produto**: Horizontal, Vertical Premium ou Ambos.
- **Prédios**, um modo por cupom:
  - Todos os prédios.
  - Prédios específicos escolhidos pelo admin — com opção: recusar se o cliente adicionar outros, ou dar desconto só nos prédios da lista.
  - Quantidade livre: admin define mínimo/máximo e o cliente escolhe quais.
  - Combinado: "escolha até 5 prédios entre estes 12".
- **Desconto**: percentual, valor fixo, preço final, valor por mês (com centavos).
- **Regras de uso**: limite total, limite por cliente, plano mínimo, valor mínimo, data de início e de expiração, ativo/inativo.

## Novo visual da tela do cupom
- Janela larga (quase tela cheia no computador, tela inteira no celular), estilo vidro no padrão moderno do site, vermelho EXA, sem botões verdes.
- Seções: **Identificação** · **Desconto** · **Produto** · **Prédios** (busca, marcar todos, contador) · **Regras de uso** · **Resumo ao vivo** fixo na lateral explicando como o cupom vai funcionar.
- Lista de cupons em cartões com selo de produto, prédios e usos.

## Regra única e segura
- Uma só verificação no servidor, usada pelo cliente, pela criação do pedido e pela conferência de preço, com motivo claro da recusa ("Este cupom vale só para Vertical Premium").
- Cada uso registrado uma única vez por pedido; cancelamento devolve o uso; recontagem dos usos atuais a partir dos pedidos reais.
- Remover os códigos fixos; cortesia segue só pelo fluxo de cortesia do super admin.
- Preço final sempre recalculado no servidor.
- Cupons existentes continuam iguais (Ambos + Todos os prédios).

## Depois do cupom (autorizado pelo Jeferson)
- Deploy da função nova `exa2-relatorio-pedido` (commit c6534d7), sem alterar código nem arquivos.
- Publicar o site (rotas /anunciante/relatorios e aba Relatório do pedido).

## Detalhes técnicos
- Migration em `cupons`: `tipo_produto` (default 'ambos'), `modo_predios` ('todos' | 'especificos' | 'quantidade' | 'combinado'), `predios_fora_da_lista` ('recusar' | 'desconto_parcial'), `valor numeric(12,2)` sincronizado com `desconto_percentual` para compatibilidade; validações por trigger. Nova `cupom_predios(cupom_id, building_id)` com GRANTs + RLS (super_admin gerencia). `cupom_usos` com unique(cupom_id, pedido_id).
- Nova `validate_coupon_v2(codigo, valor, meses, building_ids[], tipo_produto)` SECURITY DEFINER; `validate_coupon_secure`/`apply_coupon_secure` passam a usá-la; remover incremento duplicado; trigger de devolução no cancelamento.
- Frontend: formulário de /super_admin/cupons redesenhado, `useSecureCoupon`, `CouponStep` e criadores de pedido enviando prédios + produto.
- Edge functions afetadas: `validate-order-price`, `process-fidelity-checkout`, `exa2-cobranca` (não protegidas). Não toco em asaas-*, sofia-agent, clicksign-*.
- Testes, um por regra: produto errado recusa; prédio fora recusa (ou desconto parcial); quantidade fora do limite recusa; uso não conta em dobro; cancelamento devolve; centavos preservados.
