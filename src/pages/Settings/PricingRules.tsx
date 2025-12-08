import { useState, useEffect } from "react";
import { FiPlus, FiDollarSign } from "react-icons/fi";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Modal } from "../../components/ui/modal";
import { PricingRulesAPI, type PricingRule, type PricingRulePayload } from "../../api/endpoints/pricingRules";
import { ServiceTypesAPI, type ServiceType } from "../../api/endpoints/serviceTypes";
import { useNotification } from "../../context/NotificationContext";
import SpinnerOne from "../../components/ui/spinner/SpinnerOne";
import { PencilIcon, TrashBinIcon } from "../../icons";

type Strategy = "per_day" | "tiered" | "flat_rate" | "fixed_price";

interface TierConfig {
  min_days: number;
  max_days: number | null;
  discount_percentage: number;
}

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

export default function PricingRules() {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [formData, setFormData] = useState<PricingRulePayload>({
    name: "",
    service_type_id: null,
    strategy: "per_day",
    priority: 0,
    is_active: true,
    calculation_config: {},
    applies_to: {},
  });
  const [tiers, setTiers] = useState<TierConfig[]>([
    { min_days: 1, max_days: 3, discount_percentage: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingRule, setDeletingRule] = useState<PricingRule | null>(null);

  const { notify } = useNotification();

  useEffect(() => {
    Promise.all([fetchPricingRules(), fetchServiceTypes()]);
  }, []);

  const fetchPricingRules = async () => {
    try {
      setLoading(true);
      const response = await PricingRulesAPI.list();
      setPricingRules(response.data);
    } catch (error: any) {
      console.error("Erreur lors du chargement des règles:", error);
      // Si l'endpoint n'existe pas encore, afficher un message approprié
      if (error?.response?.status === 404 || error?.message?.includes("404")) {
        notify("warning", "Endpoint non disponible", "L'endpoint /pricing-rules n'est pas encore implémenté côté backend. Les données de démonstration seront affichées.");
      } else {
        notify("error", "Erreur", error.message || "Impossible de charger les règles de tarification");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceTypes = async () => {
    try {
      const response = await ServiceTypesAPI.list();
      setServiceTypes(response.data.filter(st => st.is_active));
    } catch (error: any) {
      console.error("Erreur lors du chargement des types de service:", error);
    }
  };

  const openCreateModal = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      service_type_id: null,
      strategy: "per_day",
      priority: 0,
      is_active: true,
      calculation_config: {},
      applies_to: {},
    });
    setTiers([{ min_days: 1, max_days: 3, discount_percentage: 0 }]);
    setModalOpen(true);
  };

  const openEditModal = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      service_type_id: rule.service_type_id,
      strategy: rule.strategy,
      priority: rule.priority,
      is_active: rule.is_active,
      calculation_config: rule.calculation_config || {},
      applies_to: rule.applies_to || {},
    });

    // Si stratégie tiered, charger les paliers
    if (rule.strategy === "tiered" && rule.calculation_config?.tiers) {
      setTiers(rule.calculation_config.tiers);
    } else {
      setTiers([{ min_days: 1, max_days: 3, discount_percentage: 0 }]);
    }

    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingRule(null);
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinDays = lastTier.max_days ? lastTier.max_days + 1 : lastTier.min_days + 3;
    setTiers([
      ...tiers,
      { min_days: newMinDays, max_days: newMinDays + 3, discount_percentage: 0 },
    ]);
  };

  const updateTier = (index: number, field: keyof TierConfig, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      notify("warning", "Champ requis", "Le nom est obligatoire");
      return;
    }

    try {
      setSubmitting(true);

      // Construire calculation_config selon la stratégie
      let calculationConfig: any = {};

      if (formData.strategy === "per_day") {
        calculationConfig = {
          base_price_source: "dress",
          apply_tax: true,
          tax_rate: 20,
          rounding: "up",
        };
      } else if (formData.strategy === "tiered") {
        calculationConfig = {
          tiers: tiers.map(tier => ({
            ...tier,
            max_days: tier.max_days === "" || tier.max_days === null ? null : Number(tier.max_days),
          })),
          apply_tax: true,
          tax_rate: 20,
        };
      } else if (formData.strategy === "flat_rate") {
        calculationConfig = {
          applies_to_period: "weekend",
          fixed_multiplier: 2.5,
        };
      } else if (formData.strategy === "fixed_price") {
        calculationConfig = {
          fixed_amount_ht: 25.0,
          fixed_amount_ttc: 30.0,
        };
      }

      const payload: PricingRulePayload = {
        ...formData,
        calculation_config: calculationConfig,
        service_type_id: formData.service_type_id || null,
      };

      if (editingRule) {
        await PricingRulesAPI.update(editingRule.id, payload);
        notify("success", "Modifié", "La règle de tarification a été modifiée avec succès");
      } else {
        await PricingRulesAPI.create(payload);
        notify("success", "Créé", "La règle de tarification a été créée avec succès");
      }

      closeModal();
      fetchPricingRules();
    } catch (error: any) {
      console.error("Erreur lors de la création/modification:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Une erreur est survenue";
      notify("error", "Erreur", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteConfirm = (rule: PricingRule) => {
    setDeletingRule(rule);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingRule) return;

    try {
      await PricingRulesAPI.delete(deletingRule.id);
      notify("success", "Supprimé", "La règle de tarification a été supprimée");
      setDeleteConfirmOpen(false);
      setDeletingRule(null);
      fetchPricingRules();
    } catch (error: any) {
      notify("error", "Erreur", error.message || "Impossible de supprimer la règle");
    }
  };

  const getStrategyLabel = (strategy: Strategy) => {
    const labels = {
      per_day: "Prix par jour",
      tiered: "Prix dégressif",
      flat_rate: "Forfait",
      fixed_price: "Prix fixe",
    };
    return labels[strategy];
  };

  const getStrategyBadgeColor = (strategy: Strategy) => {
    const colors = {
      per_day: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      tiered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      flat_rate: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      fixed_price: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return colors[strategy];
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
        title="Règles de tarification - Velvena App"
        description="Gérez les règles de calcul des prix"
      />
      <PageBreadcrumb pageTitle="Règles de tarification" />

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Règles de tarification
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configurez les stratégies de calcul automatique des prix
            </p>
          </div>
          <Button variant="primary" onClick={openCreateModal}>
            <FiPlus className="w-4 h-4 mr-2" />
            Nouvelle règle
          </Button>
        </div>

        <div className="p-6">
          {pricingRules.length === 0 ? (
            <div className="text-center py-12">
              <FiDollarSign className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune règle de tarification configurée
              </p>
              <Button variant="outline" onClick={openCreateModal} className="mt-4">
                Créer la première règle
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pricingRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {rule.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStrategyBadgeColor(rule.strategy)}`}>
                          {getStrategyLabel(rule.strategy)}
                        </span>
                        {rule.service_type && (
                          <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {rule.service_type.name}
                          </span>
                        )}
                        <span className="px-2 py-1 text-xs font-mono bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                          Priorité: {rule.priority}
                        </span>
                        {rule.is_active ? (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded">
                            Inactive
                          </span>
                        )}
                      </div>

                      {/* Afficher le détail selon la stratégie */}
                      {rule.strategy === "tiered" && rule.calculation_config?.tiers && (
                        <div className="mt-3 space-y-1">
                          {rule.calculation_config.tiers.map((tier: TierConfig, idx: number) => (
                            <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                              • {tier.min_days} à {tier.max_days ?? "∞"} jours : -{tier.discount_percentage}%
                            </div>
                          ))}
                        </div>
                      )}

                      {rule.strategy === "fixed_price" && rule.calculation_config && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Prix fixe : {rule.calculation_config.fixed_amount_ttc}€ TTC
                        </div>
                      )}

                      {rule.strategy === "flat_rate" && rule.calculation_config && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          Forfait {rule.calculation_config.applies_to_period} : multiplicateur {rule.calculation_config.fixed_multiplier}x
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <TooltipWrapper title="Modifier">
                        <button
                          type="button"
                          onClick={() => openEditModal(rule)}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/10"
                        >
                          <PencilIcon className="size-4" />
                          <span className="sr-only">Modifier</span>
                        </button>
                      </TooltipWrapper>
                      <TooltipWrapper title="Supprimer">
                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(rule)}
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
      <Modal isOpen={modalOpen} onClose={closeModal} className="max-w-3xl">
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {editingRule ? "Modifier la règle" : "Nouvelle règle de tarification"}
          </h2>

          <div className="space-y-4">
            <div>
              <Label>Nom de la règle *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tarif standard location courte durée"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stratégie de tarification *</Label>
                <select
                  value={formData.strategy}
                  onChange={(e) => setFormData({ ...formData, strategy: e.target.value as Strategy })}
                  required
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                >
                  <option value="per_day">Prix par jour</option>
                  <option value="tiered">Prix dégressif (paliers)</option>
                  <option value="flat_rate">Forfait période</option>
                  <option value="fixed_price">Prix fixe</option>
                </select>
              </div>

              <div>
                <Label>Type de service</Label>
                <select
                  value={formData.service_type_id || ""}
                  onChange={(e) => setFormData({ ...formData, service_type_id: e.target.value || null })}
                  className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
                >
                  <option value="">Tous les services</option>
                  {serviceTypes.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Priorité (plus élevé = prioritaire)</Label>
              <Input
                type="number"
                min="0"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Si plusieurs règles s'appliquent, celle avec la priorité la plus élevée sera utilisée
              </p>
            </div>

            {/* Configuration spécifique selon la stratégie */}
            {formData.strategy === "tiered" && (
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between mb-3">
                  <Label>Paliers de tarification dégressifs</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addTier}>
                    <FiPlus className="w-4 h-4 mr-1" />
                    Ajouter un palier
                  </Button>
                </div>
                <div className="space-y-2">
                  {tiers.map((tier, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        value={tier.min_days}
                        onChange={(e) => updateTier(index, "min_days", Number(e.target.value))}
                        placeholder="Min jours"
                        className="w-24"
                      />
                      <span className="text-gray-500">à</span>
                      <Input
                        type="number"
                        min="0"
                        value={tier.max_days ?? ""}
                        onChange={(e) => updateTier(index, "max_days", e.target.value ? Number(e.target.value) : null)}
                        placeholder="Max (vide = ∞)"
                        className="w-32"
                      />
                      <span className="text-gray-500">jours</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={tier.discount_percentage}
                        onChange={(e) => updateTier(index, "discount_percentage", Number(e.target.value))}
                        placeholder="Réduction %"
                        className="w-32"
                      />
                      <span className="text-gray-500">%</span>
                      {tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTier(index)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.strategy === "per_day" && (
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Prix par jour :</strong> Le prix sera calculé en multipliant le prix journalier de la robe par le nombre de jours de location.
                </p>
              </div>
            )}

            {formData.strategy === "flat_rate" && (
              <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/10">
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  <strong>Forfait période :</strong> Un prix forfaitaire pour une période spécifique (week-end, semaine...).
                  Le multiplicateur de 2.5x signifie que le prix sera équivalent à 2.5 jours.
                </p>
              </div>
            )}

            {formData.strategy === "fixed_price" && (
              <div className="border rounded-lg p-4 bg-orange-50 dark:bg-orange-900/10">
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  <strong>Prix fixe :</strong> Un montant fixe indépendant de la durée ou du prix de la robe.
                  Idéal pour les essayages ou services à prix unique.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Enregistrement..." : editingRule ? "Modifier" : "Créer"}
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
            Êtes-vous sûr de vouloir supprimer la règle "{deletingRule?.name}" ? Cette action est irréversible.
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
