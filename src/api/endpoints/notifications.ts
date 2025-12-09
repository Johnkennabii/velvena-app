import { httpClient } from "../httpClient";

export interface NotificationMeta {
  contractNumber?: string;
  reference?: string;
  timestamp: string;
  customer?: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
  };
  creator?: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface NotificationData {
  id: string;
  type: "CONTRACT_SIGNED" | "DRESS_CREATED";
  title: string;
  message: string;
  meta: NotificationMeta;
  created_at: string;
  seen: boolean;
  seen_at: string | null;
}

export interface NotificationsListResponse {
  success: boolean;
  data: NotificationData[];
}

export interface UnseenCountResponse {
  success: boolean;
  count: number;
}

export interface MarkAsSeenResponse {
  success: boolean;
  data: {
    id: string;
    notification_id: string;
    user_id: string;
    seen: boolean;
    seen_at: string;
  };
}

export const NotificationsAPI = {
  /**
   * Récupérer toutes les notifications
   */
  async list(): Promise<NotificationData[]> {
    const res = await httpClient.get("/notifications", {
      _enableCache: true,
      _cacheTTL: 30 * 1000, // 30 secondes - notifications changent en temps réel
    });
    if (res?.data && Array.isArray(res.data)) {
      return res.data as NotificationData[];
    }
    if (Array.isArray(res)) {
      return res as NotificationData[];
    }
    return [];
  },

  /**
   * Récupérer le nombre de notifications non vues
   */
  async getUnseenCount(): Promise<number> {
    const res = await httpClient.get("/notifications/unseen-count", {
      _enableCache: true,
      _cacheTTL: 30 * 1000, // 30 secondes - compteur change en temps réel
    });
    if (res?.count !== undefined) {
      return Number(res.count);
    }
    if (res?.data?.count !== undefined) {
      return Number(res.data.count);
    }
    return 0;
  },

  /**
   * Marquer une notification comme vue
   */
  async markAsSeen(notificationId: string): Promise<MarkAsSeenResponse> {
    const res = await httpClient.patch(`/notifications/${notificationId}/seen`);
    return res as MarkAsSeenResponse;
  },

  /**
   * Marquer toutes les notifications comme vues
   */
  async markAllAsSeen(): Promise<void> {
    // Récupérer toutes les notifications non vues
    const notifications = await this.list();
    const unseenNotifications = notifications.filter((n) => !n.seen);

    // Marquer chacune comme vue
    await Promise.all(
      unseenNotifications.map((notif) => this.markAsSeen(notif.id))
    );
  },
};
