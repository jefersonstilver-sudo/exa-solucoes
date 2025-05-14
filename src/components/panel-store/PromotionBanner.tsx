
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface PromotionBannerProps {
  showPromotion: boolean;
  setShowPromotion: (show: boolean) => void;
}

const PromotionBanner: React.FC<PromotionBannerProps> = ({
  showPromotion,
  setShowPromotion
}) => {
  if (!showPromotion) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="mb-8 bg-gradient-to-r from-[#3C1361] to-[#3C1361]/90 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgzMCkiPjxwYXRoIGQ9Ik0gLTEwLDEwIGwgNjAsLTIwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMC41IiBzdHJva2Utb3BhY2l0eT0iMC4xIiBzdHJva2U9IiNmZmYiIGZpbGw9Im5vbmUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjcGF0dGVybikiLz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
        <div className="mb-4 md:mb-0 max-w-lg">
          <h3 className="text-xl md:text-2xl font-bold mb-2">É novo por aqui? Ganhe um bônus de estreia na sua primeira campanha! ✨</h3>
          <p className="text-sm md:text-base text-white/80">
            Ganhe 1 vídeo profissional por mês com a Indexa Produtora!
          </p>
        </div>
        <Button 
          className="bg-[#00FFAB] hover:bg-[#00FFAB]/90 text-[#3C1361] font-medium py-6 px-8 rounded-xl transition-transform hover:scale-105 duration-200 text-base"
          onClick={() => setShowPromotion(false)}
        >
          Ver promoção
        </Button>
      </div>
    </motion.div>
  );
};

export default PromotionBanner;
