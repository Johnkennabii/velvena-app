import { useModal } from "../../hooks/useModal";

interface MaintenanceSettingsModalProps {
  currentMessage?: string;
}

export default function MaintenanceSettingsModal({
  currentMessage,
}: MaintenanceSettingsModalProps) {
  const { isOpen, openModal, closeModal } = useModal();

  return (
    <>
      <button
        onClick={openModal}
        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
      >
        Paramètres
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Paramètres de maintenance
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message actuel
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentMessage || "Aucun message de maintenance configuré"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <span className="font-medium">Note:</span> Le message est défini lors de l'activation de la maintenance. Désactivez puis réactivez pour changer le message.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={closeModal}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
