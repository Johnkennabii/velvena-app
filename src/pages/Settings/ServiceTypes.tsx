import { useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Modal } from "../../components/ui/modal";
import { ServiceTypesAPI, type ServiceType, type ServiceTypePayload } from "../../api/endpoints/serviceTypes";
import { useNotification } from "../../context/NotificationContext";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import { PencilIcon, TrashBinIcon } from "../../icons";

const TooltipWrapper = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="tooltip-wrapper group/tooltip relative inline-block">
    {children}
    <div className="invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/tooltip:visible group-hover/tooltip:opacity-100">
      <div className="relative">
        <div className="whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900">
          {title}
        </div>
        <div className="absolute -bottom-1 left-1/2 h-3 w-4 -translate-x-1/2 rotate-45 bg-gray-900 dark:bg-gray-100" />
      </div>
    </div>
  </div>
);

export default function ServiceTypes() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [formData, setFormData] = useState<ServiceTypePayload>({
    name: "",
    code: "",
    description: "",
    is_active: true,
    config: {},
  });
  const [configFields, setConfigFields] = useState<Record<string, any>>({
    min_duration_days: "",
    max_duration_days: "",
    requires_deposit: false,
    default_deposit_percentage: "",
    duration_minutes: "",
    return_policy_days: "",
    weekend_only: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<ServiceType | null>(null);

  const { notify } = useNotification();

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  const fetchServiceTypes = async () => {
    try {
      setLoading(true);
      const response = await ServiceTypesAPI.list();
      setServiceTypes(response.data);
    } catch (error: any) {
      console.error("Erreur lors du chargement des types de service:", error);
      // Si l'endpoint n'existe pas encore, afficher un message approprié
      if (error?.response?.status === 404 || error?.message?.includes("404")) {
        notify("warning", "Endpoint non disponible", "L'endpoint /service-types n'est pas encore implémenté côté backend.");
      } else {
        notify("error", "Erreur", error.message || "Impossible de charger les types de service");
      }
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: "",
      code: "",
      description: "",
      is_active: true,
      config: {},
    });
    setConfigFields({
      min_duration_days: "",
      max_duration_days: "",
      requires_deposit: false,
      default_deposit_percentage: "",
      duration_minutes: "",
      return_policy_days: "",
      weekend_only: false,
    });
    setModalOpen(true);
  };

  const openEditModal = (service: ServiceType) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      code: service.code,
      description: service.description || "",
      is_active: service.is_active,
      config: service.config || {},
    });
    setConfigFields({
      min_duration_days: service.config?.min_duration_days || "",
      max_duration_days: service.config?.max_duration_days || "",
      requires_deposit: service.config?.requires_deposit || false,
      default_deposit_percentage: service.config?.default_deposit_percentage || "",
      duration_minutes: service.config?.duration_minutes || "",
      return_policy_days: service.config?.return_policy_days || "",
      weekend_only: service.config?.weekend_only || false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      notify("warning", "Champs requis", "Le nom et le code sont obligatoires");
      return;
    }

    try {
      setSubmitting(true);

      // Construire l'objet config en excluant les valeurs vides
      const config: Record<string, any> = {};
      if (configFields.min_duration_days !== "") config.min_duration_days = Number(configFields.min_duration_days);
      if (configFields.max_duration_days !== "") config.max_duration_days = Number(configFields.max_duration_days);
      if (configFields.requires_deposit) config.requires_deposit = true;
      if (configFields.default_deposit_percentage !== "") config.default_deposit_percentage = Number(configFields.default_deposit_percentage);
      if (configFields.duration_minutes !== "") config.duration_minutes = Number(configFields.duration_minutes);
      if (configFields.return_policy_days !== "") config.return_policy_days = Number(configFields.return_policy_days);
      if (configFields.weekend_only) config.weekend_only = true;

      const payload: ServiceTypePayload = {
        ...formData,
        config: Object.keys(config).length > 0 ? config : null,
      };

      if (editingService) {
        await ServiceTypesAPI.update(editingService.id, payload);
        notify("success", "Modifié", "Le type de service a été modifié avec succès");
      } else {
        await ServiceTypesAPI.create(payload);
        notify("success", "Créé", "Le type de service a été créé avec succès");
      }

      closeModal();
      fetchServiceTypes();
    } catch (error: any) {
      console.error("Erreur lors de la création/modification:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Une erreur est survenue";
      notify("error", "Erreur", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (service: ServiceType) => {
    setDeletingService(service);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingService) return;

    try {
      await ServiceTypesAPI.delete(deletingService.id);
      notify("success", "Supprimé", "Le type de service a été supprimé");
      setDeleteConfirmOpen(false);
      setDeletingService(null);
      fetchServiceTypes();
    } catch (error: any) {
      notify("error", "Erreur", error.message || "Impossible de supprimer le type de service");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerOne />
      </div>
    );
  }

  return (
    <div>
      <PageMeta
        title="Types de service - Velvena App"
        description="Gérez les types de services proposés"
      />
      <PageBreadcrumb pageTitle="Types de service" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Types de service
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Définissez les services que vous proposez (location, vente, essayage...)
            </p>
          </div>
          <Button variant="primary" onClick={openCreateModal}>
            <FiPlus className="w-4 h-4 mr-2" />
            Nouveau type
          </Button>
        </div>

        <div className="p-6">
          {serviceTypes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun type de service configuré
              </p>
              <Button variant="outline" onClick={openCreateModal} className="mt-4">
                Créer le premier type
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceTypes.map((service) => (
                <div
                  key={service.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {service.name}
                        </h3>
                        <span className="px-2 py-1 text-xs font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {service.code}
                        </span>
                        {service.is_active ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                            Actif
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded">
                            Inactif
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {service.description}
                        </p>
                      )}
                      {service.config && Object.keys(service.config).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {service.config.min_duration_days && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                              Min: {service.config.min_duration_days} jours
                            </span>
                          )}
                          {service.config.max_duration_days && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                              Max: {service.config.max_duration_days} jours
                            </span>
                          )}
                          {service.config.requires_deposit && (
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                              Acompte: {service.config.default_deposit_percentage}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <TooltipWrapper title="Modifier">
                        <button
                          type="button"
                          onClick={() => openEditModal(service)}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                        >
                          <PencilIcon className="size-4" />
                          <span className="sr-only">Modifier</span>
                        </button>
                      </TooltipWrapper>
                      <TooltipWrapper title="Supprimer">
                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(service)}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-error-600 transition hover:bg-gray-50 hover:text-error-600 dark:border-gray-700 dark:text-error-400 dark:hover:bg-white/10"
                        >
                          <TrashBinIcon className="size-4" />
                          <span className="sr-only">Supprimer</span>
                        </button>
                      </TooltipWrapper>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Create/Edit */}
      <Modal isOpen={modalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {editingService ? "Modifier le type de service" : "Nouveau type de service"}
          </h2>

          <div className="space-y-4">
            <div>
              <Label>Nom du service *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Location courte durée"
                required
              />
            </div>

            <div>
              <Label>Code *</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="rental_short"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Identifiant unique (lettres minuscules, chiffres et underscores uniquement)
              </p>
            </div>

            <div>
              <Label>Description</Label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Location de robes pour événements courts"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                rows={3}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Configuration
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Durée min (jours)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={configFields.min_duration_days}
                    onChange={(e) => setConfigFields({ ...configFields, min_duration_days: e.target.value })}
                    placeholder="1"
                  />
                </div>

                <div>
                  <Label>Durée max (jours)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={configFields.max_duration_days}
                    onChange={(e) => setConfigFields({ ...configFields, max_duration_days: e.target.value })}
                    placeholder="7"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configFields.requires_deposit}
                    onChange={(e) => setConfigFields({ ...configFields, requires_deposit: e.target.checked })}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Acompte requis
                  </span>
                </label>
              </div>

              {configFields.requires_deposit && (
                <div className="mt-4">
                  <Label>Pourcentage d'acompte par défaut</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={configFields.default_deposit_percentage}
                    onChange={(e) => setConfigFields({ ...configFields, default_deposit_percentage: e.target.value })}
                    placeholder="30"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Durée (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={configFields.duration_minutes}
                    onChange={(e) => setConfigFields({ ...configFields, duration_minutes: e.target.value })}
                    placeholder="60"
                  />
                </div>

                <div>
                  <Label>Politique de retour (jours)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={configFields.return_policy_days}
                    onChange={(e) => setConfigFields({ ...configFields, return_policy_days: e.target.value })}
                    placeholder="14"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configFields.weekend_only}
                    onChange={(e) => setConfigFields({ ...configFields, weekend_only: e.target.checked })}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Week-end uniquement
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Enregistrement..." : editingService ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Delete Confirm */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Confirmer la suppression
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Êtes-vous sûr de vouloir supprimer le type de service "{deletingService?.name}" ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
