
import React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, CreditCard } from "lucide-react";

const SecurityBadges = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mt-4 py-3 px-4 bg-gray-50 rounded-lg border border-gray-100"
    >
      <p className="text-xs text-gray-500 text-center flex items-center justify-center">
        <Lock className="inline-block h-3.5 w-3.5 mr-1.5 text-gray-400" />
        Ambiente seguro com criptografia — seus dados estão protegidos
      </p>
    </motion.div>
  );
};

export default SecurityBadges;
