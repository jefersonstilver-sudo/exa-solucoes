import { usePrivacyModeStore } from '@/hooks/usePrivacyMode';
import { cn } from '@/lib/utils';

interface PrivacyMaskProps {
  value: string | number;
  className?: string;
  maskLength?: 'short' | 'medium' | 'long';
}

const MASK_DOTS = {
  short: '•••',
  medium: '•••••',
  long: '••••••••'
};

export const PrivacyMask = ({ 
  value, 
  className,
  maskLength = 'medium' 
}: PrivacyMaskProps) => {
  const { isPrivate } = usePrivacyModeStore();

  if (isPrivate) {
    return (
      <span 
        className={cn(
          "inline-block select-none tracking-wider",
          "text-muted-foreground/60",
          "transition-all duration-300 ease-out",
          className
        )}
        title="Pressione ALT+M para exibir"
      >
        {MASK_DOTS[maskLength]}
      </span>
    );
  }

  return <span className={className}>{value}</span>;
};

export default PrivacyMask;
