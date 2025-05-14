
import React from 'react';
import { motion } from 'framer-motion';

const CheckoutHeader: React.FC = () => {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="mb-10 text-center"
    >
      <h1 className="text-3xl font-bold text-[#1E1B4B]">
        🎬 Sua campanha está prestes a estrear
      </h1>
      <p className="text-muted-foreground mt-2">
        O próximo anúncio de sucesso começa agora. Confirme sua veiculação abaixo.
      </p>
    </motion.div>
  );
};

export default CheckoutHeader;
