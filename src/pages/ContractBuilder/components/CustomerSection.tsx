import type { Customer } from "../../../api/endpoints/customers";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import Button from "../../../components/ui/button/Button";

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

interface CustomerSectionProps {
  selectedCustomer: Customer | null;
  customerSearchTerm: string;
  onCustomerSearchTermChange: (value: string) => void;
  onCustomerSearch: () => void;
  customerLoading: boolean;
  customerResults: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  onClearSelectedCustomer: () => void;
  showCustomerForm: boolean;
  onShowCustomerFormChange: (show: boolean) => void;
  customerForm: QuickCustomerFormState;
  onCustomerFormFieldChange: (
    field: keyof QuickCustomerFormState
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomerFormReset: () => void;
  onCreateCustomer: () => void;
  creatingCustomer: boolean;
}

export default function CustomerSection({
  selectedCustomer,
  customerSearchTerm,
  onCustomerSearchTermChange,
  onCustomerSearch,
  customerLoading,
  customerResults,
  onCustomerSelect,
  onClearSelectedCustomer,
  showCustomerForm,
  onShowCustomerFormChange,
  customerForm,
  onCustomerFormFieldChange,
  onCustomerFormReset,
  onCreateCustomer,
  creatingCustomer,
}: CustomerSectionProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-gray-900/50 dark:ring-white/10">
      <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
        Client
      </h2>

      <div className="space-y-5">
        {/* Customer search */}
        <div>
          <Label htmlFor="customer-search">Rechercher un client</Label>
          <div className="mt-1.5 flex gap-2">
            <div className="flex-1">
              <Input
                id="customer-search"
                value={customerSearchTerm}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => onCustomerSearchTermChange(event.target.value)}
                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
                  if (event.key === "Enter") {
                    onCustomerSearch();
                  }
                }}
                placeholder="Nom, prénom, email..."
                disabled={!!selectedCustomer}
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={onCustomerSearch}
              disabled={customerLoading || !!selectedCustomer}
            >
              {customerLoading ? "Recherche..." : "Rechercher"}
            </Button>
          </div>
        </div>

        {/* Selected customer */}
        {selectedCustomer && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm dark:border-blue-500/40 dark:bg-blue-500/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedCustomer.firstname} {selectedCustomer.lastname}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  {selectedCustomer.email}
                  {selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {[
                    selectedCustomer.address,
                    selectedCustomer.postal_code,
                    selectedCustomer.city,
                    selectedCustomer.country,
                  ]
                    .filter(Boolean)
                    .join(" • ") || "Adresse non renseignée"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClearSelectedCustomer}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/50 hover:text-red-600 dark:hover:bg-gray-800"
                aria-label="Supprimer le client sélectionné"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Customer results */}
        {!selectedCustomer && customerResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Résultats ({customerResults.length})
            </p>
            <div className="space-y-2">
              {customerResults.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => onCustomerSelect(customer)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm transition hover:border-blue-400 hover:bg-blue-50/60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:border-blue-500"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-800 dark:text-white">
                      {customer.firstname} {customer.lastname}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Sélectionner</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                    {customer.email}
                    {customer.phone ? ` • ${customer.phone}` : ""}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create customer toggle */}
        {!selectedCustomer && (
          <div>
            <button
              type="button"
              onClick={() => {
                onShowCustomerFormChange(!showCustomerForm);
                if (showCustomerForm) {
                  onCustomerFormReset();
                }
              }}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <svg
                className={`h-4 w-4 transition-transform ${showCustomerForm ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {showCustomerForm ? "Masquer" : "Créer un nouveau client"}
            </button>
          </div>
        )}

        {/* Create customer form */}
        {!selectedCustomer && showCustomerForm && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/50">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Nouveau client
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="customer-firstname">Prénom *</Label>
                <Input
                  id="customer-firstname"
                  value={customerForm.firstname}
                  onChange={onCustomerFormFieldChange("firstname")}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customer-lastname">Nom *</Label>
                <Input
                  id="customer-lastname"
                  value={customerForm.lastname}
                  onChange={onCustomerFormFieldChange("lastname")}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer-email">Email *</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerForm.email}
                onChange={onCustomerFormFieldChange("email")}
                required
              />
            </div>

            <div>
              <Label htmlFor="customer-phone">Téléphone</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={customerForm.phone}
                onChange={onCustomerFormFieldChange("phone")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="customer-city">Ville</Label>
                <Input
                  id="customer-city"
                  value={customerForm.city}
                  onChange={onCustomerFormFieldChange("city")}
                />
              </div>
              <div>
                <Label htmlFor="customer-postal-code">Code postal</Label>
                <Input
                  id="customer-postal-code"
                  value={customerForm.postal_code}
                  onChange={onCustomerFormFieldChange("postal_code")}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer-address">Adresse</Label>
              <Input
                id="customer-address"
                value={customerForm.address}
                onChange={onCustomerFormFieldChange("address")}
              />
            </div>

            <div>
              <Label htmlFor="customer-country">Pays</Label>
              <Input
                id="customer-country"
                value={customerForm.country}
                onChange={onCustomerFormFieldChange("country")}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={onCreateCustomer}
                disabled={creatingCustomer}
                className="flex-1"
              >
                {creatingCustomer ? "Création..." : "Créer le client"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onShowCustomerFormChange(false);
                  onCustomerFormReset();
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
