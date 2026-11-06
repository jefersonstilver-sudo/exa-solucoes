# Reestruturação do sistema de cupons

## O que encontrei hoje (falhas reais)
1. **Sem restrição de produto**: o cupom vale igual para Horizontal e Vertical Premium.
2. **Sem restrição de prédios**: não dá para limitar o cupom a alguns prédios.
3. **Uso contado em dobro**: o cupom soma +1 quando é aplicado e soma +1 de novo por um gatilho automático — o limite de usos acaba antes da hora.
4. **Valores em reais guardados como número inteiro**: "Preço final", "Desconto fixo" e "Valor por mês" perdem os centavos (R$ 199,90 vira 199).
5. **Validação diferente em cada lugar**: a tela do cliente, a criação do pedido e a conferência de preço usam regras diferentes (uma olha "data_expiracao", que nem existe; a data real é "expira_em"). Um cupom pode passar numa etapa e falhar em outra.
6. **Códigos fixos escondidos no sistema** ("573040" = pedido a R$ 0,05 e "CORTESIA_ADMIN" = 100%) aceitos para qualquer pessoa na conferência de preço — risco de fraude.
7. Uso por usuário conta pedidos cancelados e o cupom não é devolvido de forma consistente.

## Como vai ficar

### Tela "Editar/Novo Cupom" (super admin)
Novos campos, mantendo os atuais:
- **Tipo de produto**: Horizontal, Vertical Premium ou Ambos.
- **Prédios**: "Todos os prédios" ou "Prédios específicos" (lista com busca e marcar vários). Opção extra: "o pedido precisa conter só esses prédios" ou "o desconto vale só sobre esses prédios".
- **Data de início** (já existe no banco, passa a aparecer).
- Valores em reais aceitam centavos.
- Resumo ao final: "Vale para Vertical, 3 prédios, planos de 3+ meses, até 31/12".

### Uma única regra de validação (no banco)
Uma função só, usada pela tela do cliente, pela criação do pedido e pela conferência de preço, que confere tudo de uma vez:
ativo, início/expiração, limite total, limite por cliente (só pedidos não cancelados), plano mínimo, valor mínimo, quantidade de prédios, **tipo de produto**, **prédios permitidos**. Devolve o motivo exato da recusa em português ("Este cupom vale só para Vertical Premium").

### Uso do cupom à prova de erro
- Registro de cada uso numa tabela própria, com trava para não contar duas vezes o mesmo pedido.
- Contagem feita num único ponto; gatilho duplicado removido.
- Cancelamento do pedido devolve o uso automaticamente.
- Recontagem dos usos atuais a partir dos pedidos reais (corrige números inflados).

### Segurança
- Remover os códigos fixos "573040" e "CORTESIA_ADMIN" da conferência de preço; cortesia continua só pelo fluxo de cortesia do super admin.
- O preço final é sempre recalculado no servidor; o valor enviado pela tela não é confiado.
- Cupons existentes continuam valendo como hoje (Ambos + Todos os prédios).

## Detalhes técnicos
- Migration: colunas em `cupons` — `tipo_produto text default 'ambos'` (validação por trigger), `escopo_predios text default 'todos'`, `valor numeric(12,2)` (copiado de `desconto_percentual`, mantido em sincronia para compatibilidade); nova tabela `cupom_predios(cupom_id, building_id)` com GRANTs + RLS (super_admin gerencia, leitura via função); `cupom_usos` com unique(cupom_id, pedido_id).
- Nova `validate_coupon_v2(p_codigo, p_valor, p_meses, p_building_ids uuid[], p_tipo_produto)` SECURITY DEFINER; `validate_coupon_secure`/`apply_coupon_secure` passam a chamá-la; remover incremento duplicado (manter um só); trigger de devolução no cancelamento; script de recontagem.
- Frontend: formulário do cupom em /super_admin/cupons, `useSecureCoupon`, `CouponStep`, criadores de pedido passam prédios + tipo de produto.
- Edge functions afetadas (pedirei confirmação, não são protegidas): `validate-order-price`, `process-fidelity-checkout`, `exa2-cobranca`. **Não toco** em asaas-*, sofia-agent, clicksign-*.
- Testes: um por regra (produto errado recusa, prédio fora recusa, limite não conta em dobro, cancelamento devolve, centavos preservados).

## Pergunta em aberto
Quando o cupom é de "prédios específicos" e o cliente escolhe prédios a mais: recusar o cupom, ou aplicar o desconto só nos prédios permitidos? (Proponho recusar por padrão, com a opção configurável no cupom.)
