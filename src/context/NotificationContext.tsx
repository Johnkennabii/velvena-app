import { createContext, useContext, useState, ReactNode, useRef, useEffect, useCallback } from "react";
import Notification from "../components/ui/notification/Notfication";
import UpdateNotification from "../components/ui/notification/UpdateNotification";

type NotificationVariant = "success" | "info" | "warning" | "error";

type NotificationType =
  | {
      type: "custom";
      title: string;
      message: string;
      onConfirm?: () => void;
    }
  | {
      type: "simple";
      variant: NotificationVariant;
      title: string;
      description?: string;
    };

interface NotificationContextType {
  showSimple: (variant: NotificationVariant, title: string, description?: string) => void;
  showReconnect: (title: string, message: string, onReconnect: () => void) => void;
  notify: (variant: NotificationVariant, title: string, message?: string) => void;
  hide: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showSimple = useCallback((variant: NotificationVariant, title: string, description?: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification({ type: "simple", variant, title, description });
    setVisible(true);

    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setNotification(null), 400); // délai pour l'animation de sortie
    }, 3000);
  }, []);

  const showReconnect = useCallback((title: string, message: string, onReconnect: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification({ type: "custom", title, message, onConfirm: onReconnect });
    setVisible(true);
  }, []);

  const notify = useCallback((variant: NotificationVariant, title: string, message?: string) => {
    showSimple(variant, title, message);
  }, [showSimple]);

  const hide = useCallback(() => {
    setVisible(false);
    setTimeout(() => setNotification(null), 400);
  }, []);

  // nettoyage à la fermeture
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ showSimple, showReconnect, notify, hide }}>
      {children}

      {/* Zone d’affichage notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-[999999] transform transition-all duration-500 ${
            visible
              ? "translate-x-0 opacity-100 animate-slideInRight"
              : "translate-x-full opacity-0 animate-slideOutLeft"
          }`}
        >
          {notification.type === "simple" ? (
            <Notification
              variant={notification.variant}
              title={notification.title}
              description={notification.description}
            />
          ) : (
            <UpdateNotification
              title={notification.title}
              message={notification.message}
              onUpdateClick={notification.onConfirm}
              onLaterClick={hide}
            />
          )}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

// Hook d’accès
export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotification must be used within a NotificationProvider");
  return ctx;
};