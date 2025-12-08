/**
 * Système de logging conditionnel pour l'application
 * Les logs debug/info sont affichés uniquement en développement
 * Les logs warn/error sont toujours affichés
 */

/**
 * Détermine si l'application est en mode développement
 */
const isDevelopment = import.meta.env.DEV;

/**
 * Préfixe pour tous les logs de l'application
 */
const LOG_PREFIX = "[Velvena]";

/**
 * Utilitaire de logging avec niveaux de sévérité
 */
export const logger = {
  /**
   * Log de debug (affiché uniquement en développement)
   * Utilisé pour les informations de débogage détaillées
   */
  debug: (...args: any[]): void => {
    if (isDevelopment) {
      console.log(`${LOG_PREFIX} [DEBUG]`, ...args);
    }
  },

  /**
   * Log d'information (affiché uniquement en développement)
   * Utilisé pour les informations générales sur le flux d'exécution
   */
  info: (...args: any[]): void => {
    if (isDevelopment) {
      console.info(`${LOG_PREFIX} [INFO]`, ...args);
    }
  },

  /**
   * Log d'avertissement (toujours affiché)
   * Utilisé pour les situations anormales mais non bloquantes
   */
  warn: (...args: any[]): void => {
    console.warn(`${LOG_PREFIX} [WARN]`, ...args);
  },

  /**
   * Log d'erreur (toujours affiché)
   * Utilisé pour les erreurs et exceptions
   */
  error: (...args: any[]): void => {
    console.error(`${LOG_PREFIX} [ERROR]`, ...args);
  },

  /**
   * Log de succès (affiché uniquement en développement)
   * Utilisé pour confirmer la réussite d'opérations importantes
   */
  success: (...args: any[]): void => {
    if (isDevelopment) {
      console.log(`${LOG_PREFIX} [SUCCESS] ✅`, ...args);
    }
  },

  /**
   * Log groupé (affiché uniquement en développement)
   * Utilisé pour grouper plusieurs logs connexes
   */
  group: (label: string, callback: () => void): void => {
    if (isDevelopment) {
      console.group(`${LOG_PREFIX} ${label}`);
      callback();
      console.groupEnd();
    }
  },

  /**
   * Log de table (affiché uniquement en développement)
   * Utilisé pour afficher des données tabulaires
   */
  table: (data: any): void => {
    if (isDevelopment) {
      console.table(data);
    }
  },
};

/**
 * Alias pour compatibilité avec le code existant
 */
export const log = logger;

/**
 * Export par défaut
 */
export default logger;
