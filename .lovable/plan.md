
# Plano: Logo do Cliente na Proposta + Processamento IA

## Resumo do Pedido

1. **Exibir logo do cliente na proposta pública** - No card slate do header (lado direito, conforme marcação na imagem)
2. **Logo sempre em versão branca** - Como o exemplo NewZone Importados mostrado
3. **Campo de upload no formulário de criação** - Abaixo do campo CNPJ
4. **Processamento com IA** - Upscale, remoção de fundo, deixar em alta definição
5. **Exibir logo também no PDF** - Manter fidelidade visual com a proposta online

---

## Design Visual na Proposta Pública

A logo do cliente aparecerá no card slate do header (onde você marcou o retângulo vermelho):

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  bg-white/10 backdrop-blur-sm rounded-xl                                    │
│                                                                             │
│  🏢 New Zone Importados                              ┌──────────────────┐  │
│  Responsável: Paola Doldan   CNPJ: 12.345.678/9000-00│  [LOGO CLIENTE]  │  │
│  📍 Endereço...                                      │   (branca)       │  │
│                                                      └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Layout flex com `flex-row items-center justify-between`
- Logo no lado direito com tamanho fixo (~80x80px em desktop, ~60x60px mobile)
- Logo sempre renderizada em **branco** usando filtro CSS `brightness(0) invert(1)`
- Fallback gracioso se não houver logo (espaço não aparece)

---

## Design do Campo de Upload no Formulário Admin

Será adicionado logo **abaixo do campo CNPJ** (após linha 2066):

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  CNPJ                                                                        │
│  [12.345.678/0001-00]  [🔍]                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Logo do Cliente (opcional)                                                  │
│                                                                              │
│  SEM LOGO:                         COM LOGO:                                │
│  ┌────────────────────────┐        ┌─────────┐ ┌────────┐ ┌────┐            │
│  │    🖼️                   │        │  LOGO   │ │ Trocar │ │ ✕  │           │
│  │   Adicionar logo       │        │ (prev)  │ └────────┘ └────┘            │
│  │   PNG até 5MB          │        └─────────┘                              │
│  │   IA otimiza auto      │                                                  │
│  └────────────────────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Processamento de IA da Logo

### Edge Function: `process-client-logo`

Fluxo de processamento usando a API Lovable AI (Gemini):

```text
1. Receber imagem base64 do cliente
2. Enviar para Gemini Image com prompt:
   "Remove the background from this logo image completely. 
    Enhance quality and resolution. Make the logo clean 
    with transparent background. Keep original colors. 
    Output high-quality PNG suitable for professional documents."
3. Receber imagem processada
4. Upload para Supabase Storage: proposal-client-logos/
5. Retornar URL pública
```

### Tecnologia

- Modelo: `google/gemini-2.5-flash-image` (via ai.gateway.lovable.dev)
- Funcionalidades: remoção de fundo + upscale + otimização
- Armazenamento: bucket `arquivos` / pasta `proposal-client-logos/`

---

## Alterações no Banco de Dados

### Nova coluna na tabela `proposals`

```sql
ALTER TABLE proposals 
ADD COLUMN client_logo_url TEXT DEFAULT NULL;

COMMENT ON COLUMN proposals.client_logo_url IS 
  'URL da logo do cliente processada por IA para exibição na proposta';
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | MODIFICAR | Adicionar estado + campo de upload + integração com modal |
| `src/components/admin/proposals/ClientLogoUploadModal.tsx` | CRIAR | Modal de upload com processamento IA e preview |
| `src/pages/public/PropostaPublicaPage.tsx` | MODIFICAR | Exibir logo do cliente no header slate (lado direito, branca) |
| `src/components/admin/proposals/ProposalPDFExporter.tsx` | MODIFICAR | Incluir logo do cliente no PDF |
| `supabase/functions/process-client-logo/index.ts` | CRIAR | Edge Function para processar logo com IA |
| Migração SQL | EXECUTAR | Adicionar coluna `client_logo_url` |

---

## Detalhes de Implementação

### 1. NovaPropostaPage.tsx

**Novo estado** (após linha 254):
```typescript
const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null);
const [showLogoUploadModal, setShowLogoUploadModal] = useState(false);
const [isProcessingLogo, setIsProcessingLogo] = useState(false);
```

**Novo campo UI** (após linha 2066, abaixo do CNPJ):
```tsx
{/* Upload de Logo do Cliente */}
<div className="md:col-span-2 mt-3">
  <Label className="text-xs flex items-center gap-1.5">
    <ImageIcon className="h-3 w-3" />
    Logo do Cliente (opcional)
  </Label>
  
  {clientLogoUrl ? (
    <div className="mt-2 flex items-center gap-3">
      <div className="w-16 h-16 rounded-lg border-2 border-slate-200 
                      overflow-hidden bg-slate-800 flex items-center justify-center">
        <img 
          src={clientLogoUrl} 
          alt="Logo" 
          className="w-full h-full object-contain filter brightness-0 invert" 
        />
      </div>
      <Button variant="outline" size="sm" onClick={() => setShowLogoUploadModal(true)}>
        Trocar
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setClientLogoUrl(null)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setShowLogoUploadModal(true)}
      className="mt-2 w-full p-4 border-2 border-dashed border-slate-200 
                 rounded-lg hover:border-slate-300 transition-colors text-center"
    >
      <ImageIcon className="h-6 w-6 text-slate-400 mx-auto mb-1" />
      <span className="text-sm text-slate-500">Adicionar logo</span>
      <span className="text-xs text-slate-400 block">
        PNG até 5MB - A IA remove fundo e otimiza automaticamente
      </span>
    </button>
  )}
