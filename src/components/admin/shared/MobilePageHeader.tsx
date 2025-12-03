import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  className
}) => {
  return (
    <div className={cn(
      "sticky top-0 z-10 mobile-header-clean",
      className
    )}>
      <div className="px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {Icon && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon className="w-4.5 h-4.5 text-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-foreground truncate leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobilePageHeader;
