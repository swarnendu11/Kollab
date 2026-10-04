import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#10B981] text-white hover:bg-[#059669] shadow-sm shadow-[#10B981]/30",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-500/30",
        outline:
          "border border-emerald-200/80 bg-white hover:bg-emerald-50/60 text-slate-800",
        secondary:
          "bg-emerald-50 text-emerald-950 hover:bg-emerald-100/80",
        ghost:
          "hover:bg-emerald-50/80 hover:text-emerald-950 text-slate-700",
        link:
          "text-[#10B981] underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-[#10B981] via-[#059669] to-[#0D9488] text-white hover:opacity-95 shadow-md shadow-[#10B981]/25",
        success:
          "bg-[#10B981] text-white hover:bg-[#059669] shadow-sm shadow-emerald-500/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-6 text-base font-semibold",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
