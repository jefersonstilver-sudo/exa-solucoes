
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
    data-checkbox="true"
    className={cn(
      // Tamanho fixo Apple-style (18px)
      "peer shrink-0",
      "h-[18px] w-[18px] min-h-[18px] min-w-[18px] max-h-[18px] max-w-[18px]",
      // Cantos arredondados Apple
      "rounded-[5px]",
      // Borda elegante
      "border-[1.5px] border-gray-300",
      // Hover sutil
      "hover:border-gray-400 hover:bg-gray-50/50",
      // Transição suave
      "transition-all duration-200 ease-out",
      // Focus ring
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400/50",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-40",
      // Checked state - Apple blue
      "data-[state=checked]:bg-[#007AFF] data-[state=checked]:border-[#007AFF]",
      "data-[state=checked]:text-white",
      // Shadow sutil quando marcado
      "data-[state=checked]:shadow-sm",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-current",
        "animate-in zoom-in-75 duration-150"
      )}
    >
      <Check className="h-3 w-3" strokeWidth={2.5} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
