# ANALYSE APPROFONDIE DE LA LOGIQUE MÉTIER - VELVENA APP

## 1. CONTRATS (CONTRACTS)

### 1.1 Types de Contrats

Les contrats sont définis par un `contract_type_id` et un `name`. Les types de contrats sont des catégorisations:
- **Location par jour**: Type identifié par le code `DAILY_CONTRACT_TYPE_ID`
- **Forfait (Package)**: Contrats avec forfait fixe
- **Autres types customisables**: Créés via l'interface de gestion

**Fichiers**: 
- `/src/api/endpoints/contractTypes.ts`
- `/src/constants/catalogue.ts` (ligne 17: `DAILY_CONTRACT_TYPE_ID`)

### 1.2 Statuts de Contrat

Les statuts possibles sont définis dans `contractPermissions.ts`:

```typescript
type ContractStatus =
  | 'DRAFT'              // Brouillon - contrat en cours de création
  | 'PENDING'            // En attente - PDF manuel attendu
  | 'PENDING_SIGNATURE'  // Signature en cours - lien envoyé
  | 'SIGNED'             // Signé - contrat finalisé
  | 'SIGNED_ELECTRONICALLY' // Signé électroniquement
```

**Transitions de Statut**:
- Création → DRAFT (ligne 409 ContractBuilder.tsx)
- DRAFT → PENDING_SIGNATURE (après envoi du lien de signature)
- PENDING_SIGNATURE → SIGNED (après signature électronique)
- PENDING → SIGNED (après upload d'un PDF signé)

**Fichier**: `/src/utils/contractPermissions.ts` (lignes 12-17)

### 1.3 Champs de Prix et Montants

Chaque contrat possède 4 types de montants:

#### 1.3.1 Total du Contrat (total_price)
- `total_price_ht`: Prix total hors taxes (robes + addons)
- `total_price_ttc`: Prix total TTC (robes + addons + 20% TVA)

**Calcul**:
```
totalHT = (robes HT * jours) + addons HT
totalTTC = totalHT * 1.20
```

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 328-329)

#### 1.3.2 Acompte / Account (MONTANT DÛ)
- `account_ht`: Montant d'acompte dû HT
- `account_ttc`: Montant d'acompte dû TTC
- Calculé comme **50% du total du contrat**

**Calcul**:
```
depositTTC = totalTTC * 0.5  // 50%
depositHT = depositTTC / 1.20
```

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 331-333)

#### 1.3.3 Caution (DÉPÔT DE GARANTIE)
- `caution_ht`: Montant de caution dû HT
- `caution_ttc`: Montant de caution dû TTC
- **Montant fixe**: 500€ TTC par défaut

**Calcul**:
```
cautionTTC = 500.00 (fixe)
cautionHT = cautionTTC / 1.20 = 416.67
```

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 335-337)

#### 1.3.4 Montants Payés (account_paid, caution_paid)
- `account_paid_ht`: Acompte effectivement payé HT
- `account_paid_ttc`: Acompte effectivement payé TTC
- `caution_paid_ht`: Caution effectivement payée HT
- `caution_paid_ttc`: Caution effectivement payée TTC

**Caractéristique**: Ces montants sont saisis manuellement par l'utilisateur et peuvent être partiels.

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 339-343)

### 1.4 Addons et Packages

#### 1.4.1 Addons (Services Supplémentaires)
```typescript
interface ContractAddon {
  id: string;
  name: string;
  description?: string | null;
  price_ht: number | string;
  price_ttc: number | string;
  included: boolean;  // Inclus dans le forfait ou optionnel
}
```

**Deux types d'addons**:
1. **Inclus**: Inclus dans le forfait (`included: true`)
2. **Optionnels**: À ajouter manuellement (`included: false`)

**Fichier**: `/src/api/endpoints/contractAddons.ts`

#### 1.4.2 Packages (Forfaits)
```typescript
interface ContractPackage {
  id: string;
  name: string;
  num_dresses: number;      // Nombre de robes limitées
  price_ht: string | number; // Prix fixe HT
  price_ttc: string | number; // Prix fixe TTC
  addons?: ContractPackageAddonLink[];  // Addons inclus
}
```

**Règles des Packages**:
- Prix fixe indépendant du nombre de jours
- Limite du nombre de robes: `num_dresses`
- Les addons inclus ne sont pas facturés en supplément
- Les addons optionnels peuvent être ajoutés

