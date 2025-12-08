import { FiLock } from "react-icons/fi";

interface FeatureBadgeProps {
  label: string;
  variant?: "pro" | "enterprise" | "premium";
  size?: "sm" | "md";
}

export default function FeatureBadge({
  label,
  variant = "pro",
  size = "sm",
}: FeatureBadgeProps) {
  const variantStyles = {
    pro: "bg-brand-100 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400",
    enterprise:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    premium:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  };

  const sizeStyles = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium uppercase tracking-wide ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      <FiLock className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}
