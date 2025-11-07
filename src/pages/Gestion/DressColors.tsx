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
import { DressColorsAPI, type DressColor } from "../../api/endpoints/dressColors";
import { PencilIcon, CloseLineIcon, TrashBinIcon } from "../../icons";

interface ColorRow extends DressColor {
  createdLabel: string;
  updatedLabel: string;
  descriptionPreview: string;
  hexCodeDisplay: string;
}

type ConfirmState = {
  mode: "soft" | "hard";
  color: ColorRow | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    const date = new Date(value);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

const renderDescriptionPreview = (value?: string | null) => {
  if (!value) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 77)}...`;
};

const normalizeHex = (value: string) => {
  let trimmed = value.trim();
  if (!trimmed) return "";
  let hasHash = false;
  if (trimmed.startsWith("#")) {
    hasHash = true;
    trimmed = trimmed.slice(1);
  }
  const hex = trimmed.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase();
  if (!hex) return hasHash ? "#" : "";
  return `#${hex}`;
};

const isValidHex = (value: string) => /^#[0-9A-F]{6}$/.test(value);

const PRESET_COLORS = [
  "#FFFFFF",
  "#000000",
  "#F87171",
  "#FB923C",
  "#FACC15",
  "#34D399",
  "#60A5FA",
  "#A855F7",
  "#EC4899",
  "#D97706",
  "#15803D",
  "#1D4ED8",
  "#7C3AED",
  "#BE123C",
  "#0EA5E9",
  "#F472B6",
];

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

