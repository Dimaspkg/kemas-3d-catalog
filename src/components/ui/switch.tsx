
"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils"

const switchRootVariants = cva(
  "group peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
  {
    variants: {
      size: {
        default: "h-10 w-[90px]",
        sm: "h-9 w-20",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const switchThumbVariants = cva(
    "pointer-events-none flex items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-transform text-sm font-semibold",
    {
      variants: {
        size: {
          default: "h-9 w-12 data-[state=checked]:translate-x-9 data-[state=unchecked]:translate-x-0",
          sm: "h-8 w-10 data-[state=checked]:translate-x-9 data-[state=unchecked]:translate-x-0",
        },
      },
      defaultVariants: {
        size: "default",
      },
    }
);


const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & VariantProps<typeof switchRootVariants>
>(({ className, size, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(switchRootVariants({ size, className }))}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(switchThumbVariants({size}))}
    >
      <span className="hidden group-data-[state=checked]:block text-primary">Open</span>
      <span className="hidden group-data-[state=unchecked]:block text-muted-foreground">Close</span>
    </SwitchPrimitives.Thumb>
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
