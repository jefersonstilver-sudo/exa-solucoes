## Diagnóstico

O `/catalogo` lê os dados do **Notion** (edge function `catalogo-predios`), enquanto o admin lê da tabela `buildings` do Supabase. Por isso a flag Airbnb está dessincronizada.

No Notion temos **21 prédios marcados com Airbnb**. Cruzando por nome com os prédios `ativo` / `instalacao` da nossa tabela `buildings`, **3 já estão corretos** (Residencial Miró, Riverside, Royal Legacy) e **4 estão faltando** ser marcados:

| Nome no admin | Status | Equivalente no Notion |
|---|---|---|
| Condomínio Cheverny | ativo | Condomínio Edifício Cheverny |
| Foz Residence | ativo | Edifício Foz Residence |
| Saint Peter | ativo | Condomínio Residencial Saint Peter |
| Omoiru | instalação | Omoiru |

Os demais marcados no Notion são `interesse` (não estão no admin como ativo/instalação) ou variantes/torres ainda não cadastradas separadamente no admin (ex.: "Cheverny 2", "Riverside Residence 2", "Royal Legacy 2/3"). Esses **não** serão tocados — apenas se você pedir explicitamente para criar/desdobrar.

## O que será feito

1. `UPDATE buildings SET tem_airbnb = true WHERE id IN (...)` para os 4 IDs acima.
   - IDs: `f5207451-fa43-4a38-8fac-f6e62c56ca6e` (Cheverny), `6e3e0e94-28ca-40ad-bc79-bbe301a0400f` (Foz Residence), `bc17603b-5013-406f-9da8-243f7aa2d737` (Saint Peter), `df70a9c6-7883-4a83-8d8a-e40e1bb0a43d` (Omoiru).
2. Nada mais é alterado: sem mudanças em UI, filtros, RLS, edge functions, ou em qualquer outro prédio.
3. Após a atualização o pill "Com Airbnb" no `/super_admin/predios` passará a contar **7** (3 atuais + 4 novos).

## Fora do escopo (não será feito sem ok explícito)

- Criar prédios novos para "Cheverny 2", "Riverside Residence 2", "Royal Legacy 2/3".
- Marcar prédios em status `interesse`/leads.
- Sincronização automática Notion → Supabase (pode ser proposta depois como rotina).
