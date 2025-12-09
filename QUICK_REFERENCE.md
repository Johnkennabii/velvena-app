# QUICK REFERENCE - LOGIQUE MÉTIER VELVENA APP

## CONTRATS: STATUTS

```
DRAFT → PENDING_SIGNATURE → SIGNED (ou SIGNED_ELECTRONICALLY)
  ↓
PENDING → SIGNED
```

## CONTRATS: 4 TYPES DE MONTANTS

| Montant | Type | Calcul | Notes |
|---------|------|--------|-------|
| total_price | Dû | Robes + Addons | Prix réel du contrat |
| account (acompte) | Dû | 50% du total | Paiement initial |
| account_paid | Payé | Saisi utilisateur | Peut être partiel |
| caution | Dû | 500€ fixe | Dépôt de garantie |
| caution_paid | Payé | Saisi utilisateur | Peut être partiel |

## TARIFICATION: 4 STRATÉGIES

```
1. PER_DAY: Prix journalier * jours
2. TIERED: Réductions par paliers de durée
3. FLAT_RATE: Montant forfaitaire par période
4. FIXED_PRICE: Montant fixe indépendant
```

## PACKAGES: LIMITATIONS

```
Nombre de robes: items.length <= package.num_dresses
Durée: Maximum 24h en mode forfait
Prix: Fixe, indépendant des jours
```

## ROBES: TARIFICATION

```
price_per_day_ttc: Utilisé en mode journalier
price_per_day_ht: Calculé automatiquementa
price_ttc: Prix unitaire (vente)
price_ht: Prix unitaire (vente)
```

## TVA: CALCULS

```
HT → TTC:  * 1.20
TTC → HT:  * 0.8333...
TVA:       HT * 0.20
```

## VALIDATIONS CRITIQUES

```
1. Durée > 0 jours
2. items.length <= package.num_dresses (si forfait)
3. startDate < endDate
4. isAvailable == true pour chaque robe
5. selectedCustomer != null
6. selectedTypeId != null
```

## PERMISSIONS PAR STATUT

| Action | DRAFT | PENDING | PENDING_SIG | SIGNED | DELETED |
|--------|-------|---------|------------|--------|---------|
| Edit | OUI | Admin | OUI | Admin | NON |
| Delete | OUI | Admin | Admin | Admin | NON |
| Reactivate | NON | NON | NON | NON | Admin |
| PDF | OUI | NON | NON | NON | NON |
| Sign | OUI | NON | NON | NON | NON |

## MONTANTS: FORMULES

```
totalTTC = (sum(dress.price_per_day_ttc * jours) + sum(addon.price_ttc))
totalHT = totalTTC / 1.20

depositTTC = totalTTC * 0.5
depositHT = depositTTC / 1.20

cautionTTC = 500
cautionHT = 416.67
```

## FICHIERS CRITIQUES

```
Contrats:           /src/api/endpoints/contracts.ts
Tarification:       /src/pages/Settings/PricingRules.tsx
Permissions:        /src/utils/contractPermissions.ts
Calculs TVA:        /src/utils/pricing.ts
Création contrat:   /src/pages/ContractBuilder/ContractBuilder.tsx
Robes:              /src/api/endpoints/dresses.ts
Forfaits:           /src/api/endpoints/contractPackages.ts
Addons:             /src/api/endpoints/contractAddons.ts
ServiceTypes:       /src/api/endpoints/serviceTypes.ts
```

## API ENDPOINTS CLÉS

```
POST   /contracts                    Créer contrat
PUT    /contracts/{id}               Modifier
GET    /contracts/{id}               Récupérer
POST   /contracts/{id}/generate-signature  Signer
GET    /dresses/availability?start&end     Disponibilité
POST   /sign-links/{token}/sign     Signer électroniquement
```

## CONSTANTES

```
DAILY_CONTRACT_TYPE_ID: 89f29652-c045-43ec-b4b2-ca32e913163d
VAT_RATE: 0.20 (20%)
DEFAULT_CAUTION: 500€ TTC
DEPOSIT_PERCENTAGE: 50%
PAYMENT_METHODS: card, cash, check, transfer, paypal, other
```

## WORKFLOW CONTRAT

```
1. Panier → Robes sélectionnées
2. Config → Type + Dates + Addons
3. Client → Sélection/création
4. Validation → Vérifier tous les champs
5. Création → status: DRAFT
6. Signature → Email lien au client
7. Signé → status: SIGNED_ELECTRONICALLY
```

## ERREURS COURANTES

```
"Trop de robes pour le forfait" 
  → items.length > package.num_dresses

"Robe indisponible"
  → isAvailable == false (conflict dates)

"Forfait limité à 24h"
  → Duration > 24h en mode forfait

"Contrat incomplet"
  → Manque type, robes, dates ou client
```

## PAIEMENTS: RÈGLES

```
AVANT création:
  - Utilisateur saisit montants payés
  - Stockés dans account_paid_* et caution_paid_*

APRÈS création:
  - Peut être mis à jour via ContractsAPI.update()
  - Montants payés peuvent être partiels
  - Montants dus sont calculés automatiquement
```

## ADDONS: INCLUS vs OPTIONNELS

```
Inclus:
  - Dans le forfait
  - Pas facturés supplémentairement
  - included: true

Optionnels:
  - Hors forfait
  - Facturés en supplément
  - included: false
  - Sélection manuelle
```

## MODE FORFAIT vs JOURNALIER

```
FORFAIT:
  - Prix fixe
  - Durée: 24h max
  - Robes: limité par num_dresses
  - Addons: inclus + optionnels

JOURNALIER:
  - Prix/jour
  - Durée: flexible
  - Robes: illimitées
  - Addons: tous optionnels
```

---

**Dernière mise à jour**: 2024-12-07
**Version**: 1.0 - Analyse complète

