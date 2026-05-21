"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:pointer-events-none disabled:opacity-50 text-base min-h-[48px] px-6",
  {
    variants: {
      variant: {
        primary: "bg-teal-700 text-white hover:bg-teal-800",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300",
        outline: "border-2 border-teal-700 text-teal-800 hover:bg-teal-50",
        danger: "bg-red-700 text-white hover:bg-red-800",
        ghost: "text-teal-800 hover:bg-teal-50",
      },
      size: {
        default: "px-6 py-3",
        sm: "px-4 py-2 min-h-[40px] text-base",
        lg: "px-8 py-4 min-h-[56px] text-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
