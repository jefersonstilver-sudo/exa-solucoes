import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Building {
  building_id: string;
  building_name: string;
  bairro?: string;
  endereco?: string;
  quantidade_telas?: number;
  visualizacoes_mes?: number;
  preco_base?: number;
}

interface ProposalPDFExporterProps {
  proposal: {
    id: string;
    number: string;
    client_name: string;
    client_email?: string;
    client_phone?: string;
    client_cnpj?: string;
    selected_buildings: Building[];
    total_panels: number;
    total_impressions_month?: number;
    fidel_monthly_value: number;
    cash_total_value: number;
    discount_percent?: number;
    duration_months: number;
    created_at: string;
    expires_at?: string;
    metadata?: { type?: string };
  };
  sellerName?: string;
}

export const ProposalPDFExporter: React.FC<ProposalPDFExporterProps> = ({ 
  proposal, 
  sellerName = 'Equipe EXA Mídia' 
}) => {
  const isCortesia = proposal.metadata?.type === 'cortesia';
  const buildings = Array.isArray(proposal.selected_buildings) ? proposal.selected_buildings : [];
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const totalOriginal = buildings.reduce((sum, b) => sum + (b.preco_base || 0), 0) * proposal.duration_months;
  const totalFidelidade = proposal.fidel_monthly_value * proposal.duration_months;

  const handlePrint = () => {
    const printContent = document.getElementById('proposal-print-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Proposta ${proposal.number} - EXA Mídia</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.5;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px solid #9C1E1E;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: #9C1E1E;
          }
          .logo span { color: #333; }
          .proposal-number {
            text-align: right;
            font-size: 14px;
            color: #666;
          }
          .proposal-number strong {
            display: block;
            font-size: 18px;
            color: #9C1E1E;
          }
          h1 {
            font-size: 24px;
            color: #9C1E1E;
            margin-bottom: 20px;
            text-align: center;
          }
          .section {
            margin-bottom: 25px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #9C1E1E;
            text-transform: uppercase;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dotted #ddd;
          }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #666; }
          .info-value { font-weight: 500; }
          .buildings-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .buildings-table th,
          .buildings-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .buildings-table th {
            background: #9C1E1E;
            color: white;
            font-weight: 500;
          }
          .buildings-table tr:nth-child(even) {
            background: #f5f5f5;
          }
          .pricing-box {
            background: linear-gradient(135deg, #9C1E1E 0%, #7a1818 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          .pricing-box .price {
            font-size: 32px;
            font-weight: bold;
          }
          .pricing-box .period {
            font-size: 14px;
            opacity: 0.9;
          }
          .pricing-box .original {
            text-decoration: line-through;
            opacity: 0.7;
            font-size: 14px;
          }
          .cortesia-badge {
            background: #22c55e;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 10px;
          }
          .conditions {
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .conditions h4 {
            font-size: 13px;
            color: #333;
            margin-bottom: 10px;
          }
          .conditions ul {
            margin-left: 20px;
          }
          .conditions li {
            margin-bottom: 5px;
          }
          .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            gap: 40px;
          }
          .signature-box {
            flex: 1;
            text-align: center;
            padding-top: 60px;
            border-top: 1px solid #333;
          }
          .signature-box p {
            font-size: 12px;
            color: #666;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          .footer strong {
            color: #9C1E1E;
          }
          @media print {
            body { padding: 0; }
            .section { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">EXA<span>MÍDIA</span></div>
          <div class="proposal-number">
            Proposta Comercial
            <strong>${proposal.number}</strong>
            ${format(new Date(proposal.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </div>
        </div>

        <h1>${isCortesia ? '🎁 PROPOSTA DE CORTESIA' : 'PROPOSTA COMERCIAL'}</h1>

        <div class="section">
          <div class="section-title">Dados do Cliente</div>
          <div class="info-row">
            <span class="info-label">Nome/Razão Social</span>
            <span class="info-value">${proposal.client_name}</span>
          </div>
          ${proposal.client_cnpj ? `
          <div class="info-row">
            <span class="info-label">CNPJ</span>
            <span class="info-value">${proposal.client_cnpj}</span>
          </div>
          ` : ''}
          ${proposal.client_email ? `
          <div class="info-row">
            <span class="info-label">E-mail</span>
            <span class="info-value">${proposal.client_email}</span>
          </div>
          ` : ''}
          ${proposal.client_phone ? `
          <div class="info-row">
            <span class="info-label">Telefone</span>
            <span class="info-value">${proposal.client_phone}</span>
          </div>
          ` : ''}
        </div>

        <div class="section">
          <div class="section-title">Locais Contratados</div>
          <table class="buildings-table">
            <thead>
              <tr>
                <th>Prédio</th>
                <th>Bairro</th>
                <th>Telas</th>
                <th>Exibições/mês</th>
              </tr>
            </thead>
            <tbody>
              ${buildings.map(b => `
                <tr>
                  <td>${b.building_name}</td>
                  <td>${b.bairro || '-'}</td>
                  <td>${b.quantidade_telas || 1}</td>
                  <td>${(b.visualizacoes_mes || 0).toLocaleString('pt-BR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 10px; text-align: right; font-size: 13px; color: #666;">
            <strong>Total:</strong> ${proposal.total_panels} tela(s) • ${(proposal.total_impressions_month || 0).toLocaleString('pt-BR')} exibições/mês
          </div>
        </div>

        <div class="section">
          <div class="section-title">Período de Veiculação</div>
          <div class="info-row">
            <span class="info-label">Duração</span>
            <span class="info-value">${proposal.duration_months} ${proposal.duration_months === 1 ? 'mês' : 'meses'}</span>
          </div>
          ${proposal.expires_at ? `
          <div class="info-row">
            <span class="info-label">Validade da Proposta</span>
            <span class="info-value">${format(new Date(proposal.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
          </div>
          ` : ''}
        </div>

        <div class="pricing-box">
          ${isCortesia ? `
            <div class="cortesia-badge">🎁 100% CORTESIA</div>
            <div class="original">Valor original: ${formatCurrency(totalOriginal)}</div>
            <div class="price">R$ 0,00</div>
            <div class="period">GRÁTIS por ${proposal.duration_months} ${proposal.duration_months === 1 ? 'mês' : 'meses'}</div>
          ` : `
            <div class="original">De ${formatCurrency(totalOriginal)}</div>
            <div class="price">${formatCurrency(proposal.fidel_monthly_value)}/mês</div>
            <div class="period">Total: ${formatCurrency(totalFidelidade)} em ${proposal.duration_months}x</div>
            ${proposal.discount_percent ? `<div style="margin-top: 10px; font-size: 14px;">Desconto de ${proposal.discount_percent}% aplicado</div>` : ''}
          `}
        </div>

        <div class="conditions">
          <h4>Condições Gerais</h4>
          <ul>
            <li>Vídeo institucional de até 15 segundos no formato horizontal (16:9)</li>
            <li>Exibição em loop contínuo nos elevadores dos prédios selecionados</li>
            <li>Aprovação do conteúdo em até 48 horas úteis</li>
            <li>Substituição de vídeo permitida uma vez por mês sem custo adicional</li>
            <li>Relatório mensal de exibições disponível no painel do cliente</li>
            ${isCortesia ? '<li><strong>Esta cortesia não gera vínculo ou obrigação de contratação futura</strong></li>' : ''}
          </ul>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <p><strong>${proposal.client_name}</strong></p>
            <p>Cliente</p>
          </div>
          <div class="signature-box">
            <p><strong>${sellerName}</strong></p>
            <p>EXA Mídia Digital</p>
          </div>
        </div>

        <div class="footer">
          <p><strong>EXA Mídia Digital</strong></p>
          <p>Foz do Iguaçu, PR • contato@examidia.com.br • (45) 99809-0000</p>
          <p style="margin-top: 10px;">Documento gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div id="proposal-print-content">
      <Button 
        onClick={handlePrint} 
        variant="outline" 
        className="gap-2"
      >
        <Printer className="h-4 w-4" />
        Imprimir / PDF
      </Button>
    </div>
  );
};

export default ProposalPDFExporter;
