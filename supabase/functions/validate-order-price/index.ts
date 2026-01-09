import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting storage (in-memory, resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Plan discount rates - MUST match frontend priceCalculator.ts
const PLAN_DISCOUNTS: Record<number, number> = {
  1: 1.00,    // No discount
  3: 0.80,    // 20% discount
  6: 0.70,    // 30% discount
  12: 0.625,  // 37.5% discount
};

const PIX_DISCOUNT = 0.05; // 5% PIX discount

// Generate HMAC signature for validation
async function generateSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  try {
    // Rate limit check
    if (!checkRateLimit(clientIp)) {
      console.error('⚠️ [VALIDATE_PRICE] Rate limit exceeded for IP:', clientIp);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          isValid: false 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { buildingIds, planMonths, couponCode, clientPrice, applyPixDiscount = true, userId } = body;

    console.log('🔍 [VALIDATE_PRICE] Request received:', {
      buildingIds,
      planMonths,
      couponCode: couponCode || 'none',
      clientPrice,
      applyPixDiscount,
      userId: userId ? userId.substring(0, 8) + '...' : 'anonymous'
    });

    // Input validation
    if (!buildingIds || !Array.isArray(buildingIds) || buildingIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'buildingIds is required and must be a non-empty array', isValid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!planMonths || ![1, 3, 6, 12].includes(planMonths)) {
      return new Response(
        JSON.stringify({ error: 'planMonths must be 1, 3, 6, or 12', isValid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof clientPrice !== 'number' || clientPrice < 0) {
      return new Response(
        JSON.stringify({ error: 'clientPrice must be a non-negative number', isValid: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const hmacSecret = Deno.env.get('CART_HMAC_SECRET') || 'default-secret-change-me';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch building prices from database
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('id, nome, preco_base, preco_trimestral, preco_semestral, preco_anual, status')
      .in('id', buildingIds);

    if (buildingsError) {
      console.error('❌ [VALIDATE_PRICE] Database error:', buildingsError);
      throw new Error('Failed to fetch building prices');
    }

    if (!buildings || buildings.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No buildings found with the provided IDs',
          isValid: false,
          buildingIds 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if all buildings were found
    if (buildings.length !== buildingIds.length) {
      const foundIds = buildings.map(b => b.id);
      const missingIds = buildingIds.filter((id: string) => !foundIds.includes(id));
      console.warn('⚠️ [VALIDATE_PRICE] Missing buildings:', missingIds);
    }

    // Calculate server price
    const breakdown: Array<{
      buildingId: string;
      buildingName: string;
      basePrice: number;
      calculatedPrice: number;
      usedManualPrice: boolean;
    }> = [];

    let subtotal = 0;
    const DEFAULT_BASE_PRICE = 200; // R$ 200/month default

    for (const building of buildings) {
      let itemPrice: number;
      let usedManualPrice = false;

      switch (planMonths) {
        case 3:
          if (building.preco_trimestral && building.preco_trimestral > 0) {
            itemPrice = building.preco_trimestral;
            usedManualPrice = true;
          } else {
            itemPrice = (building.preco_base || DEFAULT_BASE_PRICE) * 3 * PLAN_DISCOUNTS[3];
          }
          break;
        case 6:
          if (building.preco_semestral && building.preco_semestral > 0) {
            itemPrice = building.preco_semestral;
            usedManualPrice = true;
          } else {
            itemPrice = (building.preco_base || DEFAULT_BASE_PRICE) * 6 * PLAN_DISCOUNTS[6];
          }
          break;
        case 12:
          if (building.preco_anual && building.preco_anual > 0) {
            itemPrice = building.preco_anual;
            usedManualPrice = true;
          } else {
            itemPrice = (building.preco_base || DEFAULT_BASE_PRICE) * 12 * PLAN_DISCOUNTS[12];
          }
          break;
        case 1:
        default:
          itemPrice = building.preco_base || DEFAULT_BASE_PRICE;
          break;
      }

      subtotal += itemPrice;
      breakdown.push({
        buildingId: building.id,
        buildingName: building.nome || 'Unknown',
        basePrice: building.preco_base || DEFAULT_BASE_PRICE,
        calculatedPrice: itemPrice,
        usedManualPrice
      });
    }

    // Apply coupon discount if provided
    let afterCoupon = subtotal;
    let couponDiscount = 0;
    let couponValid = false;
    let couponDetails = null;

    if (couponCode) {
      // Special test coupons
      if (couponCode === '573040') {
        console.log('🎯 [VALIDATE_PRICE] Special test coupon 573040 detected');
        return new Response(
          JSON.stringify({
            isValid: true,
            serverPrice: 0.05,
            clientPrice,
            priceDifference: Math.abs(0.05 - clientPrice),
            isPotentialFraud: false,
            breakdown,
            couponApplied: { code: '573040', discount: 100, type: 'test' },
            signature: await generateSignature(`0.05-${Date.now()}`, hmacSecret),
            message: 'Test coupon applied - R$ 0.05'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (couponCode === 'CORTESIA_ADMIN') {
        console.log('🎁 [VALIDATE_PRICE] Courtesy coupon detected');
        return new Response(
          JSON.stringify({
            isValid: true,
            serverPrice: 0.00,
            clientPrice,
            priceDifference: Math.abs(0 - clientPrice),
            isPotentialFraud: false,
            breakdown,
            couponApplied: { code: 'CORTESIA_ADMIN', discount: 100, type: 'courtesy' },
            signature: await generateSignature(`0-${Date.now()}`, hmacSecret),
            message: 'Courtesy order - R$ 0.00'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch regular coupon from database
      const { data: coupon, error: couponError } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', couponCode.toUpperCase())
        .eq('ativo', true)
        .single();

      if (couponError || !coupon) {
        console.warn('⚠️ [VALIDATE_PRICE] Invalid or inactive coupon:', couponCode);
      } else {
        // Check if coupon is expired
        if (coupon.data_expiracao && new Date(coupon.data_expiracao) < new Date()) {
          console.warn('⚠️ [VALIDATE_PRICE] Expired coupon:', couponCode);
        } else if (coupon.min_meses && planMonths < coupon.min_meses) {
          console.warn('⚠️ [VALIDATE_PRICE] Plan too short for coupon:', { planMonths, minRequired: coupon.min_meses });
        } else {
          couponDiscount = coupon.desconto_percentual || 0;
          afterCoupon = subtotal * (1 - couponDiscount / 100);
          couponValid = true;
          couponDetails = {
            code: coupon.codigo,
            discount: couponDiscount,
            type: 'percentage'
          };
        }
      }
    }

    // Apply PIX discount if requested
    let pixDiscountAmount = 0;
    if (applyPixDiscount) {
      pixDiscountAmount = afterCoupon * PIX_DISCOUNT;
    }

    let serverPrice = afterCoupon - pixDiscountAmount;
    
    // Ensure minimum price (R$ 0.05)
    serverPrice = Math.max(serverPrice, 0.05);
    
    // Round to 2 decimal places
    serverPrice = Math.round(serverPrice * 100) / 100;

    // Calculate price difference
    const priceDifference = Math.abs(serverPrice - clientPrice);
    const percentDifference = clientPrice > 0 ? (priceDifference / clientPrice) * 100 : 0;
    
    // Price is valid if difference is less than 1%
    const isValid = percentDifference <= 1;
    const isPotentialFraud = percentDifference > 5;

    // Generate signature for the validated price
    const signatureData = `${serverPrice}-${buildingIds.join(',')}-${planMonths}-${Date.now()}`;
    const signature = await generateSignature(signatureData, hmacSecret);

    // Log validation for audit
    const validationLog = {
      user_id: userId || null,
      building_ids: buildingIds,
      plan_months: planMonths,
      coupon_code: couponCode || null,
      client_price: clientPrice,
      server_price: serverPrice,
      price_difference: priceDifference,
      is_valid: isValid,
      is_potential_fraud: isPotentialFraud,
      ip_address: clientIp,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    };

    // Insert audit log (don't fail if this errors)
    const { error: logError } = await supabase
      .from('price_validation_logs')
      .insert(validationLog);

    if (logError) {
      console.warn('⚠️ [VALIDATE_PRICE] Failed to insert audit log:', logError.message);
    }

    const duration = Date.now() - startTime;
    console.log('✅ [VALIDATE_PRICE] Validation complete:', {
      serverPrice,
      clientPrice,
      priceDifference,
      isValid,
      isPotentialFraud,
      duration: `${duration}ms`
    });

    return new Response(
      JSON.stringify({
        isValid,
        serverPrice,
        clientPrice,
        priceDifference,
        percentDifference: Math.round(percentDifference * 100) / 100,
        isPotentialFraud,
        breakdown,
        couponApplied: couponValid ? couponDetails : null,
        pixDiscountApplied: applyPixDiscount,
        pixDiscountAmount: Math.round(pixDiscountAmount * 100) / 100,
        signature,
        timestamp: Date.now(),
        message: isValid 
          ? 'Price validated successfully' 
          : `Price mismatch detected: expected ${serverPrice}, got ${clientPrice}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [VALIDATE_PRICE] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        isValid: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
