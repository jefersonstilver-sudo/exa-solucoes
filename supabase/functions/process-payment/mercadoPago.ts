
import * as MercadoPago from "https://esm.sh/mercadopago@1.5.16";
import { MercadoPagoItem, PaymentPreference } from './types.ts';

export function configureMercadoPago(): string {
  const MP_ACCESS_TOKEN = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') ?? '';
  MercadoPago.configure({
    access_token: MP_ACCESS_TOKEN,
    sandbox: true
  });
  return MP_ACCESS_TOKEN;
}

export function createPaymentItems(pedidoId: string, cartItems: any[], correctedTotalAmount: number): MercadoPagoItem[] {
  return [{
    id: `campaign_${pedidoId}`,
    title: `Campanha publicitária digital - ${cartItems.length} painéis`,
    quantity: 1,
    unit_price: correctedTotalAmount,
    currency_id: 'BRL',
    description: `Veiculação por 30 dias em ${cartItems.length} painel(éis)`,
    category_id: "digital_goods",
    picture_url: "https://via.placeholder.com/150"
  }];
}

export function createPaymentPreference(
  items: MercadoPagoItem[],
  userEmail: string,
  returnUrls: { successUrl: string; failureUrl: string; pendingUrl: string },
  pedidoId: string,
  userId: string,
  paymentMethod: string,
  paymentKey: string,
  idempotencyKey: string,
  correctedTotalAmount: number,
  supabaseUrl: string
): PaymentPreference {
  return {
    items,
    payer: {
      email: userEmail || 'cliente@exemplo.com',
      name: "Cliente Teste",
      identification: {
        type: "CPF",
        number: "11111111111"
      }
    },
    back_urls: {
      success: returnUrls.successUrl,
      failure: returnUrls.failureUrl,
      pending: returnUrls.pendingUrl
    },
    auto_return: "approved",
    external_reference: pedidoId,
    notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
    statement_descriptor: "INDEXA MÍDIA",
    expires: false,
    payment_methods: {
      installments: 12,
    },
    metadata: {
      pedido_id: pedidoId,
      user_id: userId,
      payment_method: paymentMethod,
      test: true,
      email: userEmail,
      payment_key: paymentKey,
      idempotency_key: idempotencyKey,
      total_amount_check: correctedTotalAmount
    }
  };
}

export async function createMercadoPagoPreference(preference: PaymentPreference, MP_ACCESS_TOKEN: string): Promise<{ preferenceId: string; initPoint: string }> {
  let preferenceId = "";
  let initPoint = "";
  
  try {
    if (!MP_ACCESS_TOKEN) {
      console.log("No MP_ACCESS_TOKEN found, using test mode");
      preferenceId = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
    } else {
      console.log("Sending request to MercadoPago API...");
      const response = await MercadoPago.preferences.create(preference);
      
      preferenceId = response.body.id;
      initPoint = response.body.init_point;
      
      if (initPoint && !initPoint.includes('test=')) {
        initPoint = `${initPoint}${initPoint.includes('?') ? '&' : '?'}test=true`;
      }
      
      console.log("MercadoPago preference created successfully");
    }
  } catch (mpError) {
    console.error("Error creating MercadoPago preference:", mpError);
    
    preferenceId = `FALLBACK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?preference_id=${preferenceId}&test=true`;
    
    console.log("Using emergency fallback preference");
  }
  
  return { preferenceId, initPoint };
}
