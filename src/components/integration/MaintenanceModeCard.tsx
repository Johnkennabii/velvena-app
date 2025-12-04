import { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import IntegrationCard from "./IntegrationCard";
import MaintenanceSettingsModal from "./MaintenanceSettingsModal";

const WEBHOOK_SECRET = "b424e37efd29da5a71682bcd84a9a140ff17f597eaa56f45a058a644d4f8df29";
const API_URL_POST = "https://api.allure-creation.fr/api/webhook/maintenance"; // Pour activer/désactiver
const API_URL_GET = "https://www.allure-creation.fr/api/maintenance"; // Pour vérifier le statut

interface MaintenanceStatus {
  enabled: boolean;
  message?: string;
  lastUpdated?: string;
}

const MaintenanceIcon = () => (
  <svg
    className="h-10 w-10 text-blue-600 dark:text-blue-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

export default function MaintenanceModeCard() {
  const { notify } = useNotification();
  const [status, setStatus] = useState<MaintenanceStatus>({ enabled: false });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const fetchStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch(API_URL_GET, {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du statut:", error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const toggleMaintenance = async (enabled: boolean) => {
    setLoading(true);
    try {
      const payload: any = { enabled };

      const response = await fetch(API_URL_POST, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Maintenance-Secret": WEBHOOK_SECRET,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        notify(
          "success",
          enabled ? "Maintenance activée" : "Maintenance désactivée",
          enabled
            ? "Le site e-commerce est maintenant en mode maintenance. Redémarrage en cours (3-5 min)."
            : "Le site e-commerce est de nouveau accessible au public."
        );
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Erreur lors de la requête");
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      notify("error", "Erreur", error.message || "Impossible de modifier le mode maintenance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IntegrationCard
      title="Mode Maintenance E-commerce"
      icon={<MaintenanceIcon />}
      description="Activer/désactiver le mode maintenance du site public www.allure-creation.fr. Le site se redémarre automatiquement après 3-5 minutes."
      connect={status.enabled}
      onToggle={toggleMaintenance}
      loading={loading || checking}
      badge={
        checking ? (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <svg className="mr-1 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            ...
          </span>
        ) : status.enabled ? (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
            <span className="mr-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Hors ligne
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-500/10 dark:text-green-400">
            <span className="mr-1 h-2 w-2 rounded-full bg-green-500" />
            En ligne
          </span>
        )
      }
      customActions={
        <>
          <MaintenanceSettingsModal currentMessage={status.message} />
          <button
            onClick={fetchStatus}
            disabled={loading || checking}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
            title="Rafraîchir le statut"
          >
            <svg
              className={`h-4 w-4 ${checking ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </>
      }
    />
  );
}
