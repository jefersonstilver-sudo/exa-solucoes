# 📧 Sistema Centralizado de Templates de Email - EXA Mídia

Sistema completo e modular de templates de email com visual unificado da marca EXA.

## 📁 Estrutura

```
_shared/
├── email-templates/
│   ├── types.ts          # Tipos TypeScript
│   ├── base.ts           # Componentes base e estilos
│   ├── auth.ts           # Templates de autenticação
│   ├── admin.ts          # Templates administrativos
│   ├── video.ts          # Templates de notificação de vídeo
│   ├── benefits.ts       # Templates de benefícios
│   └── index.ts          # Exportações centralizadas
├── email-service.ts      # Serviço unificado de envio
└── README.md            # Esta documentação
```

## 🎨 Padrão Visual

### Cores Oficiais EXA
- **Primary:** `#7D1818`
- **Primary Dark:** `#9C1E1E`
- **Primary Light:** `#DC2626`
- **Gradient:** `linear-gradient(135deg, #7D1818 0%, #9C1E1E 100%)`

### Logo
- **URL:** `https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png`

## 🚀 Como Usar

### 1. Importar o Serviço

```typescript
import { UnifiedEmailService } from '../_shared/email-service.ts';

const emailService = new UnifiedEmailService(
  Deno.env.get('RESEND_API_KEY')!
);
```

### 2. Enviar Emails

#### Email de Confirmação (Signup)
```typescript
const { data, error } = await emailService.sendConfirmationEmail({
  userName: 'João Silva',
  userEmail: 'joao@exemplo.com',
  confirmationUrl: 'https://examidia.com.br/confirmar?token=...'
});
```

#### Email de Boas-Vindas Admin
```typescript
const { data, error } = await emailService.sendAdminWelcomeEmail({
  nome: 'Maria Santos',
  email: 'maria@examidia.com.br',
  role: 'admin_marketing',
  password: 'Temp123!@#',
  createdBy: 'João Admin',
  loginUrl: 'https://examidia.com.br/login',
  userName: 'Maria Santos',
  userEmail: 'maria@examidia.com.br'
});
```

#### Email de Vídeo Aprovado
```typescript
const { data, error } = await emailService.sendVideoApprovedEmail({
  userName: 'Carlos Cliente',
  userEmail: 'carlos@empresa.com',
  videoTitle: 'Campanha Verão 2025',
  buildings: ['Edifício Alpha', 'Condomínio Beta', 'Residencial Gamma'],
  startDate: '15/01/2025',
  endDate: '15/02/2025',
  orderId: 'abc123def456'
});
```

#### Email de Presente (Benefício)
```typescript
const { data, error } = await emailService.sendBenefitInvitationEmail({
  providerName: 'Pedro Prestador',
  providerEmail: 'pedro@exemplo.com',
  presentLink: 'https://examidia.com.br/presente?token=...',
  activationPoint: 'Edifício Central - São Paulo'
});
```

## 📝 Tipos Disponíveis

### Autenticação
- `ConfirmationEmailData` - Confirmação de email
- `PasswordRecoveryEmailData` - Recuperação de senha

### Administrativo
- `AdminWelcomeEmailData` - Boas-vindas admin
  - Roles: `super_admin`, `admin`, `admin_marketing`, `admin_financeiro`

### Vídeos
- `VideoSubmittedEmailData` - Vídeo enviado
- `VideoApprovedEmailData` - Vídeo aprovado
- `VideoRejectedEmailData` - Vídeo rejeitado

### Benefícios
- `BenefitInvitationEmailData` - Convite para escolher presente
- `BenefitGiftCodeEmailData` - Código do presente

## 🎯 Recursos

### Componentes Reutilizáveis
- Header com logo EXA
- Footer padronizado
- Botões de CTA
- Info boxes
- Warning boxes
- Success boxes
- Dividers

### Responsividade
- Otimizado para desktop e mobile
- Breakpoint em 640px
- Botões adaptáveis

### Acessibilidade
- Cores com bom contraste
- Fontes legíveis (Inter)
- Estrutura semântica

## 🔧 Personalização

### Criar Novo Template

```typescript
// email-templates/custom.ts
import { createEmailTemplate } from './base.ts';

export function createCustomEmail(data: CustomData): string {
  const content = `
    <h1 class="greeting">Olá, ${data.userName}!</h1>
    <p class="message">Seu conteúdo aqui...</p>
    <div class="cta-container">
      <a href="${data.link}" class="cta-button">Clique Aqui</a>
    </div>
  `;

  return createEmailTemplate({
    title: 'Título do Email',
    subtitle: 'Subtítulo',
    content,
    footerText: 'Texto adicional no rodapé'
  });
}
```

### Adicionar ao Serviço

```typescript
// email-service.ts
async sendCustomEmail(data: CustomData) {
  const html = createCustomEmail(data);
  
  return await this.resend.emails.send({
    from: this.fromAddress,
    to: [data.userEmail],
    subject: 'Assunto do Email',
    html
  });
}
```

## 📊 Logs e Debug

Todos os templates incluem logs estruturados para facilitar o debug:

```typescript
console.log('📧 [EMAIL] Enviando email de boas-vindas para:', email);
console.log('✅ [EMAIL] Email enviado com sucesso!');
console.error('❌ [EMAIL] Erro ao enviar:', error);
```

## 🔒 Segurança

- API keys via variáveis de ambiente
- Validação de dados de entrada
- Links seguros e válidos
- Rate limiting integrado

## 📚 Exemplos Completos

Veja os arquivos de função existentes para exemplos completos:
- `unified-email-service/index.ts` - Autenticação
- `create-admin-account/index.ts` - Admin
- `video-notification-service/index.ts` - Vídeos
- `send-benefit-emails/index.ts` - Benefícios

---

**Desenvolvido para EXA Mídia - Publicidade Inteligente 🚀**
