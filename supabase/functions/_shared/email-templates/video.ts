// ============================================
// TEMPLATES DE NOTIFICAÇÕES DE VÍDEO
// ============================================

import { createEmailTemplate, EXA_COLORS } from './base.ts';
import type { VideoSubmittedEmailData, VideoApprovedEmailData, VideoRejectedEmailData } from './types.ts';

// Email: Vídeo enviado para análise
export function createVideoSubmittedEmail(data: VideoSubmittedEmailData): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 64px;">🎬</span>
    </div>
    
    <h1 class="greeting" style="text-align: center;">Vídeo Recebido com Sucesso!</h1>
    
    <p class="message" style="text-align: center;">
      Olá, <strong>${data.userName}</strong>!
    </p>
    
    <p class="message" style="text-align: center;">
      Recebemos seu vídeo "<strong>${data.videoTitle}</strong>" e ele já está em análise pela nossa equipe!
    </p>
    
    <!-- INFO BOX -->
    <div style="background: #f7fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #718096; font-size: 14px;">📋 Status:</span>
        <span style="color: #1a202c; font-weight: 600; font-size: 14px;">Em Análise</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
        <span style="color: #718096; font-size: 14px;">⏱️ Prazo de Análise:</span>
        <span style="color: #1a202c; font-weight: 600; font-size: 14px;">Até 24 horas</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #718096; font-size: 14px;">📁 Pedido:</span>
        <span style="color: #1a202c; font-weight: 600; font-size: 14px;">#${data.orderId.substring(0, 8)}</span>
      </div>
    </div>
    
    <!-- TIMELINE -->
    <div style="background: #edf2f7; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #2d3748; font-size: 16px; margin: 0 0 16px;">O que acontece agora?</h3>
      
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 12px;">✓</span>
        <div style="flex: 1; color: #4a5568; font-size: 14px; line-height: 1.5;">
          <strong>Análise Técnica:</strong> Verificamos qualidade, formato e duração
        </div>
      </div>
      
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 12px;">✓</span>
        <div style="flex: 1; color: #4a5568; font-size: 14px; line-height: 1.5;">
          <strong>Conformidade CONAR:</strong> Garantimos que o conteúdo está adequado para ambiente familiar
        </div>
      </div>
      
      <div style="display: flex; align-items: start;">
        <span style="font-size: 20px; margin-right: 12px;">✓</span>
        <div style="flex: 1; color: #4a5568; font-size: 14px; line-height: 1.5;">
          <strong>Aprovação:</strong> Você receberá um email assim que o vídeo for aprovado
        </div>
      </div>
    </div>
    
    <p class="message" style="font-size: 14px; color: #718096; text-align: center;">
      Você receberá uma notificação por email assim que seu vídeo for aprovado ou caso precisemos de ajustes.
    </p>
    
    <div class="cta-container">
      <a href="https://examidia.com.br/painel" class="cta-button">📊 Acompanhar Pedido</a>
    </div>
  `;

  return createEmailTemplate({
    title: 'Vídeo Recebido',
    subtitle: 'Em Análise pela Nossa Equipe',
    content
  });
}

// Email: Vídeo aprovado
export function createVideoApprovedEmail(data: VideoApprovedEmailData): string {
  const buildingsList = data.buildings.map(b => `<li style="margin-bottom: 8px; color: #4a5568; font-size: 14px;">${b}</li>`).join('');
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 80px;">🎉</span>
    </div>
    
    <h1 class="greeting" style="text-align: center; color: #10b981;">Parabéns! Seu Vídeo Foi Aprovado!</h1>
    
    <p class="message" style="text-align: center;">
      Olá, <strong>${data.userName}</strong>!
    </p>
    
    <p class="message" style="text-align: center;">
      Temos ótimas notícias! Seu vídeo "<strong>${data.videoTitle}</strong>" foi aprovado e já está <strong style="color: #10b981;">ATIVO</strong> nos painéis!
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <span style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: #ffffff; font-weight: 700; padding: 12px 32px; border-radius: 50px; font-size: 18px; box-shadow: 0 4px 15px rgba(72, 187, 120, 0.4);">
        📺 EM EXIBIÇÃO
      </span>
    </div>
    
    <!-- DETALHES DA CAMPANHA -->
    <div style="background: #f0fff4; border: 2px solid #9ae6b4; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="color: #22543d; font-size: 18px; margin: 0 0 16px;">📊 Detalhes da Campanha</h3>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div style="background: #ffffff; padding: 12px; border-radius: 8px;">
          <div style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Data Início</div>
          <div style="color: #1a202c; font-weight: 600; font-size: 16px;">${data.startDate}</div>
        </div>
        <div style="background: #ffffff; padding: 12px; border-radius: 8px;">
          <div style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Data Término</div>
          <div style="color: #1a202c; font-weight: 600; font-size: 16px;">${data.endDate}</div>
        </div>
        <div style="background: #ffffff; padding: 12px; border-radius: 8px;">
          <div style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Painéis Ativos</div>
          <div style="color: #1a202c; font-weight: 600; font-size: 16px;">${data.buildings.length}</div>
        </div>
        <div style="background: #ffffff; padding: 12px; border-radius: 8px;">
          <div style="color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Pedido</div>
          <div style="color: #1a202c; font-weight: 600; font-size: 16px;">#${data.orderId.substring(0, 8)}</div>
        </div>
      </div>
      
      <div style="background: #ffffff; border-radius: 8px; padding: 16px;">
        <h4 style="color: #22543d; font-size: 14px; margin: 0 0 12px;">📍 Locais de Exibição:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          ${buildingsList}
        </ul>
      </div>
    </div>
    
    <!-- PRÓXIMOS PASSOS -->
    <div style="background: #edf2f7; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #2d3748; font-size: 16px; margin: 0 0 16px;">✓ Próximos Passos</h3>
      
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 12px;">📈</span>
        <div style="flex: 1; color: #4a5568; font-size: 14px;">
          <strong>Acompanhe métricas:</strong> Visualize impressões e alcance no seu painel
        </div>
      </div>
      
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <span style="font-size: 20px; margin-right: 12px;">⏰</span>
        <div style="flex: 1; color: #4a5568; font-size: 14px;">
          <strong>Gerencie horários:</strong> Configure quando seu vídeo será exibido
        </div>
      </div>
      
      <div style="display: flex; align-items: start;">
        <span style="font-size: 20px; margin-right: 12px;">🎬</span>
        <div style="flex: 1; color: #4a5568; font-size: 14px;">
          <strong>Envie mais vídeos:</strong> Aproveite para criar novas campanhas
        </div>
      </div>
    </div>
    
    <div class="success-box">
      <p><strong>🚀 Seu conteúdo já está alcançando seu público-alvo!</strong></p>
      <p style="margin-top: 8px;">Acesse seu painel para ver os resultados em tempo real.</p>
    </div>
    
    <div class="cta-container">
      <a href="https://examidia.com.br/painel" class="cta-button">📊 Ver Meu Painel</a>
    </div>
  `;

  return createEmailTemplate({
    title: 'Vídeo Aprovado',
    subtitle: 'Sua Campanha Está Ativa',
    content
  });
}

