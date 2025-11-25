import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const AppleTabs = TabsPrimitive.Root;

const AppleTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-2 p-1.5',
      'rounded-full',
      'bg-gray-100/80 backdrop-blur-xl',
      'border border-gray-200/50',
      className
    )}
    {...props}
  />
));
AppleTabsList.displayName = TabsPrimitive.List.displayName;

const AppleTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap',
      'rounded-full px-6 py-2.5',
      'text-sm font-medium',
      'transition-all duration-200 ease-[var(--ease-apple)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      'text-gray-600 hover:text-gray-900',
      'data-[state=active]:bg-white data-[state=active]:text-gray-900',
      'data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
AppleTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const AppleTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-6',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
AppleTabsContent.displayName = TabsPrimitive.Content.displayName;

export { AppleTabs, AppleTabsList, AppleTabsTrigger, AppleTabsContent };
