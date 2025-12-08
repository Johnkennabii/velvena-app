# Workflow : Création d'un Contrat de Location avec ServiceTypes et PricingRules

## 📊 Vue d'ensemble

Ce document explique comment créer un contrat de location en utilisant le système de **Types de Service** et **Règles de Tarification** pour le calcul automatique des prix.

---

## 🔄 Workflow Complet

### Étape 1 : Configuration préalable (Admin)

Avant de pouvoir créer des contrats, l'administrateur doit configurer :

#### 1.1 Types de Service (`/settings/service-types`)

**Exemple : Location Courte Durée**
```json
{
  "name": "Location Courte Durée",
  "code": "rental_short",
  "config": {
    "min_duration_days": 1,
    "max_duration_days": 7,
    "requires_deposit": true,
    "default_deposit_percentage": 50
  }
}
```

**Exemple : Location Longue Durée**
```json
{
  "name": "Location Longue Durée",
  "code": "rental_long",
  "config": {
    "min_duration_days": 8,
    "max_duration_days": 30,
    "requires_deposit": true,
    "default_deposit_percentage": 30
  }
}
```

#### 1.2 Règles de Tarification (`/settings/pricing-rules`)

**Exemple 1 : Prix par jour (per_day)**
```json
{
  "name": "Tarif standard par jour",
  "service_type_id": "<id_location_courte>",
  "strategy": "per_day",
  "priority": 10,
  "calculation_config": {
    "base_price_source": "dress",
    "apply_tax": true,
    "tax_rate": 0.20
  },
  "applies_to": {
    "min_duration_days": 1,
    "max_duration_days": 3
  }
}
```

**Exemple 2 : Prix dégressif (tiered)**
```json
{
  "name": "Tarif dégressif longue durée",
  "service_type_id": "<id_location_courte>",
  "strategy": "tiered",
  "priority": 20,
  "calculation_config": {
    "base_price_source": "dress",
    "tiers": [
      {
        "min_days": 4,
        "max_days": 7,
        "discount_percentage": 10
      },
      {
        "min_days": 8,
        "max_days": null,
        "discount_percentage": 20
      }
    ]
  }
}
```

**Exemple 3 : Forfait week-end (flat_rate)**
```json
{
  "name": "Forfait week-end",
  "service_type_id": "<id_location_courte>",
  "strategy": "flat_rate",
  "priority": 30,
  "calculation_config": {
    "applies_to_period": "weekend",
    "fixed_multiplier": 2.5
  },
  "applies_to": {
    "weekdays": ["friday", "saturday", "sunday"]
  }
}
```

---

### Étape 2 : Création du contrat (Page Catalogue)

#### 2.1 Sélection des éléments

```typescript
// Page : /catalogue
function CreateRentalContract() {
  // 1️⃣ Données sélectionnées par l'utilisateur
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selectedDresses, setSelectedDresses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);

  // 2️⃣ Hook de calcul automatique
  const {
    calculateMultipleDresses,
    contractAmounts,
    allCalculationsReady,
    hasCalculationErrors,
    calculationErrors,
  } = useContractCalculation({
    serviceTypeConfig: serviceType?.config,
    depositPercentage: serviceType?.config?.default_deposit_percentage || 50,
  });
}
```

