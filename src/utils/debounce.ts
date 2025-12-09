/**
 * Utilitaires de debouncing pour optimiser les requêtes API
 */

/**
 * Debounce une fonction - L'exécute seulement après un délai d'inactivité
 * Idéal pour les recherches en temps réel
 *
 * @param func - La fonction à debouncer
 * @param delay - Le délai en millisecondes
 * @returns La fonction debouncée
 *
 * @example
 * const search = debounce((query: string) => {
 *   api.search(query);
 * }, 300);
 *
 * // Sera exécuté seulement une fois après 300ms d'inactivité
 * search('test');
 * search('test1');
 * search('test12');
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle une fonction - Limite le nombre d'exécutions par période
 * Idéal pour les événements fréquents (scroll, resize)
 *
 * @param func - La fonction à throttler
 * @param limit - Le délai minimum entre deux exécutions (en millisecondes)
 * @returns La fonction throttlée
 *
 * @example
 * const handleScroll = throttle(() => {
 *   console.log('Scrolling...');
 * }, 100);
 *
 * // Sera exécuté au maximum une fois toutes les 100ms
 * window.addEventListener('scroll', handleScroll);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastResult: ReturnType<T>;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
}

/**
 * Debounce avec Promise - Retourne une promesse qui résout avec la dernière valeur
 * Idéal pour les recherches async avec autocomplete
 *
 * @param func - La fonction async à debouncer
 * @param delay - Le délai en millisecondes
 * @returns La fonction debouncée qui retourne une Promise
 *
 * @example
 * const searchAPI = debounceAsync(async (query: string) => {
 *   const results = await api.search(query);
 *   return results;
 * }, 300);
 *
 * const results = await searchAPI('test');
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestResolve: ((value: Awaited<ReturnType<T>>) => void) | null = null;
  let latestReject: ((reason?: any) => void) | null = null;

  return function (this: any, ...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        // Rejeter la promesse précédente
        if (latestReject) {
          latestReject(new Error('Debounced'));
        }
      }

      latestResolve = resolve;
      latestReject = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await func.apply(this, args);
          if (latestResolve) {
            latestResolve(result);
          }
        } catch (error) {
          if (latestReject) {
            latestReject(error);
          }
        } finally {
          timeoutId = null;
          latestResolve = null;
          latestReject = null;
        }
      }, delay);
    });
  };
}

/**
 * Délais recommandés pour différents cas d'usage
 */
export const DebounceDelay = {
  /** Recherche en temps réel - 300ms */
  SEARCH: 300,
  /** Autocomplete - 250ms */
  AUTOCOMPLETE: 250,
  /** Validation de formulaire - 500ms */
  VALIDATION: 500,
  /** Événements de scroll/resize - 100ms */
  UI_EVENTS: 100,
  /** Sauvegarde automatique - 1000ms */
  AUTOSAVE: 1000,
} as const;