**Validation**: 
```
si items.length > package.num_dresses → Erreur
```

**Fichier**: `/src/api/endpoints/contractPackages.ts` (lignes 14-27)

### 1.5 Validations sur les Contrats

#### 1.5.1 Validations à la Création
```typescript
// ContractBuilder.tsx lignes 345-352
const isComplete = !!(
  selectedTypeId &&           // Type requis
  items.length > 0 &&         // Au moins 1 robe
  startDate &&                // Date début requise
  endDate &&                  // Date fin requise
  days > 0 &&                 // Durée > 0 jours
  selectedCustomer            // Client sélectionné
);
```

#### 1.5.2 Validation Package vs Robes
```typescript
// ContractBuilder.tsx lignes 377-384
if (selectedPackage && items.length > (selectedPackage.num_dresses || 1)) {
  // ERREUR: Trop de robes pour le forfait
}
```

#### 1.5.3 Validation Dates
- Date de fin > Date de début
- Mode forfait: Maximum 24h de location
- Mode journalier: Durée flexible

**Fichier**: `/src/pages/ContractBuilder/components/ContractConfiguration.tsx` (lignes 147-150)

## 2. TARIFICATION (PRICING)

### 2.1 Les 4 Stratégies de Pricing

#### 2.1.1 PER_DAY (Prix par Jour)
**Description**: Calcul basé sur le prix journalier de la robe

**Configuration**:
```typescript
calculation_config: {
  base_price_source: "dress",  // Utilise le prix/jour de la robe
  apply_tax: true,              // Appliquer les taxes (20%)
  tax_rate: 20,                 // TVA standard française
  rounding: "up"                // Arrondir vers le haut
}
```

**Calcul**:
```
prixTotal = (prixParJour * nombreJours) * (1 + taxRate)
```

**Fichier**: `/src/pages/Settings/PricingRules.tsx` (lignes 155-161)

#### 2.1.2 TIERED (Prix Dégressif par Paliers)
**Description**: Réductions progressives selon la durée de location

**Configuration**:
```typescript
calculation_config: {
  tiers: [
    { min_days: 1, max_days: 3, discount_percentage: 0 },
    { min_days: 4, max_days: 7, discount_percentage: 10 },
    { min_days: 8, max_days: 14, discount_percentage: 15 },
    { min_days: 15, max_days: null, discount_percentage: 20 }
  ],
  apply_tax: true,
  tax_rate: 20
}
```

**Calcul**:
```
1. Déterminer le palier selon le nombre de jours
2. Appliquer la remise: prix * (1 - discount_percentage/100)
3. Appliquer la TVA: prix * 1.20
```

**Fichier**: `/src/pages/Settings/PricingRules.tsx` (lignes 162-170)

#### 2.1.3 FLAT_RATE (Forfait Fixe)
**Description**: Montant forfaitaire appliqué par période

**Configuration**:
```typescript
calculation_config: {
  applies_to_period: "weekend" | "week" | "month" | "day",
  fixed_multiplier: 2.5  // Multiplicateur du prix de base
}
```

**Cas d'usage**: Forfaits weekend, forfaits mensuels

**Fichier**: `/src/pages/Settings/PricingRules.tsx` (lignes 171-175)

#### 2.1.4 FIXED_PRICE (Prix Fixe)
**Description**: Montant fixe indépendant des conditions

**Configuration**:
```typescript
calculation_config: {
  fixed_amount_ht: 25.00,    // Prix fixe HT
  fixed_amount_ttc: 30.00    // Prix fixe TTC
}
```

**Cas d'usage**: Services ou addons à prix fixe

**Fichier**: `/src/pages/Settings/PricingRules.tsx` (lignes 176-180)

### 2.2 Calcul de la Caution (Deposit)

**Montant**: Fixe à 500€ TTC (414,33€ HT)

**Formule**:
```typescript
const cautionTTC = 500;
const cautionHT = cautionTTC / 1.20;  // = 416.67
```

**Règles**:
- Fixe pour tous les contrats
- Remboursable après restitution de la marchandise
- Pas de TVA supplémentaire

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 335-337)

### 2.3 Calcul de l'Acompte (Account)

**Montant**: 50% du total du contrat (robes + addons)

