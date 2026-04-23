import React from 'react';
import { motion } from 'framer-motion';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}

const Reveal: React.FC<RevealProps> = ({ children, delay = 0, className, y = 20 }) => (
  <motion.div
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
);

export default Reveal;
