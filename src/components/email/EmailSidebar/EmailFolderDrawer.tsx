import { useState } from "react";
import Button from "../../ui/button/Button";
import { EmailsAPI } from "../../../api/endpoints/emails";
import { useNotification } from "../../../context/NotificationContext";

interface EmailFolderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFolderCreated: () => void;
}

export default function EmailFolderDrawer({ isOpen, onClose, onFolderCreated }: EmailFolderDrawerProps) {
  const { notify } = useNotification();
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!folderName.trim()) {
      notify("error", "Erreur", "Veuillez saisir un nom de dossier");
      return;
    }

    setCreating(true);
    try {
      // Créer le dossier sous INBOX
      const folderPath = `INBOX/${folderName.trim()}`;
      await EmailsAPI.createFolder({ name: folderPath });

      notify("success", "Dossier créé", `Le dossier "${folderName}" a été créé avec succès`);
      setFolderName("");
      onClose();
      onFolderCreated();
    } catch (error) {
      console.error("Erreur lors de la création du dossier:", error);
      notify("error", "Erreur", "Impossible de créer le dossier");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    if (folderName.trim()) {
      if (window.confirm("Voulez-vous vraiment annuler ? Le nom du dossier sera perdu.")) {
        setFolderName("");
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-gray-900/50 backdrop-blur-sm transition-opacity"
        onClick={handleCancel}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-[9999] w-full max-w-md transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M2.5 5.83333C2.5 4.45262 3.61929 3.33333 5 3.33333H6.91667C7.32388 3.33333 7.70081 3.55952 7.89624 3.92262L8.76043 5.41667H15C16.3807 5.41667 17.5 6.53595 17.5 7.91667V14.1667C17.5 15.5474 16.3807 16.6667 15 16.6667H5C3.61929 16.6667 2.5 15.5474 2.5 14.1667V5.83333Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="white"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Créer un dossier</h2>
            </div>
            <button
              onClick={handleCancel}
              disabled={creating}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <svg
                className="h-6 w-6"
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

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="folderName" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nom du dossier
                </label>
                <input
                  type="text"
                  id="folderName"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Ex: Clients, Factures, Projets..."
                  disabled={creating}
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:disabled:bg-gray-900"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Le dossier sera créé sous INBOX
                </p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Conseils
                    </h3>
                    <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                      Utilisez des noms courts et descriptifs pour faciliter l'organisation de vos emails.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <Button
              type="button"
              onClick={handleCancel}
              variant="outline"
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit({} as React.FormEvent)}
              variant="primary"
              disabled={creating || !folderName.trim()}
            >
              {creating ? "Création..." : "Créer le dossier"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