#### 2.2 Flux utilisateur

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Sélectionner un client                                   │
│    └─> Rechercher ou créer un nouveau client                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Sélectionner les robes                                   │
│    └─> Cliquer sur les robes du catalogue                   │
│    └─> Vérifier la disponibilité (badge "Disponible")       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Choisir les dates de location                            │
│    └─> Date de début                                         │
│    └─> Date de fin                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CALCUL AUTOMATIQUE DES PRIX                              │
│    └─> Le système appelle POST /pricing-rules/calculate     │
│    └─> Pour chaque robe sélectionnée                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Affichage du récapitulatif                               │
│    └─> Prix total (somme de toutes les robes)               │
│    └─> Acompte suggéré (50% par défaut)                     │
│    └─> Caution (500€ fixe ou % du total)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Validation et création du contrat                        │
│    └─> POST /contracts avec tous les montants calculés      │
└─────────────────────────────────────────────────────────────┘
```

---

### Étape 3 : Calcul automatique des prix

#### 3.1 Appel API pour chaque robe

```typescript
// Le hook appelle automatiquement l'API pour chaque robe
const handleCalculatePrices = async () => {
  // Pour chaque robe sélectionnée
  for (const dressId of selectedDresses) {
    // Appel API
    const calculation = await PricingRulesAPI.calculate({
      dress_id: dressId,
      start_date: startDate.toISOString().split("T")[0], // "2025-01-15"
      end_date: endDate.toISOString().split("T")[0],     // "2025-01-20"
      // pricing_rule_id: optionnel, sinon le backend choisit automatiquement
    });

    // Résultat pour cette robe
    console.log(calculation);
    /*
    {
      strategy_used: "tiered",
      base_price_ht: 100,
      base_price_ttc: 120,
      final_price_ht: 450,      // 5 jours × 100€ avec -10% dégressif
      final_price_ttc: 540,
      duration_days: 5,
      discount_applied: 10,
      breakdown: [
        { day: 1, date: "2025-01-15", price_ht: 100, price_ttc: 120 },
        { day: 2, date: "2025-01-16", price_ht: 100, price_ttc: 120 },
        { day: 3, date: "2025-01-17", price_ht: 100, price_ttc: 120 },
        { day: 4, date: "2025-01-18", price_ht: 90, price_ttc: 108, discount_percentage: 10 },
        { day: 5, date: "2025-01-19", price_ht: 90, price_ttc: 108, discount_percentage: 10 }
      ]
    }
    */
  }

  // Le hook calcule automatiquement :
  // - total_price_ttc = somme de toutes les robes
  // - account_ttc = total_price_ttc
  // - suggested_deposit = total_price_ttc × 50%
  // - caution_ttc = 500€ ou % selon config
};
```

#### 3.2 Sélection automatique de la règle

Le backend choisit la règle de tarification selon :

1. **Priority** (ordre décroissant) : règles avec priorité plus haute d'abord
2. **Applies_to** : filtre selon durée, jours de la semaine, type de robe, etc.
3. **Service_type_id** : correspondance avec le type de service

**Exemple de sélection :**

```
Contexte : Location de 5 jours (lundi → vendredi)
Robe : Robe cocktail, 100€/jour HT

Règles disponibles :
├─ Règle A : per_day (1-3 jours) - Priority 10 ❌ (durée non valide)
├─ Règle B : tiered (4-7 jours) - Priority 20 ✅ (correspond!)
└─ Règle C : flat_rate (weekend) - Priority 30 ❌ (jours non valides)

✅ Règle sélectionnée : Règle B (tiered avec -10% pour 4-7 jours)

Calcul :
- Jour 1-3 : 100€/jour = 300€ HT
- Jour 4-5 : 90€/jour (−10%) = 180€ HT
- Total : 480€ HT → 576€ TTC
```

---

### Étape 4 : Montants du contrat

#### 4.1 Structure des montants

```typescript
interface ContractAmounts {
  // Prix total des robes (calculé par l'API)
  total_price_ht: number;      // Exemple : 480€
  total_price_ttc: number;     // Exemple : 576€

  // Montant à payer (= total)
  account_ht: number;          // 480€
  account_ttc: number;         // 576€

  // Acompte payé (modifiable par l'utilisateur)
  account_paid_ht: number;     // 240€ (50% de 480€)
  account_paid_ttc: number;    // 288€ (50% de 576€)

  // Caution (dépôt de garantie)
  caution_ht: number;          // 416.67€
  caution_ttc: number;         // 500€
  caution_paid_ht: number;     // 0€ (pas encore payée)
  caution_paid_ttc: number;    // 0€
}
```

#### 4.2 Calcul de la caution

La caution peut être calculée de 2 façons :

**Option 1 : Montant fixe (par défaut)**
```typescript
caution_ttc = 500€ (DEFAULT_CAUTION_AMOUNT)
```

**Option 2 : Pourcentage du total (si configuré dans ServiceType)**
```typescript
// ServiceType config :
{
  "default_deposit_percentage": 30
}

