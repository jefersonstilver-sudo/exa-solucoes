/**
 * Asaas API Client
 * 
 * Cliente para integração com a API de pagamentos do Asaas
 * Suporta PIX, Boleto e Cartão de Crédito
 * 
 * Documentação: https://docs.asaas.com/
 * 
 * @author EXA System
 * @version 1.0.0
 */

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface AsaasCustomer {
  id?: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
}

export interface AsaasPaymentRequest {
  customer: string; // customer ID
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
}

export interface AsaasPaymentResponse {
  id: string;
  dateCreated: string;
  customer: string;
  value: number;
  netValue: number;
  billingType: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'REFUND_IN_PROGRESS' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  dueDate: string;
  paymentDate?: string;
  invoiceUrl: string;
  bankSlipUrl?: string;
  deleted: boolean;
  externalReference?: string;
  subscription?: string; // ID da assinatura, se for pagamento de assinatura
}

export interface AsaasPixQrCodeResponse {
  success: boolean;
  encodedImage: string; // Base64 encoded QR Code image
  payload: string; // PIX copia e cola
  expirationDate: string;
}

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
}

// ========================================
// TIPOS DE ASSINATURA
// ========================================

export interface AsaasSubscriptionRequest {
  customer: string;
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
  maxInstallmentCount?: number; // Total de parcelas
}

export interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  value: number;
  nextDueDate: string;
  cycle: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  billingType: string;
  description?: string;
  externalReference?: string;
}

// ========================================
// TIPOS DE PIX AUTOMÁTICO (DÉBITO RECORRENTE)
// ========================================

export interface AsaasPixAutomaticoRequest {
  addressKey: string; // Chave PIX cadastrada no Asaas
  description: string;
  value: number;
  format: 'ALL' | 'IMAGE' | 'PAYLOAD';
  expirationSeconds?: number;
  externalReference?: string;
  allowsMultiplePayments?: boolean;
  // Débito automático recorrente
  scheduledPaymentRequest?: {
    customerExternalId?: string;
    value: number;
    startDate: string; // YYYY-MM-DD
    cycle: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY';
    maxPayments?: number;
  };
}

export interface AsaasPixAutomaticoResponse {
  id: string;
  encodedImage: string; // QR Code Base64
  payload: string; // Copia e Cola
  expirationDate: string;
  allowsMultiplePayments: boolean;
  externalReference?: string;
}

// ========================================
// CONFIGURAÇÃO
// ========================================

const ASAAS_API_URL = 'https://api.asaas.com/v3';
// Para sandbox, use: 'https://sandbox.asaas.com/api/v3'

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Log estruturado para debugging
 */
function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    service: 'asaas-client',
    message,
    ...data
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Obtém a API Key do Asaas
 */
function getApiKey(): string {
  const apiKey = Deno.env.get('ASAAS_API_KEY');
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada. Configure nas secrets do Supabase.');
  }
  return apiKey;
}

/**
 * Faz requisição autenticada para a API do Asaas
 */
async function asaasRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: Record<string, unknown>
): Promise<T> {
  const apiKey = getApiKey();
  const url = `${ASAAS_API_URL}${endpoint}`;
  
  log('info', 'Asaas API request', { method, endpoint });
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'access_token': apiKey,
    'User-Agent': 'EXA-Midia/1.0'
  };
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  const responseText = await response.text();
  
  log('info', 'Asaas API response', { 
    status: response.status, 
    statusText: response.statusText,
    hasBody: !!responseText
  });
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { message: responseText };
    }
    
    log('error', 'Asaas API error', { 
      status: response.status, 
      error: errorData 
    });
    
    const errorMessage = errorData?.errors?.[0]?.description || 
                         errorData?.message || 
                         `Erro Asaas: ${response.status}`;
    throw new Error(errorMessage);
  }
  
  if (!responseText) {
    return {} as T;
  }
  
  return JSON.parse(responseText) as T;
}

// ========================================
// CLIENTES
// ========================================

/**
 * Busca cliente existente por CPF/CNPJ
 */
