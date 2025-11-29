import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface AlertConfigCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: 'ativo' | 'inativo';
  onClick: () => void;
  onToggle: (checked: boolean) => void;
}

export const AlertConfigCard = ({
  icon: Icon,
  title,
  description,
  status,
  onClick,
  onToggle
}: AlertConfigCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        onClick={onClick}
        className="group relative cursor-pointer bg-gradient-to-br from-white/90 to-white/60 dark:from-gray-900/90 dark:to-gray-950/60 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 rounded-2xl p-5 transition-all shadow-md hover:shadow-xl overflow-hidden"
      >
        {/* Background Gradient Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-500/10 dark:to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 flex items-start gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h4 className="font-bold text-base text-foreground truncate">
                {title}
              </h4>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(status !== 'ativo');
                }}
                className="flex-shrink-0"
              >
                <Switch 
                  checked={status === 'ativo'}
                  className={`transition-all duration-300 ${
                    status === 'ativo' 
                      ? 'data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-500 shadow-lg shadow-green-500/30' 
                      : ''
                  }`}
                />
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          </div>

          {/* Arrow Icon */}
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
        </div>
      </Card>
    </motion.div>
  );
};