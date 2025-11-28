
import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-[18px] w-[18px] shrink-0 rounded-md border-2 border-gray-300",
      "hover:border-gray-400 hover:bg-gray-50",
      "transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-40",
      "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
      "data-[state=checked]:shadow-sm",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-white",
        "animate-in zoom-in-50 duration-150"
      )}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
