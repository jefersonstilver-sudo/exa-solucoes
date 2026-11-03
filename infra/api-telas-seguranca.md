# API das telas (AWS) — segurança (02/11/2026)

Servidor: EC2 `telas-indexa` (i-02ad9fcdbbf2d64aa, sa-east-1, IP 18.228.252.149), Ubuntu 24.04.
API: FastAPI em `/home/ubuntu/ServerIndexa/server.py`, serviço `telas-api` (porta 8000). Nginx na porta 80 (página padrão).
Acesso ao terminal: console AWS → EC2 → Conectar → EC2 Instance Connect (usuário `ubuntu`).

## Chave de escrita
- O `server.py` tem o middleware `_exa_chave_escrita` (bloco "EXA seguranca"). Backup do original: `server.py.bak_20261102`.
- Escrita (POST/PUT/PATCH/DELETE) confere o header `x-exa-key` contra `config/exa_api_key` (chmod 600).
- `config/exa_api_modo`:
  - `observar` (atual): chamada sem chave passa e fica no log como `[EXA-CHAVE] sem chave: ... ip=... ua=...`;
  - `exigir`: chamada sem chave recebe 401.
  - Trocar o modo não precisa reiniciar (o arquivo é lido a cada chamada).
- Livre de chave: `/geral/confirm-update/` (os NUCs chamam) e toda leitura (GET).
- No Supabase a chave fica em `exa2_config.aws_api_key`. As funções que escrevem na API importam `_shared/aws-chave.ts`, que acrescenta o header.
- Ver quem ainda escreve sem chave:
  `sudo journalctl -u telas-api --since '-24h' -o cat | grep EXA-CHAVE | awk '{print $4,$5,$6}' | sort | uniq -c | sort -rn`

## Antes de passar para `exigir`
1. Sofia: feito em 02/11 (v110 manda `x-exa-key` no DELETE).
2. As automações do computador do Jeferson (`C:\Users\jefer\exa-solucoes\scripts\noticias-dooh`, `cinema-dooh`) NÃO falam direto com a API: entram no site com e-mail e senha (puppeteer) e usam as funções do Supabase (`delete-video-from-external-api`, `exa2-agenda-sync`, RPC `safe_set_base_video`), que já mandam a chave. As escritas diretas do IP 177.71.x (casa/escritório) parecem testes manuais; depois do `exigir` passam a receber 401.
3. Ficar alguns dias sem nenhuma linha `[EXA-CHAVE]` que não seja conhecida.
4. `printf exigir > /home/ubuntu/ServerIndexa/config/exa_api_modo` e conferir as funções e as telas.

## Firewall (security group sg-0cae1a1e632bb59de)
- Porta 22: só 18.228.70.32/29 (EC2 Instance Connect sa-east-1) e 54.232.160.240/32. Antes era o mundo inteiro (~280 tentativas de invasão por semana).
- Portas 8000, 80 e 443 seguem abertas (as telas e as funções usam a 8000 por HTTP).
- Próximo passo: domínio `api.examidia.com.br` com HTTPS no nginx e mover os chamadores; depois fechar a 8000 para o mundo.

## Captcha (decisão de 02/11)
Os robôs de notícias e do Cine Cataratas fazem login no site com e-mail e senha num navegador automático. Captcha na tela de login ou o captcha do Supabase Auth (que vale para login, cadastro e troca de senha de uma vez) quebraria esses robôs e o `verify-report-access`. Por isso o Turnstile vai só no cadastro, no formulário de síndico e na recuperação de senha, conferido por função do servidor com o segredo `TURNSTILE_SECRET_KEY` (o Jeferson cola em Edge Functions → Secrets).
