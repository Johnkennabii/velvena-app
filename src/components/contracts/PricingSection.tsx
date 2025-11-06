import type { ContractForm } from "./types";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from "../form/Select";

interface PricingSectionProps {
  contractForm: ContractForm;
  onDepositPaidTTCChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCautionPaidChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPaymentMethodChange: (value: string) => void;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: "card", label: "Carte bancaire" },
  { value: "cash", label: "Espèces" },
];

export default function PricingSection({
  contractForm,
  onDepositPaidTTCChange,
  onCautionPaidChange,
  onPaymentMethodChange,
}: PricingSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tarification</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Prix total TTC</Label>
          <Input value={contractForm.totalPriceTTC} disabled />
        </div>
        <div>
          <Label>Prix total HT</Label>
          <Input value={contractForm.totalPriceHT} disabled />
        </div>
        <div>
          <Label>Acompte TTC</Label>
          <Input value={contractForm.depositTTC} disabled />
        </div>
        <div>
          <Label>Acompte HT</Label>
          <Input value={contractForm.depositHT} disabled />
        </div>
        <div>
          <Label>Acompte payé TTC</Label>
          <Input
            type="number"
            step={0.01}
            min="0"
            value={contractForm.depositPaidTTC}
            onChange={onDepositPaidTTCChange}
          />
        </div>
        <div>
          <Label>Acompte payé HT</Label>
          <Input value={contractForm.depositPaidHT} disabled />
        </div>
        <div>
          <Label>Caution TTC</Label>
          <Input value={contractForm.cautionTTC} disabled />
        </div>
        <div>
          <Label>Caution HT</Label>
          <Input value={contractForm.cautionHT} disabled />
        </div>
        <div>
          <Label>Caution payée TTC</Label>
          <Input
            type="number"
            step={0.01}
            min="0"
            value={contractForm.cautionPaidTTC}
            onChange={onCautionPaidChange}
          />
        </div>
        <div>
          <Label>Caution payée HT</Label>
          <Input value={contractForm.cautionPaidHT} readOnly />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Méthode de paiement</Label>
          <Select
            value={contractForm.paymentMethod}
            onChange={onPaymentMethodChange}
            options={PAYMENT_METHOD_OPTIONS}
            placeholder="Sélectionner une méthode"
          />
        </div>
        <div>
          <Label>Statut</Label>
          <Input value="En attente" disabled />
        </div>
      </div>
    </section>
  );
}
