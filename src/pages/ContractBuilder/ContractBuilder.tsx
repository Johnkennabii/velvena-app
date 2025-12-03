import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useCart } from "../../context/CartContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DraggableDressList from "./components/DraggableDressList";
import ContractConfiguration from "./components/ContractConfiguration";
import ContractPreview from "./components/ContractPreview";
import CustomerSection from "./components/CustomerSection";
import CustomerDetailsDrawer from "../Catalogue/components/CustomerDetailsDrawer";
import ContractStepper from "./components/ContractStepper";
import { ContractTypesAPI, type ContractType } from "../../api/endpoints/contractTypes";
import { ContractPackagesAPI, type ContractPackage } from "../../api/endpoints/contractPackages";
import { ContractAddonsAPI } from "../../api/endpoints/contractAddons";
import { CustomersAPI, type Customer, type CustomerPayload } from "../../api/endpoints/customers";
import { ContractsAPI, type ContractCreatePayload, type ContractAddon, type ContractFullView } from "../../api/endpoints/contracts";
import { DressesAPI } from "../../api/endpoints/dresses";
import { useNotification } from "../../context/NotificationContext";

const toNumber = (value: number | string): number => {
  return typeof value === "number" ? value : Number.parseFloat(String(value || 0));
};

const formatCurrency = (value: number | string) => {
  const num = toNumber(value);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(num);
};

