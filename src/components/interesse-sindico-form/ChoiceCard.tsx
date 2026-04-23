import React from 'react';
import { Check } from 'lucide-react';

interface Props {
  selected: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  type?: 'radio' | 'checkbox';
}

export const ChoiceCard: React.FC<Props> = ({ selected, onClick, label, description, icon, type = 'radio' }) => {
  return (
    <button
      type="button"
      role={type === 'radio' ? 'radio' : 'checkbox'}
      aria-checked={selected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onClick();
        }
      }}
      className="sif-choice w-full text-left"
      data-selected={selected}
    >
      {icon && <span className="text-white/70 shrink-0">{icon}</span>}
      <span className="flex-1 min-w-0 pr-7">
        <span className="block text-[15px] font-medium text-white">{label}</span>
        {description && <span className="block text-xs text-white/55 mt-0.5">{description}</span>}
      </span>
      <span className="sif-choice-marker">
        <Check size={14} strokeWidth={3} />
      </span>
    </button>
  );
};

export default ChoiceCard;
