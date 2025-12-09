// src/api/httpClient.ts
import { apiCache, CacheTTL } from "../utils/apiCache";

const BASE_URL = import.meta.env.VITE_API_URL || "https://api.velvena.fr";

interface CustomRequestInit extends RequestInit {
  _skipAuthRefresh?: boolean;
  _skipErrorNotification?: boolean;
  _enableCache?: boolean;
  _cacheTTL?: number;
  _retryCount?: number;
}

let logoutFn: (() => void) | null = null;
let notifyFn:
  | ((
      variant: "success" | "info" | "warning" | "error",
      title: string,
      message?: string,
    ) => void)
  | null = null;
let sessionExpiredFn: (() => void) | null = null;
let refreshFn: (() => Promise<string | null>) | null = null;

export const httpClientInit = (deps: {
  logout?: () => void;
  notify?: (
    variant: "success" | "info" | "warning" | "error",
    title: string,
    message?: string,
  ) => void;
  onSessionExpired?: () => void;
  refreshToken?: () => Promise<string | null>;
}) => {
  logoutFn = deps.logout ?? null;
  notifyFn = deps.notify ?? null;
  sessionExpiredFn = deps.onSessionExpired ?? null;
  refreshFn = deps.refreshToken ?? null;
};

/**
 * Calcule le délai d'attente pour l'exponential backoff
 */
function getBackoffDelay(retryCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s
  const baseDelay = 1000;
  const maxDelay = 16000;
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Ajouter un jitter aléatoire de ±20%
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return delay + jitter;
}

async function performRequest(path: string, options: CustomRequestInit = {}, retry = true): Promise<any> {
  const {
    _skipAuthRefresh,
    _skipErrorNotification,
    _enableCache,
    _cacheTTL,
    _retryCount = 0,
    ...cleanOptions
  } = options as CustomRequestInit;

  const skipRefresh = Boolean(_skipAuthRefresh);
  const skipErrorNotification = Boolean(_skipErrorNotification);
  const enableCache = Boolean(_enableCache);
  const isFormData = typeof FormData !== "undefined" && cleanOptions.body instanceof FormData;
  const isGetRequest = !cleanOptions.method || cleanOptions.method.toUpperCase() === "GET";

  // Vérifier le cache pour les requêtes GET avec cache activé
  if (isGetRequest && enableCache) {
    const cached = apiCache.get(path, cleanOptions);
    if (cached !== null) {
      return cached;
    }
  }

  const token = localStorage.getItem("token");
  const hadToken = Boolean(token);

  const headers = new Headers(cleanOptions.headers as HeadersInit | undefined);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const requestInit: RequestInit = {
    ...cleanOptions,
    headers,
    credentials: 'include', // ✅ Permet l'envoi des cookies pour CORS
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...requestInit,
  });

  // Ne pas traiter le 401 comme une session expirée si c'est une tentative de connexion
  const isLoginRequest = path === "/auth/login";

  if (response.status === 401 && retry && hadToken && refreshFn && !skipRefresh && !isLoginRequest) {
    try {
      const refreshed = await refreshFn();
      if (refreshed) {
        return performRequest(path, options, false);
      }
    } catch {
      // ignore, will trigger sessionExpired below
    }
  }

  if (response.status === 401 && !isLoginRequest) {
    if (sessionExpiredFn) {
      sessionExpiredFn();
    } else {
      notifyFn?.("warning", "Session expirée", "Veuillez vous reconnecter");
      logoutFn?.();
    }
    throw new Error("Unauthorized");
  }

  // Gérer les erreurs 503 (rate limiting) avec exponential backoff
  if (response.status === 503 && _retryCount < 5) {
    const delay = getBackoffDelay(_retryCount);
    console.warn(`Rate limit atteint (503). Retry ${_retryCount + 1}/5 dans ${Math.round(delay)}ms`);

    await new Promise((resolve) => setTimeout(resolve, delay));

    return performRequest(path, { ...options, _retryCount: _retryCount + 1 }, retry);
  }

  if (!response.ok) {
    const errorText = await response.text();
    const error: any = new Error(errorText);
    error.status = response.status;
    error.statusText = response.statusText;

    // Ne pas notifier automatiquement pour les erreurs de connexion (/auth/login)
    // car elles sont gérées spécifiquement dans AuthContext avec des messages personnalisés
    // Ou si _skipErrorNotification est passé en option
    if (!isLoginRequest && !skipErrorNotification) {
      notifyFn?.("error", "Erreur API", `(${response.status}) ${errorText}`);
    }

    throw error;
  }

  if (response.status === 204) return null;

  const data = await response.json();

  // Mettre en cache si demandé (uniquement pour GET)
  if (isGetRequest && enableCache) {
    const ttl = _cacheTTL || CacheTTL.MODERATE;
    apiCache.set(path, data, ttl, cleanOptions);
  }

  return data;
}

export async function httpClient(path: string, options: CustomRequestInit = {}) {
  return performRequest(path, options);
}

httpClient.get = (url: string, options?: CustomRequestInit) => httpClient(url, { method: "GET", ...options });
httpClient.post = (url: string, body: any, options: CustomRequestInit = {}) =>
  httpClient(url, { method: "POST", body: JSON.stringify(body), ...options });
httpClient.put = (url: string, body: any, options: CustomRequestInit = {}) =>
  httpClient(url, { method: "PUT", body: JSON.stringify(body), ...options });
httpClient.patch = (url: string, body?: any, options: CustomRequestInit = {}) =>
  httpClient(url, {
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...options,
  });
httpClient.delete = (url: string, options: CustomRequestInit = {}) =>
  httpClient(url, { method: "DELETE", ...options });