**Formule**:
```typescript
const totalTTC = baseTTC + addonsTotalTTC;
const depositTTC = totalTTC * 0.5;  // 50%
const depositHT = depositTTC / 1.20;
```

**Règles**:
- Calculé AVANT le paiement
- Peut être payé partiellement
- Le client saisit le montant payé manuellement

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 328-333)

### 2.4 Gestion des Taxes (TVA)

**Taux TVA**: 20% (France)

**Constantes**:
```typescript
export const VAT_RATE = 0.20;
export const VAT_RATIO = 1 / (1 + VAT_RATE);  // = 0.833333...
```

**Fonctions de Conversion**:
```typescript
// HT → TTC
calculateTTC = (ht) => ht * (1 + VAT_RATE) = ht * 1.20

// TTC → HT
calculateHT = (ttc) => ttc * VAT_RATIO = ttc * 0.833333...

// Montant TVA
calculateVAT = (ht) => ht * VAT_RATE = ht * 0.20
```

**Fichier**: `/src/utils/pricing.ts` (lignes 1-59)

### 2.5 Remises et Promotions

#### 2.5.1 Réductions par Paliers (Tiered Pricing)
Implémentées via la stratégie "tiered" avec réductions progressives

#### 2.5.2 Réductions Manuelles
```typescript
applyDiscount = (price, discountPercent) => 
  price * (1 - discountPercent / 100)
```

**Fichier**: `/src/utils/pricing.ts` (lignes 102-115)

## 3. SERVICE TYPES (TYPES DE SERVICES)

### 3.1 Structure des ServiceTypes

```typescript
interface ServiceType {
  id: string;
  name: string;
  code: string;  // Code unique (ex: "DAILY_RENTAL", "WEEKEND")
  organization_id: string | null;  // Multi-tenant
  description: string | null;
  is_active: boolean;
  config: {
    min_duration_days?: number;         // Durée minimale
    max_duration_days?: number;         // Durée maximale
    requires_deposit?: boolean;         // Caution obligatoire
    default_deposit_percentage?: number; // % de caution
    duration_minutes?: number;          // Durée en minutes
    return_policy_days?: number;        // Jours pour retour
    weekend_only?: boolean;             // Weekend uniquement
    [key: string]: any;  // Config extensible
  } | null;
  pricing_rules?: PricingRule[];  // Règles associées
}
```

### 3.2 ServiceTypes Existants (Prévus)

1. **DAILY_RENTAL** (Location par jour)
   - Code: Identifié par `DAILY_CONTRACT_TYPE_ID`
   - Utilise PricingRule "per_day"
   - Durée flexible

2. **WEEKEND** (Location weekend)
   - FlatRate forfaitaire
   - `weekend_only: true`

3. **MONTHLY** (Location mensuelle)
   - FlatRate par mois
   - `min_duration_days: 30`

4. **PACKAGE** (Forfait)
   - Prix fixe
   - Nombre de robes limité

### 3.3 Influence sur la Tarification

- Les ServiceTypes définissent les **limites de durée**
- Les **PricingRules** associées calculent le prix
- Configuration de **caution optionnelle** par type

**Fichier**: `/src/api/endpoints/serviceTypes.ts` (lignes 4-24)

## 4. PACKAGES (FORFAITS)

### 4.1 Structure des Packages

```typescript
interface ContractPackage {
  id: string;
  name: string;
  num_dresses: number;              // Limitation: 1-5 robes généralement
  price_ht: string | number;        // Prix fixe HT
  price_ttc: string | number;       // Prix fixe TTC
  created_at?: string;
  created_by?: string | null;
  updated_at?: string | null;
  addons?: ContractPackageAddonLink[];  // Addons inclus
}
```

### 4.2 Limitations des Packages

#### 4.2.1 Limitation du Nombre de Robes
```typescript
// Validation ContractBuilder.tsx lignes 377-384
if (items.length > selectedPackage.num_dresses) {
  // ERREUR: Trop de robes
}
```

**Exemple**:
- Package "Soirée": 2 robes max → Erreur si 3 robes sélectionnées
- Package "Mariage": 4 robes max

#### 4.2.2 Limitation de Durée (Mode Forfait)
```typescript
// ContractConfiguration.tsx lignes 147-150
if (!isDailyContract && start && end) {
  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  if (diffHours > 24) {
    // LIMITER À 24H
  }
}
```

