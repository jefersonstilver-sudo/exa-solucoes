# Conectar Notion API (somente leitura) para futuro catálogo online de prédios

## Contexto
Você vai criar um **catálogo de prédios online** (HTML virá depois). Antes disso, precisamos garantir que eu enxergo 100% da base oficial do Notion ("Prédios Painéis", data source `1d6f9e03-8d81-8129-a48d-000beff05020`).

## Escopo desta etapa — APENAS LEITURA
- **NÃO mexer** em `buildings`, `panels`, ou qualquer tabela do Supabase.
- **NÃO criar** páginas, componentes ou rotas no app EXA.
- **NÃO sincronizar** dados do Notion para o Supabase.
- Esta etapa é puramente diagnóstica para o futuro catálogo.

## Passos

1. **Abrir caixa de secret** para você colar o `NOTION_API_KEY` (Internal Integration Token).
   - Você gera em: https://www.notion.so/profile/integrations → "New internal integration"
   - Compartilha a página "Base de prédios oficial" com a integração (botão `...` → Connections)

2. **Script de leitura** (`/tmp/notion_read.py`) executado uma única vez:
   - Pagina `POST /v1/data_sources/{id}/query` (todos os status, sem filtro)
   - Conta totais por `Status` (Interesse, Ativo, Primeira Reunião, Conselho, Instalação Internet, Instalação Painel, OFFLINE, INATIVO, etc.)
   - Lista campos disponíveis por prédio (nome, endereço, síndico, contato, fotos, etc.)

3. **Saída em `/mnt/documents/`** (apenas arquivos, zero impacto no app):
   - `notion_inventario.json` — dump completo bruto
   - `notion_resumo.md` — contagens por Status + amostra de 3 prédios para você confirmar que estou vendo tudo certo

4. **Confirmação com você** antes de qualquer próximo passo. Você manda o HTML do catálogo depois.

## Garantia
Nenhum arquivo do projeto EXA será criado ou modificado nesta etapa. Sem migrations, sem edge functions, sem mudanças de UI.
