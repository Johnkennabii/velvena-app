import { useState } from "react";

interface Badge {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: "emerald" | "blue" | "rose" | "amber";
}

interface StackedBadgesProps {
  badges: Badge[];
}

const colorClasses = {
  emerald: {
    bg: "bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500",
    ring: "ring-emerald-500/30",
  },
  blue: {
    bg: "bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500",
    ring: "ring-blue-500/30",
  },
  rose: {
    bg: "bg-gradient-to-br from-rose-500 to-red-600 dark:from-rose-400 dark:to-red-500",
    ring: "ring-rose-500/30",
  },
  amber: {
    bg: "bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-500",
    ring: "ring-amber-500/30",
  },
};

/**
 * Composant de badges empilés façon iOS
 * - Desktop: hover sur la carte entière pour déployer
 * - Mobile/Tablette: tap sur les badges pour déployer
 */
export default function StackedBadges({ badges }: StackedBadgesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (badges.length === 0) return null;

  const handleClick = () => {
    // Toggle seulement sur mobile (détection touch)
    if ("ontouchstart" in window) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className="group/badges relative flex items-center"
      onClick={handleClick}
    >
      {/* Container des badges avec animation */}
      <div className="flex items-center">
        {badges.map((badge, index) => {
          const colors = colorClasses[badge.color];

          return (
            <div
              key={badge.id}
              className="transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:!ml-1"
              style={{
                // Position empilée par défaut, espacée au hover de la carte/expand
                marginLeft: index === 0 ? "0" : isExpanded ? "0.25rem" : "-0.75rem",
                zIndex: badges.length - index,
                transitionDelay: `${index * 50}ms`,
              }}
            >
              <div
                className={`
                  relative overflow-hidden rounded-full backdrop-blur-xl
                  shadow-lg ring-2 ring-white/50 dark:ring-black/50
                  transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  ${colors.ring}
                `}
                style={{
                  transitionDelay: `${index * 50}ms`,
                }}
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 ${colors.bg} transition-all duration-500`} />

                {/* Content */}
                <div className="relative flex items-center gap-1.5 px-2 py-1.5">
                  {/* Icône toujours visible */}
                  <div className="h-3.5 w-3.5 flex-shrink-0 text-white transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
                    {badge.icon}
                  </div>

                  {/* Label visible seulement quand déployé (hover carte ou click mobile) */}
                  <span
                    className={`
                      whitespace-nowrap text-[10px] font-bold text-white
                      transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden
                      ${isExpanded ? "max-w-[200px] opacity-100" : "max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100"}
                    `}
                    style={{
                      transitionDelay: `${(index * 50) + 100}ms`,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicateur tap (visible sur mobile uniquement) */}
      <div className="pointer-events-none absolute -right-1 -top-1 opacity-0 transition-opacity md:hidden">
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800">
          <svg className="h-2.5 w-2.5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? "M6 18L18 6M6 6l12 12" : "M9 5l7 7-7 7"} />
          </svg>
        </div>
      </div>
    </div>
  );
}
