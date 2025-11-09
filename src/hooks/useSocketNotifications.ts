import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;

    const socketInstance = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("[Socket.IO] Connected to server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("[Socket.IO] Disconnected from server");
      setIsConnected(false);
    });

    socketInstance.on("notification", (data: Omit<Notification, "id" | "read">) => {
      console.log("[Socket.IO] Received notification:", data);
      const newNotification: Notification = {
        ...data,
        id: `${Date.now()}-${Math.random()}`,
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[Socket.IO] Connection error:", error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
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
    socket,
    isConnected,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
  };
}