**Règle**: Forfait limité à 24h de location

#### 4.2.3 Prix Fixe vs Calculé
- **Prix FIXE**: Le package a un prix TTC et HT définis
- **Non affecté par**: Nombre de jours, nombre de robes (tant que < num_dresses)

### 4.3 Addons Inclus dans le Package

```typescript
// ContractBuilder.tsx lignes 294-299
const packageAddonIds = selectedPackage?.addons?.map(link => link.addon_id) || [];
const packageIncludedAddons = addons.filter(a => packageAddonIds.includes(a.id));
const optionalAddons = selectedPackage
  ? addons.filter(a => !packageAddonIds.includes(a.id))
  : addons;
```

**Calcul du Total Package**:
```
totalTTC = packagePrice_ttc + optionalAddons.sum()
```

**Fichier**: `/src/api/endpoints/contractPackages.ts`

## 5. ROBES (DRESSES)

### 5.1 Structure d'une Robe

```typescript
interface DressDetails {
  id: string;
  name: string;
  reference: string;
  
  // Prix fixes (pour vente)
  price_ht: string | number;        // Prix unitaire HT
  price_ttc: string | number;       // Prix unitaire TTC
  
  // Prix par jour (pour location)
  price_per_day_ht?: string | number | null;
  price_per_day_ttc?: string | number | null;
  
  // Métadonnées
  images: string[];
  type_id?: string | null;
  size_id?: string | null;
  condition_id?: string | null;
  color_id?: string | null;
  
  // Statuts
  created_at?: string;
  deleted_at?: string | null;
  published_at?: string | null;
}
```

### 5.2 États Possibles d'une Robe

#### 5.2.1 États de Disponibilité
- **Available**: Disponible pour location
- **Loué**: Dans un contrat actif
- **Maintenance**: En révision/nettoyage
- **Supprimé**: `deleted_at` est set

**Système de Disponibilité**:
```typescript
// ContractBuilder.tsx lignes 142-157
const response = await DressesAPI.listAvailability(
  startDate.toISOString(),
  endDate.toISOString()
);

// Retourne: { id, isAvailable, current_contract: {...} }
```

#### 5.2.2 États de Publication
- **Publiée**: `published_at` is set
- **Non publiée**: `published_at` is null

### 5.3 Système de Tarification des Robes

#### 5.3.1 Prix Unitaires (Vente)
- `price_ht`: Prix hors taxes
- `price_ttc`: Prix toutes taxes comprises (= price_ht * 1.20)

#### 5.3.2 Prix Journaliers (Location)
- `price_per_day_ht`: Prix/jour HT
- `price_per_day_ttc`: Prix/jour TTC

**Utilisation**:
```typescript
// En mode journalier:
totalTTC = sum(dress.price_per_day_ttc * jours) pour chaque robe

// En mode forfait: ignoré
totalTTC = package.price_ttc
```

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 310-318)

### 5.4 Disponibilité en Temps Réel

**API Endpoint**: `GET /dresses/availability?start=ISO&end=ISO`

**Réponse**:
```typescript
interface DressAvailability {
  id: string;
  isAvailable: boolean;
  current_contract?: {
    start_datetime: string;
    end_datetime: string;
  } | null;
}
```

**Utilisation**:
```typescript
// Affichage des robes indisponibles dans le panier
availabilityInfo: Map<dressId, isAvailable>
```

**Fichier**: `/src/api/endpoints/dresses.ts` (lignes 65-88, 341-365)

## 6. VALIDATION ET RÈGLES MÉTIER

### 6.1 Validations sur les Dates

#### 6.1.1 Validation Dates de Base
```typescript
// Calculer la durée
const calculateDays = (start: Date | null, end: Date | null): number => {
  if (!start || !end) return 0;
  const diff = end.getTime() - start.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Nécessaire: days > 0
```

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 32-36)

#### 6.1.2 Validation Mode Forfait
```typescript
// Forfait limité à 24h maximum
if (!isDailyContract && diffHours > 24) {
  // ERREUR ou limitation à 24h
}
```

**Fichier**: `/src/pages/ContractBuilder/components/ContractConfiguration.tsx` (lignes 147-150)

### 6.2 Modification de Contrat Actif

**Règles par Statut**:

