import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

const LaunchCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    // Data de lançamento: Sexta-feira 22 de Janeiro de 2025
    const launchDate = new Date('2025-01-22T00:00:00');
    
    const timer = setInterval(() => {
      const now = new Date();
      const difference = launchDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setIsLaunched(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isLaunched) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-500 text-white p-4 rounded-lg shadow-lg mb-8"
      >
        <div className="flex items-center justify-center">
          <Calendar className="h-6 w-6 mr-2" />
          <span className="text-lg font-bold">🎉 Vendas Abertas! 🎉</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl shadow-xl mb-8"
    >
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Clock className="h-6 w-6 mr-2" />
          <h3 className="text-xl font-bold">Vendas Começam em:</h3>
        </div>
        
        <div className="text-sm font-medium mb-4 opacity-90">
          Sexta-feira, 22 de Janeiro de 2025
        </div>

        <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
          {[
            { label: 'Dias', value: timeLeft.days },
            { label: 'Horas', value: timeLeft.hours },
            { label: 'Min', value: timeLeft.minutes },
            { label: 'Seg', value: timeLeft.seconds }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="bg-white/20 backdrop-blur-sm rounded-lg p-3"
            >
              <div className="text-2xl font-bold">{item.value.toString().padStart(2, '0')}</div>
              <div className="text-xs opacity-80 uppercase tracking-wide">{item.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 text-sm opacity-90">
          Fique atento! Em breve você poderá reservar os melhores espaços publicitários.
        </div>
      </div>
    </motion.div>
  );
};

export default LaunchCountdown;