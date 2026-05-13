## Plano consolidado — Segurança (3 superfícies) + Filtros/Ordenação de Prédios

Duas frentes independentes nesta entrega. Nenhuma altera UX/funcionalidade fora do escopo.

---

## PARTE A — Refatoração de Segurança (3 superfícies públicas)

Endurecer 3 policies hoje abertas (`USING true`) sem quebrar fluxos públicos. **Garantia: zero exposição de dados de representante legal.**

### A1. `proposals` — propostas públicas por token
- Criar RPC `public.get_public_proposal(_token text)` `SECURITY DEFINER STABLE` retornando apenas a proposta cujo token bate, e apenas colunas necessárias para a página pública (sem CPF, sem dados internos).
- Substituir policy `SELECT USING true` por:
  - `super_admin`/`admin`/`comercial` via `has_role()`
  - `auth.uid() = user_id` (cliente dono)
  - Anônimo somente via RPC.
- Refatorar a página pública de proposta para usar `supabase.rpc('get_public_proposal', { _token })`.

### A2. `configuracoes_empresa` — split público vs sensível
- Criar RPC `public.get_public_company_info()` `SECURITY DEFINER STABLE` retornando APENAS: razão social, nome fantasia, CNPJ, endereço, telefones institucionais, e-mail institucional, website, instagram, foro. **NUNCA** `representante_cpf`, `representante_rg`, `representante_email`.
- Remover policy pública de `SELECT`. Manter `SELECT` apenas para `super_admin`/`admin` e `service_role` (Edge Functions de contrato).
- Refatorar `useCompanySettings` com 2 modos:
  - **Público (default):** chama RPC. Campos sensíveis ficam ausentes.
  - **Admin (`{ includeSensitive: true }`):** select direto na tabela (RLS bloqueia se não for admin).
- Auditar usos de `representante_cpf/rg/email` no frontend — só podem aparecer em telas admin ou PDFs server-side.

### A3. `painels` — pareamento sem expor credenciais
- Criar RPC `public.get_painel_pairing_info(_codigo_pareamento text)` retornando apenas campos seguros (id, nome, predio_id, status, código). **Sem** `senha_anydesk`, `token_acesso`, `ip`, `mac`.
- Remover policy `SELECT USING true`. Manter `SELECT` para `super_admin`/`admin`/`admin_marketing` e `service_role`.
- Atualizar páginas públicas (`PainelAguardandoVinculo`, `PublicBuildingDisplay`, monitor) para usar a RPC.

### Princípios de segurança
- Todas as funções `SECURITY DEFINER` + `SET search_path = public` + `STABLE`.
- `GRANT EXECUTE` apenas onde necessário (anon/authenticated).
- Nenhuma alteração em RLS de outras tabelas, edge functions ou fluxos administrativos.
- Validação pós-deploy: `supabase--linter`, testes manuais dos 3 fluxos públicos, e tentativa de leitura anônima de campos sensíveis (deve falhar).

---

## PARTE B — Filtros e Ordenação de Prédios (`/super_admin/predios`)

**Diagnóstico atual** (`BuildingsManagement3` + `BuildingsFilters3`):
- Só existe filtro por `status` (pills) e busca textual.
- Estado `filters` ainda carrega `bairro` e `padrao_publico`, mas a UI não os expõe.
- Sem ordenação configurável. Sem filtro de Airbnb. Sem indicação de "atualizado recentemente".

**Banco confirmado anteriormente:** não há `updated_at`; existem `local_updated_at` e `created_at`. Trigger de auto-update em `local_updated_at` precisa ser criado para a ordenação por edição funcionar de fato.

### B1. Migration (banco)
- `CREATE TRIGGER buildings_set_local_updated_at BEFORE UPDATE ON public.buildings FOR EACH ROW EXECUTE FUNCTION ...` que faz `NEW.local_updated_at = now()`. Garante que qualquer edição "sobe" o prédio para o topo.
- Função criada com `SECURITY DEFINER` + `SET search_path = public`.

### B2. Processor (`buildingsAdminProcessor.ts`)
- Incluir `local_updated_at` e `created_at` no objeto `AdminBuilding` retornado (hoje só `created_at`).

### B3. Filtros (revisão profissional — sem bairro)
Linha de filtros abaixo da busca, chips horizontais com scroll em mobile:
1. **Status** (pills atuais — mantém)
2. **Airbnb** — Todos / Com Airbnb / Sem Airbnb (`tem_airbnb`)
3. **Padrão de público** — Todos / Alto / Médio / Normal
4. **Painéis** — Todos / Com painéis ativos / Sem painéis
5. **Device** — Todos / Online / Offline / Sem device

Botão "Limpar filtros" aparece somente quando há filtro não-default. Removido filtro de bairro (irrelevante para ~23 prédios; a busca textual já cobre).

### B4. Ordenação
Dropdown "Ordenar por" no canto direito da barra de filtros:
- **Atualizado recentemente** (default) — `local_updated_at desc` (fallback `created_at`)
- **Mais recentes** — `created_at desc`
- **Nome (A→Z)**
- **Maior público estimado** — `publico_estimado desc`
- **Mais painéis ativos** — `paineis_ativos desc`

### B5. Realtime
- `useAdminBuildingsData` já escuta `postgres_changes` em `buildings`. Combinado com o trigger + ordenação default, qualquer edição move o prédio para o topo automaticamente.

### B6. Arquivos afetados (Parte B)
- 1 migration (trigger + função)
- `src/services/buildingsAdminProcessor.ts` (incluir `local_updated_at`)
- `src/components/admin/buildings/v3/BuildingsFilters3.tsx` (nova linha de filtros + dropdown sort)
- `src/pages/admin/BuildingsManagement3.tsx` (estado `sortBy`, lógica de filtro+sort, props novas)

**Não tocar:** `BuildingCard3`, modais, upload, trimmer, RLS de outras tabelas, fluxos comerciais.

---

## Ordem de execução
1. Parte A (segurança) — migration + refatorações de hooks/páginas públicas.
2. Parte B (filtros) — migration trigger + UI.
3. Validação final: linter + testes manuais.
