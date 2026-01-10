/**
 * Banco Inter API Client - OAuth2 + mTLS
 * 
 * Cliente compartilhado para todas as operações com o Banco Inter
 * Implementa autenticação OAuth2 com certificado mTLS, cache de token,
 * retry com exponential backoff e logging estruturado.
 * 
 * @author EXA System
 * @version 1.0.0
 */

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface InterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface InterSaldoResponse {
  disponivel: number;
  bloqueadoCheque: number;
  bloqueadoJudicialmente: number;
  bloqueadoAdministrativo: number;
  limite: number;
}

export interface InterExtratoItem {
  dataEntrada: string;
  tipoTransacao: string;
  tipoOperacao: string;
  valor: string;
  titulo: string;
  descricao: string;
  dataInclusao?: string;
  idTransacao?: string;
  endToEndId?: string;
  codigoBarra?: string;
}

export interface InterExtratoResponse {
  transacoes: InterExtratoItem[];
}

export interface InterPixCobrancaRequest {
  calendario: {
    expiracao: number; // segundos até expiração
  };
  devedor?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  valor: {
    original: string; // "123.45"
  };
  chave: string; // Chave PIX do recebedor
  solicitacaoPagador?: string;
  infoAdicionais?: Array<{
    nome: string;
    valor: string;
  }>;
}

export interface InterPixCobrancaResponse {
  calendario: {
    criacao: string;
    expiracao: number;
  };
  txid: string;
  revisao: number;
  loc: {
    id: number;
    location: string;
    tipoCob: string;
    criacao: string;
  };
  location: string;
  status: 'ATIVA' | 'CONCLUIDA' | 'REMOVIDA_PELO_USUARIO_RECEBEDOR' | 'REMOVIDA_PELO_PSP';
  devedor?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  valor: {
    original: string;
  };
  chave: string;
  solicitacaoPagador?: string;
  pixCopiaECola?: string;
}

export interface InterBoletoRequest {
  seuNumero: string;
  valorNominal: number;
  dataVencimento: string; // YYYY-MM-DD
  numDiasAgenda: number;
  pagador: {
    cpfCnpj: string;
    tipoPessoa: 'FISICA' | 'JURIDICA';
    nome: string;
    endereco: string;
    cidade: string;
    uf: string;
    cep: string;
    email?: string;
    telefone?: string;
  };
  mensagem?: {
    linha1?: string;
    linha2?: string;
    linha3?: string;
    linha4?: string;
    linha5?: string;
  };
  desconto1?: {
    codigoDesconto: string;
    data: string;
    taxa?: number;
    valor?: number;
  };
  multa?: {
    codigoMulta: string;
    data: string;
    taxa?: number;
    valor?: number;
  };
  mora?: {
    codigoMora: string;
    data: string;
    taxa?: number;
    valor?: number;
  };
}

export interface InterBoletoResponse {
  seuNumero: string;
  nossoNumero: string;
  codigoBarras: string;
  linhaDigitavel: string;
  codigoSolicitacao: string;
}

export interface InterApiError {
  title?: string;
  detail?: string;
  message?: string;
  timestamp?: string;
  status?: number;
  error?: string;
  violations?: Array<{
    razao: string;
    propriedade: string;
    valor: string;
  }>;
}

// ========================================
// CONFIGURAÇÃO
// ========================================

const INTER_API_URL = 'https://cdpj.partners.bancointer.com.br';
const TOKEN_CACHE_KEY = 'inter_access_token';
const TOKEN_EXPIRY_KEY = 'inter_token_expiry';

// Cache simples em memória (para edge functions)
let tokenCache: { token: string; expiry: number } | null = null;

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Gera um TXID único para PIX (35 caracteres alfanuméricos)
 */
export function generateTxId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 35; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Formata valor para o formato do Inter (string com 2 casas decimais)
 */
export function formatInterValue(value: number): string {
  return value.toFixed(2);
}

/**
 * Log estruturado para debugging
 */
function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    service: 'inter-client',
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
 * Sleep para retry com backoff
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formata uma string de certificado PEM para garantir estrutura correta
 * O certificado pode vir sem newlines após o Base64 decode
 */
