

# Plano: Device status e visibilidade do COMERCIAL TABLET

## Esclarecimentos

### 1. "Não conectado" vs "Online"
Isso é **correto e esperado**. O badge mostra o status do **dispositivo físico** (computador/tablet) vinculado ao prédio na tabela `devices`. "Não conectado" significa que nenhum dispositivo foi vinculado àquele prédio (não existe registro em `devices` com `building_id` apontando para ele). "Online" significa que há um dispositivo vinculado e ele está reportando como ativo. Para que todos apareçam como "Online", é necessário vincular um dispositivo a cada prédio no módulo de monitoramento/AnyDesk.

### 2. COMERCIAL TABLET na loja pública
O prédio está com status `ativo`, então a RPC `get_buildings_for_public_store` **já o retorna**. Ele deveria aparecer na loja. Se não está aparecendo visualmente, pode ser porque:
- Não tem `imagem_principal` (a foto aparece vazia na screenshot) — o card da loja pode renderizar sem destaque
- Tem `quantidade_telas = 0`, `publico_estimado = 0`, `preco_base = 0` — pode estar sendo renderizado mas sem dados visíveis

**O prédio JÁ aparece na loja se está como `ativo`** — a RPC não filtra por imagem. Mas se o objetivo é que ele seja **apenas interno** (uso administrativo, sem aparecer na loja), o status correto é `interno`.

### Sem mudança de código necessária

A lógica já está correta:
- `ativo` → aparece na loja pública E no admin
- `interno` → aparece APENAS no admin, agendamentos, manutenções
- `Não conectado` → nenhum dispositivo físico vinculado (vincular no módulo AnyDesk/Monitoramento)

Se você quer que o COMERCIAL TABLET **não apareça na loja**, mude o status para `interno`. Se quer que apareça, mantenha como `ativo` e adicione foto + dados (preço, telas, público).

