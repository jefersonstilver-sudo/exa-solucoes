
// Plan configuration with updated pricing and benefits
export const CHECKOUT_STEPS = {
  REVIEW: 0,
  PLAN: 1,
  COUPON: 2,
  PAYMENT: 3
};

// Plan configuration with updated pricing and benefits
export const PLANS = {
  1: {
    months: 1,
    pricePerMonth: 250,
    discount: 0,
    extras: []
  },
  3: {
    months: 3,
    pricePerMonth: 220,
    discount: 12,
    extras: ['🎥 1 vídeo por mês produzido pela Indexa']
  },
  6: {
    months: 6,
    pricePerMonth: 200,
    discount: 20,
    extras: ['🎥 1 vídeo por mês produzido pela Indexa']
  },
  12: {
    months: 12,
    pricePerMonth: 180,
    discount: 28,
    extras: ['🎥 1 vídeo por mês produzido pela Indexa', '🎬 Vídeo institucional', '🎞️ Bônus de exibição ininterrupta de 30s']
  }
};

// MercadoPago test credentials
export const MP_PUBLIC_KEY = "TEST-c7666b6a-b135-4b17-9e3e-e9e0933953be";
