import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "https://api.allure-creation.fr";

export interface Notification {
  id: string;
  type: "CONTRACT_SIGNED" | "DRESS_CREATED";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  reference?: string;
  contractNumber?: string;
  contractId?: string;
  creator?: {
    id: string | null;
    firstName?: string;
    lastName?: string;
  };
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

export function useSocketNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ["websocket"] });

    socket.on("connect", () => console.log("🔗 Connecté à Socket.IO"));

    socket.on("notification", (notif: Omit<Notification, "id" | "read">) => {
      const newNotification: Notification = {
        ...notif,
        id: `${Date.now()}-${Math.random()}`,
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    });

    socket.on("disconnect", () => console.log("❌ Déconnecté de Socket.IO"));

    return () => {
      socket.disconnect();
    };
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };
}