</div>
```

### 2. ClientLogoUploadModal.tsx (Novo)

Componente com:
- Área de drag-and-drop
- Validação: PNG, max 5MB
- Chamada à Edge Function para processamento
- Preview antes/depois
- Estados de loading com mensagens amigáveis
- Botões: Cancelar / Confirmar

### 3. PropostaPublicaPage.tsx

No header slate (linha 1769), modificar para layout flexível:

```tsx
<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 border border-white/20">
  <div className="flex items-start justify-between gap-4">
    {/* Left: Company Info */}
    <div className="flex-1">
      {proposal.client_company_name && (
        <div className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
          <Building2 className="h-5 w-5 sm:h-6 sm:w-6 opacity-80" />
          {proposal.client_company_name}
        </div>
      )}
      {/* ... resto das infos ... */}
    </div>
    
    {/* Right: Client Logo (branca) */}
    {proposal.client_logo_url && (
      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 
                      bg-white/10 rounded-xl flex items-center justify-center 
                      flex-shrink-0 border border-white/20 p-2">
        <img 
          src={proposal.client_logo_url} 
          alt="Logo do cliente"
          className="w-full h-full object-contain filter brightness-0 invert"
        />
      </div>
    )}
  </div>
</div>
```

### 4. Edge Function: process-client-logo

```typescript
// supabase/functions/process-client-logo/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 1. Receber imagem base64
  const { imageBase64, fileName } = await req.json();
  
  // 2. Processar com Gemini (remoção de fundo + upscale)
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "Remove background completely, enhance quality..." },
          { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } }
        ]
      }],
      modalities: ["image", "text"]
    }),
  });

  // 3. Upload para Storage
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const storagePath = `proposal-client-logos/${Date.now()}_${fileName}`;
  await supabase.storage.from("arquivos").upload(storagePath, buffer);

  // 4. Retornar URL
  return new Response(JSON.stringify({ 
    success: true, 
    logoUrl: publicUrl 
  }));
});
```

---

## Checklist de Implementação

### Banco de Dados
- [ ] Criar migração para adicionar coluna `client_logo_url` na tabela `proposals`

### Backend
- [ ] Criar Edge Function `process-client-logo` com integração Lovable AI
- [ ] Deploy da Edge Function

### Admin (Formulário de Criação)
- [ ] Adicionar estados `clientLogoUrl`, `showLogoUploadModal`, `isProcessingLogo`
- [ ] Criar componente `ClientLogoUploadModal.tsx`
- [ ] Adicionar campo de upload abaixo do CNPJ
- [ ] Salvar `client_logo_url` no create/update da proposta

### Proposta Pública
- [ ] Modificar header slate para exibir logo do cliente no lado direito
- [ ] Aplicar filtro CSS `brightness-0 invert` para logo branca
- [ ] Fallback gracioso quando não houver logo

### PDF
- [ ] Carregar logo do cliente no PDF
- [ ] Posicionar no header correspondente
- [ ] Aplicar tratamento para impressão (preto sobre fundo claro ou branco sobre fundo escuro)

### Testes
- [ ] Testar upload de logo com diferentes formatos
- [ ] Verificar processamento IA (remoção de fundo)
- [ ] Testar exibição na proposta pública (mobile e desktop)
- [ ] Testar geração de PDF com logo

---

## Estimativa de Esforço

| Componente | Complexidade |
|------------|--------------|
| Migração SQL | Baixa |
| Edge Function IA | Média |
| ClientLogoUploadModal | Média |
| Campo no NovaPropostaPage | Baixa |
| Exibição na PropostaPublicaPage | Baixa |
| Integração no PDF | Média |

**Total**: 3-4 ciclos de implementação
