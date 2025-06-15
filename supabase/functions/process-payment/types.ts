
export interface PaymentRequestData {
  pedido_id: string;
  total_amount: number;
  cart_items: CartItem[];
  user_id: string;
  return_url?: string;
  payment_method?: string;
  payment_key?: string;
  idempotency_key?: string;
  anti_duplicate_controls?: any;
}

export interface CartItem {
  panel_id: string;
  duration: number;
  price: number;
}

export interface MercadoPagoItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
  description: string;
  category_id: string;
  picture_url: string;
}

export interface PaymentPreference {
  items: MercadoPagoItem[];
  payer: {
    email: string;
    name: string;
    identification: {
      type: string;
      number: string;
    };
  };
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
  external_reference: string;
  notification_url: string;
  statement_descriptor: string;
  expires: boolean;
  payment_methods: {
    installments: number;
  };
  metadata: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  preference_id?: string;
  init_point?: string;
  pedido_id?: string;
  payment_method?: string;
  corrected_total_amount?: number;
  anti_duplicate_check?: string;
  test?: boolean;
  error?: string;
  error_details?: string;
  timestamp?: string;
}
