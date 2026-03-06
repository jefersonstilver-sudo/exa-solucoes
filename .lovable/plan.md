
Objetivo
Corrigir o header de “Meus Pedidos” para que a logo respeite a configuração de escala salva no perfil (até 300%), sem alterar fluxos não relacionados.

Diagnóstico
- O controle de escala já existe em `CompanyBrandSection` e é salvo em `auth.user_metadata.logo_scale`.
- O componente selecionado (`src/components/advertiser/orders/AdvertiserDashboardHeader.tsx`, linha do `<img>`) recebe apenas `logoUrl`; ele não recebe nem aplica `logo_scale`.
- Resultado: a configuração funciona no perfil, mas não “acompanha” no header do dashboard.

Plano de implementação
1) Propagar a escala para o header (fonte de dados correta)
- Arquivo: `src/pages/advertiser/AdvertiserOrders.tsx`
- Ler `logo_scale` do usuário autenticado (metadata), normalizar e aplicar fallback seguro:
  - aceitar `number` (e `string` numérica por segurança),
  - limitar entre `0.5` e `3`,
  - default `1`.
- Passar a escala como prop para `AdvertiserDashboardHeader` (ex.: `logoScale={resolvedLogoScale}`).

2) Aplicar escala apenas na imagem da logo
- Arquivo: `src/components/advertiser/orders/AdvertiserDashboardHeader.tsx`
- Adicionar prop opcional `logoScale?: number` (default `1`).
- Aplicar `transform: scale(logoScale)` na camada da imagem (não no bloco vermelho).
- Manter o container vermelho com tamanho fixo (não escalar fundo).
- Ajustar overflow para permitir o crescimento visual da logo sem cortar quando necessário (seguindo o comportamento já adotado no preview de configuração).

3) Preservar comportamentos existentes
- Manter fallback de inicial quando não há logo.
- Manter lógica `#original` (não inverter quando marcado).
- Não alterar layout/fluxos fora do header de pedidos.

Detalhes técnicos (seção técnica)
- Fonte de verdade da escala: `auth.user_metadata.logo_scale` (já usada no perfil).
- Normalização recomendada:
  - `raw = user?.user_metadata?.logo_scale`
  - `scale = clamp(parseFloat(raw), 0.5, 3)` quando válido
  - fallback `1`
- Aplicação visual:
  - escala no elemento de imagem (ou wrapper imediato da imagem),
  - container vermelho permanece `w-20 h-20` / `sm:w-24 sm:h-24` fixo.
- Compatibilidade:
  - sem migration de banco,
  - sem alteração em upload/signed URL.

Validação
1. Em `/anunciante/configuracoes`, ajustar para 300% e salvar.
2. Abrir `/anunciante/pedidos` e confirmar que a logo do header aumenta em tempo real conforme valor salvo (não o fundo vermelho).
3. Testar 50%, 100%, 300% para conferir consistência visual.
4. Recarregar a página e confirmar persistência da escala.
5. Validar caso com `#original` para garantir que as cores continuam corretas.

Arquivos envolvidos
- `src/pages/advertiser/AdvertiserOrders.tsx` (passagem da escala)
- `src/components/advertiser/orders/AdvertiserDashboardHeader.tsx` (aplicação visual da escala na logo)
