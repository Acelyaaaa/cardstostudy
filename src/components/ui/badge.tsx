import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "easy" | "medium" | "hard" | "success" | "warning";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-gray-100 text-gray-600": variant === "default",
          "bg-emerald-50 text-emerald-700": variant === "easy" || variant === "success",
          "bg-amber-50 text-amber-700": variant === "medium" || variant === "warning",
          "bg-red-50 text-red-700": variant === "hard",
        },
        className
      )}
      {...props}
    />
  );
}