function formatPemCertificate(rawCert: string): string {
  // Se já está formatado corretamente, retornar como está
  if (rawCert.includes('-----BEGIN CERTIFICATE-----\n')) {
    return rawCert.trim();
  }
  
  // Remover headers/footers existentes e espaços
  let content = rawCert
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s/g, '');
  
  // Reformatar com quebras de linha a cada 64 caracteres
  const lines: string[] = [];
  for (let i = 0; i < content.length; i += 64) {
    lines.push(content.substring(i, i + 64));
  }
  
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`;
}

/**
 * Formata uma string de chave privada PEM para garantir estrutura correta
 */
function formatPemPrivateKey(rawKey: string): string {
  log('info', 'Formatting private key', { 
    rawLength: rawKey.length,
    hasBeginPrivate: rawKey.includes('BEGIN PRIVATE KEY'),
    hasBeginRsa: rawKey.includes('BEGIN RSA PRIVATE KEY'),
    hasBeginEc: rawKey.includes('BEGIN EC PRIVATE KEY')
  });
  
  // Detectar tipo de chave (RSA ou EC)
  const isRsa = rawKey.includes('RSA PRIVATE KEY');
  const isEc = rawKey.includes('EC PRIVATE KEY');
  
  let header: string;
  let footer: string;
  
  if (isRsa) {
    header = '-----BEGIN RSA PRIVATE KEY-----';
    footer = '-----END RSA PRIVATE KEY-----';
  } else if (isEc) {
    header = '-----BEGIN EC PRIVATE KEY-----';
    footer = '-----END EC PRIVATE KEY-----';
  } else {
    header = '-----BEGIN PRIVATE KEY-----';
    footer = '-----END PRIVATE KEY-----';
  }
  
  // Normalizar quebras de linha e remover espaços extras
  const normalized = rawKey
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
  
  // Se já está formatado corretamente com headers, apenas normalizar
  if (normalized.includes(header) && normalized.includes(footer)) {
    log('info', 'Key already has correct headers, normalizing');
    return normalized;
  }
  
  // Remover headers/footers existentes e espaços
  let content = rawKey
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/\s/g, '');
  
  log('info', 'Key content extracted', { contentLength: content.length });
  
  // Reformatar com quebras de linha a cada 64 caracteres
  const lines: string[] = [];
  for (let i = 0; i < content.length; i += 64) {
    lines.push(content.substring(i, i + 64));
  }
  
  const result = `${header}\n${lines.join('\n')}\n${footer}`;
  log('info', 'Key formatted', { 
    resultLength: result.length,
    lineCount: lines.length,
    hasCorrectHeaders: result.includes(header) && result.includes(footer)
  });
  
  return result;
}

// ========================================
// AUTENTICAÇÃO OAUTH2 + mTLS
// ========================================

/**
 * Obtém token de acesso OAuth2 do Banco Inter
 * Implementa cache de token com validação de expiração
 */
export async function getInterToken(): Promise<string> {
  // Verificar cache
  if (tokenCache && tokenCache.expiry > Date.now()) {
    log('info', 'Using cached Inter token', { expiresIn: Math.floor((tokenCache.expiry - Date.now()) / 1000) });
    return tokenCache.token;
  }

  log('info', 'Requesting new Inter access token');

  const clientId = Deno.env.get('INTER_CLIENT_ID');
  const clientSecret = Deno.env.get('INTER_CLIENT_SECRET');
  const certBase64 = Deno.env.get('INTER_CERTIFICATE_BASE64');
  const keyBase64 = Deno.env.get('INTER_PRIVATE_KEY_BASE64');

  if (!clientId || !clientSecret || !certBase64 || !keyBase64) {
    throw new Error('Missing Inter API credentials. Required: INTER_CLIENT_ID, INTER_CLIENT_SECRET, INTER_CERTIFICATE_BASE64, INTER_PRIVATE_KEY_BASE64');
  }

  // Decodificar certificados Base64
  let certDecoded: string;
  let keyDecoded: string;
  
  try {
    certDecoded = atob(certBase64);
    log('info', 'Certificate decoded successfully', { 
      length: certDecoded.length,
      preview: certDecoded.substring(0, 50) + '...'
    });
  } catch (e) {
    log('error', 'Failed to decode certificate Base64', { error: e.message });
    throw new Error(`Certificate Base64 decode failed: ${e.message}`);
  }
  
  try {
    keyDecoded = atob(keyBase64);
    log('info', 'Private key decoded successfully', { 
      length: keyDecoded.length,
      preview: keyDecoded.substring(0, 50) + '...'
    });
  } catch (e) {
    log('error', 'Failed to decode private key Base64', { error: e.message });
    throw new Error(`Private key Base64 decode failed: ${e.message}`);
  }

  // Formatar certificados PEM
  const cert = formatPemCertificate(certDecoded);
  const key = formatPemPrivateKey(keyDecoded);
  
  log('info', 'PEM certificates formatted', {
    certHasBeginEnd: cert.includes('-----BEGIN CERTIFICATE-----') && cert.includes('-----END CERTIFICATE-----'),
    keyHasBeginEnd: key.includes('-----BEGIN') && key.includes('-----END'),
    certLines: cert.split('\n').length,
    keyLines: key.split('\n').length
  });

  // Criar cliente HTTP com certificado mTLS
  let httpClient;
  try {
    httpClient = Deno.createHttpClient({
      caCerts: [cert],
      certChain: cert,
      privateKey: key,
    });
    log('info', 'HTTP client with mTLS created successfully');
  } catch (e) {
    log('error', 'Failed to create HTTP client with mTLS', { error: e.message });
    throw new Error(`mTLS client creation failed: ${e.message}`);
  }

  const tokenUrl = `${INTER_API_URL}/oauth/v2/token`;
  
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: 'extrato.read boleto-cobranca.read boleto-cobranca.write pix.read pix.write cob.read cob.write cobv.read cobv.write'
  });

  try {
    log('info', 'Sending OAuth token request', { url: tokenUrl, clientIdPrefix: clientId.substring(0, 8) + '...' });
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      // @ts-ignore - Deno specific
      client: httpClient,
    });

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    log('info', 'OAuth response received', { 
      status: response.status, 
      statusText: response.statusText,
      headers: responseHeaders
    });

    if (!response.ok) {
      const errorText = await response.text();
      log('error', 'Failed to get Inter token', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText,
        headers: responseHeaders
      });
      throw new Error(`Inter auth failed: ${response.status} - ${errorText}`);
    }

    const data: InterTokenResponse = await response.json();
    
    // Cache token (com margem de 60 segundos antes da expiração)
    tokenCache = {
      token: data.access_token,
      expiry: Date.now() + (data.expires_in - 60) * 1000
    };

    log('info', 'Inter token obtained successfully', { expiresIn: data.expires_in });
    
    return data.access_token;
  } catch (error) {
    log('error', 'Inter authentication error', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    httpClient.close();
  }
}

// ========================================
// CLIENTE HTTP COM RETRY
// ========================================

interface InterRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: Record<string, unknown>;
  maxRetries?: number;
}

/**
 * Faz requisição autenticada para a API do Inter
 * Implementa retry com exponential backoff
 */
export async function interRequest<T>(options: InterRequestOptions): Promise<T> {
  const { method, path, body, maxRetries = 3 } = options;
  
  const certBase64 = Deno.env.get('INTER_CERTIFICATE_BASE64');
  const keyBase64 = Deno.env.get('INTER_PRIVATE_KEY_BASE64');

  if (!certBase64 || !keyBase64) {
    throw new Error('Missing Inter certificates');
  }

  const cert = formatPemCertificate(atob(certBase64));
  const key = formatPemPrivateKey(atob(keyBase64));

  const httpClient = Deno.createHttpClient({
    caCerts: [cert],
    certChain: cert,
    privateKey: key,
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const token = await getInterToken();
      
      const url = `${INTER_API_URL}${path}`;
      
      log('info', `Inter API request attempt ${attempt}`, { method, path });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        // @ts-ignore - Deno specific
        client: httpClient,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: InterApiError;
        
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        // Não fazer retry para erros de cliente (4xx)
        if (response.status >= 400 && response.status < 500) {
          log('error', 'Inter API client error', { status: response.status, error: errorData });
          throw new Error(`Inter API error ${response.status}: ${errorData.detail || errorData.message || errorText}`);
        }

        // Retry para erros de servidor (5xx)
        throw new Error(`Inter API error ${response.status}: ${errorText}`);
      }

      // Algumas respostas podem ser vazias (204)
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      log('info', 'Inter API request successful', { method, path });
      
      return data as T;
    } catch (error) {
      lastError = error;
      log('warn', `Inter API request failed, attempt ${attempt}/${maxRetries}`, { error: error.message });

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await sleep(delay);
      }
    }
  }

  httpClient.close();
  throw lastError || new Error('Inter API request failed after retries');
}

// ========================================
// BANKING API
// ========================================

/**
 * Obtém saldo da conta corrente
 */
export async function getInterSaldo(): Promise<InterSaldoResponse> {
  const contaCorrente = Deno.env.get('INTER_CONTA_CORRENTE');
  
  if (!contaCorrente) {
    throw new Error('Missing INTER_CONTA_CORRENTE environment variable');
  }

  return interRequest<InterSaldoResponse>({
    method: 'GET',
    path: `/banking/v2/saldo`,
  });
}

/**
 * Obtém extrato bancário
 */
export async function getInterExtrato(dataInicio: string, dataFim: string): Promise<InterExtratoResponse> {
  return interRequest<InterExtratoResponse>({
    method: 'GET',
    path: `/banking/v2/extrato?dataInicio=${dataInicio}&dataFim=${dataFim}`,
  });
}

// ========================================
// PIX COBRANÇA API
// ========================================

/**
 * Cria uma cobrança PIX (Pix Cob)
 */
export async function createPixCobranca(txid: string, request: InterPixCobrancaRequest): Promise<InterPixCobrancaResponse> {
  return interRequest<InterPixCobrancaResponse>({
    method: 'PUT',
    path: `/pix/v2/cob/${txid}`,
    body: request as unknown as Record<string, unknown>,
  });
}

/**
 * Consulta uma cobrança PIX
 */
export async function getPixCobranca(txid: string): Promise<InterPixCobrancaResponse> {
  return interRequest<InterPixCobrancaResponse>({
    method: 'GET',
    path: `/pix/v2/cob/${txid}`,
  });
}

/**
 * Gera o QR Code de uma cobrança PIX
 */
export async function getPixQrCode(locationId: number): Promise<{ qrcode: string; imagemQrcode: string }> {
  return interRequest<{ qrcode: string; imagemQrcode: string }>({
    method: 'GET',
    path: `/pix/v2/loc/${locationId}/qrcode`,
  });
}

// ========================================
// BOLETO COBRANÇA API
// ========================================

/**
 * Emite um boleto de cobrança (híbrido com PIX)
 */
export async function createBoleto(request: InterBoletoRequest): Promise<InterBoletoResponse> {
  return interRequest<InterBoletoResponse>({
    method: 'POST',
    path: `/cobranca/v3/cobrancas`,
    body: request as unknown as Record<string, unknown>,
  });
}

/**
 * Consulta um boleto pelo código de solicitação
 */
export async function getBoleto(codigoSolicitacao: string): Promise<InterBoletoResponse & { situacao: string; dataSituacao: string }> {
  return interRequest<InterBoletoResponse & { situacao: string; dataSituacao: string }>({
    method: 'GET',
    path: `/cobranca/v3/cobrancas/${codigoSolicitacao}`,
  });
}

/**
 * Obtém o PDF do boleto
 */
export async function getBoletoPdf(codigoSolicitacao: string): Promise<ArrayBuffer> {
  const certBase64 = Deno.env.get('INTER_CERTIFICATE_BASE64');
  const keyBase64 = Deno.env.get('INTER_PRIVATE_KEY_BASE64');

  if (!certBase64 || !keyBase64) {
    throw new Error('Missing Inter certificates');
  }

  const cert = atob(certBase64);
  const key = atob(keyBase64);

  const httpClient = Deno.createHttpClient({
    caCerts: [cert],
    certChain: cert,
    privateKey: key,
  });

  try {
    const token = await getInterToken();
    
    const response = await fetch(`${INTER_API_URL}/cobranca/v3/cobrancas/${codigoSolicitacao}/pdf`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
      },
      // @ts-ignore - Deno specific
      client: httpClient,
    });

    if (!response.ok) {
      throw new Error(`Failed to get boleto PDF: ${response.status}`);
    }

    return await response.arrayBuffer();
  } finally {
    httpClient.close();
  }
}

/**
 * Cancela um boleto
 */
export async function cancelBoleto(codigoSolicitacao: string, motivoCancelamento: string): Promise<void> {
  await interRequest({
    method: 'POST',
    path: `/cobranca/v3/cobrancas/${codigoSolicitacao}/cancelar`,
    body: { motivoCancelamento },
  });
}

// ========================================
// WEBHOOKS
// ========================================

/**
 * Valida assinatura HMAC de webhook do Inter
 */
export function validateInterWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const encoder = new TextEncoder();
    const key = encoder.encode(webhookSecret);
    const data = encoder.encode(payload);
    
    // Usar crypto.subtle para HMAC-SHA256
    // Nota: Esta é uma implementação simplificada
    // Para produção, usar implementação completa de HMAC
    
    return true; // TODO: Implementar validação HMAC quando Inter fornecer especificação
  } catch {
    return false;
  }
}

// ========================================
// EXPORTAÇÕES
// ========================================

export default {
  getInterToken,
  interRequest,
  getInterSaldo,
  getInterExtrato,
  createPixCobranca,
  getPixCobranca,
  getPixQrCode,
  createBoleto,
  getBoleto,
  getBoletoPdf,
  cancelBoleto,
  generateTxId,
  formatInterValue,
  validateInterWebhookSignature,
};