| Statut | canEdit | canSoftDelete | Notes |
|--------|---------|---------------|-------|
| DRAFT | OUI | OUI | Complètement modifiable |
| PENDING | Admin/Manager | Admin/Manager | Peu modifiable |
| PENDING_SIGNATURE | OUI | Admin/Manager | Modifiable jusqu'au paiement |
| SIGNED | Admin seulement | Admin/Manager | Minimalement modifiable |
| SIGNED_ELECTRONICALLY | Admin seulement | Admin/Manager | Lecture seule |

**Fichier**: `/src/utils/contractPermissions.ts` (lignes 78-118)

### 6.3 Règles de Remboursement et Annulation

**Implicites (Non implémentées actuellement)**:
- Caution remboursable après restitution
- Acompte utilisé ou remboursé selon conditions
- Pas de logique d'annulation explicite implémentée

### 6.4 Gestion des Conflits de Disponibilité

**Détection**:
```typescript
// Vérifier avant création/modification
const checkAvailability = async () => {
  const response = await DressesAPI.listAvailability(
    startDate.toISOString(),
    endDate.toISOString()
  );
  
  // Si une robe n'est pas disponible pendant la période
  if (!response.data.find(d => d.id === dressId).isAvailable) {
    // CONFLIT: Robe louée à cette période
  }
};
```

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 135-161)

## 7. WORKFLOW DE CONTRAT

### 7.1 Étapes de Création à Completion

```
┌─────────────────────────────────────────────────────┐
│ 1. SÉLECTION DES ROBES (Panier)                    │
│    - Parcourir le catalogue                         │
│    - Ajouter des robes au panier                    │
│    - Vérifier la disponibilité                      │
└──────────────────┬──────────────────────────────────┘
                   │ items > 0
┌──────────────────▼──────────────────────────────────┐
│ 2. CONFIGURATION DU CONTRAT                         │
│    - Choisir type de contrat (jour/forfait)        │
│    - Sélectionner forfait (optionnel)              │
│    - Saisir dates de location                      │
│    - Sélectionner addons                           │
│    - Choisir méthode de paiement                   │
└──────────────────┬──────────────────────────────────┘
                   │ Type + Dates OK
┌──────────────────▼──────────────────────────────────┐
│ 3. SÉLECTION DU CLIENT                             │
│    - Rechercher client existant                    │
│    OU créer nouveau client                         │
│    - Saisir coordonnées (rapide)                   │
└──────────────────┬──────────────────────────────────┘
                   │ Client sélectionné
┌──────────────────▼──────────────────────────────────┐
│ 4. VALIDATION ET CRÉATION                          │
│    - Vérifier toutes les données                   │
│    - Créer le contrat (status: DRAFT)              │
│    - Générer numéro contrat                        │
│    - Enregistrer tous les montants                 │
└──────────────────┬──────────────────────────────────┘
                   │ Contrat créé
┌──────────────────▼──────────────────────────────────┐
│ 5. PAIEMENT ET SIGNATURE (Post-création)           │
│    - Utilisateur saisit montants payés             │
│    - Signer électroniquement (optionnel)           │
│    - Générer PDF du contrat                        │
│    - Envoyer lien de signature                     │
└──────────────────┬──────────────────────────────────┘
                   │ Signature reçue
┌──────────────────▼──────────────────────────────────┐
│ 6. CONTRAT SIGNÉ                                   │
│    - Status: SIGNED ou SIGNED_ELECTRONICALLY      │
│    - Archivé et consultable                        │
│    - Robes marquées comme louées                   │
└─────────────────────────────────────────────────────┘
```

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 354-360)

### 7.2 Enregistrement des Paiements

**Timing du Paiement**:
- L'utilisateur saisit les montants payés AVANT création du contrat
- Les montants payés sont stockés dans: `account_paid_*` et `caution_paid_*`

**Payload de Création**:
```typescript
const payload: ContractCreatePayload = {
  // ... autres champs ...
  account_ht: toNumber(depositHT),           // Montant DÛ HT
  account_ttc: toNumber(depositTTC),         // Montant DÛ TTC
  account_paid_ht: toNumber(depositPaidHTValue),   // Montant PAYÉ HT
  account_paid_ttc: toNumber(depositPaidTTCValue), // Montant PAYÉ TTC
  caution_ht: toNumber(cautionHT),           // Caution due HT
  caution_ttc: toNumber(cautionTTC),         // Caution due TTC
  caution_paid_ht: toNumber(cautionPaidHTValue),   // Caution payée HT
  caution_paid_ttc: toNumber(cautionPaidTTCValue), // Caution payée TTC
};
```

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 402-423)

