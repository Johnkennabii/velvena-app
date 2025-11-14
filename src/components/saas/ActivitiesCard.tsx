import { useState, useEffect } from "react";
import { MoreDotIcon } from "../../icons";
import { HiOutlineTicket } from "react-icons/hi2";
import { PiDress } from "react-icons/pi";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { NotificationsAPI, NotificationData } from "../../api/endpoints/notifications";

export default function ActivitiesCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les notifications
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const [notifs, count] = await Promise.all([
        NotificationsAPI.list(),
        NotificationsAPI.getUnseenCount(),
      ]);
      setNotifications(notifs);
      setUnseenCount(count);
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filtrer les notifications non vues et limiter à 10
  const unseenNotifications = notifications.filter((n) => !n.seen).slice(0, 10);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function handleRefresh() {
    await fetchNotifications();
    closeDropdown();
  }

  async function handleMarkAllAsRead() {
    try {
      await NotificationsAPI.markAllAsSeen();
      // Rafraîchir la liste après marquage
      await fetchNotifications();
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error);
    }
    closeDropdown();
  }

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const notifDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - notifDate.getTime()) / 1000);

    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
    }
    if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
    }
    const months = Math.floor(diffInSeconds / 2592000);
    return `Il y a ${months} mois`;
  };

  const getNotificationIcon = (type: NotificationData["type"]) => {
    if (type === "CONTRACT_SIGNED") {
      return <HiOutlineTicket className="size-5 text-success-500" />;
    }
    if (type === "DRESS_CREATED") {
      return <PiDress className="size-5 text-warning-500" />;
    }
    return <HiOutlineTicket className="size-5 text-warning-500" />;
  };

  const getNotificationColor = (type: NotificationData["type"]) => {
    return type === "CONTRACT_SIGNED" ? "text-success-500" : "text-warning-500";
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Notifications non vues
          </h3>
          {unseenCount > 0 && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {unseenCount} notification{unseenCount > 1 ? "s" : ""} non vue{unseenCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-48 p-2"
          >
            <DropdownItem
              onItemClick={handleRefresh}
              className="flex w-full items-center gap-2 font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current"
              >
                <path d="M1 4V10H7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 20V14H17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20.49 9C19.9828 7.56678 19.1209 6.28536 17.9845 5.27538C16.8482 4.26541 15.4745 3.55976 13.9917 3.22426C12.5089 2.88876 10.9652 2.93402 9.50481 3.35586C8.04437 3.77771 6.71475 4.56142 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4386 15.9556 20.2223 14.4952 20.6441C13.0348 21.066 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.1518 19.7346 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Rafraîchir
            </DropdownItem>
            <DropdownItem
              onItemClick={handleMarkAllAsRead}
              className="flex w-full items-center gap-2 font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current"
              >
                <path d="M20 6L9 17L4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Tout marquer comme lu
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
      <div className="relative">
        {isLoading ? (
          <div className="py-10 text-center">
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">Chargement des notifications...</p>
          </div>
        ) : unseenNotifications.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-500 dark:text-gray-400">Aucune notification non vue</p>
          </div>
        ) : (
          <>
            {/* Timeline line */}
            <div className="absolute top-6 bottom-10 left-5 w-px bg-gray-200 dark:bg-gray-800"></div>

            {unseenNotifications.map((notif, index) => {
              const isLast = index === unseenNotifications.length - 1;

              // Extraire le nom du client depuis meta
              const customerName = notif.meta.customer?.fullName
                || (notif.meta.customer?.firstName && notif.meta.customer?.lastName
                  ? `${notif.meta.customer.firstName} ${notif.meta.customer.lastName}`
                  : "Client");

              // Extraire le nom du créateur depuis meta
              const creatorName = notif.meta.creator
                ? `${notif.meta.creator.firstName || ""} ${notif.meta.creator.lastName || ""}`.trim()
                : null;

              const displayName = notif.type === "CONTRACT_SIGNED" ? customerName : creatorName || "Système";

              return (
                <div key={notif.id} className={`relative flex ${!isLast ? "mb-6" : ""}`}>
                  <div className="z-10 flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-white ring-4 ring-white dark:bg-gray-900 dark:ring-gray-800">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="ml-4">
                    <div className="mb-1 flex items-center gap-1">
                      <p className={`text-theme-xs font-medium ${getNotificationColor(notif.type)}`}>
                        {notif.title}
                      </p>
                    </div>
                    <div className="flex items-baseline">
                      <h3 className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {displayName}
                      </h3>
                      {notif.meta.contractNumber && (
                        <span className="ml-2 text-theme-sm font-normal text-gray-500 dark:text-gray-400">
                          Contrat N° {notif.meta.contractNumber}
                        </span>
                      )}
                      {notif.meta.reference && (
                        <span className="ml-2 text-theme-sm font-normal text-gray-500 dark:text-gray-400">
                          Réf: {notif.meta.reference}
                        </span>
                      )}
                    </div>
                    <p className="text-theme-sm font-normal text-gray-500 dark:text-gray-400">
                      {notif.message}
                    </p>
                    <p className="text-theme-xs mt-1 text-gray-400">
                      {getTimeAgo(notif.meta.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