// Caution = 30% du total
caution_ttc = 576€ × 0.30 = 172.80€
```

---

### Étape 5 : Création du contrat

#### 5.1 Payload complet

```typescript
const createContract = async () => {
  const payload: ContractCreatePayload = {
    // Identification
    contract_number: "CTR-2025-001",
    customer_id: customer.id,
    contract_type_id: contractType.id,

    // Dates
    start_datetime: "2025-01-15T10:00:00.000Z",
    end_datetime: "2025-01-20T18:00:00.000Z",

    // Robes (calculées précédemment)
    dresses: [
      { dress_id: "robe-1-id" },
      { dress_id: "robe-2-id" }
    ],

    // 💰 MONTANTS CALCULÉS
    total_price_ht: contractAmounts.total_price_ht,    // 480€
    total_price_ttc: contractAmounts.total_price_ttc,  // 576€

    account_ht: contractAmounts.account_ht,            // 480€
    account_ttc: contractAmounts.account_ttc,          // 576€

    account_paid_ht: contractAmounts.account_paid_ht,  // 240€ (50%)
    account_paid_ttc: contractAmounts.account_paid_ttc, // 288€

    caution_ht: contractAmounts.caution_ht,            // 416.67€
    caution_ttc: contractAmounts.caution_ttc,          // 500€
    caution_paid_ht: 0,
    caution_paid_ttc: 0,

    // Paiement
    deposit_payment_method: "card",

    // Statut
    status: "pending", // En attente (acompte payé, caution non payée)
  };

  await ContractsAPI.create(payload);
};
```

#### 5.2 Transitions de statut

```
draft (brouillon)
  ↓
  [Acompte payé]
  ↓
pending (en attente)
  ↓
  [Caution payée + date de début atteinte]
  ↓
active (actif)
  ↓
  [Date de fin atteinte + robe retournée]
  ↓
completed (terminé)

❌ cancelled peut être appliqué depuis draft, pending ou active
```

---

## 💻 Code complet d'exemple

```typescript
import { useState } from "react";
import { useContractCalculation } from "@/hooks/useContractCalculation";
import { ContractsAPI } from "@/api/endpoints/contracts";
import { ServiceTypesAPI } from "@/api/endpoints/serviceTypes";
import ContractAmountsSummary from "@/components/contracts/ContractAmountsSummary";