### 7.3 Gestion des Retards de Retour

**Implicite (Non implémentée actuellement)**:
- Pas de logique de calcul des retards
- Pas de frais supplémentaires automatiques
- Gestion manuelle requise

## 8. PERMISSIONS ET CONTRÔLE D'ACCÈS

### 8.1 Rôles Utilisateurs

```typescript
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'COLLABORATOR';
```

### 8.2 Permissions par Statut et Rôle

#### État DRAFT:
- **SUPER_ADMIN/ADMIN/MANAGER/COLLABORATOR**: 
  - ✓ Générer PDF
  - ✓ Modifier
  - ✓ Envoyer signature
  - ✓ Désactiver

#### État PENDING:
- **ADMIN/MANAGER**: 
  - ✓ Importer PDF signé
  - ✓ Modifier
  - ✓ Désactiver

#### État PENDING_SIGNATURE:
- **Tous**: 
  - ✓ Voir le contrat
- **ADMIN/MANAGER**: 
  - ✓ Modifier
  - ✓ Désactiver

#### État SIGNED:
- **ADMIN**: 
  - ✓ Modifier
  - ✓ Importer nouveau PDF
- **ADMIN/MANAGER**: 
  - ✓ Désactiver

#### Contrat Supprimé (deleted_at):
- **ADMIN/MANAGER**: 
  - ✓ Réactiver

**Fichier**: `/src/utils/contractPermissions.ts` (lignes 44-121)

## 9. ARCHITECTURE FRONTEND

### 9.1 Flux de Données

```
CartContext (Robes sélectionnées)
    ↓
ContractBuilder (Orchestration)
    ├→ ContractConfiguration (Config contrat)
    ├→ CustomerSection (Sélection client)
    ├→ PricingSection (Affichage prix)
    ├→ ContractPreview (Récapitulatif)
    └→ CustomerDetailsDrawer (Post-création)
```

### 9.2 États Gérés

```typescript
// Dates et durée
startDate: Date | null
endDate: Date | null
days: number = calculateDays(startDate, endDate)

// Configuration
selectedTypeId: string
selectedPackageId: string | null
selectedAddonIds: string[]

// Paiement
depositPaidTTC: string
cautionPaidTTC: string
paymentMethod: "card" | "cash"

// Client
selectedCustomer: Customer | null

// Disponibilité
availabilityInfo: Map<dressId, boolean>
```

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 57-97)

## 10. CONSTANTES CRITIQUES

```typescript
// Catalogue constants
DAILY_CONTRACT_TYPE_ID = "89f29652-c045-43ec-b4b2-ca32e913163d"
PAGE_SIZE = 12
MAX_IMAGES = 5

// Pricing constants  
VAT_RATE = 0.20
VAT_RATIO = 0.833333...

// Default values
DEFAULT_CAUTION_TTC = 500.00
DEPOSIT_PERCENTAGE = 0.50  // 50%
```

**Fichier**: `/src/constants/catalogue.ts`

---

## RÉSUMÉ DES FICHIERS CLÉS

| Fichier | Responsabilité |
|---------|-----------------|
| `/src/pages/ContractBuilder/ContractBuilder.tsx` | Logique principale de création de contrat |
| `/src/utils/pricing.ts` | Calculs HT/TTC et TVA |
| `/src/utils/contractPermissions.ts` | Gestion des permissions et rôles |
| `/src/api/endpoints/contracts.ts` | API des contrats |
| `/src/api/endpoints/pricingRules.ts` | API des règles de tarification |
| `/src/api/endpoints/dresses.ts` | API des robes et disponibilité |
| `/src/api/endpoints/contractPackages.ts` | API des forfaits |
| `/src/api/endpoints/contractAddons.ts` | API des addons |
| `/src/api/endpoints/serviceTypes.ts` | API des types de service |
| `/src/pages/Settings/PricingRules.tsx` | UI gestion des règles de tarification |
| `/src/constants/catalogue.ts` | Constantes application |