export default function DressColors() {
  const [colors, setColors] = useState<DressColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [processing, setProcessing] = useState<{ type: "soft" | "hard" | null; id: string | null }>({
    type: null,
    id: null,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [editColor, setEditColor] = useState<ColorRow | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", hex_code: "#000000" });
  const [editForm, setEditForm] = useState({ name: "", hex_code: "#000000" });
  const [confirmState, setConfirmState] = useState<ConfirmState>({ mode: "soft", color: null });

  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const isManager = hasRole("MANAGER");

  useEffect(() => {
    const fetchColors = async () => {
      try {
        setLoading(true);
        const data = await DressColorsAPI.list();
        setColors(data);
      } catch (error) {
        console.error("❌ Impossible de charger les couleurs de robe :", error);
        notify("error", "Erreur", "Le chargement des couleurs a échoué.");
      } finally {
        setLoading(false);
      }
    };

    fetchColors();
  }, [notify]);

  const rows: ColorRow[] = useMemo(
    () =>
      colors.map((color) => {
        const normalizedHex = normalizeHex(color.hex_code ?? "");
        const hexCodeDisplay = isValidHex(normalizedHex) ? normalizedHex : "";
        return {
          ...color,
          createdLabel: formatDate(color.created_at),
          updatedLabel: formatDate(color.updated_at),
          descriptionPreview: renderDescriptionPreview(color.description),
          hexCodeDisplay,
        };
      }),
    [colors],
  );

  const openCreateModal = () => {
    if (!isAdmin && !isManager) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setCreateForm({ name: "", hex_code: "#000000" });
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const openEditModal = (row: ColorRow) => {
    setEditColor(row);
    setEditForm({
      name: row.name,
      hex_code: row.hexCodeDisplay || "#000000",
    });
  };

  const closeEditModal = () => {
    if (updating) return;
    setEditColor(null);
  };

  const requestSoftDelete = (row: ColorRow) => {
    if (!isAdmin && !isManager) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setConfirmState({ mode: "soft", color: row });
  };

  const requestHardDelete = (row: ColorRow) => {
    if (!isAdmin) {
      notify("warning", "Action non autorisée", "Seul un administrateur peut supprimer définitivement une couleur.");
      return;
    }
    setConfirmState({ mode: "hard", color: row });
  };

  const resetConfirm = () => setConfirmState({ mode: "soft", color: null });

  const performSoftDelete = async (row: ColorRow) => {
    setProcessing({ type: "soft", id: row.id });
    let success = false;
    try {
      await DressColorsAPI.softDelete(row.id);
      setColors((prev) => prev.filter((item) => item.id !== row.id));
      notify("success", "Couleur désactivée", "La couleur a été désactivée.");
      success = true;
    } catch (error) {
      console.error("❌ Soft delete couleur :", error);
      notify("error", "Erreur", "Impossible de désactiver la couleur.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const performHardDelete = async (row: ColorRow) => {
    setProcessing({ type: "hard", id: row.id });
    let success = false;
    try {
      await DressColorsAPI.hardDelete(row.id);
      setColors((prev) => prev.filter((item) => item.id !== row.id));
      notify("success", "Couleur supprimée", "La couleur a été supprimée définitivement.");
      success = true;
    } catch (error) {
      console.error("❌ Hard delete couleur :", error);
      notify("error", "Erreur", "Impossible de supprimer la couleur.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.color) return;
    const row = confirmState.color;
    const success =
      confirmState.mode === "soft" ? await performSoftDelete(row) : await performHardDelete(row);
    if (success) resetConfirm();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.name.trim()) {
      notify("warning", "Champs manquants", "Le nom est obligatoire.");
      return;
    }

    const hex = normalizeHex(createForm.hex_code);
    if (!isValidHex(hex)) {
      notify("warning", "Champs manquants", "Le code couleur doit être un hexadécimal valide (ex : #1A2B3C).");
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: createForm.name.trim(),
        hex_code: hex,
      };
      const created = await DressColorsAPI.create(payload);
      setColors((prev) => [created, ...prev]);
      notify("success", "Couleur créée", "La couleur a été ajoutée.");
      setCreateOpen(false);
    } catch (error) {
      console.error("❌ Création couleur :", error);
      notify("error", "Erreur", "Impossible de créer la couleur.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editColor) return;

    if (!editForm.name.trim()) {
      notify("warning", "Champs manquants", "Le nom est obligatoire.");
      return;
    }

    const hex = normalizeHex(editForm.hex_code);
    if (!isValidHex(hex)) {
      notify("warning", "Champs manquants", "Le code couleur doit être un hexadécimal valide (ex : #1A2B3C).");
      return;
    }

    try {
      setUpdating(true);
      const payload = {
        name: editForm.name.trim(),
        hex_code: hex,
      };
      const updated = await DressColorsAPI.update(editColor.id, payload);
      setColors((prev) => prev.map((color) => (color.id === editColor.id ? updated : color)));
      notify("success", "Couleur mise à jour", "Les modifications ont été enregistrées.");
      setEditColor(null);
    } catch (error) {
      console.error("❌ Mise à jour couleur :", error);
      notify("error", "Erreur", "Impossible de mettre à jour la couleur.");
    } finally {
      setUpdating(false);
    }
  };

  const confirmColor = confirmState.color;
  const confirmLoading =
    !!confirmColor && processing.type === confirmState.mode && processing.id === confirmColor.id;
  const confirmTitle =
    confirmState.mode === "soft" ? "Désactiver la couleur" : "Supprimer la couleur";
  const confirmDescription =
    confirmState.mode === "soft"
      ? "Cette action désactivera temporairement la couleur."
      : "Cette action est définitive. Toutes les données associées à cette couleur seront supprimées.";
  const confirmAccent =
    confirmState.mode === "soft"
      ? "border-warning-100 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-300"
      : "border-error-100 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300";

  return (
    <>
      <PageMeta title="Couleurs de robe" description="Administration des couleurs de robe." />
      <PageBreadcrumb pageTitle="Couleurs de robe" />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Couleurs de robe</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Chargement..." : `${rows.length} couleur${rows.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {(isAdmin || isManager) && (
            <Button onClick={openCreateModal} disabled={creating} variant="outline">
              Ajouter une couleur
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex w-full justify-center py-16">
            <SpinnerOne />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
            <h4 className="text-base font-medium text-gray-800 dark:text-white/90">Aucune couleur disponible</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dès qu’une couleur sera créée, elle apparaîtra automatiquement ici.
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
                    Code couleur
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
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.hexCodeDisplay ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: row.hexCodeDisplay }}
                            aria-hidden
                          />
                          <span>{row.hexCodeDisplay}</span>
                        </div>
                      ) : (
                        "—"
                      )}
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
        isOpen={Boolean(confirmColor)}
        onClose={confirmLoading ? () => undefined : resetConfirm}
        className="max-w-md w-full p-6"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{confirmTitle}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{confirmDescription}</p>
          </div>

          {confirmColor && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${confirmAccent}`}>
              <p>
                Couleur :<span className="font-semibold"> {confirmColor.name}</span>
              </p>
              {confirmColor.description ? (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{confirmColor.descriptionPreview}</p>
              ) : null}
              {confirmColor.hexCodeDisplay ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span
                    className="inline-flex h-5 w-5 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: confirmColor.hexCodeDisplay }}
                    aria-hidden
                  />
                  <span>{confirmColor.hexCodeDisplay}</span>
                </div>
              ) : null}
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
        className="max-w-[520px] w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleCreate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Ajouter une couleur de robe
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Complétez les informations suivantes pour créer une couleur.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom de la couleur
              </label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex : Bleu nuit"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Code couleur (hex)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={createForm.hex_code}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, hex_code: normalizeHex(e.target.value) }))
                    }
                    placeholder="#000000"
                    maxLength={7}
                    className="w-32"
                    required
                  />
                  <input
                    type="color"
                    aria-label="Sélectionner une couleur"
                    value={isValidHex(createForm.hex_code) ? createForm.hex_code : "#000000"}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, hex_code: normalizeHex(e.target.value) }))
                    }
                    className="h-11 w-11 cursor-pointer rounded-md border border-gray-300 bg-white p-1 dark:border-gray-700"
                  />
                </div>
                {isValidHex(createForm.hex_code) && (
                  <span
                    className="inline-flex h-8 w-8 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: createForm.hex_code }}
                    aria-label="Aperçu de la couleur sélectionnée"
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setCreateForm((prev) => ({ ...prev, hex_code: color }))}
                    className={`h-7 w-7 rounded-full border transition focus:outline-hidden focus:ring-2 focus:ring-brand-500/40 ${
                      createForm.hex_code === color
                        ? "border-brand-500 ring-2 ring-brand-500/30"
                        : "border-gray-300 hover:scale-105 dark:border-gray-600"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Choisir la couleur ${color}`}
                  />
                ))}
              </div>
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
        isOpen={Boolean(editColor)}
        onClose={updating ? () => undefined : closeEditModal}
        className="max-w-[520px] w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Modifier la couleur de robe
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajustez les informations de la couleur sélectionnée.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom de la couleur
              </label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex : Bleu nuit"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Code couleur (hex)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={editForm.hex_code}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, hex_code: normalizeHex(e.target.value) }))
                    }
                    placeholder="#000000"
                    maxLength={7}
                    className="w-32"
                    required
                  />
                  <input
                    type="color"
                    aria-label="Sélectionner une couleur"
                    value={isValidHex(editForm.hex_code) ? editForm.hex_code : "#000000"}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, hex_code: normalizeHex(e.target.value) }))
                    }
                    className="h-11 w-11 cursor-pointer rounded-md border border-gray-300 bg-white p-1 dark:border-gray-700"
                  />
                </div>
                {isValidHex(editForm.hex_code) && (
                  <span
                    className="inline-flex h-8 w-8 rounded-full border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: editForm.hex_code }}
                    aria-label="Aperçu de la couleur sélectionnée"
                  />
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setEditForm((prev) => ({ ...prev, hex_code: color }))}
                    className={`h-7 w-7 rounded-full border transition focus:outline-hidden focus:ring-2 focus:ring-brand-500/40 ${
                      editForm.hex_code === color
                        ? "border-brand-500 ring-2 ring-brand-500/30"
                        : "border-gray-300 hover:scale-105 dark:border-gray-600"
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Choisir la couleur ${color}`}
                  />
                ))}
              </div>
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
