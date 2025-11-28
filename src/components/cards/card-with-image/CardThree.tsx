import { ReactNode } from "react";
import clsx from "clsx";
import { Link } from "react-router";
import WithIndicators from "../../ui/carousel/WithIndicators";

export type CardInfoItem = {
  label: string;
  value: ReactNode;
};

export type CardThreeProps = {
  title?: string;
  subtitle?: string;
  description?: string;
  images?: string[];
  fallbackImage?: string;
  infoItems?: CardInfoItem[];
  badges?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  autoPlayCarousel?: boolean;
  imageClassName?: string;
  bodyClassName?: string;
  overlayBadges?: ReactNode;
};

const DEFAULT_IMAGE = "/images/cards/card-03.png";
const DEFAULT_DESCRIPTION =
  "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Animi architecto aspernatur cum et ipsum";

const DefaultFooter = () => (
  <Link
    to="/"
    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
  >
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
    Card link
  </Link>
);

export default function CardThree({
  title = "Card title",
  subtitle,
  description = DEFAULT_DESCRIPTION,
  images,
  fallbackImage = DEFAULT_IMAGE,
  infoItems,
  badges,
  footer,
  children,
  autoPlayCarousel = false,
  imageClassName = "w-full h-60 object-cover",
  bodyClassName = "",
  overlayBadges,
}: CardThreeProps = {}) {
  const hasDescription = Boolean(description);
  const hasInfoItems = Array.isArray(infoItems) && infoItems.length > 0;
  const computedFooter = footer === undefined ? <DefaultFooter /> : footer;

  return (
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:shadow-lg hover:ring-black/10 dark:bg-gray-900/50 dark:ring-white/10 dark:hover:ring-white/20">
      {/* Image Section - iOS style */}
      <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
        <div className="relative w-full overflow-hidden">
          <WithIndicators
            images={images}
            fallbackImage={fallbackImage}
            autoPlay={autoPlayCarousel}
            imageClassName={clsx(
              imageClassName,
              "rounded-none transition-transform duration-700 ease-out group-hover:scale-105"
            )}
            className="h-full w-full"
          />

          {/* Subtle gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Overlay badges - style iOS empilé */}
          {overlayBadges && (
            <div className="absolute left-2.5 top-2.5 z-10">
              {overlayBadges}
            </div>
          )}
        </div>
      </div>

      {/* Content Section - iOS spacing and typography */}
      <div className={clsx("flex flex-1 flex-col gap-4 p-5", bodyClassName)}>
        {/* Badges */}
        {badges && (
          <div className="flex flex-wrap gap-2">
            {badges}
          </div>
        )}

        {/* Title & Description - iOS typography */}
        <div className="flex flex-col gap-2.5">
          {/* Title with better readability */}
          <h3 className="break-words text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white">
            {title}
          </h3>

          {/* Subtitle (reference) with icon */}
          {subtitle && (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                <svg className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <p className="break-words text-sm font-semibold text-gray-700 dark:text-gray-300">
                {subtitle}
              </p>
            </div>
          )}

          {/* Description with full text visible */}
          {hasDescription && (
            <div className="rounded-lg bg-gray-50/50 p-3 dark:bg-white/[0.02]">
              <p className="break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Info Items - iOS card style with subtle backgrounds */}
        {hasInfoItems && (
          <div className="rounded-xl bg-gray-50/80 p-4 dark:bg-white/5">
            <div className="grid gap-3 sm:grid-cols-2">
              {infoItems!.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="flex flex-col gap-1"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {item.label}
                  </dt>
                  <dd className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Children content */}
        {children}
      </div>

      {/* Footer - iOS bottom section */}
      {computedFooter && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          {computedFooter}
        </div>
      )}
    </div>
  );
}