export default function CreateRentalContractPage() {
  // Sélections utilisateur
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selectedDresses, setSelectedDresses] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);

  // Hook de calcul
  const {
    calculateMultipleDresses,
    contractAmounts,
    allCalculationsReady,
    hasCalculationErrors,
    calculationErrors,
    dressCalculations,
  } = useContractCalculation({
    serviceTypeConfig: serviceType?.config,
    depositPercentage: serviceType?.config?.default_deposit_percentage || 50,
  });

  // Étape 1 : Calculer les prix
  const handleCalculatePrices = async () => {
    if (selectedDresses.length === 0) {
      alert("Sélectionnez au moins une robe");
      return;
    }

    await calculateMultipleDresses(selectedDresses, startDate, endDate);
  };

  // Étape 2 : Créer le contrat
  const handleCreateContract = async () => {
    if (!customer) {
      alert("Sélectionnez un client");
      return;
    }

    if (!allCalculationsReady) {
      alert("Veuillez d'abord calculer les prix");
      return;
    }

    if (hasCalculationErrors) {
      alert("Erreurs de calcul : " + calculationErrors.map(e => e.error).join(", "));
      return;
    }

    try {
      const contract = await ContractsAPI.create({
        contract_number: generateContractNumber(),
        customer_id: customer.id,
        contract_type_id: serviceType?.id || "default-rental-type-id",
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),

        dresses: selectedDresses.map(id => ({ dress_id: id })),

        // Montants calculés automatiquement
        total_price_ht: contractAmounts.total_price_ht,
        total_price_ttc: contractAmounts.total_price_ttc,
        account_ht: contractAmounts.account_ht,
        account_ttc: contractAmounts.account_ttc,
        account_paid_ht: contractAmounts.account_paid_ht,
        account_paid_ttc: contractAmounts.account_paid_ttc,
        caution_ht: contractAmounts.caution_ht,
        caution_ttc: contractAmounts.caution_ttc,
        caution_paid_ht: 0,
        caution_paid_ttc: 0,

        deposit_payment_method: "card",
        status: "pending",
      });

      alert("Contrat créé avec succès!");
      // Rediriger vers la page du contrat
      navigate(`/contracts/${contract.id}`);
    } catch (error: any) {
      alert("Erreur : " + error.message);
    }
  };

  return (
    <div className="p-6">
      <h1>Créer un contrat de location</h1>

      {/* 1. Sélection client */}
      <CustomerSelector value={customer} onChange={setCustomer} />

      {/* 2. Sélection type de service */}
      <ServiceTypeSelector value={serviceType} onChange={setServiceType} />

      {/* 3. Sélection robes */}
      <DressSelector
        selected={selectedDresses}
        onChange={setSelectedDresses}
        startDate={startDate}
        endDate={endDate}
      />

      {/* 4. Dates */}
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
      />

      {/* 5. Calculer */}
      <button
        onClick={handleCalculatePrices}
        disabled={selectedDresses.length === 0}
      >
        Calculer les prix
      </button>

      {/* 6. Récapitulatif */}
      {allCalculationsReady && (
        <div className="mt-6">
          <h2>Récapitulatif</h2>

          {/* Détail par robe */}
          {Array.from(dressCalculations.values()).map((calc) => (
            <div key={calc.dress_id}>
              <p>Robe {calc.dress_id}</p>
              {calc.loading && <p>Calcul en cours...</p>}
              {calc.error && <p className="text-red-500">{calc.error}</p>}
              {calc.calculation && (
                <p>
                  Prix : {calc.calculation.final_price_ttc}€ TTC
                  ({calc.calculation.strategy_used})
                </p>
              )}
            </div>
          ))}

          {/* Résumé total */}
          <ContractAmountsSummary
            amounts={contractAmounts}
            depositPercentage={
              serviceType?.config?.default_deposit_percentage || 50
            }
          />
        </div>
      )}

      {/* 7. Créer le contrat */}
      <button
        onClick={handleCreateContract}
        disabled={!allCalculationsReady || hasCalculationErrors}
        className="mt-4"
      >
        Créer le contrat
      </button>
    </div>
  );
}
```

---

## ✅ Checklist de validation

Avant de créer le contrat, vérifier :

- [ ] Client sélectionné
- [ ] Au moins une robe sélectionnée
- [ ] Dates de début et fin valides (début < fin)
- [ ] Durée respecte les limites du ServiceType (min/max_duration_days)
- [ ] Toutes les robes disponibles pour la période
- [ ] Calcul des prix terminé sans erreur
- [ ] Montants cohérents (account = total, caution > 0)
- [ ] Méthode de paiement sélectionnée

---

## 🚨 Gestion d'erreurs courantes

### Erreur : "Aucune règle de tarification applicable"

**Cause** : Aucune `PricingRule` ne correspond aux critères (durée, jours, type de robe)

**Solution** : Créer une règle par défaut avec `applies_to: null` et faible priorité

### Erreur : "Durée minimale non respectée"

**Cause** : `duration_days < serviceType.config.min_duration_days`

**Solution** : Ajuster les dates ou choisir un autre type de service

### Erreur : "Robe non disponible"

**Cause** : La robe est déjà réservée pour la période

**Solution** : Vérifier la disponibilité via `/dresses/availability` avant le calcul

---

## 📚 Ressources

- **Types et constantes** : `src/types/businessLogic.ts`
- **Hook de calcul** : `src/hooks/useContractCalculation.ts`
- **Composant récapitulatif** : `src/components/contracts/ContractAmountsSummary.tsx`
- **API PricingRules** : `src/api/endpoints/pricingRules.ts`
- **Guide complet** : `FRONTEND_IMPLEMENTATION_GUIDE.md`