export async function findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomerResponse | null> {
  try {
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
    const response = await asaasRequest<{ data: AsaasCustomerResponse[] }>(
      'GET',
      `/customers?cpfCnpj=${cleanCpfCnpj}`
    );
    
    if (response.data && response.data.length > 0) {
      log('info', 'Customer found', { customerId: response.data[0].id });
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    log('warn', 'Error finding customer', { error: error.message });
    return null;
  }
}

/**
 * Cria um novo cliente no Asaas
 */
export async function createCustomer(customer: AsaasCustomer): Promise<AsaasCustomerResponse> {
  log('info', 'Creating customer', { name: customer.name });
  
  const response = await asaasRequest<AsaasCustomerResponse>('POST', '/customers', {
    name: customer.name,
    email: customer.email,
    cpfCnpj: customer.cpfCnpj?.replace(/\D/g, ''),
    phone: customer.phone,
    mobilePhone: customer.mobilePhone,
  });
  
  log('info', 'Customer created', { customerId: response.id });
  return response;
}

/**
 * Obtém ou cria um cliente no Asaas
 */
export async function getOrCreateCustomer(customer: AsaasCustomer): Promise<string> {
  // Se já tem um CPF/CNPJ, tentar encontrar existente
  if (customer.cpfCnpj) {
    const existing = await findCustomerByCpfCnpj(customer.cpfCnpj);
    if (existing) {
      return existing.id;
    }
  }
  
  // Criar novo cliente
  const newCustomer = await createCustomer(customer);
  return newCustomer.id;
}

// ========================================
// PAGAMENTOS PIX
// ========================================

/**
 * Cria uma cobrança PIX no Asaas
 */
export async function createPixPayment(
  customerId: string,
  value: number,
  description?: string,
  externalReference?: string
): Promise<AsaasPaymentResponse> {
  // Data de vencimento = hoje + 1 dia
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1);
  const dueDateStr = dueDate.toISOString().split('T')[0];
  
  log('info', 'Creating PIX payment', { customerId, value, dueDate: dueDateStr });
  
  const payment = await asaasRequest<AsaasPaymentResponse>('POST', '/payments', {
    customer: customerId,
    billingType: 'PIX',
    value: value,
    dueDate: dueDateStr,
    description: description || 'Pagamento EXA Mídia',
    externalReference: externalReference,
  });
  
  log('info', 'PIX payment created', { paymentId: payment.id, status: payment.status });
  return payment;
}

/**
 * Obtém o QR Code PIX de um pagamento
 */
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCodeResponse> {
  log('info', 'Getting PIX QR Code', { paymentId });
  
  const qrCode = await asaasRequest<AsaasPixQrCodeResponse>(
    'GET',
    `/payments/${paymentId}/pixQrCode`
  );
  
  log('info', 'PIX QR Code retrieved', { 
    hasImage: !!qrCode.encodedImage, 
    hasPayload: !!qrCode.payload,
    expirationDate: qrCode.expirationDate
  });
  
  return qrCode;
}

/**
 * Fluxo completo: Cria pagamento PIX e retorna QR Code
 */
export async function createPixCharge(
  customer: AsaasCustomer,
  amount: number,
  description?: string,
  externalReference?: string
): Promise<{
  paymentId: string;
  qrCodeBase64: string;
  pixCopiaECola: string;
  expiresAt: string;
  invoiceUrl: string;
  status: string;
}> {
  log('info', 'Creating complete PIX charge', { 
    customerName: customer.name, 
    amount 
  });
  
  // 1. Obter ou criar cliente
  const customerId = await getOrCreateCustomer(customer);
  
  // 2. Criar pagamento PIX
  const payment = await createPixPayment(
    customerId, 
    amount, 
    description, 
    externalReference
  );
  
  // 3. Obter QR Code
  const qrCode = await getPixQrCode(payment.id);
  
  log('info', 'PIX charge created successfully', { 
    paymentId: payment.id,
    customerId
  });
  
  return {
    paymentId: payment.id,
    qrCodeBase64: qrCode.encodedImage,
    pixCopiaECola: qrCode.payload,
    expiresAt: qrCode.expirationDate,
    invoiceUrl: payment.invoiceUrl,
    status: payment.status,
  };
}

// ========================================
// CONSULTAS
// ========================================

/**
 * Consulta status de um pagamento
 */
export async function getPaymentStatus(paymentId: string): Promise<AsaasPaymentResponse> {
  log('info', 'Getting payment status', { paymentId });
  
  const payment = await asaasRequest<AsaasPaymentResponse>(
    'GET',
    `/payments/${paymentId}`
  );
  
  log('info', 'Payment status retrieved', { 
    paymentId, 
    status: payment.status 
  });
  
  return payment;
}

/**
 * Lista pagamentos por referência externa
 */
