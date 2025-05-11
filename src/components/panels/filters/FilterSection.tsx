
import React from 'react';
import { Label } from '@/components/ui/label';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterSectionProps {
  title: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
}

const sectionVariants = {
  open: { height: 'auto', opacity: 1, marginBottom: 16 },
  closed: { height: 0, opacity: 0, marginBottom: 0 }
};

const FilterSection: React.FC<FilterSectionProps> = ({ 
  title, 
  isExpanded, 
  onToggleExpand, 
  children 
}) => {
  return (
    <div className="mb-2">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={onToggleExpand}
      >
        <Label className="font-medium text-[#7C3AED] flex items-center">
          {title}
        </Label>
        <ChevronDown 
          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </div>
      
      <motion.div
        variants={sectionVariants}
        animate={isExpanded ? 'open' : 'closed'}
        initial="closed"
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default FilterSection;
