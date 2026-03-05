
Objetivo: corrigir definitivamente a logo “corrompida” no card de “Meus Pedidos” sem alterar fluxos não relacionados.

1) Diagnóstico confirmado (causa raiz)
- O campo `users.avatar_url` está salvo com URL `.../storage/v1/object/public/arquivos/...`.
- O bucket `arquivos` está com `public=false` (privado).
- Resultado: URL pública direta falha (404/403), então o `<img>` quebra e aparece texto alternativo (“Logo da empresa”), parecendo “logo corrompida”.

Mapa do problema (fim a fim):
```text
Upload da logo -> salva URL em avatar_url (object/public/arquivos/...)
-> página Meus Pedidos usa essa URL crua
-> bucket privado não entrega imagem
-> img quebrada no header
```

2) Correção proposta (escopo mínimo e direto)
Vamos manter o upload como está e corrigir somente a resolução da URL no “Meus Pedidos”:

A. `src/pages/advertiser/AdvertiserOrders.tsx`
- Criar uma etapa de “resolução segura” da logo antes de enviar ao header.
- Usar `useLogoImageUrl` para gerar signed URL quando a origem for `arquivos` (bucket privado).
- Preservar variante `#original` (quando existir) no URL final, para não quebrar a lógica de filtro visual.
- Continuar com fallback para `userProfile?.avatar_url` caso dados da empresa não venham.

B. `src/components/advertiser/orders/AdvertiserDashboardHeader.tsx`
- Adicionar fallback robusto de renderização:
  - Se `img` falhar (`onError`), mostrar inicial da empresa/usuário (em vez de ícone quebrado/alt).
- Manter hover sofisticado já aplicado (scale/shadow/ring), agora visível porque a imagem passa a carregar.

C. `src/components/settings/CompanyBrandSection.tsx` (ajuste preventivo relacionado)
- Ajustar regex de extração de `storage_key` ao recarregar dados para também parar em `#`:
  - de `(\?|$)` para `(\?|#|$)`.
- Isso evita chave inválida quando a URL contém `#original`, prevenindo futuras quebras da mesma natureza.

3) Detalhes técnicos
- Não haverá mudança de layout estrutural nem fluxo de upload.
- Não haverá migração de banco.
- A solução é compatível com:
  - logo comum (branca CSS),
  - logo original (`#original`),
  - URLs externas já públicas.
- A correção é retrocompatível com logos já salvas no banco.

4) Validação (E2E)
- Testar no fluxo real:
  1. Abrir “Minha Conta” e confirmar logo atual visível.
  2. Ir para “Meus Pedidos” e verificar logo carregada corretamente (sem ícone quebrado).
  3. Passar mouse sobre a logo e validar efeito suave (scale/shadow/ring).
  4. Trocar logo e repetir teste.
  5. Testar variante original (quando aplicável) para garantir que não aplica filtro branco indevido.

5) Impacto e risco
- Impacto: apenas rendering da logo no card de “Meus Pedidos” e robustez de parsing no settings.
- Risco baixo: mudanças localizadas em 2–3 arquivos, sem alterar regras de negócio, pedidos, pagamentos ou autenticação.
