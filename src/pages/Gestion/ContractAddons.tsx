import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { ContractAddonsAPI, type ContractAddon } from "../../api/endpoints/contractAddons";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { PencilIcon, CloseLineIcon, TrashBinIcon } from "../../icons";

interface AddonRow extends ContractAddon {
  formattedHT: string;
  formattedTTC: string;
}

type ConfirmState = {
  mode: "soft" | "hard";
  addon: AddonRow | null;
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

const parsePrice = (value: string | number) => {
  const numeric = typeof value === "number" ? value : parseFloat(value);
  if (Number.isNaN(numeric)) return "-";
  return `${numeric.toFixed(2)} €`;
};

const toNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const normalized = value.replace(/\s+/g, "").replace(/,/g, ".").trim();
  if (!normalized) return null;

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
};

export default function ContractAddons() {
  const [addons, setAddons] = useState<ContractAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<{ type: "soft" | "hard" | null; id: string | null }>({
    type: null,
    id: null,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    price_ht: "",
    price_ttc: "",
    included: false,
  });
  const [editAddon, setEditAddon] = useState<ContractAddon | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price_ht: "",
    price_ttc: "",
    included: false,
  });
  const [confirmState, setConfirmState] = useState<ConfirmState>({ mode: "soft", addon: null });
  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const isManager = hasRole("MANAGER");

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        setLoading(true);
        const data = await ContractAddonsAPI.list();
        setAddons(data);
      } catch (error) {
        console.error("❌ Impossible de charger les options :", error);
        notify("error", "Erreur", "Le chargement des options a échoué.");
      } finally {
        setLoading(false);
      }
    };

    fetchAddons();
  }, [notify]);

  const rows: AddonRow[] = useMemo(
    () =>
      addons.map((addon) => ({
        ...addon,
        formattedHT: parsePrice(addon.price_ht),
        formattedTTC: parsePrice(addon.price_ttc),
      })),
    [addons],
  );

  const openCreateModal = () => {
    if (!isAdmin && !isManager) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setCreateForm({ name: "", price_ht: "", price_ttc: "", included: false });
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const handleCreateChange = (field: keyof typeof createForm, value: string | boolean) => {
    setCreateForm((prev) => {
      if (field === "price_ttc" && typeof value === "string") {
        const newTtc = value;
        const numericTtc = toNumber(newTtc);
        if (numericTtc === null) {
          return {
            ...prev,
            price_ttc: newTtc,
            price_ht: "",
          };
        }

        const ht = numericTtc / 1.2;
        return {
          ...prev,
          price_ttc: newTtc,
          price_ht: ht.toFixed(2),
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const openEditModal = (addon: ContractAddon) => {
    setEditAddon(addon);
    setEditForm({
      name: addon.name,
      price_ht: addon.price_ht ?? "",
      price_ttc: addon.price_ttc ?? "",
      included: Boolean(addon.included),
    });
  };

  const closeEditModal = () => {
    if (processing.type) return;
    setEditAddon(null);
  };

  const handleEditChange = (field: keyof typeof editForm, value: string | boolean) => {
    setEditForm((prev) => {
      if (field === "price_ttc" && typeof value === "string") {
        const newTtc = value;
        const numericTtc = toNumber(newTtc);
        if (numericTtc === null) {
          return {
            ...prev,
            price_ttc: newTtc,
            price_ht: "",
          };
        }

        const ht = numericTtc / 1.2;
        return {
          ...prev,
          price_ttc: newTtc,
          price_ht: ht.toFixed(2),
        };
      }

      return { ...prev, [field]: value };
    });
  };

  const requestSoftDelete = (row: AddonRow) => {
    if (!isAdmin && !isManager) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setConfirmState({ mode: "soft", addon: row });
  };

  const requestHardDelete = (row: AddonRow) => {
    if (!isAdmin) {
      notify("warning", "Action non autorisée", "Seul un administrateur peut supprimer définitivement une option.");
      return;
    }
    setConfirmState({ mode: "hard", addon: row });
  };

  const resetConfirm = () => setConfirmState({ mode: "soft", addon: null });

  const performSoftDelete = async (row: AddonRow) => {
    setProcessing({ type: "soft", id: row.id });
    let success = false;
    try {
      await ContractAddonsAPI.softDelete(row.id);
      setAddons((prev) => prev.filter((addon) => addon.id !== row.id));
      notify("success", "Option désactivée", "L'option a été désactivée.");
      success = true;
    } catch (error) {
      console.error("❌ Soft delete option :", error);
      notify("error", "Erreur", "Impossible de désactiver l'option.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const performHardDelete = async (row: AddonRow) => {
    setProcessing({ type: "hard", id: row.id });
    let success = false;
    try {
      await ContractAddonsAPI.hardDelete(row.id);
      setAddons((prev) => prev.filter((addon) => addon.id !== row.id));
      notify("success", "Option supprimée", "L'option a été supprimée définitivement.");
      success = true;
    } catch (error) {
      console.error("❌ Hard delete option :", error);
      notify("error", "Erreur", "Impossible de supprimer l'option.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.addon) return;
    const row = confirmState.addon;
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

    const priceHtValue = toNumber(createForm.price_ht);
    const priceTtcValue = toNumber(createForm.price_ttc);
    if (priceHtValue === null || priceTtcValue === null) {
      notify("warning", "Champs manquants", "Les prix HT et TTC doivent être renseignés avec un format valide.");
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: createForm.name.trim(),
        price_ht: priceHtValue,
        price_ttc: priceTtcValue,
        included: createForm.included,
      };
      const created = await ContractAddonsAPI.create(payload);
      setAddons((prev) => [created, ...prev]);
      notify("success", "Option créée", "L'option a été ajoutée.");
      setCreateOpen(false);
    } catch (error) {
      console.error("❌ Création option :", error);
      notify("error", "Erreur", "Impossible de créer l'option.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAddon) return;

    if (!editForm.name.trim()) {
      notify("warning", "Champs manquants", "Le nom est obligatoire.");
      return;
    }

    const priceHtValue = toNumber(editForm.price_ht);
    const priceTtcValue = toNumber(editForm.price_ttc);
    if (priceHtValue === null || priceTtcValue === null) {
      notify("warning", "Champs manquants", "Les prix HT et TTC doivent être renseignés avec un format valide.");
      return;
    }

    try {
      setUpdating(true);
      const payload = {
        name: editForm.name.trim(),
        price_ht: priceHtValue,
        price_ttc: priceTtcValue,
        included: editForm.included,
      };
      const updated = await ContractAddonsAPI.update(editAddon.id, payload);
      setAddons((prev) => prev.map((addon) => (addon.id === editAddon.id ? updated : addon)));
      notify("success", "Option mise à jour", "Les modifications ont été enregistrées.");
      setEditAddon(null);
    } catch (error) {
      console.error("❌ Mise à jour option :", error);
      notify("error", "Erreur", "Impossible de mettre à jour l'option.");
    } finally {
      setUpdating(false);
    }
  };

  const confirmAddon = confirmState.addon;
  const confirmLoading =
    !!confirmAddon && processing.type === confirmState.mode && processing.id === confirmAddon.id;
  const confirmTitle =
    confirmState.mode === "soft" ? "Désactiver l'option" : "Supprimer l'option";
  const confirmDescription =
    confirmState.mode === "soft"
      ? "Cette action désactivera temporairement l'option."
      : "Cette action est définitive. Toutes les données associées à cette option seront supprimées.";
  const confirmAccent =
    confirmState.mode === "soft"
      ? "border-warning-100 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-300"
      : "border-error-100 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300";

  return (
    <>
      <PageMeta title="Gestion des options - Allure Creation App" description="Administration des options contractuelles." />
      <PageBreadcrumb pageTitle="Options" />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Options</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Chargement..." : `${rows.length} option${rows.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {(isAdmin || isManager) && (
            <Button onClick={openCreateModal} disabled={creating} variant="outline">
              Ajouter une option
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex w-full justify-center py-16">
            <SpinnerOne />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
            <h4 className="text-base font-medium text-gray-800 dark:text-white/90">Aucune option disponible</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dès qu’une option sera créée, elle apparaîtra automatiquement ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <TableHeader className="bg-gray-50 dark:bg-white/[0.03]">
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nom
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Prix HT
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Prix TTC
                  </TableCell>
                  <TableCell isHeader className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
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
                      {row.formattedHT}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.formattedTTC}
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
        isOpen={Boolean(confirmAddon)}
        onClose={confirmLoading ? () => undefined : resetConfirm}
        className="max-w-md w-full p-6"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{confirmTitle}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{confirmDescription}</p>
          </div>

          {confirmAddon && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${confirmAccent}`}>
              <p>
                Option :<span className="font-semibold"> {confirmAddon.name}</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {confirmAddon.formattedHT} HT • {confirmAddon.formattedTTC} TTC
              </p>
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
              Ajouter une option
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Complétez les informations suivantes pour créer une option.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom de l'option
              </label>
              <Input
                value={createForm.name}
                onChange={(e) => handleCreateChange("name", e.target.value)}
                placeholder="Nom"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prix HT
              </label>
              <Input
                value={createForm.price_ht}
                onChange={(e) => handleCreateChange("price_ht", e.target.value)}
                placeholder="Ex : 99.99"
                disabled
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prix TTC
              </label>
              <Input
                value={createForm.price_ttc}
                onChange={(e) => handleCreateChange("price_ttc", e.target.value)}
                placeholder="Ex : 119.99"
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
        isOpen={Boolean(editAddon)}
        onClose={updating ? () => undefined : closeEditModal}
        className="max-w-[420px] w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Modifier l'option
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajustez les informations de l'option sélectionnée.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom
              </label>
              <Input
                value={editForm.name}
                onChange={(e) => handleEditChange("name", e.target.value)}
                placeholder="Nom"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prix HT
              </label>
              <Input
                value={editForm.price_ht}
                onChange={(e) => handleEditChange("price_ht", e.target.value)}
                placeholder="Ex : 99.99"
                required
                disabled
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prix TTC
              </label>
              <Input
                value={editForm.price_ttc}
                onChange={(e) => handleEditChange("price_ttc", e.target.value)}
                placeholder="Ex : 119.99"
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
