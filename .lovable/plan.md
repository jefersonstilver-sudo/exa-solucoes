

# Central de Notas e Acompanhamento - Upgrade Completo

## Objetivo

Transformar o sistema de notas em uma central completa de registros com gravacao de audio + transcricao automatica (Whisper), anexo de arquivos, tipos categorizados, e painel compacto na aba principal (Visao Geral) do contato. Tudo conectado com dados reais.

## 1. Migracao de Banco de Dados

Adicionar 3 colunas na tabela `contact_notes`:

| Coluna | Tipo | Default | Descricao |
|--------|------|---------|-----------|
| `note_type` | `text` | `'text'` | Tipo: text, audio, meeting, call, file |
| `audio_url` | `text` | `NULL` | URL do audio gravado no Storage |
| `attachment_url` | `text` | `NULL` | URL do arquivo anexado |

Criar o bucket `contact-attachments` no Supabase Storage (publico, com policy de upload autenticado).

## 2. Atualizar tipo ContactNote

**Arquivo: `src/types/contatos.ts`**

Adicionar os 3 campos novos na interface `ContactNote`:
- `note_type?: 'text' | 'audio' | 'meeting' | 'call' | 'file'`
- `audio_url?: string`
- `attachment_url?: string`

## 3. Reescrever TabNotas.tsx - Central Completa

O componente atual e basico (so texto + importante). Sera reescrito para incluir:

### Formulario de Nova Nota

```text
+-----------------------------------------------------+
| Nova Nota                                            |
|                                                      |
| Tipo: [Texto] [Audio/Reuniao] [Ligacao] [Arquivo]   |
|                                                      |
| [Textarea para o conteudo...]                        |
|                                                      |
| [Mic Gravar]  [Clip Anexar]                          |
|                                                      |
| Se gravando: [00:15 Gravando...] [Parar] [Cancelar] |
| Se transcrevendo: [Spinner Transcrevendo...]         |
| Se audio pronto: [Player] + texto transcrito         |
| Se arquivo anexo: [nome.pdf - 2MB] [X remover]      |
|                                                      |
| [Estrela Importante]           [Adicionar Nota]      |
+-----------------------------------------------------+
```

### Funcionalidades:

- **Tipo de nota**: Toggle entre texto, audio/reuniao, ligacao, arquivo
- **Gravacao de audio**: Reutilizar o hook `useVoiceRecorder` existente para gravar, upload para Storage e transcrever via edge function `transcribe-audio` (Whisper)
- **Anexo de arquivo**: Upload de PDF/imagem/planilha para o bucket `contact-attachments`
- **Transcricao automatica**: Audio transcrito pelo Whisper, texto inserido automaticamente no campo de conteudo
- **Marcar como importante**: Toggle de estrela antes de salvar

### Timeline de Notas

Cada nota exibe:
- Badge colorido do tipo (Texto, Audio, Reuniao, Ligacao, Arquivo)
- Conteudo textual da nota
- Player de audio inline se `audio_url` existir
- Link/preview do arquivo se `attachment_url` existir
- Quem criou (email) + tempo relativo
- Botoes de estrela e excluir

## 4. Painel Compacto de Notas na TabVisaoGeral

**Arquivo: `src/components/contatos/detalhe/TabVisaoGeral.tsx`**

Adicionar entre o card "Canal de Entrada" e "Dados Pessoais" um card compacto "Notas e Atualizacoes Recentes" que:

- Busca as 3 notas mais recentes do contato via `contact_notes`
- Mostra cada nota com badge de tipo, preview do conteudo (truncado), autor e tempo
- Notas importantes aparecem com destaque amarelo
- Formulario inline simplificado: textarea + botao para adicionar nota rapida
- Botao "Ver todas as notas" que indica a aba Notas

## 5. Integracao com useVoiceRecorder

O hook ja existente (`src/hooks/useVoiceRecorder.ts`) faz exatamente o que precisamos:
- Grava audio do microfone (WebM/Opus)
- Upload para Supabase Storage (`voice-recordings`)
- Transcreve via edge function `transcribe-audio` (OpenAI Whisper)
- Retorna `audioUrl` e `transcription`

Sera reutilizado diretamente no componente TabNotas, com o prompt ajustado para contexto de CRM/reunioes comerciais.

## Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar colunas + criar bucket |
| `src/types/contatos.ts` | Adicionar campos na interface ContactNote |
| `src/components/contatos/detalhe/TabNotas.tsx` | Reescrever completo com audio, arquivo, tipos |
| `src/components/contatos/detalhe/TabVisaoGeral.tsx` | Adicionar painel compacto de notas recentes |

Nenhuma edge function nova necessaria - a `transcribe-audio` ja existe e funciona.

