# Intégration des PricingRules dans le Catalogue

## ✅ Ce qui a été fait

### 1. Création du hook `usePricingCalculation`

**Fichier** : `src/hooks/catalogue/usePricingCalculation.ts`

Ce hook permet de calculer automatiquement le prix d'une robe via l'API `/pricing-rules/calculate`.

**Utilisation** :
```typescript
const { calculation, loading, error } = usePricingCalculation({
  dressId: "robe-id",
  startDate: new Date("2025-01-15"),
  endDate: new Date("2025-01-20"),
  enabled: true,
});

// calculation contient :
// {
//   strategy_used: "tiered",
//   base_price_ht: 100,
//   base_price_ttc: 120,
//   final_price_ht: 450,
//   final_price_ttc: 540,
//   duration_days: 5,
//   discount_applied: 10,
//   breakdown: [...] // détail jour par jour
// }
```

### 2. Imports ajoutés dans `Catalogue.tsx`

```typescript
import { usePricingCalculation } from "../../hooks/catalogue/usePricingCalculation";
import { PricingRulesAPI } from "../../api/endpoints/pricingRules";
```

---

## 🔧 Ce qu'il reste à faire

### Étape 1 : Utiliser le hook dans le composant Catalogue

**Localisation** : `src/pages/Catalogue/Catalogue.tsx` ligne ~370-380

**Ajouter après les autres hooks** :

```typescript
// Après les hooks existants (ligne ~370)
const {
  calculation: priceCalculation,
  loading: priceCalculating,
  error: priceCalculationError,
} = usePricingCalculation({
  dressId: contractDrawer.dress?.id || null,
  startDate: contractForm?.startDate ? new Date(contractForm.startDate) : null,
  endDate: contractForm?.endDate ? new Date(contractForm.endDate) : null,
  enabled: contractDrawer.open && contractDrawer.mode === "daily",
});
```

### Étape 2 : Remplacer le calcul manuel par le calcul API

**Localisation** : `src/pages/Catalogue/Catalogue.tsx` ligne ~416

**AVANT (calcul manuel)** :
```typescript
const pricePerDay = useMemo(() => {
  const dress = contractDrawer.dress;
  if (!dress) {
    return { ht: 0, ttc: 0 };
  }
  return {
    ht: toNumeric(dress.price_per_day_ht ?? 0),
    ttc: toNumeric(dress.price_per_day_ttc ?? 0),
  };
}, [contractDrawer.dress]);
```

**APRÈS (avec PricingRules)** :
```typescript
const pricePerDay = useMemo(() => {
  const dress = contractDrawer.dress;
  if (!dress) {
    return { ht: 0, ttc: 0 };
  }

  // Si on est en mode "daily" (location) et qu'on a un calcul API
  if (contractDrawer.mode === "daily" && priceCalculation) {
    // Utiliser le prix calculé par l'API divisé par le nombre de jours
    const days = priceCalculation.duration_days || 1;
    return {
      ht: priceCalculation.final_price_ht / days,
      ttc: priceCalculation.final_price_ttc / days,
    };
  }

  // Sinon, utiliser les prix par défaut de la robe
  return {
    ht: toNumeric(dress.price_per_day_ht ?? 0),
    ttc: toNumeric(dress.price_per_day_ttc ?? 0),
  };
}, [contractDrawer.dress, contractDrawer.mode, priceCalculation]);
```

### Étape 3 : Utiliser le prix total calculé (ligne ~1101)

**Localisation** : `src/pages/Catalogue/Catalogue.tsx` ligne ~1101

**AVANT** :
```typescript
const baseHT = pricePerDay.ht * days;
const baseTTC = pricePerDay.ttc * days;
```

**APRÈS** :
```typescript
// Si on a un calcul API, utiliser directement le prix final
const baseHT = priceCalculation?.final_price_ht ?? (pricePerDay.ht * days);
const baseTTC = priceCalculation?.final_price_ttc ?? (pricePerDay.ttc * days);
```

### Étape 4 : Afficher un indicateur de chargement

**Ajouter dans le drawer de contrat** (optionnel mais recommandé) :

