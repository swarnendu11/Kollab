import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium leading-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-500/25",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-500/30",
        emerald:
          "bg-[#10B981] text-white hover:bg-[#059669] shadow-sm shadow-emerald-500/25",
        coral:
          "bg-[#F43F5E] text-white hover:bg-[#E11D48] shadow-sm shadow-rose-500/25",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 text-slate-700",
        link:
          "text-indigo-600 underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-to-r from-indigo-600 via-emerald-500 to-rose-500 text-white hover:opacity-95 shadow-md shadow-indigo-500/20",
        success:
          "bg-[#10B981] text-white hover:bg-[#059669] shadow-sm shadow-emerald-500/25",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        md: "h-9 rounded-xl px-3.5 text-xs font-semibold",
        lg: "h-12 rounded-2xl px-6 text-base font-semibold",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
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
