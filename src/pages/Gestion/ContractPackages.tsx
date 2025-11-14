import type React from "react";
import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useNotification } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/form/input/InputField";
import MultiSelect from "../../components/form/MultiSelect";
import Badge from "../../components/ui/badge/Badge";
import { PencilIcon, CloseLineIcon, TrashBinIcon } from "../../icons";
import { ContractPackagesAPI, type ContractPackage } from "../../api/endpoints/contractPackages";
import { ContractAddonsAPI, type ContractAddon } from "../../api/endpoints/contractAddons";

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

interface PackageRow extends ContractPackage {
  formattedHT: string;
  formattedTTC: string;
  addonIds: string[];
  addonNames: string[];
}

type PackageForm = {
  name: string;
  num_dresses: string;
  price_ht: string;
  price_ttc: string;
  addon_ids: string[];
};

type ConfirmState = {
  mode: "soft" | "hard";
  package: PackageRow | null;
};

const defaultForm: PackageForm = {
  name: "",
  num_dresses: "",
  price_ht: "",
  price_ttc: "",
  addon_ids: [],
};

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

const toInteger = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Math.trunc(value);
  }

  const normalized = value.replace(/\s+/g, "").trim();
  if (!normalized) return null;

  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return null;
  return Math.trunc(numeric);
};

const ensureAddonLinks = (pkg: ContractPackage, fallbackAddonIds: string[]): ContractPackage => {
  if (pkg.addons && pkg.addons.length > 0) return pkg;
  if (fallbackAddonIds.length === 0) return pkg;
  return {
    ...pkg,
    addons: fallbackAddonIds.map((addonId) => ({
      package_id: pkg.id,
      addon_id: addonId,
    })),
  };
};

