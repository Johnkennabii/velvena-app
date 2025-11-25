/**
 * Formatage de devises (euros)
 * @param value Valeur numérique ou chaîne à formater
 * @returns Chaîne formatée en euros (ex: "1 234,56 €")
 */
export const formatCurrency = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === "") {
    return "0,00 €";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "0,00 €";
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Formatage de dates au format français
 * @param value Date au format ISO string ou Date object
 * @param options Options de formatage Intl.DateTimeFormat
 * @returns Date formatée (ex: "25 janvier 2025")
 */
export const formatDate = (
  value: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!value) {
    return "—";
  }

  try {
    const date = typeof value === "string" ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      return "—";
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    return date.toLocaleDateString("fr-FR", options || defaultOptions);
  } catch (error) {
    return "—";
  }
};

/**
 * Formatage de dates avec heure au format français
 * @param value Date au format ISO string ou Date object
 * @returns Date et heure formatées (ex: "25 janvier 2025 à 14:30")
 */
export const formatDateTime = (value: string | Date | null | undefined): string => {
  if (!value) {
    return "—";
  }

  try {
    const date = typeof value === "string" ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "—";
  }
};

/**
 * Formatage de dates courtes (ex: "25/01/2025")
 * @param value Date au format ISO string ou Date object
 * @returns Date formatée courte
 */
export const formatDateShort = (value: string | Date | null | undefined): string => {
  if (!value) {
    return "—";
  }

  try {
    const date = typeof value === "string" ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return "—";
  }
};

/**
 * Formatage de nombres avec séparateurs
 * @param value Nombre à formater
 * @param decimals Nombre de décimales (défaut: 0)
 * @returns Nombre formaté (ex: "1 234,56")
 */
export const formatNumber = (
  value: number | string | null | undefined,
  decimals: number = 0
): string => {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "0";
  }

  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};

/**
 * Formatage de pourcentages
 * @param value Valeur entre 0 et 1 (ou 0-100 si asPercentage=true)
 * @param decimals Nombre de décimales (défaut: 0)
 * @param asPercentage Si true, value est déjà en pourcentage (0-100)
 * @returns Pourcentage formaté (ex: "45,5 %")
 */
export const formatPercentage = (
  value: number | string | null | undefined,
  decimals: number = 0,
  asPercentage: boolean = false
): string => {
  if (value === null || value === undefined || value === "") {
    return "0 %";
  }

  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "0 %";
  }

  const percentValue = asPercentage ? numValue : numValue * 100;

  return `${formatNumber(percentValue, decimals)} %`;
};

/**
 * Formatage de numéros de téléphone français
 * @param value Numéro de téléphone
 * @returns Numéro formaté (ex: "06 12 34 56 78")
 */
export const formatPhoneNumber = (value: string | null | undefined): string => {
  if (!value) {
    return "—";
  }

  // Supprimer tous les caractères non numériques
  const cleaned = value.replace(/\D/g, "");

  // Si le numéro commence par 33, remplacer par 0
  const normalized = cleaned.startsWith("33") ? "0" + cleaned.substring(2) : cleaned;

  // Formater par groupes de 2
  if (normalized.length === 10) {
    return normalized.replace(/(\d{2})(?=\d)/g, "$1 ");
  }

  return value; // Retourner la valeur originale si format invalide
};
