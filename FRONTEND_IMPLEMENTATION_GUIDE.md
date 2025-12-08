# Guide d'implémentation Frontend - Velvena App

## 📋 Table des matières

1. [Nouveaux fichiers créés](#nouveaux-fichiers-créés)
2. [Types et constantes](#types-et-constantes)
3. [Hooks personnalisés](#hooks-personnalisés)
4. [Composants](#composants)
5. [Workflow de création de contrat](#workflow-de-création-de-contrat)
6. [Exemples d'utilisation](#exemples-dutilisation)

---

## 🆕 Nouveaux fichiers créés

### 1. **Types et logique métier**
```
src/types/businessLogic.ts
```
- Constantes (TVA, acomptes, caution)
- Énumérations (statuts, stratégies de pricing)
- Fonctions utilitaires (calculs, conversions, validations)
- Formatters (monnaie, dates, pourcentages)

### 2. **Hook de calcul**
```
src/hooks/useContractCalculation.ts
```
- `useContractCalculation()` - Calcul automatique des prix
- `useContractPayments()` - Calcul des montants restants

### 3. **Composant de récapitulatif**
```
src/components/contracts/ContractAmountsSummary.tsx
```
- Affichage visuel des montants
- Progress bars de paiement
- Récapitulatif total

### 4. **API mise à jour**
```
src/api/endpoints/pricingRules.ts
```
- Ajout de la méthode `calculate()`

---

## 🎯 Types et Constantes

### Constantes métier

```typescript
import {
  VAT_RATE,                      // 0.20 (20%)
  DEFAULT_DEPOSIT_PERCENTAGE,    // 50%
  DEFAULT_CAUTION_AMOUNT,        // 500€
  ContractStatus,
  PricingStrategy,
  PaymentMethod,
} from "../types/businessLogic";
```

### Énumérations

```typescript
// Statuts de contrat
enum ContractStatus {
  DRAFT = "draft",        // Brouillon
  PENDING = "pending",    // En attente
  ACTIVE = "active",      // Actif
  COMPLETED = "completed", // Terminé
  CANCELLED = "cancelled", // Annulé
}

// Stratégies de pricing
enum PricingStrategy {
  PER_DAY = "per_day",         // Prix par jour
  TIERED = "tiered",           // Dégressif
  FLAT_RATE = "flat_rate",     // Forfait
  FIXED_PRICE = "fixed_price", // Prix fixe
}
```

### Fonctions utilitaires

```typescript
import {
  htToTtc,                    // Convertir HT → TTC
  ttcToHt,                    // Convertir TTC → HT
  calculateDurationDays,      // Calculer durée en jours
  calculateDeposit,           // Calculer acompte
  calculateCaution,           // Calculer caution
  formatCurrency,             // Formater en euros
  getContractStatusLabel,     // Label du statut
  getContractStatusColor,     // Couleur du badge
} from "../types/businessLogic";

// Exemples d'utilisation
const priceTtc = htToTtc(100);  // 120€
const priceHt = ttcToHt(120);   // 100€

const deposit = calculateDeposit(1000, 50);  // 500€ (50% de 1000€)
const caution = calculateCaution(1000);      // 500€ (montant fixe)

const formatted = formatCurrency(1234.56);   // "1 234,56 €"
```

---

## 🪝 Hooks Personnalisés

### 1. useContractCalculation

Gère les calculs de prix pour un contrat de location.

```typescript
import { useContractCalculation } from "../hooks/useContractCalculation";

function ContractForm() {
  const {
    // Fonctions
    calculateDressPrice,
    calculateMultipleDresses,
    resetCalculations,

    // Résultats
    dressCalculations,
    totalPriceTtc,
    totalPriceHt,
    contractAmounts,
    suggestedDeposit,

    // États
    allCalculationsReady,
    hasCalculationErrors,
    calculationErrors,
  } = useContractCalculation({
    serviceTypeConfig: selectedServiceType?.config,
    depositPercentage: 50,
  });

  // Calculer le prix d'une robe
  const handleCalculateDress = async () => {
    const calculation = await calculateDressPrice(
      dressId,
      new Date("2025-06-15"),
      new Date("2025-06-18"),
      pricingRuleId // optionnel
    );

    console.log("Prix TTC:", calculation.final_price_ttc);
  };

  // Calculer plusieurs robes en une fois
  const handleCalculateAll = async () => {
    await calculateMultipleDresses(
      ["dress-id-1", "dress-id-2"],
      startDate,
      endDate
    );
  };

  return (
    <div>
      <p>Prix total: {formatCurrency(totalPriceTtc)}</p>
      <p>Acompte suggéré: {formatCurrency(suggestedDeposit.ttc)}</p>

      {!allCalculationsReady && <p>Calcul en cours...</p>}
      {hasCalculationErrors && <p>Erreurs détectées</p>}
    </div>
  );
}
```

### 2. useContractPayments

Calcule les montants restants à payer.

```typescript
import { useContractPayments } from "../hooks/useContractCalculation";

function PaymentStatus({ amounts }: { amounts: ContractAmounts }) {
  const {
    remainingAccount,        // { ht, ttc }
    remainingCaution,        // { ht, ttc }
    totalRemaining,          // { ht, ttc }
    isFullyPaid,            // boolean
    accountPaidPercentage,   // 0-100
    cautionPaidPercentage,   // 0-100
  } = useContractPayments(amounts);

  return (
    <div>
      <p>Restant à payer: {formatCurrency(remainingAccount.ttc)}</p>
      <p>Caution restante: {formatCurrency(remainingCaution.ttc)}</p>
      <p>Total restant: {formatCurrency(totalRemaining.ttc)}</p>
      <p>Progression: {accountPaidPercentage}%</p>
      {isFullyPaid && <p>✓ Entièrement payé</p>}
    </div>
  );
}
```

---

## 🧩 Composants

### ContractAmountsSummary

Affiche un récapitulatif visuel des montants du contrat.

```typescript
import ContractAmountsSummary from "../components/contracts/ContractAmountsSummary";

function ContractDetails() {
  const amounts: ContractAmounts = {
    total_price_ht: 300,
    total_price_ttc: 360,
    account_ht: 300,
    account_ttc: 360,
    account_paid_ht: 150,
    account_paid_ttc: 180,
    caution_ht: 416.67,
    caution_ttc: 500,
    caution_paid_ht: 0,
    caution_paid_ttc: 0,
  };

  return (
    <ContractAmountsSummary
      amounts={amounts}
      showDeposit={true}
      depositPercentage={50}
      className="max-w-md"
    />
  );
}
```

**Props :**
- `amounts` - Montants du contrat
- `showDeposit?` - Afficher l'acompte suggéré (défaut: true)
- `depositPercentage?` - % d'acompte (défaut: 50)
- `className?` - Classes CSS additionnelles

**Affiche :**
- Prix total (HT/TTC)
- Acompte suggéré avec badge informatif
- Montant à payer avec progress bar
- Caution avec progress bar
- Récapitulatif total avec badge de statut

---

## 🔄 Workflow de Création de Contrat

### Contrat LOCATION (avec calcul de prix)

```typescript
import { useContractCalculation } from "../hooks/useContractCalculation";
import { ContractsAPI } from "../api/endpoints/contracts";
import ContractAmountsSummary from "../components/contracts/ContractAmountsSummary";

function CreateRentalContract() {
  const [selectedDresses, setSelectedDresses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  const {
    calculateMultipleDresses,
    contractAmounts,
    allCalculationsReady,
    hasCalculationErrors,
  } = useContractCalculation();

  // Étape 1 : Calculer les prix des robes
  const handleCalculate = async () => {
    await calculateMultipleDresses(selectedDresses, startDate, endDate);
  };

  // Étape 2 : Créer le contrat
  const handleCreateContract = async () => {
    if (!allCalculationsReady) {
      alert("Veuillez d'abord calculer les prix");
      return;
    }

    if (hasCalculationErrors) {
      alert("Erreurs de calcul détectées");
      return;
    }

    const payload = {
      contract_number: "CTR-2025-001",
      customer_id: customerId,
      contract_type_id: locationTypeId,
      start_datetime: startDate.toISOString(),
      end_datetime: endDate.toISOString(),

      // Robes
      dresses: selectedDresses.map(id => ({ dress_id: id })),

      // Prix calculés
      total_price_ht: contractAmounts.total_price_ht,
      total_price_ttc: contractAmounts.total_price_ttc,

      // Montant à payer (= total)
      account_ht: contractAmounts.account_ht,
      account_ttc: contractAmounts.account_ttc,

      // Acompte de 50% (peut être modifié)
      account_paid_ht: contractAmounts.account_ht * 0.5,
      account_paid_ttc: contractAmounts.account_ttc * 0.5,

      // Caution
      caution_ht: contractAmounts.caution_ht,
      caution_ttc: contractAmounts.caution_ttc,
      caution_paid_ht: 0,
      caution_paid_ttc: 0,

      deposit_payment_method: "card",
      status: "pending",
    };

    await ContractsAPI.create(payload);
  };

  return (
    <div>
      {/* Sélection des robes et dates */}
      <DressSelector onChange={setSelectedDresses} />
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
      />

      <button onClick={handleCalculate}>
        Calculer les prix
      </button>

      {/* Afficher le récapitulatif */}
      {allCalculationsReady && (
        <ContractAmountsSummary
          amounts={contractAmounts}
          depositPercentage={50}
        />
      )}

      <button
        onClick={handleCreateContract}
        disabled={!allCalculationsReady}
      >
        Créer le contrat
      </button>
    </div>
  );
}
```

### Contrat FORFAIT (prix fixe)

```typescript
import { ContractPackagesAPI } from "../api/endpoints/contractPackages";
import { ContractsAPI } from "../api/endpoints/contracts";

function CreatePackageContract() {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedDresses, setSelectedDresses] = useState<string[]>([]);

  const handleCreateContract = async () => {
    if (!selectedPackage) return;

    // Validation : nombre de robes ≤ package.num_dresses
    if (selectedDresses.length > selectedPackage.num_dresses) {
      alert(`Maximum ${selectedPackage.num_dresses} robes autorisées`);
      return;
    }

    const amounts: ContractAmounts = {
      // Prix fixe du package
      total_price_ht: selectedPackage.price_ht,
      total_price_ttc: selectedPackage.price_ttc,

      account_ht: selectedPackage.price_ht,
      account_ttc: selectedPackage.price_ttc,

      // Paiement complet immédiat
      account_paid_ht: selectedPackage.price_ht,
      account_paid_ttc: selectedPackage.price_ttc,

      // Caution fixe
      caution_ht: 416.67,
      caution_ttc: 500,
      caution_paid_ht: 0,
      caution_paid_ttc: 0,
    };

    const payload = {
      contract_number: "CTR-2025-002",
      customer_id: customerId,
      contract_type_id: packageTypeId,
      package_id: selectedPackage.id,  // ← Important !

      start_datetime: startDate.toISOString(),
      end_datetime: endDate.toISOString(),

      dresses: selectedDresses.map(id => ({ dress_id: id })),

      ...amounts,

      deposit_payment_method: "card",
      status: "active",  // Forfait = paiement complet
    };

    await ContractsAPI.create(payload);
  };

  return (
    <div>
      <PackageSelector onChange={setSelectedPackage} />
      <DressSelector
        maxSelection={selectedPackage?.num_dresses}
        onChange={setSelectedDresses}
      />

      {selectedPackage && (
        <div>
          <p>Prix forfait: {formatCurrency(selectedPackage.price_ttc)}</p>
          <p>Robes: {selectedDresses.length}/{selectedPackage.num_dresses}</p>
        </div>
      )}

      <button onClick={handleCreateContract}>
        Créer le contrat
      </button>
    </div>
  );
}
```

---

## 📝 Exemples Complets

### 1. Calcul de prix avec affichage détaillé

```typescript
function PriceBreakdown() {
  const {
    calculateDressPrice,
    getDressCalculation,
  } = useContractCalculation();

  const [dressId] = useState("dress-123");
  const calculation = getDressCalculation(dressId);

  useEffect(() => {
    calculateDressPrice(
      dressId,
      new Date("2025-06-15"),
      new Date("2025-06-20")
    );
  }, [dressId]);

  if (!calculation) return <p>Chargement...</p>;

  if (calculation.loading) {
    return <p>Calcul en cours...</p>;
  }

  if (calculation.error) {
    return <p className="text-red-600">{calculation.error}</p>;
  }

  const calc = calculation.calculation!;

  return (
    <div className="space-y-4">
      <div>
        <h3>Stratégie : {calc.strategy_used}</h3>
        <p>Durée : {calc.duration_days} jours</p>
        {calc.discount_applied && (
          <p className="text-green-600">
            Réduction : {calc.discount_applied}%
          </p>
        )}
      </div>

      <div>
        <p>Prix de base : {formatCurrency(calc.base_price_ttc)}</p>
        <p className="text-2xl font-bold">
          Prix final : {formatCurrency(calc.final_price_ttc)}
        </p>
      </div>

      {/* Détail jour par jour */}
      <div>
        <h4>Détail journalier :</h4>
        {calc.breakdown.map((day, index) => (
          <div key={index} className="flex justify-between">
            <span>Jour {day.day} - {day.date}</span>
            <span>{formatCurrency(day.price_ttc)}</span>
            {day.discount_percentage && (
              <span className="text-green-600">
                -{day.discount_percentage}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Validation des dates selon ServiceType

```typescript
import { validateContractDates, calculateDurationDays } from "../types/businessLogic";

function DateValidation() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);

  const validation = validateContractDates(
    startDate,
    endDate,
    serviceType?.config
  );

  const durationDays = calculateDurationDays(startDate, endDate);

  return (
    <div>
      <DatePicker value={startDate} onChange={setStartDate} />
      <DatePicker value={endDate} onChange={setEndDate} />

      <p>Durée : {durationDays} jours</p>

      {serviceType?.config?.min_duration_days && (
        <p className="text-sm text-gray-600">
          Minimum : {serviceType.config.min_duration_days} jours
        </p>
      )}

      {serviceType?.config?.max_duration_days && (
        <p className="text-sm text-gray-600">
          Maximum : {serviceType.config.max_duration_days} jours
        </p>
      )}

      {!validation.valid && (
        <p className="text-red-600">{validation.error}</p>
      )}
    </div>
  );
}
```

### 3. Badge de statut de contrat

```typescript
import { getContractStatusLabel, getContractStatusColor, ContractStatus } from "../types/businessLogic";

function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const label = getContractStatusLabel(status);
  const colorClass = getContractStatusColor(status);

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${colorClass}`}>
      {label}
    </span>
  );
}

// Utilisation
<ContractStatusBadge status={ContractStatus.ACTIVE} />
// → Badge vert "Actif"

<ContractStatusBadge status={ContractStatus.PENDING} />
// → Badge jaune "En attente"
```

---

## ✅ Checklist d'implémentation

### Pour créer un contrat de LOCATION

- [ ] Sélectionner les robes
- [ ] Choisir les dates (start/end)
- [ ] Sélectionner le ServiceType (optionnel)
- [ ] Appeler `calculateMultipleDresses()` pour chaque robe
- [ ] Attendre que `allCalculationsReady === true`
- [ ] Vérifier qu'il n'y a pas d'erreurs (`hasCalculationErrors`)
- [ ] Utiliser `contractAmounts` pour remplir le payload
- [ ] Créer le contrat avec `POST /contracts`
- [ ] **NE PAS** inclure `package_id`

### Pour créer un contrat FORFAIT

- [ ] Charger les packages disponibles (`GET /contract-packages`)
- [ ] Utilisateur choisit un package
- [ ] Sélectionner les robes (≤ `package.num_dresses`)
- [ ] Vérifier la durée (≤ `package.max_duration_hours`)
- [ ] Utiliser les prix fixes du package
- [ ] Créer le contrat avec `POST /contracts`
- [ ] **OBLIGATOIRE** : inclure `package_id`
- [ ] **NE PAS** calculer les prix via `/pricing-rules/calculate`

---

## 🚨 Erreurs courantes à éviter

### ❌ Mélanger forfait et location
```typescript
// MAUVAIS : Ne pas mélanger package_id avec calcul de prix
{
  package_id: "pkg-123",
  total_price_ttc: calculatedPrice  // ❌ Conflit !
}
```

### ❌ Oublier de calculer les prix
```typescript
// MAUVAIS : Créer un contrat location sans calculer
await ContractsAPI.create({
  ...
  total_price_ttc: 0  // ❌ Prix non calculé !
});
```

### ❌ Ignorer les validations
```typescript
// MAUVAIS : Ne pas valider les dates
const { valid } = validateContractDates(start, end, config);
// On crée quand même sans vérifier valid ❌
```

### ✅ Bonne pratique
```typescript
// BON : Workflow complet avec validations
const validation = validateContractDates(start, end, serviceConfig);
if (!validation.valid) {
  alert(validation.error);
  return;
}

await calculateMultipleDresses(dresses, start, end);

if (!allCalculationsReady || hasCalculationErrors) {
  alert("Erreurs de calcul");
  return;
}

await ContractsAPI.create({
  ...contractAmounts,
  // ... autres champs
});
```

---

## 📚 Ressources

- **Types complets** : `src/types/businessLogic.ts`
- **Hooks** : `src/hooks/useContractCalculation.ts`
- **Composants** : `src/components/contracts/ContractAmountsSummary.tsx`
- **API** : `src/api/endpoints/pricingRules.ts` → méthode `calculate()`
- **Documentation backend** : `BUSINESS_LOGIC_ANALYSIS.md`

---

## 🎉 Résumé

Vous disposez maintenant de :

1. ✅ **Types TypeScript complets** avec toutes les constantes métier
2. ✅ **Hooks personnalisés** pour gérer les calculs automatiquement
3. ✅ **Composant de récapitulatif** prêt à l'emploi
4. ✅ **Fonctions utilitaires** (conversions, validations, formatters)
5. ✅ **Exemples de code** pour tous les cas d'usage

Le système est maintenant **100% aligné avec la logique métier backend** ! 🚀
