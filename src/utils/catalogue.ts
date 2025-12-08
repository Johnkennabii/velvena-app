/**
 * Utilitaires spécifiques au catalogue de robes
 */

/**
 * Génère un numéro de contrat au format CTR-XX-XXXXXXX
 * Exemple: CTR-25-1234567
 */
export const generateContractNumber = (): string => {
  const year = new Date().getFullYear().toString().slice(-2); // 2 derniers chiffres de l'année
  const random = Math.floor(1000000 + Math.random() * 9000000); // 7 chiffres aléatoires
  return `CTR-${year}-${random}`;
};

/**
 * Génère une référence de robe au format RB-XX-XXXXXXX
 * Exemple: RB-25-1234567
 */
export const generateReference = (): string => {
  const year = new Date().getFullYear().toString().slice(-2); // 2 derniers chiffres de l'année
  const random = Math.floor(1000000 + Math.random() * 9000000); // 7 chiffres aléatoires
  return `RB-${year}-${random}`;
};

/**
 * Extrait l'ID de stockage depuis une URL
 * Exemple: "https://api.example.com/storage/abc123?..." → "abc123"
 */
export const extractStorageId = (url: string): string => {
  const match = url.match(/\/storage\/([^/?]+)/);
  if (!match) {
    throw new Error(`Impossible d'extraire l'ID de stockage de l'URL: ${url}`);
  }
  return match[1];
};

/**
 * Parse une valeur string en number (retourne null si invalide)
 */
export const parseNumber = (value: string): number | null => {
  if (!value || value.trim() === "") return null;
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Convertit une valeur unknown en number (0 par défaut)
 */
export const toNumeric = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseNumber(value);
    return parsed ?? 0;
  }
  return 0;
};

/**
 * Formate une valeur monétaire en string avec 2 décimales
 */
export const formatMoneyValue = (value: number): string => {
  return value.toFixed(2);
};

/**
 * Retourne les métadonnées de statut d'un contrat (couleur et label)
 */
export const getContractStatusMeta = (
  status?: string | null,
  deletedAt?: string | null
): { variant: "success" | "warning" | "error" | "info" | "light"; label: string } => {
  if (deletedAt) {
    return { variant: "error", label: "Supprimé" };
  }

  switch (status?.toUpperCase()) {
    case "DRAFT":
      return { variant: "light", label: "Brouillon" };
    case "PENDING":
      return { variant: "warning", label: "En attente" };
    case "PENDING_SIGNATURE":
      return { variant: "info", label: "Signature en attente" };
    case "SIGNED":
    case "SIGNED_ELECTRONICALLY":
      return { variant: "success", label: "Signé" };
    default:
      return { variant: "light", label: status || "Inconnu" };
  }
};
