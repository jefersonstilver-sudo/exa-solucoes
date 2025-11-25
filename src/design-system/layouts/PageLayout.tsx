import React from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'gradient' | 'dark';
  className?: string;
}

export const PageLayout = ({ 
  title,
  subtitle,
  children,
  actions,
  variant = 'default',
  className
}: PageLayoutProps) => {
  const backgrounds = {
    default: 'bg-[hsl(var(--apple-gray-50))]',
    gradient: 'bg-gradient-to-br from-gray-50 via-white to-gray-50',
    dark: 'bg-[hsl(var(--apple-gray-900))]',
  };

  return (
    <div className={cn(
      'min-h-screen',
      backgrounds[variant],
      'p-[var(--space-6)] lg:p-[var(--space-10)]',
      className
    )}>
      {/* Header Padronizado Apple-like */}
      <header className="mb-[var(--space-8)] flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-[var(--text-3xl)] font-semibold tracking-tight text-[hsl(var(--apple-gray-900))]">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[var(--text-base)] text-[hsl(var(--apple-gray-500))] font-light">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-[var(--space-3)]">
            {actions}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="space-y-[var(--space-6)]">
        {children}
      </main>
    </div>
  );
};
