import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-indigo-200/80 bg-indigo-50 text-indigo-700",
        indigo:
          "border-transparent bg-indigo-600 text-white shadow-xs",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-700",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700",
        outline:
          "text-slate-800 border-slate-200 bg-white",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold",
        emerald:
          "border-transparent bg-emerald-500 text-white shadow-xs",
        coral:
          "border-rose-200 bg-rose-50 text-rose-700",
        live:
          "border-transparent bg-rose-500 text-white shadow-xs shadow-rose-500/30 animate-pulse",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800",
        cyan:
          "border-teal-200 bg-teal-50 text-teal-800",
        pink:
          "border-pink-200 bg-pink-50 text-pink-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
