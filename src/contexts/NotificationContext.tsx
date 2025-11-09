import { createContext, useContext, ReactNode, useCallback } from "react";
import {
  useSocketNotifications,
  type Notification,
} from "../hooks/useSocketNotifications";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const handleNotificationReceived = useCallback(
    (notification: Notification) => {
      // Émettre un événement personnalisé pour que d'autres composants puissent réagir
      const event = new CustomEvent("socket-notification", {
        detail: notification,
      });
      window.dispatchEvent(event);
    },
    []
  );

  const socketNotifications = useSocketNotifications(
    handleNotificationReceived
  );

  return (
    <NotificationContext.Provider value={socketNotifications}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
