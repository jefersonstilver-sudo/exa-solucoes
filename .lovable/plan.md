

## Plano: Corrigir fonte esticada, adicionar equipe e logo Passou Ganhou

### Problemas identificados
1. Fonte "Syne" nos headings esta renderizando com aparencia esticada/distorcida
2. Falta Beatriz Almeida como Head de Marketing na assinatura
3. Falta Jeferson Encina como Head de Estrategia (atualmente diz "Fundador & Estrategista")
4. Falta o logo da Passou Ganhou (imagem enviada pelo usuario)
5. Falta "Elaborado por Linkae Marketing" mais destacado na area de assinatura

### Alteracoes no arquivo `src/pages/public/PropostaPassouGanhou.tsx`

**1. Trocar fonte Syne por Inter (ou Montserrat)**
- Syne esta causando o efeito "esticado" por ser uma fonte ultra-condensed/wide
- Substituir todas as referencias `fontFamily: 'Syne, sans-serif'` por `'Inter, sans-serif'` (ou Montserrat)
- Atualizar o link do Google Fonts no Helmet para carregar Inter com pesos 600-800

**2. Copiar logo Passou Ganhou para o projeto**
- Copiar `user-uploads://image-1774900287.png` para `src/assets/passou-ganhou-logo.png`
- Importar no componente e usar na nav e na secao de assinatura

**3. Reescrever bloco de assinatura (linhas 450-468)**
- "Elaborado por" com:
  - Linkae Marketing (nome da empresa)
  - Jeferson Encina — Head de Estrategia
  - Beatriz Almeida — Head de Marketing
- "Apresentado para" com:
  - Logo da Passou Ganhou (imagem)
  - Magno Sipauba — Fundador & CEO
- Manter badge, layout flexivel e estilo visual existente

**4. Atualizar nav (linha 88-95)**
- Substituir texto "PASSOU GANHOU" pelo logo (imagem) na nav bar

### Nenhuma outra funcionalidade sera alterada

