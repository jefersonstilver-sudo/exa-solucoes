
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorDisplayProps {
  error: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-start"
    >
      <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-red-800">{error}</p>
    </motion.div>
  );
};

export default ErrorDisplay;
