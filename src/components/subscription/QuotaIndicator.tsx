import { useMemo } from "react";
import type { QuotaCheck } from "../../types/subscription";

interface QuotaIndicatorProps {
  label: string;
  quota: QuotaCheck;
  icon?: React.ReactNode;
  showUpgradeButton?: boolean;
  onUpgradeClick?: () => void;
}

export default function QuotaIndicator({
  label,
  quota,
  icon,
  showUpgradeButton = false,
  onUpgradeClick,
}: QuotaIndicatorProps) {
  const { current_usage, limit, percentage_used, remaining } = quota;

  // Déterminer la couleur en fonction du pourcentage
  const { color, bgColor, textColor } = useMemo(() => {
    if (percentage_used >= 100) {
      return {
        color: "bg-red-500",
        bgColor: "bg-red-100 dark:bg-red-900/20",
        textColor: "text-red-700 dark:text-red-400",
      };
    } else if (percentage_used >= 80) {
      return {
        color: "bg-orange-500",
        bgColor: "bg-orange-100 dark:bg-orange-900/20",
        textColor: "text-orange-700 dark:text-orange-400",
      };
    } else if (percentage_used >= 60) {
      return {
        color: "bg-yellow-500",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
        textColor: "text-yellow-700 dark:text-yellow-400",
      };
    } else {
      return {
        color: "bg-green-500",
        bgColor: "bg-green-100 dark:bg-green-900/20",
        textColor: "text-green-700 dark:text-green-400",
      };
    }
  }, [percentage_used]);

  const isUnlimited = limit === -1;

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${bgColor}`}>
              <div className={textColor}>{icon}</div>
            </div>
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
        </div>
        {showUpgradeButton && percentage_used >= 80 && (
          <button
            onClick={onUpgradeClick}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            Upgrade
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {!isUnlimited && (
        <div className="mb-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} transition-all duration-300`}
              style={{ width: `${Math.min(percentage_used, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between text-xs">
        {isUnlimited ? (
          <span className="text-gray-600 dark:text-gray-400">
            {current_usage} utilisé • Illimité
          </span>
        ) : (
          <>
            <span className="text-gray-600 dark:text-gray-400">
              {current_usage} / {limit} utilisé{current_usage > 1 ? "s" : ""}
            </span>
            <span className={`font-medium ${textColor}`}>
              {remaining} restant{remaining > 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>

      {/* Warning Message */}
      {percentage_used >= 80 && !isUnlimited && (
        <div className={`mt-3 p-2 rounded ${bgColor}`}>
          <p className={`text-xs ${textColor}`}>
            {percentage_used >= 100
              ? "⚠️ Limite atteinte. Passez à un plan supérieur pour continuer."
              : `⚠️ ${percentage_used}% utilisé. Pensez à upgrader votre plan.`}
          </p>
        </div>
      )}
    </div>
  );
}
