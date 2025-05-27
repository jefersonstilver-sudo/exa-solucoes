
import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// COMPONENTE MELHORADO com glow effect mais visível
const AvatarGlow = React.forwardRef<
  React.ElementRef<typeof React.Fragment>,
  React.HTMLAttributes<HTMLDivElement> & { active?: boolean }
>(({ className, active = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-full transition-all duration-300",
      active && [
        "before:absolute before:-inset-[2px] before:rounded-full before:opacity-60 before:blur-[1px] before:content-['']",
        "before:bg-gradient-to-r before:from-[#00FFAB] before:via-[#58E3AB] before:to-[#00FFAB]",
        "before:animate-pulse"
      ],
      className
    )}
    {...props}
  >
    <div className={cn(
      "relative rounded-full",
      active && "ring-2 ring-[#00FFAB]/30 ring-offset-2 ring-offset-transparent"
    )}>
      {children}
    </div>
  </div>
))
AvatarGlow.displayName = "AvatarGlow"

export { Avatar, AvatarImage, AvatarFallback, AvatarGlow }
