import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useCart } from "../../context/CartContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import DraggableDressList from "./components/DraggableDressList";
import ContractConfiguration from "./components/ContractConfiguration";
import ContractPreview from "./components/ContractPreview";
import CustomerSection from "./components/CustomerSection";
import { ContractTypesAPI, type ContractType } from "../../api/endpoints/contractTypes";
import { ContractPackagesAPI, type ContractPackage } from "../../api/endpoints/contractPackages";
import { ContractAddonsAPI } from "../../api/endpoints/contractAddons";
import { CustomersAPI, type Customer, type CustomerPayload } from "../../api/endpoints/customers";
import { ContractsAPI, type ContractCreatePayload, type ContractAddon } from "../../api/endpoints/contracts";
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
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `CONT-${year}${month}${day}-${random}`;
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

  // Pricing state (paid amounts - defaulting to 0 for now)
  const depositPaidTTC = "0.00";
  const depositPaidHT = "0.00";
  const cautionPaidTTC = "0.00";
  const cautionPaidHT = "0.00";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  // Deposit (30% of total by default)
  const depositTTC = totalTTC * 0.3;
  const depositHT = totalHT * 0.3;

  // Caution (example: 500€ default)
  const cautionTTC = 500;
  const cautionHT = cautionTTC / 1.2;

  const isComplete = !!(
    selectedTypeId &&
    items.length > 0 &&
    startDate &&
    endDate &&
    days > 0 &&
    selectedCustomer
  );

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
        account_paid_ht: toNumber(depositPaidHT),
        account_paid_ttc: toNumber(depositPaidTTC),
        caution_ht: toNumber(cautionHT),
        caution_ttc: toNumber(cautionTTC),
        caution_paid_ht: toNumber(cautionPaidHT),
        caution_paid_ttc: toNumber(cautionPaidTTC),
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

      // Clear cart and redirect
      clearCart();
      navigate(`/contrats`);
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

        {/* Contenu principal */}
        {itemCount === 0 ? (
          // État vide
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-900/50">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
              <svg className="h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Votre panier est vide
            </h3>
            <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Ajoutez des robes depuis le catalogue pour créer un contrat
            </p>
            <button
              type="button"
              onClick={handleBackToCatalogue}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 active:scale-95"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Parcourir le catalogue
            </button>
          </div>
        ) : (
          // Contenu avec robes
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Colonne gauche: Liste des robes (2/3) */}
            <div className="space-y-6 lg:col-span-2">
              <DraggableDressList />

              {/* Section Client */}
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

            {/* Colonne droite: Configuration et prévisualisation (1/3) */}
            <div className="space-y-6">
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
                onTypeChange={setSelectedTypeId}
                onPackageChange={setSelectedPackageId}
                onAddonsChange={handleAddonToggle}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onPaymentMethodChange={setPaymentMethod}
              />

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
        )}
      </div>
    </>
  );
}
