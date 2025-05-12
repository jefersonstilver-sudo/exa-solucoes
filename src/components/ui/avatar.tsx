
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

// New component that adds a glowing effect to the avatar
const AvatarGlow = React.forwardRef<
  React.ElementRef<typeof React.Fragment>,
  React.HTMLAttributes<HTMLDivElement> & { active?: boolean }
>(({ className, active = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative rounded-full",
      active && "before:absolute before:-inset-[3px] before:rounded-full before:bg-indexa-mint before:opacity-90 before:blur-[2px] before:content-['']",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
AvatarGlow.displayName = "AvatarGlow"

export { Avatar, AvatarImage, AvatarFallback, AvatarGlow }
