import { io, Socket } from "socket.io-client";

// URL de l'API WebSocket
const SOCKET_URL = import.meta.env.VITE_API_URL || "https://api.velvena.fr";

/**
 * Crée une connexion socket.io avec authentification JWT
 */
export function createSocketConnection(): Socket {
  // Récupérer le token depuis le localStorage
  const token = localStorage.getItem("access_token");

  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: {
      token: token || undefined,
    },
  });

  return socket;
}

/**
 * URL du socket pour référence
 */
export const socketUrl = SOCKET_URL;
