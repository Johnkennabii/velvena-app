import type { Customer } from "../../api/endpoints/customers";
import type { QuickCustomerForm } from "./types";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

interface ClientSelectionSectionProps {
  selectedCustomer: Customer | null;
  customerSearchTerm: string;
  customerResults: Customer[];
  customerForm: QuickCustomerForm;
  showCustomerForm: boolean;
  customerLoading: boolean;
  creatingCustomer: boolean;
  onCustomerSelect: (customer: Customer) => void;
  onClearSelectedCustomer: () => void;
  onCustomerSearch: () => Promise<void>;
  onCustomerSearchTermChange: (value: string) => void;
  onCustomerSearchKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onCustomerFormChange: (field: keyof QuickCustomerForm) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onShowCustomerFormToggle: (show: boolean) => void;
  onCreateCustomer: () => Promise<void>;
  onCustomerFormReset: () => void;
}

export default function ClientSelectionSection({
  selectedCustomer,
  customerSearchTerm,
  customerResults,
  customerForm,
  showCustomerForm,
  customerLoading,
  creatingCustomer,
  onCustomerSelect,
  onClearSelectedCustomer,
  onCustomerSearch,
  onCustomerSearchTermChange,
  onCustomerSearchKeyDown,
  onCustomerFormChange,
  onShowCustomerFormToggle,
  onCreateCustomer,
  onCustomerFormReset,
}: ClientSelectionSectionProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Client</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Associez un client existant ou créez-en un nouveau.
          </p>
        </div>
        {selectedCustomer ? (
          <Button type="button" variant="outline" size="sm" onClick={onClearSelectedCustomer}>
            Changer
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            placeholder="Rechercher (nom, email, téléphone)"
            value={customerSearchTerm}
            onChange={(event) => onCustomerSearchTermChange(event.target.value)}
            onKeyDown={onCustomerSearchKeyDown}
          />
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => void onCustomerSearch()}
          disabled={customerLoading}
        >
          {customerLoading ? "Recherche..." : "Rechercher"}
        </Button>
      </div>

      {selectedCustomer ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-sm dark:border-brand-500/40 dark:bg-brand-500/10">
          <p className="font-semibold text-gray-900 dark:text-white">
            {selectedCustomer.firstname} {selectedCustomer.lastname}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {selectedCustomer.email}
            {selectedCustomer.phone ? ` • ${selectedCustomer.phone}` : ""}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {[selectedCustomer.address, selectedCustomer.postal_code, selectedCustomer.city, selectedCustomer.country]
              .filter(Boolean)
              .join(" • ") || "Adresse non renseignée"}
          </p>
        </div>
      ) : null}

      {customerResults.length ? (
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
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm transition hover:border-brand-400 hover:bg-brand-50/60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:border-brand-500"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-gray-800 dark:text-white">
                    {customer.firstname} {customer.lastname}
                  </span>
                  <span className="text-xs text-brand-600 dark:text-brand-400">Associer</span>
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {customer.email}
                  {customer.phone ? ` • ${customer.phone}` : ""}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Ajouter un client</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onShowCustomerFormToggle(!showCustomerForm)}
          >
            {showCustomerForm ? "Fermer" : "Nouveau client"}
          </Button>
        </div>
        {showCustomerForm ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Prénom</Label>
                <Input
                  value={customerForm.firstname}
                  onChange={onCustomerFormChange("firstname")}
                  required
                />
              </div>
              <div>
                <Label>Nom</Label>
                <Input value={customerForm.lastname} onChange={onCustomerFormChange("lastname")} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customerForm.email}
                  onChange={onCustomerFormChange("email")}
                  required
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={customerForm.phone} onChange={onCustomerFormChange("phone")} />
              </div>
              <div>
                <Label>Ville</Label>
                <Input value={customerForm.city} onChange={onCustomerFormChange("city")} />
              </div>
              <div>
                <Label>Pays</Label>
                <Input value={customerForm.country} onChange={onCustomerFormChange("country")} />
              </div>
              <div>
                <Label>Adresse</Label>
                <Input value={customerForm.address} onChange={onCustomerFormChange("address")} />
              </div>
              <div>
                <Label>Code postal</Label>
                <Input value={customerForm.postal_code} onChange={onCustomerFormChange("postal_code")} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onShowCustomerFormToggle(false);
                  onCustomerFormReset();
                }}
              >
                Annuler
              </Button>
              <Button type="button" onClick={() => void onCreateCustomer()} disabled={creatingCustomer}>
                {creatingCustomer ? "Création..." : "Créer et associer"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
