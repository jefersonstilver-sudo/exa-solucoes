
Diagnóstico confirmado: o erro mudou de causa.

1. O bucket `videos` já está correto:
- `public = true`
- `file_size_limit = 104857600` (100MB)
Então o problema não é mais a configuração do bucket.

2. O erro atual vem do método de upload usado no frontend:
- `src/pages/admin/VideosSitePage.tsx`
- hoje o arquivo usa `supabase.storage.from(bucket).upload(...)`
- o log mostra `413 Payload too large / The object exceeded the maximum allowed size`
- a documentação do Supabase recomenda não usar o upload padrão para arquivos maiores; para vídeo, o caminho correto é upload resumable via TUS

3. O que isso significa na prática:
- o frontend está validando 100MB
- o bucket aceita 100MB
- mas o transporte atual do upload continua falhando para vídeo maior porque o endpoint/método padrão não é o adequado para esse tamanho
- por isso o mesmo erro continua aparecendo mesmo após o ajuste no bucket

Plano de correção

Etapa 1 — trocar o upload da `VideosSitePage` para upload resumable
- arquivo: `src/pages/admin/VideosSitePage.tsx`
- substituir o fluxo atual de `.upload(...)` por TUS resumable upload
- usar o endpoint direto de storage:
  `https://{project-id}.storage.supabase.co/storage/v1/upload/resumable`
- autenticar com o token atual da sessão Supabase
- manter o mesmo bucket (`videos`) e o mesmo path por pasta (`homepage`, etc.)

Etapa 2 — adicionar a dependência necessária
- arquivo: `package.json`
- adicionar `tus-js-client`
- usar progresso real do upload em vez do progresso simulado atual

Etapa 3 — preservar o comportamento existente
- continuar:
  - validando tipo `video/*`
  - limitando a 100MB no client
  - gerando nome único do arquivo
  - obtendo `publicUrl` ao final
  - atualizando os mesmos estados (`homeVideoUrl`, `homeHorizontalUrl`, etc.)
- não alterar a lógica de salvar configurações no banco

Etapa 4 — melhorar a resiliência da tela
- remover a simulação fake de progresso do upload atual
- exibir progresso real do TUS
- tratar cancelamento/erro com mensagem mais clara:
  - erro de autenticação
  - erro de limite
  - erro de rede
  - erro de retomada

Etapa 5 — validação após implementação
- testar upload do mesmo vídeo que falhou
- testar pelo menos:
  - vídeo pequeno
  - vídeo médio
  - vídeo próximo do limite
- confirmar que a URL pública é gerada e que “Salvar Configurações” continua funcionando

Arquivos que eu pretendo alterar
1. `package.json`
2. `src/pages/admin/VideosSitePage.tsx`

Resumo objetivo:
- o bucket já está certo
- o problema agora é o método de upload
- a correção correta é migrar de upload padrão para upload resumable (TUS) na `VideosSitePage`
