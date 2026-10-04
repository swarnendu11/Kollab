import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#10B981] text-white shadow-xs shadow-emerald-500/20",
        secondary:
          "border-transparent bg-emerald-50 text-emerald-800 border-emerald-100",
        destructive:
          "border-transparent bg-red-100 text-red-700 border-red-200",
        outline:
          "text-emerald-900 border-emerald-200 bg-white",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 border-emerald-200",
        warning:
          "border-transparent bg-amber-100 text-amber-800 border-amber-200",
        cyan:
          "border-transparent bg-teal-100 text-teal-800 border-teal-200",
        pink:
          "border-transparent bg-emerald-200/60 text-emerald-950 border-emerald-300",
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
