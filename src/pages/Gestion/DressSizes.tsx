import type React from "react";
import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { DressSizesAPI, type DressSize } from "../../api/endpoints/dressSizes";
import { PencilIcon, CloseLineIcon, TrashBinIcon } from "../../icons";
import { formatDateTimeShort } from "../../utils/formatters";

interface SizeRow extends DressSize {
  createdLabel: string;
  updatedLabel: string;
}

type ConfirmState = {
  mode: "soft" | "hard";
  size: SizeRow | null;
};

const TooltipWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="relative inline-block group">
    {children}
    <div className="invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100">
      <div className="relative">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          {title}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900" />
      </div>
    </div>
  </div>
);

export default function DressSizes() {
  const [sizes, setSizes] = useState<DressSize[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [processing, setProcessing] = useState<{ type: "soft" | "hard" | null; id: string | null }>({
    type: null,
    id: null,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editSize, setEditSize] = useState<SizeRow | null>(null);
  const [createName, setCreateName] = useState("");
  const [editName, setEditName] = useState("");
  const [confirmState, setConfirmState] = useState<ConfirmState>({ mode: "soft", size: null });

  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const isManager = hasRole("MANAGER");

  useEffect(() => {
    const fetchSizes = async () => {
      try {
        setLoading(true);
        const data = await DressSizesAPI.list();
        setSizes(data);
      } catch (error) {
        console.error("❌ Impossible de charger les tailles de robe :", error);
        notify("error", "Erreur", "Le chargement des tailles a échoué.");
      } finally {
        setLoading(false);
      }
    };

    fetchSizes();
  }, [notify]);

  const rows: SizeRow[] = useMemo(
    () =>
      sizes.map((size) => ({
        ...size,
        createdLabel: formatDateTimeShort(size.created_at),
        updatedLabel: formatDateTimeShort(size.updated_at),
      })),
    [sizes],
  );

  const openCreateModal = () => {
    if (!isAdmin && !isManager) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setCreateName("");
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const openEditModal = (row: SizeRow) => {
    setEditSize(row);
    setEditName(row.name);
  };

  const closeEditModal = () => {
    if (updating) return;
    setEditSize(null);
  };

  const requestSoftDelete = (row: SizeRow) => {
    if (!isAdmin && !isManager) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setConfirmState({ mode: "soft", size: row });
  };

  const requestHardDelete = (row: SizeRow) => {
    if (!isAdmin) {
      notify("warning", "Action non autorisée", "Seul un administrateur peut supprimer définitivement une taille.");
      return;
    }
    setConfirmState({ mode: "hard", size: row });
  };

  const resetConfirm = () => setConfirmState({ mode: "soft", size: null });

  const performSoftDelete = async (row: SizeRow) => {
    setProcessing({ type: "soft", id: row.id });
    let success = false;
    try {
      await DressSizesAPI.softDelete(row.id);
      setSizes((prev) => prev.filter((item) => item.id !== row.id));
      notify("success", "Taille désactivée", "La taille a été désactivée.");
      success = true;
    } catch (error) {
      console.error("❌ Soft delete taille :", error);
      notify("error", "Erreur", "Impossible de désactiver la taille.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const performHardDelete = async (row: SizeRow) => {
    setProcessing({ type: "hard", id: row.id });
    let success = false;
    try {
      await DressSizesAPI.hardDelete(row.id);
      setSizes((prev) => prev.filter((item) => item.id !== row.id));
      notify("success", "Taille supprimée", "La taille a été supprimée définitivement.");
      success = true;
    } catch (error) {
      console.error("❌ Hard delete taille :", error);
      notify("error", "Erreur", "Impossible de supprimer la taille.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.size) return;
    const row = confirmState.size;
    const success =
      confirmState.mode === "soft" ? await performSoftDelete(row) : await performHardDelete(row);
    if (success) resetConfirm();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createName.trim()) {
      notify("warning", "Champs manquants", "Le nom est obligatoire.");
      return;
    }

    try {
      setCreating(true);
      const created = await DressSizesAPI.create({ name: createName.trim() });
      setSizes((prev) => [created, ...prev]);
      notify("success", "Taille créée", "La taille a été ajoutée.");
      setCreateOpen(false);
    } catch (error) {
      console.error("❌ Création taille :", error);
      notify("error", "Erreur", "Impossible de créer la taille.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSize) return;

    if (!editName.trim()) {
      notify("warning", "Champs manquants", "Le nom est obligatoire.");
      return;
    }

    try {
      setUpdating(true);
      const updated = await DressSizesAPI.update(editSize.id, { name: editName.trim() });
      setSizes((prev) => prev.map((size) => (size.id === editSize.id ? updated : size)));
      notify("success", "Taille mise à jour", "Les modifications ont été enregistrées.");
      setEditSize(null);
    } catch (error) {
      console.error("❌ Mise à jour taille :", error);
      notify("error", "Erreur", "Impossible de mettre à jour la taille.");
    } finally {
      setUpdating(false);
    }
  };

  const confirmSize = confirmState.size;
  const confirmLoading =
    !!confirmSize && processing.type === confirmState.mode && processing.id === confirmSize.id;
  const confirmTitle =
    confirmState.mode === "soft" ? "Désactiver la taille" : "Supprimer la taille";
  const confirmDescription =
    confirmState.mode === "soft"
      ? "Cette action désactivera temporairement la taille."
      : "Cette action est définitive. Toutes les données associées à cette taille seront supprimées.";
  const confirmAccent =
    confirmState.mode === "soft"
      ? "border-warning-100 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-300"
      : "border-error-100 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300";

  return (
    <>
      <PageMeta title="Tailles de robe - Velvena App" description="Administration des tailles de robe." />
      <PageBreadcrumb pageTitle="Tailles de robe" />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Tailles de robe</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Chargement..." : `${rows.length} taille${rows.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {(isAdmin || isManager) && (
            <Button onClick={openCreateModal} disabled={creating} variant="outline">
              Ajouter une taille
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex w-full justify-center py-16">
            <SpinnerOne />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
            <h4 className="text-base font-medium text-gray-800 dark:text-white/90">Aucune taille disponible</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dès qu’une taille sera créée, elle apparaîtra automatiquement ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <TableHeader className="bg-gray-50 dark:bg-white/[0.03]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Nom
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-transparent">
                {rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white/90">
                      {row.name}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TooltipWrapper title="Modifier">
                          <button
                            type="button"
                            onClick={() => openEditModal(row)}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                          >
                            <PencilIcon className="size-4" />
                          </button>
                        </TooltipWrapper>
                        {(isAdmin || isManager) && (
                          <TooltipWrapper title="Désactiver (soft delete)">
                            <button
                              type="button"
                              onClick={() => requestSoftDelete(row)}
                              disabled={processing.type === "soft" && processing.id === row.id}
                              className={`inline-flex size-9 items-center justify-center rounded-lg border transition ${
                                processing.type === "soft" && processing.id === row.id
                                  ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60 dark:border-gray-700 dark:text-gray-500"
                                  : "border-gray-300 text-warning-600 hover:bg-gray-50 hover:text-warning-600 dark:border-gray-700 dark:text-warning-400 dark:hover:bg-white/10"
                              }`}
                            >
                              <CloseLineIcon className="size-4" />
                            </button>
                          </TooltipWrapper>
                        )}
                        {isAdmin && (
                          <TooltipWrapper title="Supprimer définitivement">
                            <button
                              type="button"
                              onClick={() => requestHardDelete(row)}
                              disabled={processing.type === "hard" && processing.id === row.id}
                              className={`inline-flex size-9 items-center justify-center rounded-lg border transition ${
                                processing.type === "hard" && processing.id === row.id
                                  ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60 dark:border-gray-700 dark:text-gray-500"
                                  : "border-gray-300 text-error-600 hover:bg-gray-50 hover:text-error-600 dark:border-gray-700 dark:text-error-400 dark:hover:bg-white/10"
                              }`}
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </TooltipWrapper>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(confirmSize)}
        onClose={confirmLoading ? () => undefined : resetConfirm}
        className="max-w-md w-full p-6"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{confirmTitle}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{confirmDescription}</p>
          </div>

          {confirmSize && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${confirmAccent}`}>
              <p>
                Taille :<span className="font-semibold"> {confirmSize.name}</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Créée le {confirmSize.createdLabel}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={resetConfirm}
              disabled={confirmLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                confirmLoading
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={confirmLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm text-white shadow-theme-xs transition focus:outline-hidden focus:ring-3 ${
                confirmLoading
                  ? "cursor-not-allowed opacity-60 bg-gray-300 dark:bg-gray-700"
                  : confirmState.mode === "soft"
                  ? "bg-warning-600 hover:bg-warning-700 focus:ring-warning-500/20"
                  : "bg-error-600 hover:bg-error-700 focus:ring-error-500/20"
              }`}
            >
              {confirmLoading
                ? "Traitement..."
                : confirmState.mode === "soft"
                ? "Oui, désactiver"
                : "Oui, supprimer"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={createOpen}
        onClose={creating ? () => undefined : closeCreateModal}
        className="max-w-[420px] w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleCreate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Ajouter une taille
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Indiquez le nom de la taille que vous souhaitez ajouter.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom de la taille
              </label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Ex : 36"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={creating}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                creating
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <Button type="submit" disabled={creating}>
              {creating ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(editSize)}
        onClose={updating ? () => undefined : closeEditModal}
        className="max-w-[420px] w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Modifier la taille
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajustez le nom de la taille sélectionnée.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom de la taille
              </label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex : 36"
                required
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeEditModal}
              disabled={updating}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3.5 text-sm ring-1 ring-inset transition ${
                updating
                  ? "cursor-not-allowed opacity-60 ring-gray-200 text-gray-400 dark:ring-gray-700 dark:text-gray-500"
                  : "ring-gray-300 text-gray-700 hover:bg-gray-50 dark:ring-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              }`}
            >
              Annuler
            </button>
            <Button type="submit" disabled={updating}>
              {updating ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
