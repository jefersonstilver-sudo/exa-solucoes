
Diagnóstico da auditoria (causa raiz)

1) Existem 3 fluxos diferentes de “salvar” no mesmo contexto:
- `CompanyBrandSection` → botão **Salvar tamanho** (`handleLogoScaleSave`): salva só `logo_scale`.
- `CompanyBrandSection` → botão **Salvar Empresa** (`handleSave`): salva dados da empresa + `logo_scale`.
- `AdvertiserSettings` (topo) → botão **Salvar Alterações** (`handleSave`): salva nome/telefone/notificações, mas **não salva o valor atual do slider**.

2) O valor do slider (`logoScale`) é estado local do `CompanyBrandSection`.
- Quando você move o slider, ele cresce na hora (preview local).
- Se você clicar no botão do topo (**Salvar Alterações**) sem persistir a escala por um dos saves do bloco da empresa, o valor atual do slider não é gravado nesse fluxo.

3) Após salvar no topo, acontece recarregamento de perfil:
- `refreshUserProfile()` no `AdvertiserSettings` dispara atualização.
- Isso aciona `loadUserSettings()` e provoca ciclo de re-render/loading.
- O `CompanyBrandSection` volta a carregar do dado persistido em `auth.user_metadata.logo_scale` (valor antigo).
- Resultado visual: “volta a ficar pequenininha”.

Evidência objetiva da sessão
- No log de rede, o `PUT /auth/v1/user` do botão de topo enviou:
  `{"data":{"name":"...","phone":"...","notifications":{...}}}`
  sem `logo_scale`.
- Portanto, nesse caminho, o tamanho atual do slider não foi persistido.

Plano de correção (sem alterar fluxos não relacionados)

1) Unificar persistência da escala no save principal de configurações
- Em `AdvertiserSettings.handleSave`, incluir `logo_scale` no `supabase.auth.updateUser({ data: ... })`.
- Isso garante que clicar em **Salvar Alterações** preserve exatamente o tamanho visto no preview.

2) Unificar estado da escala para evitar divergência
- Tornar `logoScale` “fonte única” no nível de `AdvertiserSettings` e passar para `CompanyBrandSection` via props (valor + onChange), ou manter no filho com callback explícito para o pai.
- Objetivo: qualquer save use o mesmo valor atual.

3) Robustez de leitura
- Onde carregar `logo_scale`, aceitar `number` e `string`, com clamp `0.5..3`.
- Evita fallback silencioso para `1` em cenários de tipagem inconsistente.

4) Preservar UX atual
- Não mudar layout nem fluxo fora deste problema.
- Manter botão “Salvar tamanho” se desejado, mas alinhado ao mesmo estado/fonte de verdade do save principal.

Validação pós-ajuste

- Ajustar logo para 300% e clicar **Salvar Alterações** (topo) → deve permanecer grande imediatamente.
- Recarregar página `/anunciante/configuracoes` → escala deve continuar igual.
- Ir para `/anunciante/pedidos` → header deve refletir a mesma escala.
- Repetir com 50%, 100%, 300%.
