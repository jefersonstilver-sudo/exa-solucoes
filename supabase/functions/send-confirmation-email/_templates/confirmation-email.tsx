
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ConfirmationEmailProps {
  userName: string;
  confirmationUrl: string;
  userEmail: string;
}

export const ConfirmationEmail = ({
  userName = 'Cliente',
  confirmationUrl = '#',
  userEmail = ''
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirme seu email na Indexa e comece a anunciar nos melhores locais</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header com Logo */}
        <Section style={header}>
          <Img
            src="https://indexa.app/logo-indexa.png"
            width="120"
            height="40"
            alt="Indexa"
            style={logo}
          />
        </Section>

        {/* Conteúdo Principal */}
        <Section style={content}>
          <Heading style={h1}>
            Bem-vindo(a) à Indexa, {userName}! 🎯
          </Heading>
          
          <Text style={text}>
            Estamos muito felizes em ter você conosco! Você está a apenas um clique de acessar 
            a maior plataforma de painéis publicitários digitais do Brasil.
          </Text>

          <Text style={text}>
            Para ativar sua conta e começar a anunciar nos melhores locais da cidade, 
            confirme seu email clicando no botão abaixo:
          </Text>

          {/* Botão Principal */}
          <Section style={buttonContainer}>
            <Button
              pX={24}
              pY={16}
              style={button}
              href={confirmationUrl}
            >
              ✅ Confirmar Email e Ativar Conta
            </Button>
          </Section>

          <Text style={smallText}>
            Ou copie e cole este link no seu navegador:
          </Text>
          <Text style={linkText}>
            {confirmationUrl}
          </Text>

          <Hr style={hr} />

          {/* Benefícios */}
          <Section style={benefitsSection}>
            <Heading style={h2}>O que você pode fazer na Indexa:</Heading>
            
            <Text style={benefitItem}>
              🏢 <strong>Anunciar em prédios premium</strong> - Alcance milhares de pessoas diariamente
            </Text>
            
            <Text style={benefitItem}>
              📱 <strong>Campanhas inteligentes</strong> - Tecnologia de ponta para máximo impacto
            </Text>
            
            <Text style={benefitItem}>
              📊 <strong>Relatórios em tempo real</strong> - Acompanhe o desempenho das suas campanhas
            </Text>
            
            <Text style={benefitItem}>
              💰 <strong>Melhor custo-benefício</strong> - Publicidade exterior nunca foi tão acessível
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Este email foi enviado para <strong>{userEmail}</strong>
          </Text>
          
          <Text style={footer}>
            Se você não criou uma conta na Indexa, pode ignorar este email com segurança.
          </Text>
        </Section>

        {/* Footer */}
        <Section style={footerSection}>
          <Text style={footerText}>
            © 2024 Indexa - Transformando a publicidade exterior
          </Text>
          <Text style={footerText}>
            📧 Dúvidas? Responda este email ou visite nosso site
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ConfirmationEmail;

// Estilos
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  padding: '32px 48px 32px 48px',
  backgroundColor: '#7c3aed',
  borderRadius: '8px 8px 0 0',
  textAlign: 'center' as const,
};

const logo = {
  margin: '0 auto',
};

const content = {
  padding: '32px 48px',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  width: '100%',
  maxWidth: '320px',
};

const smallText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '24px 0 8px',
  textAlign: 'center' as const,
};

const linkText = {
  color: '#7c3aed',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
  wordBreak: 'break-all' as const,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const benefitsSection = {
  margin: '24px 0',
};

const benefitItem = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 12px',
};

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const footerSection = {
  borderTop: '1px solid #e5e7eb',
  padding: '24px 48px',
  backgroundColor: '#f9fafb',
  borderRadius: '0 0 8px 8px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 4px',
  textAlign: 'center' as const,
};