export async function listPaymentsByExternalReference(
  externalReference: string
): Promise<AsaasPaymentResponse[]> {
  log('info', 'Listing payments by external reference', { externalReference });
  
  const response = await asaasRequest<{ data: AsaasPaymentResponse[] }>(
    'GET',
    `/payments?externalReference=${externalReference}`
  );
  
  return response.data || [];
}

// ========================================
// ASSINATURAS RECORRENTES
// ========================================

/**
 * Cria uma assinatura recorrente no Asaas
 */
export async function createSubscription(
  customerId: string,
  value: number,
  totalMonths: number,
  description?: string,
  externalReference?: string
): Promise<AsaasSubscriptionResponse> {
  // Próximo vencimento = amanhã
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 1);
  const dueDateStr = nextDueDate.toISOString().split('T')[0];
  
  log('info', 'Creating subscription', { customerId, value, totalMonths, nextDueDate: dueDateStr });
  
  const subscription = await asaasRequest<AsaasSubscriptionResponse>('POST', '/subscriptions', {
    customer: customerId,
    billingType: 'PIX',
    value: value,
    nextDueDate: dueDateStr,
    cycle: 'MONTHLY',
    maxInstallmentCount: totalMonths,
    description: description || `Assinatura EXA - ${totalMonths} meses`,
    externalReference: externalReference
  });
  
  log('info', 'Subscription created', { subscriptionId: subscription.id, status: subscription.status });
  return subscription;
}

/**
 * Lista pagamentos de uma assinatura
 */
export async function listPaymentsBySubscription(
  subscriptionId: string
): Promise<AsaasPaymentResponse[]> {
  log('info', 'Listing payments by subscription', { subscriptionId });
  
  const response = await asaasRequest<{ data: AsaasPaymentResponse[] }>(
    'GET',
    `/payments?subscription=${subscriptionId}`
  );
  
  return response.data || [];
}

/**
 * Fluxo completo: Cria assinatura recorrente + retorna primeira cobrança PIX
 * @deprecated Use createPixAutomaticoCharge para débito automático real
 */
export async function createPixSubscription(
  customer: AsaasCustomer,
  monthlyValue: number,
  totalMonths: number,
  description?: string,
  externalReference?: string
): Promise<{
  subscriptionId: string;
  firstPaymentId: string;
  qrCodeBase64: string;
  pixCopiaECola: string;
  expiresAt: string;
  invoiceUrl: string;
  status: string;
}> {
  log('info', 'Creating complete PIX subscription', { 
    customerName: customer.name, 
    monthlyValue,
    totalMonths
  });
  
  // 1. Obter ou criar cliente
  const customerId = await getOrCreateCustomer(customer);
  
  // 2. Criar assinatura
  const subscription = await createSubscription(
    customerId,
    monthlyValue,
    totalMonths,
    description,
    externalReference
  );
  
  // 3. Aguardar um pouco para a primeira cobrança ser gerada
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 4. Buscar a primeira cobrança gerada pela assinatura
  const payments = await listPaymentsBySubscription(subscription.id);
  
  if (!payments || payments.length === 0) {
    // Se não encontrou pagamentos, criar um manualmente
    log('warn', 'No payments found for subscription, creating manual payment', { subscriptionId: subscription.id });
    
    const manualPayment = await createPixPayment(
      customerId,
      monthlyValue,
      description,
      externalReference
    );
    
    const qrCode = await getPixQrCode(manualPayment.id);
    
    return {
      subscriptionId: subscription.id,
      firstPaymentId: manualPayment.id,
      qrCodeBase64: qrCode.encodedImage,
      pixCopiaECola: qrCode.payload,
      expiresAt: qrCode.expirationDate,
      invoiceUrl: manualPayment.invoiceUrl,
      status: manualPayment.status,
    };
  }
  
  const firstPayment = payments[0];
  
  // 5. Obter QR Code da primeira cobrança
  const qrCode = await getPixQrCode(firstPayment.id);
  
  log('info', 'PIX subscription created successfully', { 
    subscriptionId: subscription.id,
    paymentId: firstPayment.id,
    customerId
  });
  
  return {
    subscriptionId: subscription.id,
    firstPaymentId: firstPayment.id,
    qrCodeBase64: qrCode.encodedImage,
    pixCopiaECola: qrCode.payload,
    expiresAt: qrCode.expirationDate,
    invoiceUrl: firstPayment.invoiceUrl,
    status: firstPayment.status,
  };
}

// ========================================
// PIX AUTOMÁTICO - DÉBITO RECORRENTE DO BANCO CENTRAL
// ========================================