const calculateDays = (start: Date | null, end: Date | null): number => {
  if (!start || !end) return 0;
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const generateContractNumber = (): string => {
  // Format: CT-AC-XXXXXXX (7 chiffres aléatoires)
  const random = Math.floor(Math.random() * 10000000)
    .toString()
    .padStart(7, "0");
  return `CT-AC-${random}`;
};

type QuickCustomerFormState = {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  postal_code: string;
};

export default function ContractBuilder() {
  const navigate = useNavigate();
  const { items, itemCount, clearCart, mainDressId } = useCart();
  const { notify } = useNotification();

  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [packages, setPackages] = useState<ContractPackage[]>([]);
  const [addons, setAddons] = useState<ContractAddon[]>([]);

  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");

  // Customer state
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState<QuickCustomerFormState>({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    address: "",
    postal_code: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityInfo, setAvailabilityInfo] = useState<Map<string, boolean>>(new Map());

  // Custom paid amounts state
  const [depositPaidTTC, setDepositPaidTTC] = useState<string>("0");
  const [cautionPaidTTC, setCautionPaidTTC] = useState<string>("0");

  // Drawer state
  const [customerDrawer, setCustomerDrawer] = useState<{
    open: boolean;
    customer: Customer | null;
    contract: ContractFullView | null;
  }>({
    open: false,
    customer: null,
    contract: null,
  });

  // Charger les données de référence
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [typesData, packagesData, addonsData] = await Promise.all([
          ContractTypesAPI.list(),
          ContractPackagesAPI.list(),
          ContractAddonsAPI.list(),
        ]);

        setContractTypes(typesData);
        setPackages(packagesData);
        setAddons(addonsData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        notify("error", "Erreur", "Impossible de charger les données nécessaires");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Check availability when dates change
  useEffect(() => {
    if (!startDate || !endDate || items.length === 0) {
      setAvailabilityInfo(new Map());
      return;
    }

    const checkAvailability = async () => {
      try {
        const response = await DressesAPI.listAvailability(
          startDate.toISOString(),
          endDate.toISOString()
        );

        const availabilityMap = new Map<string, boolean>();
        response.data.forEach((entry: { id: string; isAvailable: boolean }) => {
          availabilityMap.set(entry.id, entry.isAvailable !== false);
        });

        setAvailabilityInfo(availabilityMap);
      } catch (error) {
        console.error("Erreur lors de la vérification de disponibilité:", error);
      }
    };

    checkAvailability();
  }, [startDate, endDate, items]);

  // Customer search
  const handleCustomerSearch = useCallback(async () => {
    const trimmed = customerSearchTerm.trim();
    if (!trimmed) {
      notify("warning", "Recherche", "Veuillez entrer un terme de recherche");
      return;
    }

    setCustomerLoading(true);
    try {
      const response = await CustomersAPI.list({ search: trimmed, limit: 10 });
      setCustomerResults(response.data);
      if (response.data.length === 0) {
        notify("info", "Recherche", "Aucun client trouvé");
      }
    } catch (error) {
      console.error("Erreur lors de la recherche de client:", error);
      notify("error", "Erreur", "Erreur lors de la recherche");
    } finally {
      setCustomerLoading(false);
    }
  }, [customerSearchTerm, notify]);

  const handleCustomerSelect = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerResults([]);
    setShowCustomerForm(false);
  }, []);

  const handleClearSelectedCustomer = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  const handleCustomerFormFieldChange = (field: keyof QuickCustomerFormState) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCustomerForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleCustomerFormReset = useCallback(() => {
    setCustomerForm({
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      address: "",
      postal_code: "",
    });
  }, []);

  const handleCreateCustomer = useCallback(async () => {
    if (!customerForm.firstname || !customerForm.lastname || !customerForm.email) {
      notify("warning", "Client", "Veuillez renseigner au minimum le prénom, nom et email");
      return;
    }

    setCreatingCustomer(true);
    try {
      const payload: CustomerPayload = {
        firstname: customerForm.firstname,
        lastname: customerForm.lastname,
        email: customerForm.email,
        phone: customerForm.phone || null,
        city: customerForm.city || null,
        country: customerForm.country || null,
        address: customerForm.address || null,
        postal_code: customerForm.postal_code || null,
      };

      const created = await CustomersAPI.create(payload);
      setSelectedCustomer(created);
      setShowCustomerForm(false);
      handleCustomerFormReset();
      notify("success", "Client", `Client ${created.firstname} ${created.lastname} créé avec succès`);
    } catch (error) {
      console.error("Erreur lors de la création du client:", error);
      notify("error", "Erreur", "Impossible de créer le client");
    } finally {
      setCreatingCustomer(false);
    }
  }, [customerForm, handleCustomerFormReset, notify]);

  const handleClearCart = () => {
    if (confirm("Êtes-vous sûr de vouloir vider le panier ?")) {
      clearCart();
    }
  };

  const handleBackToCatalogue = () => {
    navigate("/catalogue");
  };

  const handleCloseDrawer = () => {
    setCustomerDrawer({
      open: false,
      customer: null,
      contract: null,
    });
  };

  const handleNavigateToCustomer = () => {
    if (customerDrawer.customer) {
      // Fermer le drawer et naviguer vers la page clients avec l'état pour ouvrir le drawer
      handleCloseDrawer();
      navigate("/customers", {
        state: {
          openCustomerDrawer: true,
          customerId: customerDrawer.customer.id,
        },
      });
    }
  };

  const handleAddonToggle = (addonId: string, checked: boolean) => {
    if (checked) {
      setSelectedAddonIds((prev) => [...prev, addonId]);
    } else {
      setSelectedAddonIds((prev) => prev.filter((id) => id !== addonId));
    }
  };

  // Calculate pricing
  const days = calculateDays(startDate, endDate);
  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const selectedContractType = contractTypes.find((t) => t.id === selectedTypeId);

  // Déterminer si c'est un contrat "Location par jour"
  const isDailyContract = selectedContractType?.name?.toLowerCase().includes("jour") || false;

  // Addons inclus dans le forfait (si forfait sélectionné)
  const packageAddonIds = selectedPackage?.addons?.map((link) => link.addon_id).filter(Boolean) || [];
  const packageIncludedAddons = addons.filter((a) => packageAddonIds.includes(a.id));
  const optionalAddons = selectedPackage
    ? addons.filter((a) => !packageAddonIds.includes(a.id))
    : addons;
  const selectedAddons = addons.filter((a) => selectedAddonIds.includes(a.id));

  // Calcul des prix de base
  let baseHT = 0;
  let baseTTC = 0;

  if (selectedPackage) {
    // Mode forfait: prix fixe du package
    baseTTC = toNumber(selectedPackage.price_ttc);
    baseHT = toNumber(selectedPackage.price_ht);
  } else if (days > 0) {
    // Mode à la journée: somme des prix/jour * nombre de jours
    items.forEach((item) => {
      const priceTTC = toNumber(item.dress.price_per_day_ttc || 0);
      const priceHT = toNumber(item.dress.price_per_day_ht || 0);
      baseTTC += priceTTC * days;
      baseHT += priceHT * days;
    });
  }

  // Addons
  let addonsTotalTTC = 0;
  let addonsTotalHT = 0;
  selectedAddons.forEach((addon) => {
    addonsTotalTTC += toNumber(addon.price_ttc);
    addonsTotalHT += toNumber(addon.price_ht);
  });

  const totalTTC = baseTTC + addonsTotalTTC;
  const totalHT = baseHT + addonsTotalHT;

  // Deposit (50% of total) - montants DUS
  const depositTTC = totalTTC * 0.5;
  const depositHT = depositTTC / 1.2;

  // Caution (500€ default) - montants DUS
  const cautionTTC = 500;
  const cautionHT = cautionTTC / 1.2;

  // Montants PAYÉS (saisis par l'utilisateur)
  const depositPaidTTCValue = toNumber(depositPaidTTC);
  const depositPaidHTValue = depositPaidTTCValue / 1.2;
  const cautionPaidTTCValue = toNumber(cautionPaidTTC);
  const cautionPaidHTValue = cautionPaidTTCValue / 1.2;

  const isComplete = !!(
    selectedTypeId &&
    items.length > 0 &&
    startDate &&
    endDate &&
    days > 0 &&
    selectedCustomer
  );

  // Calculate current step for stepper
  const getCurrentStep = () => {
    if (items.length === 0) return 1; // Step 1: Select dresses
    if (!selectedTypeId || !startDate || !endDate) return 2; // Step 2: Configure contract
    if (!selectedCustomer) return 3; // Step 3: Customer info
    return 4; // Step 4: Ready to create
  };

  const currentStep = getCurrentStep();

  const steps = [
    { id: 1, label: "Robes", icon: "dress", description: `${items.length} sélectionnée${items.length > 1 ? "s" : ""}` },
    { id: 2, label: "Configuration", icon: "settings", description: selectedTypeId ? "Complété" : "À configurer" },
    { id: 3, label: "Client", icon: "user", description: selectedCustomer ? "Sélectionné" : "À choisir" },
    { id: 4, label: "Validation", icon: "check", description: isComplete ? "Prêt" : "En attente" },
  ];

  const handleCreateContract = async () => {
    if (!isComplete) {
      notify("warning", "Contrat", "Veuillez compléter tous les champs obligatoires");
      return;
    }

    if (selectedPackage && items.length > (selectedPackage.num_dresses || 1)) {
      notify(
        "error",
        "Contrat",
        `Le forfait "${selectedPackage.name}" permet maximum ${selectedPackage.num_dresses} robe(s), mais ${items.length} sont sélectionnées.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const contractNumber = generateContractNumber();

      // Log des valeurs pour débug
      console.log("Création du contrat avec:", {
        depositTTC,
        depositHT,
        depositPaidTTC,
        depositPaidHTValue,
        cautionTTC,
        cautionHT,
        cautionPaidTTC,
        cautionPaidHTValue,
      });

      const payload: ContractCreatePayload = {
        contract_number: contractNumber,
        customer_id: selectedCustomer!.id,
        contract_type_id: selectedTypeId,
        start_datetime: startDate!.toISOString(),
        end_datetime: endDate!.toISOString(),
        deposit_payment_method: paymentMethod,
        status: "DRAFT",
        account_ht: toNumber(depositHT),
        account_ttc: toNumber(depositTTC),
        account_paid_ht: toNumber(depositPaidHTValue),
        account_paid_ttc: toNumber(depositPaidTTCValue),
        caution_ht: toNumber(cautionHT),
        caution_ttc: toNumber(cautionTTC),
        caution_paid_ht: toNumber(cautionPaidHTValue),
        caution_paid_ttc: toNumber(cautionPaidTTCValue),
        total_price_ht: toNumber(totalHT),
        total_price_ttc: toNumber(totalTTC),
        package_id: selectedPackage ? selectedPackage.id : null,
        addons: selectedAddonIds.map((id) => ({ addon_id: id })),
        dresses: items.map((item) => ({ dress_id: item.dress.id })),
      };

      const created = await ContractsAPI.create(payload);

      notify(
        "success",
        "Contrat créé",
        `Le contrat ${created.contract_number ?? contractNumber} a été créé avec succès !`
      );

      // Fetch the full contract details
      const fullContract = await ContractsAPI.getById(created.id);

      // Clear cart and open drawer
      clearCart();
      setCustomerDrawer({
        open: true,
        customer: selectedCustomer,
        contract: fullContract,
      });
    } catch (error) {
      console.error("Erreur lors de la création du contrat:", error);
      notify("error", "Erreur", "Impossible de créer le contrat");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Créateur de Contrat" description="Créez votre contrat de location" />

      <div className="mx-auto max-w-7xl">
        <PageBreadcrumb pageTitle="Créateur de Contrat" />

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Créateur de Contrat
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {itemCount === 0
                ? "Votre panier est vide"
                : `${itemCount} robe${itemCount > 1 ? "s" : ""} sélectionnée${itemCount > 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBackToCatalogue}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour au catalogue
            </button>

            {itemCount > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Vider le panier
              </button>
            )}
          </div>
        </div>

        {/* Stepper */}
        {itemCount > 0 && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-gray-900/50 dark:ring-white/10">
            <ContractStepper currentStep={currentStep} steps={steps} />
          </div>
        )}

        {/* Contenu principal */}
        {itemCount === 0 ? (
          // État vide
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-20 dark:border-gray-700 dark:bg-gray-900/50">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <svg className="h-12 w-12 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Votre panier est vide
            </h3>
            <p className="mb-8 max-w-md text-center text-sm text-gray-600 dark:text-gray-400">
              Commencez par ajouter des robes depuis le catalogue pour créer un nouveau contrat de location
            </p>
            <button
              type="button"
              onClick={handleBackToCatalogue}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-blue-600 hover:to-indigo-700"
            >
              <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Parcourir le catalogue
            </button>
          </div>
        ) : (
          // Contenu avec robes - Layout 2 colonnes
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Colonne principale: Contenu (3/5) */}
            <div className="space-y-6 lg:col-span-3">
              {/* Step 1: Liste des robes */}
              <div className="scroll-mt-6" id="dresses-section">
                <DraggableDressList
                  isDailyContract={isDailyContract}
                  availabilityInfo={availabilityInfo}
                  isPackageMode={!!selectedPackageId}
                />
              </div>

              {/* Step 2: Configuration du contrat */}
              <div className="scroll-mt-6" id="configuration-section">
                <ContractConfiguration
                  contractTypes={contractTypes}
                  packages={packages}
                  addons={addons}
                  selectedTypeId={selectedTypeId}
                  selectedPackageId={selectedPackageId}
                  selectedAddonIds={selectedAddonIds}
                  startDate={startDate}
                  endDate={endDate}
                  paymentMethod={paymentMethod}
                  isDailyContract={isDailyContract}
                  packageIncludedAddons={packageIncludedAddons}
                  optionalAddons={optionalAddons}
                  onTypeChange={setSelectedTypeId}
                  onPackageChange={setSelectedPackageId}
                  onAddonsChange={handleAddonToggle}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onPaymentMethodChange={setPaymentMethod}
                  days={days}
                  baseHT={baseHT}
                  baseTTC={baseTTC}
                  addonsTotalHT={addonsTotalHT}
                  addonsTotalTTC={addonsTotalTTC}
                  totalHT={totalHT}
                  totalTTC={totalTTC}
                  depositHT={depositHT}
                  depositTTC={depositTTC}
                  cautionHT={cautionHT}
                  cautionTTC={cautionTTC}
                  depositPaidTTC={depositPaidTTC}
                  cautionPaidTTC={cautionPaidTTC}
                  onDepositPaidChange={setDepositPaidTTC}
                  onCautionPaidChange={setCautionPaidTTC}
                />
              </div>

              {/* Step 3: Section Client */}
              <div className="scroll-mt-6" id="customer-section">
                <CustomerSection
                  selectedCustomer={selectedCustomer}
                  customerSearchTerm={customerSearchTerm}
                  onCustomerSearchTermChange={setCustomerSearchTerm}
                  onCustomerSearch={handleCustomerSearch}
                  customerLoading={customerLoading}
                  customerResults={customerResults}
                  onCustomerSelect={handleCustomerSelect}
                  onClearSelectedCustomer={handleClearSelectedCustomer}
                  showCustomerForm={showCustomerForm}
                  onShowCustomerFormChange={setShowCustomerForm}
                  customerForm={customerForm}
                  onCustomerFormFieldChange={handleCustomerFormFieldChange}
                  onCustomerFormReset={handleCustomerFormReset}
                  onCreateCustomer={handleCreateCustomer}
                  creatingCustomer={creatingCustomer}
                />
              </div>
            </div>

            {/* Sidebar droite: Récapitulatif sticky (2/5) */}
            <div className="space-y-6 lg:col-span-2">
              <div className="sticky top-6 space-y-6">
                {/* Indicateur de progression */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm ring-1 ring-blue-100 dark:from-blue-950/20 dark:to-indigo-950/20 dark:ring-blue-900/50">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Progression
                    </h3>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {Math.round((currentStep / steps.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/50 dark:bg-gray-800/50">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                      style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                    {currentStep === 4
                      ? "Tout est prêt ! Vous pouvez créer le contrat."
                      : `Étape ${currentStep}/4 : ${steps[currentStep - 1]?.label}`}
                  </p>
                </div>

                {/* Prévisualisation du contrat */}
                <ContractPreview
                dresses={items.map((item) => item.dress)}
                mainDressId={mainDressId}
                selectedTypeId={selectedTypeId}
                selectedPackageId={selectedPackageId}
                selectedAddonIds={selectedAddonIds}
                startDate={startDate}
                endDate={endDate}
                packages={packages}
                addons={addons}
                days={days}
                baseHT={baseHT}
                baseTTC={baseTTC}
                depositHT={depositHT}
                depositTTC={depositTTC}
                cautionHT={cautionHT}
                cautionTTC={cautionTTC}
                totalHT={totalHT}
                totalTTC={totalTTC}
                isComplete={isComplete}
                submitting={submitting}
                onCreateContract={handleCreateContract}
                formatCurrency={formatCurrency}
              />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Drawer */}
      <CustomerDetailsDrawer
        customerDrawer={customerDrawer}
        onClose={handleCloseDrawer}
        onNavigateToCustomer={handleNavigateToCustomer}
        customerContractTypeLabel={selectedContractType?.name ?? ""}
        customerContractPackageLabel={selectedPackage?.name ?? null}
        pricePerDayTTC={items[0]?.dress.price_per_day_ttc ? toNumber(items[0].dress.price_per_day_ttc) : 0}
        fallbackDress={items[0]?.dress ?? null}
      />
    </>
  );
}
