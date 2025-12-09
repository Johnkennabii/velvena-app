/**
 * Système de cache simple pour les requêtes API
 * Permet de réduire les appels répétés aux endpoints statiques
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>>;
  private defaultTTL: number; // Time To Live en millisecondes

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // 5 minutes par défaut
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Génère une clé de cache à partir de l'URL et des options
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || "GET";
    const body = options?.body ? JSON.stringify(options.body) : "";
    return `${method}:${url}:${body}`;
  }

  /**
   * Récupère une entrée du cache si elle existe et n'est pas expirée
   */
  get<T>(url: string, options?: RequestInit): T | null {
    const key = this.generateKey(url, options);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée est expirée
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stocke une donnée dans le cache
   */
  set<T>(url: string, data: T, ttl?: number, options?: RequestInit): void {
    const key = this.generateKey(url, options);
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt,
    });
  }

  /**
   * Vérifie si une entrée existe et est valide
   */
  has(url: string, options?: RequestInit): boolean {
    return this.get(url, options) !== null;
  }

  /**
   * Supprime une entrée du cache
   */
  delete(url: string, options?: RequestInit): void {
    const key = this.generateKey(url, options);
    this.cache.delete(key);
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalide les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Récupère le nombre d'entrées dans le cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Invalide toutes les entrées correspondant à un pattern d'URL
   */
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Instance globale du cache
export const apiCache = new APICache();

// Cleanup automatique toutes les 5 minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * TTL prédéfinis pour différents types de données
 */
export const CacheTTL = {
  /** Données très statiques (types, conditions, etc.) - 30 minutes */
  STATIC: 30 * 60 * 1000,
  /** Données peu changeantes (utilisateurs, paramètres) - 10 minutes */
  SEMI_STATIC: 10 * 60 * 1000,
  /** Données modérément changeantes (catalogue, stock) - 5 minutes */
  MODERATE: 5 * 60 * 1000,
  /** Données changeant fréquemment (disponibilités) - 2 minutes */
  DYNAMIC: 2 * 60 * 1000,
  /** Données en temps réel (notifications, compteurs) - 30 secondes */
  REALTIME: 30 * 1000,
} as const;
