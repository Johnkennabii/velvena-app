import type { DressDetails } from "../../../api/endpoints/dresses";
import { Modal } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";

// Types
export type DeleteType = "soft" | "hard";

export interface DeleteTarget {
  type: DeleteType;
  dress: DressDetails | null;
}

// Props interface
interface DeleteDressModalProps {
  deleteTarget: DeleteTarget;
  deleteLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Composant DeleteDressModal - Modal de confirmation pour la suppression d'une robe
 * Supporte deux types de suppression :
 * - soft : désactivation temporaire (réversible)
 * - hard : suppression définitive (irréversible)
 */
export default function DeleteDressModal({
  deleteTarget,
  deleteLoading,
  onClose,
  onConfirm,
}: DeleteDressModalProps) {
  const handleClose = () => {
    if (deleteLoading) return;
    onClose();
  };

  return (
    <Modal
      isOpen={Boolean(deleteTarget.dress)}
      onClose={handleClose}
      className="max-w-md w-full p-6"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {deleteTarget.type === "soft" ? "Désactiver la robe" : "Supprimer la robe"}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {deleteTarget.type === "soft"
              ? "La robe sera retirée temporairement du catalogue. Vous pourrez la réactiver plus tard."
              : "Cette action est définitive. La robe et ses données associées seront supprimées."}
          </p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 dark:border-yellow-500/40 dark:bg-yellow-500/10 dark:text-yellow-200">
          <strong>{deleteTarget.dress?.name}</strong>
          {deleteTarget.dress?.reference ? ` • Réf. ${deleteTarget.dress.reference}` : ""}
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={deleteLoading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className={
              deleteTarget.type === "soft"
                ? "bg-warning-600 hover:bg-warning-700"
                : "bg-error-600 hover:bg-error-700"
            }
            onClick={onConfirm}
            disabled={deleteLoading}
          >
            {deleteLoading ? "Traitement..." : deleteTarget.type === "soft" ? "Désactiver" : "Supprimer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