// Email: Vídeo rejeitado / precisa de ajustes
export function createVideoRejectedEmail(data: VideoRejectedEmailData): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 64px;">⚠️</span>
    </div>
    
    <h1 class="greeting" style="text-align: center;">Vídeo Precisa de Ajustes</h1>
    
    <p class="message" style="text-align: center;">
      Olá, <strong>${data.userName}</strong>!
    </p>
    
    <p class="message" style="text-align: center;">
      Analisamos seu vídeo "<strong>${data.videoTitle}</strong>" e identificamos alguns pontos que precisam ser ajustados antes da aprovação.
    </p>
    
    <!-- MOTIVO DA REJEIÇÃO -->
    <div style="background: #fffaf0; border: 2px solid #f6ad55; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="color: #c05621; font-size: 18px; margin: 0 0 12px; display: flex; align-items: center;">
        📝 Motivo dos Ajustes Necessários
      </h3>
      <div style="background: #ffffff; border-left: 4px solid #ed8936; padding: 16px; border-radius: 8px; color: #744210; font-size: 15px; line-height: 1.6; margin-top: 16px;">
        ${data.rejectionReason}
      </div>
    </div>
    
    <!-- DIRETRIZES -->
    <div style="background: #edf2f7; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="color: #2d3748; font-size: 16px; margin: 0 0 16px;">📖 Diretrizes da Plataforma</h3>
      <ul style="margin: 0; padding-left: 20px; color: #4a5568; font-size: 14px;">
        <li style="margin-bottom: 12px; line-height: 1.5;"><strong>Qualidade de vídeo:</strong> Mínimo 1080p (Full HD), formato MP4 ou MOV</li>
        <li style="margin-bottom: 12px; line-height: 1.5;"><strong>Duração:</strong> Entre 15 e 30 segundos para melhor engajamento</li>
        <li style="margin-bottom: 12px; line-height: 1.5;"><strong>Conteúdo:</strong> Adequado para todos os públicos (ambientes condominiais)</li>
        <li style="margin-bottom: 12px; line-height: 1.5;"><strong>Áudio:</strong> Volume balanceado, sem distorções</li>
        <li style="line-height: 1.5;"><strong>Conformidade CONAR:</strong> Respeitar regulamentações de publicidade</li>
      </ul>
    </div>
    
    <!-- PRÓXIMOS PASSOS -->
    <div style="background: #f0fff4; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #22543d; font-size: 16px; margin: 0 0 16px;">✓ O Que Fazer Agora?</h3>
      
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <div style="background: #48bb78; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: 12px; flex-shrink: 0;">1</div>
        <div style="flex: 1; color: #2d3748; font-size: 14px; line-height: 1.5;">
          <strong>Ajuste o vídeo</strong> conforme as observações acima
        </div>
      </div>
      
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <div style="background: #48bb78; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: 12px; flex-shrink: 0;">2</div>
        <div style="flex: 1; color: #2d3748; font-size: 14px; line-height: 1.5;">
          <strong>Envie novamente</strong> através do seu painel
        </div>
      </div>
      
      <div style="display: flex; align-items: start;">
        <div style="background: #48bb78; color: #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; margin-right: 12px; flex-shrink: 0;">3</div>
        <div style="flex: 1; color: #2d3748; font-size: 14px; line-height: 1.5;">
          <strong>Nova análise</strong> será feita em até 24 horas
        </div>
      </div>
    </div>
    
    <div class="info-box">
      <p><strong>💡 Precisa de ajuda?</strong></p>
      <p style="margin-top: 8px;">
        Nossa equipe está à disposição para esclarecer dúvidas e ajudar você a adequar seu conteúdo. 
        Entre em contato através do suporte.
      </p>
    </div>
    
    <div class="cta-container">
      <a href="https://examidia.com.br/painel" class="cta-button">📤 Enviar Novo Vídeo</a>
    </div>
  `;

  return createEmailTemplate({
    title: 'Ajustes Necessários',
    subtitle: 'Seu Vídeo Precisa de Correções',
    content
  });
}
