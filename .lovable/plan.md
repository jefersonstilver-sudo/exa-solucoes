# Diagnóstico: site não carrega conteúdo

## O que foi verificado agora

- A API de dados do Supabase (PostgREST) está **fora do ar em todo o projeto**:
  `GET /rest/v1/logos` responde **503 / PGRST002 – "Could not query the database for the schema cache. Retrying."**
  O mesmo erro aparece em qualquer tabela, não é específico das logos.
- A Edge Function `logos` devolve 500 com exatamente esse mesmo detalhe — por isso o rodapé fica em "Carregando logos...".
- Como toda leitura de dados passa por essa API, **nenhum conteúdo dinâmico carrega** (logos, prédios, loja, login).
- O banco em si está saudável: 25 de 60 conexões em uso, sem locks presos.
- Os vídeos da home respondem normalmente (HTTP 206 no Storage) — o Storage não depende do PostgREST. O quadro preto com spinner é outro problema: o vídeo vertical do desktop tem **77 MB** e demora a exibir o primeiro frame.

## Causa provável do PGRST002

O papel `authenticator` (usado pelo PostgREST) está com limites muito curtos aplicados no banco:

```
authenticator → statement_timeout = 8s, lock_timeout = 8s
```

Na inicialização o PostgREST executa uma consulta pesada de introspecção do schema (aqui: 291 tabelas/views e 3.726 colunas em public/storage/graphql_public). Com o teto de 8 s essa consulta é abortada, o cache de schema nunca é montado e todas as requisições passam a falhar com PGRST002. Esses limites não vêm de nenhuma migration do repositório — foram aplicados direto no banco.

## Correção proposta

1. **Migration**: remover o teto de introspecção do papel de conexão do PostgREST
   - `ALTER ROLE authenticator SET statement_timeout = '120s';`
   - `ALTER ROLE authenticator SET lock_timeout = '30s';`
   - manter `anon` (3s) e `authenticated` (8s) como estão — são os limites que protegem as consultas dos usuários; o `authenticator` só faz o handshake e a introspecção.
   - `NOTIFY pgrst, 'reload schema';` para forçar a recarga imediata do cache.
2. **Validar**: repetir `GET /rest/v1/logos` e a Edge Function `logos` e confirmar 200; conferir a home carregando logos e a loja.
3. Se o 503 persistir depois da recarga, o passo seguinte é reiniciar o projeto no painel do Supabase (Settings > General > Restart project) e reavaliar — nesse caso o problema é do serviço PostgREST em si, não da configuração.

## Item secundário (só se você aprovar)

O vídeo vertical da home tem 77 MB e é carregado com `preload="auto"`, o que gera o retângulo preto com spinner por vários segundos em conexões medianas. Opções: gerar uma versão comprimida do arquivo, ou exibir um poster (primeiro frame) enquanto o vídeo carrega. Nada disso será alterado sem sua confirmação.

## Escopo

Somente a migration acima. Nenhuma alteração de UI, fluxo ou funcionalidade existente.