export default function ContractPackages() {
  const [packages, setPackages] = useState<ContractPackage[]>([]);
  const [availableAddons, setAvailableAddons] = useState<ContractAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [processing, setProcessing] = useState<{ type: "soft" | "hard" | null; id: string | null }>({
    type: null,
    id: null,
  });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PackageForm>(defaultForm);
  const [editPackage, setEditPackage] = useState<PackageRow | null>(null);
  const [editForm, setEditForm] = useState<PackageForm>(defaultForm);
  const [confirmState, setConfirmState] = useState<ConfirmState>({ mode: "soft", package: null });

  const { notify } = useNotification();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  const isManager = hasRole("MANAGER");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [packagesRes, addonsRes] = await Promise.all([
          ContractPackagesAPI.list(),
          ContractAddonsAPI.list(),
        ]);
        setPackages(packagesRes);
        setAvailableAddons(addonsRes);
      } catch (error) {
        console.error("❌ Impossible de charger les forfaits :", error);
        notify("error", "Erreur", "Le chargement des forfaits a échoué.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [notify]);

  const addonMap = useMemo(() => {
    const map = new Map<string, ContractAddon>();
    availableAddons.forEach((addon) => {
      map.set(addon.id, addon);
    });
    return map;
  }, [availableAddons]);

  const rows: PackageRow[] = useMemo(
    () =>
      packages.map((pkg) => {
        const addonIds = pkg.addons?.map((link) => link.addon_id) ?? [];
        const addonNames = addonIds
          .map((id) => addonMap.get(id)?.name)
          .filter((name): name is string => Boolean(name));
        return {
          ...pkg,
          formattedHT: parsePrice(pkg.price_ht),
          formattedTTC: parsePrice(pkg.price_ttc),
          addonIds,
          addonNames,
        };
      }),
    [packages, addonMap],
  );

  const addonOptions = useMemo(
    () =>
      availableAddons.map((addon) => ({
        value: addon.id,
        text: `${addon.name} — ${parsePrice(addon.price_ttc)}`,
      })),
    [availableAddons],
  );

  const openCreateModal = () => {
    if (!isAdmin && !isManager) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setCreateForm(defaultForm);
    setCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setCreateOpen(false);
  };

  const handleCreateChange = (field: keyof PackageForm, value: string | string[]) => {
    setCreateForm((prev) => {
      if (field === "price_ttc" && typeof value === "string") {
        const numericTtc = toNumber(value);
        if (numericTtc === null) {
          return {
            ...prev,
            price_ttc: value,
            price_ht: "",
          };
        }

        const ht = numericTtc / 1.2;
        return {
          ...prev,
          price_ttc: value,
          price_ht: ht.toFixed(2),
        };
      }

      if (field === "addon_ids" && Array.isArray(value)) {
        return { ...prev, addon_ids: value };
      }

      return { ...prev, [field]: value };
    });
  };

  const openEditModal = (pkg: PackageRow) => {
    setEditPackage(pkg);
    setEditForm({
      name: pkg.name,
      num_dresses: pkg.num_dresses?.toString() ?? "",
      price_ht:
        typeof pkg.price_ht === "number" ? pkg.price_ht.toFixed(2) : pkg.price_ht?.toString() ?? "",
      price_ttc:
        typeof pkg.price_ttc === "number"
          ? pkg.price_ttc.toFixed(2)
          : pkg.price_ttc?.toString() ?? "",
      addon_ids: pkg.addonIds,
    });
  };

  const closeEditModal = () => {
    if (updating) return;
    setEditPackage(null);
  };

  const handleEditChange = (field: keyof PackageForm, value: string | string[]) => {
    setEditForm((prev) => {
      if (field === "price_ttc" && typeof value === "string") {
        const numericTtc = toNumber(value);
        if (numericTtc === null) {
          return {
            ...prev,
            price_ttc: value,
            price_ht: "",
          };
        }

        const ht = numericTtc / 1.2;
        return {
          ...prev,
          price_ttc: value,
          price_ht: ht.toFixed(2),
        };
      }

      if (field === "addon_ids" && Array.isArray(value)) {
        return { ...prev, addon_ids: value };
      }

      return { ...prev, [field]: value };
    });
  };

  const requestSoftDelete = (pkg: PackageRow) => {
    if (!isAdmin && !isManager) {
      notify("warning", "Action non autorisée", "Vous n'avez pas les droits suffisants.");
      return;
    }
    setConfirmState({ mode: "soft", package: pkg });
  };

  const requestHardDelete = (pkg: PackageRow) => {
    if (!isAdmin) {
      notify("warning", "Action non autorisée", "Seul un administrateur peut supprimer définitivement un forfait.");
      return;
    }
    setConfirmState({ mode: "hard", package: pkg });
  };

  const resetConfirm = () => setConfirmState({ mode: "soft", package: null });

  const performSoftDelete = async (pkg: PackageRow) => {
    setProcessing({ type: "soft", id: pkg.id });
    let success = false;
    try {
      await ContractPackagesAPI.softDelete(pkg.id);
      setPackages((prev) => prev.filter((item) => item.id !== pkg.id));
      notify("success", "Forfait désactivé", "Le forfait a été désactivé.");
      success = true;
    } catch (error) {
      console.error("❌ Soft delete forfait :", error);
      notify("error", "Erreur", "Impossible de désactiver le forfait.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const performHardDelete = async (pkg: PackageRow) => {
    setProcessing({ type: "hard", id: pkg.id });
    let success = false;
    try {
      await ContractPackagesAPI.hardDelete(pkg.id);
      setPackages((prev) => prev.filter((item) => item.id !== pkg.id));
      notify("success", "Forfait supprimé", "Le forfait a été supprimé définitivement.");
      success = true;
    } catch (error) {
      console.error("❌ Hard delete forfait :", error);
      notify("error", "Erreur", "Impossible de supprimer le forfait.");
    } finally {
      setProcessing({ type: null, id: null });
    }
    return success;
  };

  const handleConfirmDelete = async () => {
    if (!confirmState.package) return;
    const pkg = confirmState.package;
    const success =
      confirmState.mode === "soft" ? await performSoftDelete(pkg) : await performHardDelete(pkg);
    if (success) resetConfirm();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) {
      notify("warning", "Champs manquants", "Le nom du forfait est obligatoire.");
      return;
    }

    const numDressesValue = toInteger(createForm.num_dresses);
    if (numDressesValue === null || numDressesValue <= 0) {
      notify("warning", "Champs manquants", "Le nombre de tenues doit être un entier supérieur à 0.");
      return;
    }

    const priceHtValue = toNumber(createForm.price_ht);
    const priceTtcValue = toNumber(createForm.price_ttc);
    if (priceHtValue === null || priceTtcValue === null) {
      notify("warning", "Champs manquants", "Les prix HT et TTC doivent être renseignés avec un format valide.");
      return;
    }

    const payload = {
      name: createForm.name.trim(),
      num_dresses: numDressesValue,
      price_ht: priceHtValue,
      price_ttc: priceTtcValue,
      ...(createForm.addon_ids.length > 0 ? { addon_ids: createForm.addon_ids } : {}),
    };

    try {
      setCreating(true);
      const created = await ContractPackagesAPI.create(payload);
      const sanitized = ensureAddonLinks(created, createForm.addon_ids);
      setPackages((prev) => [sanitized, ...prev]);
      notify("success", "Forfait créé", "Le forfait a été ajouté.");
      setCreateOpen(false);
    } catch (error) {
      console.error("❌ Création forfait :", error);
      notify("error", "Erreur", "Impossible de créer le forfait.");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPackage) return;

    if (!editForm.name.trim()) {
      notify("warning", "Champs manquants", "Le nom du forfait est obligatoire.");
      return;
    }

    const numDressesValue = toInteger(editForm.num_dresses);
    if (numDressesValue === null || numDressesValue <= 0) {
      notify("warning", "Champs manquants", "Le nombre de tenues doit être un entier supérieur à 0.");
      return;
    }

    const priceHtValue = toNumber(editForm.price_ht);
    const priceTtcValue = toNumber(editForm.price_ttc);
    if (priceHtValue === null || priceTtcValue === null) {
      notify("warning", "Champs manquants", "Les prix HT et TTC doivent être renseignés avec un format valide.");
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      num_dresses: numDressesValue,
      price_ht: priceHtValue,
      price_ttc: priceTtcValue,
      ...(editForm.addon_ids.length > 0 ? { addon_ids: editForm.addon_ids } : {}),
    };

    try {
      setUpdating(true);
      const updated = await ContractPackagesAPI.update(editPackage.id, payload);
      const sanitized = ensureAddonLinks(updated, editForm.addon_ids);
      setPackages((prev) => prev.map((pkg) => (pkg.id === editPackage.id ? sanitized : pkg)));
      notify("success", "Forfait mis à jour", "Les modifications ont été enregistrées.");
      setEditPackage(null);
    } catch (error) {
      console.error("❌ Mise à jour forfait :", error);
      notify("error", "Erreur", "Impossible de mettre à jour le forfait.");
    } finally {
      setUpdating(false);
    }
  };

  const confirmPkg = confirmState.package;
  const confirmLoading =
    !!confirmPkg && processing.type === confirmState.mode && processing.id === confirmPkg.id;
  const confirmTitle =
    confirmState.mode === "soft" ? "Désactiver le forfait" : "Supprimer le forfait";
  const confirmDescription =
    confirmState.mode === "soft"
      ? "Cette action désactivera temporairement le forfait."
      : "Cette action est définitive. Toutes les données associées à ce forfait seront supprimées.";
  const confirmAccent =
    confirmState.mode === "soft"
      ? "border-warning-100 bg-warning-50 text-warning-700 dark:border-warning-500/40 dark:bg-warning-500/10 dark:text-warning-300"
      : "border-error-100 bg-error-50 text-error-700 dark:border-error-500/40 dark:bg-error-500/10 dark:text-error-300";

  return (
    <>
      <PageMeta title="Gestion des forfaits - Allure Creation App" description="Administration des forfaits contractuels." />
      <PageBreadcrumb pageTitle="Forfaits" />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Forfaits</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? "Chargement..." : `${rows.length} forfait${rows.length > 1 ? "s" : ""}`}
            </p>
          </div>
          {(isAdmin || isManager) && (
            <Button onClick={openCreateModal} disabled={creating} variant="outline">
              Ajouter un forfait
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex w-full justify-center py-16">
            <SpinnerOne />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex w-full flex-col items-center justify-center gap-2 py-16 text-center">
            <h4 className="text-base font-medium text-gray-800 dark:text-white/90">Aucun forfait disponible</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dès qu’un forfait sera créé, il apparaîtra automatiquement ici.
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
                    Tenues incluses
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Prix HT
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Prix TTC
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    Options
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
                      {row.num_dresses}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.formattedHT}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {row.formattedTTC}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {row.addonNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {row.addonNames.map((name) => (
                            <Badge key={name} variant="light" color="info" size="sm">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 dark:text-gray-400">Aucune option</span>
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
        isOpen={Boolean(confirmPkg)}
        onClose={confirmLoading ? () => undefined : resetConfirm}
        className="max-w-md w-full p-6"
        showCloseButton={false}
      >
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">{confirmTitle}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{confirmDescription}</p>
          </div>

          {confirmPkg && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${confirmAccent}`}>
              <p>
                Forfait :<span className="font-semibold"> {confirmPkg.name}</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {confirmPkg.formattedHT} HT • {confirmPkg.formattedTTC} TTC
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
        className="max-w-[480px] w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleCreate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Ajouter un forfait</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Complétez les informations suivantes pour créer un nouveau forfait.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom du forfait
              </label>
              <Input
                value={createForm.name}
                onChange={(e) => handleCreateChange("name", e.target.value)}
                placeholder="Nom du forfait"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre de tenues incluses
              </label>
              <Input
                type="number"
                min="1"
                value={createForm.num_dresses}
                onChange={(e) => handleCreateChange("num_dresses", e.target.value)}
                placeholder="Ex : 3"
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
                placeholder="Calcul automatique"
                disabled
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prix TTC
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={createForm.price_ttc}
                onChange={(e) => handleCreateChange("price_ttc", e.target.value)}
                placeholder="Ex : 119.99"
                required
              />
            </div>
            <div>
              <MultiSelect
                label="Options associées (facultatif)"
                options={addonOptions}
                defaultSelected={createForm.addon_ids}
                onChange={(values) => handleCreateChange("addon_ids", values)}
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
        isOpen={Boolean(editPackage)}
        onClose={updating ? () => undefined : closeEditModal}
        className="max-w-[480px] w-full p-6"
        showCloseButton={false}
      >
        <form className="flex flex-col gap-6" onSubmit={handleUpdate}>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Modifier le forfait</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Ajustez les informations du forfait sélectionné.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nom du forfait
              </label>
              <Input
                value={editForm.name}
                onChange={(e) => handleEditChange("name", e.target.value)}
                placeholder="Nom du forfait"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre de tenues incluses
              </label>
              <Input
                type="number"
                min="1"
                value={editForm.num_dresses}
                onChange={(e) => handleEditChange("num_dresses", e.target.value)}
                placeholder="Ex : 3"
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
                placeholder="Calcul automatique"
                disabled
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Prix TTC
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editForm.price_ttc}
                onChange={(e) => handleEditChange("price_ttc", e.target.value)}
                placeholder="Ex : 119.99"
                required
              />
            </div>
            <div>
              <MultiSelect
                label="Options associées (facultatif)"
                options={addonOptions}
                defaultSelected={editForm.addon_ids}
                onChange={(values) => handleEditChange("addon_ids", values)}
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