```typescript
{priceCalculating && (
  <div className="text-sm text-gray-500">
    Calcul du prix en cours...
  </div>
)}

{priceCalculationError && (
  <div className="text-sm text-red-500">
    ⚠️ {priceCalculationError}
  </div>
)}

{priceCalculation && (
  <div className="text-sm text-green-600">
    ✓ Stratégie : {priceCalculation.strategy_used}
    {priceCalculation.discount_applied && (
      <span> (-{priceCalculation.discount_applied}% dégressif)</span>
    )}
  </div>
)}
```

---

## 🎯 Résultat attendu

### Avant l'intégration

```
Robe à 100€/jour × 5 jours = 500€ TTC
(Calcul simple : prix × jours)
```

### Après l'intégration

```
Robe à 100€/jour × 5 jours avec règle "tiered" :
- Jour 1-3 : 100€/jour = 300€ HT
- Jour 4-5 : 90€/jour (-10%) = 180€ HT
Total : 480€ HT → 576€ TTC
(Calcul intelligent via PricingRules)
```

---

## 🧪 Test du workflow

### 1. Configuration préalable

**Dans `/settings/service-types`** :
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

**Dans `/settings/pricing-rules`** :
```json
{
  "name": "Tarif dégressif 4-7 jours",
  "service_type_id": "<id_location_courte>",
  "strategy": "tiered",
  "priority": 10,
  "calculation_config": {
    "base_price_source": "dress",
    "tiers": [
      { "min_days": 1, "max_days": 3, "discount_percentage": 0 },
      { "min_days": 4, "max_days": 7, "discount_percentage": 10 }
    ]
  }
}
```

### 2. Test dans le catalogue

1. **Aller sur `/catalogue`**
2. **Cliquer sur une robe**
3. **Sélectionner "Créer un contrat"**
4. **Choisir les dates** (ex: 5 jours)
5. **Vérifier que le prix affiché utilise la règle dégressif** :
   - Avant : 100€ × 5 = 500€ TTC
   - Après : 480€ HT → 576€ TTC (avec -10% sur jours 4-5)

### 3. Vérification dans les logs

Ouvrir la console du navigateur et vérifier :

```
Calcul prix robe-id:
{
  strategy_used: "tiered",
  final_price_ttc: 576,
  duration_days: 5,
  discount_applied: 10
}
```

---

## ❓ FAQ

### Q : Que se passe-t-il si aucune règle ne correspond ?

Le backend devrait retourner une erreur ou utiliser un calcul par défaut. Dans ce cas, le code utilisera le prix par défaut de la robe (`price_per_day_ttc`).

### Q : Comment désactiver le calcul API temporairement ?

Passer `enabled: false` au hook :

```typescript
const { calculation } = usePricingCalculation({
  // ...
  enabled: false, // Désactive le calcul API
});
```

### Q : Le calcul API est-il compatible avec les forfaits ?

Non, les forfaits (`mode === "package"`) ont un prix fixe et ne nécessitent pas de calcul dynamique. Le hook est uniquement activé pour `mode === "daily"`.

---

## 📚 Ressources

- **Hook de calcul** : `src/hooks/catalogue/usePricingCalculation.ts`
- **API PricingRules** : `src/api/endpoints/pricingRules.ts`
- **Types** : `src/types/businessLogic.ts`
- **Workflow complet** : `CONTRAT_LOCATION_WORKFLOW.md`
- **Guide implémentation** : `FRONTEND_IMPLEMENTATION_GUIDE.md`

---

## ✅ Checklist finale

Avant de considérer l'intégration complète :

- [ ] Hook `usePricingCalculation` créé ✅
- [ ] Imports ajoutés dans `Catalogue.tsx` ✅
- [ ] Hook utilisé dans le composant `Catalogue`
- [ ] Calcul `pricePerDay` modifié pour utiliser l'API
- [ ] Calcul `baseHT/baseTTC` modifié pour utiliser l'API
- [ ] Indicateur de chargement ajouté (optionnel)
- [ ] ServiceType créé dans `/settings/service-types`
- [ ] PricingRule créée dans `/settings/pricing-rules`
- [ ] Test E2E : créer un contrat avec calcul dégressif
- [ ] Vérifier que le prix final est correct dans le contrat créé

---

**Prochaine étape** : Appliquer les modifications des étapes 1-4 dans `Catalogue.tsx`
