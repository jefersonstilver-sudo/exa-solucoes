
/**
 * Types for PIX webhook integration
 */
export interface PixWebhookData {
  cliente_id: string;
  pedido_id?: string;
  transaction_id?: string;
  email: string;
  nome: string;
  plano_escolhido: string;
  periodo_meses: number;
  predios_selecionados: Array<{
    id: string;
    nome: string;
    painel_ids?: string[];
  }>;
  valor_total: string;
  periodo_exibicao: {
    inicio: string;
    fim: string;
  };
}

export interface PixWebhookResponse {
  success: boolean;
  qrCodeBase64?: string;
  qrCodeText?: string;
  paymentLink?: string;
  pix_url?: string;
  pix_base64?: string;
  init_point?: string;
  pedido_id?: string;
  transaction_id?: string;
  external_reference?: string;
  message?: string;
  error?: string;
}