export interface DirectAuthorizationConfig {
  recurrenceFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  maxPayments: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD  
  description: string;
  allowUpdate?: boolean;
  txId?: string;
}

export interface PixAutomaticoResponse {
  id: string;
  encodedImage: string;
  payload: string;
  expirationDate: string;
  externalReference?: string;
  directAuthorization?: {
    id: string;
    status: string;
  };
}

/**
 * Cria QR Code PIX com autorização de débito automático recorrente
 * Usa o endpoint /v3/pix/qrCodes/immediate com directAuthorization
 * 
 * IMPORTANTE: Requer ASAAS_PIX_KEY configurada (chave PIX cadastrada no Asaas)
 */
export async function createPixAutomaticoCharge(
  customer: AsaasCustomer,
  amount: number,
  totalMonths: number,
  description?: string,
  externalReference?: string
): Promise<{
  paymentId: string;
  qrCodeBase64: string;
  pixCopiaECola: string;
  expiresAt: string;
  directAuthorizationId?: string;
}> {
  const pixKey = Deno.env.get('ASAAS_PIX_KEY');
  
  if (!pixKey) {
    throw new Error('ASAAS_PIX_KEY não configurada. Configure nas secrets do Supabase para habilitar PIX Automático.');
  }

  log('info', 'Creating PIX Automático charge with direct authorization', { 
    customerName: customer.name, 
    amount,
    totalMonths
  });

  // Obter ou criar cliente
  const customerId = await getOrCreateCustomer(customer);

  // Calcular datas
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Começa amanhã
  
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + totalMonths);

  // Configurar autorização de débito automático
  const directAuthorization: DirectAuthorizationConfig = {
    recurrenceFrequency: 'MONTHLY',
    maxPayments: totalMonths,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    description: description || `Assinatura EXA Mídia - ${totalMonths} meses`,
    allowUpdate: false
  };

  log('info', 'Direct Authorization config', { directAuthorization });

  // Criar QR Code PIX com autorização de débito automático
  // Endpoint: POST /v3/pix/qrCodes/immediate
  const payload = {
    addressKey: pixKey,
    description: description || `Pagamento EXA Mídia - ${totalMonths}x R$ ${amount.toFixed(2)}`,
    value: amount,
    format: 'ALL',
    expirationSeconds: 3600, // 1 hora para escanear e autorizar
    externalReference: externalReference,
    allowsMultiplePayments: false,
    directAuthorization: directAuthorization
  };

  log('info', 'PIX Automático request payload', { payload });

  const response = await asaasRequest<PixAutomaticoResponse>(
    'POST',
    '/pix/qrCodes/immediate',
    payload
  );

  log('info', 'PIX Automático QR Code created', { 
    id: response.id,
    hasDirectAuth: !!response.directAuthorization,
    directAuthId: response.directAuthorization?.id,
    directAuthStatus: response.directAuthorization?.status
  });

  return {
    paymentId: response.id,
    qrCodeBase64: response.encodedImage,
    pixCopiaECola: response.payload,
    expiresAt: response.expirationDate,
    directAuthorizationId: response.directAuthorization?.id
  };
}

/**
 * Consulta status de uma autorização de débito automático
 */
export async function getDirectAuthorizationStatus(authorizationId: string): Promise<{
  id: string;
  status: string;
  createdAt: string;
  customer?: string;
}> {
  log('info', 'Getting direct authorization status', { authorizationId });
  
  const response = await asaasRequest<{
    id: string;
    status: string;
    createdAt: string;
    customer?: string;
  }>('GET', `/pix/directAuthorizations/${authorizationId}`);
  
  log('info', 'Direct authorization status retrieved', { 
    authorizationId, 
    status: response.status 
  });
  
  return response;
}

// ========================================
// UTILITÁRIOS
// ========================================

/**
 * Cancela uma assinatura
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  log('info', 'Cancelling subscription', { subscriptionId });
  
  await asaasRequest<void>('DELETE', `/subscriptions/${subscriptionId}`);
  
  log('info', 'Subscription cancelled', { subscriptionId });
}

/**
 * Obtém status de uma assinatura
 */
export async function getSubscriptionStatus(subscriptionId: string): Promise<AsaasSubscriptionResponse> {
  log('info', 'Getting subscription status', { subscriptionId });
  
  const subscription = await asaasRequest<AsaasSubscriptionResponse>(
    'GET',
    `/subscriptions/${subscriptionId}`
  );
  
  log('info', 'Subscription status retrieved', { 
    subscriptionId, 
    status: subscription.status 
  });
  
  return subscription;
}
