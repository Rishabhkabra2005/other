import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}) {
  const variants = {
    default: "bg-slate-100 text-slate-800 border-slate-300",
    success: "bg-green-100 text-green-900 border-green-300",
    warning: "bg-amber-100 text-amber-900 border-amber-300",
    danger: "bg-red-100 text-red-900 border-red-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-base font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
