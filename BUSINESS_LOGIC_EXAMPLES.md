# EXEMPLES CONCRETS DE LA LOGIQUE MÉTIER

## EXEMPLE 1: Location Journalière Simple

### Scénario
- Client: Marie Dupont
- 2 robes à 50€/jour (prix TTC)
- Période: 3 jours (23 au 26 septembre)
- Pas de forfait, pas d'addon

### Calcul des Prix

```
Données de base:
- dress1.price_per_day_ttc = 50€
- dress2.price_per_day_ttc = 50€
- jours = 3

Calcul:
baseTTC = (50 * 3) + (50 * 3) = 150 + 150 = 300€

baseHT = baseTTC / 1.20 = 300 / 1.20 = 250€

addonsTotalTTC = 0€ (aucun addon)
addonsTotalHT = 0€

totalTTC = 300€
totalHT = 250€
```

### Montants Contrat

```
Acompte (50%):
  depositTTC = 300€ * 0.5 = 150€
  depositHT = 150€ / 1.20 = 125€
  
  L'utilisateur saisit: depositPaidTTC = 150€
  
Caution:
  cautionTTC = 500€ (montant fixe)
  cautionHT = 500€ / 1.20 = 416.67€
  
  L'utilisateur saisit: cautionPaidTTC = 500€

Payload Création:
{
  account_ht: 125,           // Acompte dû
  account_ttc: 150,          // Acompte dû
  account_paid_ht: 125,      // Acompte payé
  account_paid_ttc: 150,     // Acompte payé
  caution_ht: 416.67,        // Caution due
  caution_ttc: 500,          // Caution due
  caution_paid_ht: 416.67,   // Caution payée
  caution_paid_ttc: 500,     // Caution payée
  total_price_ht: 250,       // Total contrat
  total_price_ttc: 300       // Total contrat
}
```

**Fichiers impliqués**:
- `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 310-337)
- `/src/pages/ContractBuilder/components/PricingSection.tsx`

---

## EXEMPLE 2: Location avec Forfait + Addons

### Scénario
- Client: Jean Martin
- Forfait "Mariage": 3 robes max, 200€ TTC
  - Addon inclus: "Retouche" (10€ TTC)
  - Addons optionnels: "Livraison" (25€ TTC), "Assurance" (15€ TTC)
- Période: 24h (vendredi au samedi)
- Sélection addons: Livraison + Assurance

### Calcul des Prix

```
Données de base:
- selectedPackage.price_ttc = 200€
- selectedPackage.num_dresses = 3 (validation OK: 3 robes sélectionnées)
- isDailyContract = false
- jours = 1 jour (24h)

Calcul:
baseTTC = 200€ (prix forfait)
baseHT = 200€ / 1.20 = 166.67€

Addons sélectionnés (HORS forfait):
- Livraison: 25€ TTC
- Assurance: 15€ TTC
addonsTotalTTC = 25 + 15 = 40€
addonsTotalHT = 40€ / 1.20 = 33.33€

totalTTC = 200 + 40 = 240€
totalHT = 166.67 + 33.33 = 200€
```

### Montants Contrat

```
Acompte (50%):
  depositTTC = 240€ * 0.5 = 120€
  depositHT = 120€ / 1.20 = 100€
  
  L'utilisateur saisit: depositPaidTTC = 50€ (paiement partiel)
  
Caution:
  cautionTTC = 500€ (fixe)
  cautionHT = 416.67€
  
  L'utilisateur saisit: cautionPaidTTC = 0€ (pas encore payée)

Statut du Compte Créé:
- Acompte dû: 120€ (TTC)
- Acompte payé: 50€ (TTC)
- Reste dû: 70€ (TTC)

- Caution due: 500€ (TTC)
- Caution payée: 0€
- Reste caution: 500€ (TTC)

Payload Création:
{
  account_ht: 100,           // Acompte dû HT
  account_ttc: 120,          // Acompte dû TTC
  account_paid_ht: 41.67,    // Acompte payé HT
  account_paid_ttc: 50,      // Acompte payé TTC (paiement partiel)
  caution_ht: 416.67,        // Caution due
  caution_ttc: 500,          // Caution due
  caution_paid_ht: 0,        // Caution payée HT (pas encore)
  caution_paid_ttc: 0,       // Caution payée TTC (pas encore)
  total_price_ht: 200,       // Total contrat
  total_price_ttc: 240,      // Total contrat
  package_id: "pkg-123",     // Forfait sélectionné
  addons: [
    { addon_id: "addon-livraison" },
    { addon_id: "addon-assurance" }
  ]
}
```

**Caractéristiques**:
- Mode forfait: durée limitée à 24h
- Nombre de robes validé: 3 = 3 (OK)
- Paiement partiel de l'acompte enregistré
- Caution non payée (montant due mais pas payé)

**Fichiers impliqués**:
- `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 302-337)
- `/src/api/endpoints/contractPackages.ts`

---

## EXEMPLE 3: Paiement Partiel et Suivi

### Scénario Initial
Contrat créé avec:
- Total TTC: 300€
- Acompte dû: 150€
- Acompte payé: 50€ (PARTIEL)
- Caution due: 500€
- Caution payée: 0€

### Mise à Jour - Paiement Caution

L'utilisateur fait un paiement de la caution (250€).

```
Update Payload (ContractsAPI.update):
{
  caution_paid_ttc: 250  // Au lieu de 0
}

Nouveau Statut:
- Caution due: 500€
- Caution payée: 250€
- Reste caution: 250€
```

**API Utilisée**: 
```typescript
// ContractsAPI.update(contractId, payload)
await ContractsAPI.update("contract-123", {
  caution_paid_ttc: 250,
  caution_paid_ht: 250 / 1.20  // = 208.33
});
```

**Fichier**: `/src/api/endpoints/contracts.ts` (lignes 249-253)

---

## EXEMPLE 4: Validation Package vs Robes

### Scénario VALIDE
- Forfait sélectionné: "Soirée" (num_dresses: 2)
- Robes sélectionnées: 2 robes
- Validation: 2 <= 2 → OK

```typescript
// ContractBuilder.tsx ligne 377
if (selectedPackage && items.length > selectedPackage.num_dresses) {
  // ERREUR
} else {
  // OK - Créer contrat
}
```

### Scénario ERREUR
- Forfait sélectionné: "Soirée" (num_dresses: 2)
- Robes sélectionnées: 3 robes (utilisateur en a ajouté une 3ème)
- Validation: 3 > 2 → ERREUR

```
Message d'erreur affiché:
"Le forfait "Soirée" permet maximum 2 robe(s), 
 mais 3 sont sélectionnées."

Contrat NON créé.
```

**Code**:
```typescript
if (selectedPackage && items.length > (selectedPackage.num_dresses || 1)) {
  notify(
    "error",
    "Contrat",
    `Le forfait "${selectedPackage.name}" permet maximum ${selectedPackage.num_dresses} robe(s), mais ${items.length} sont sélectionnées.`
  );
  return;  // Arrêt création
}
```

**Fichier**: `/src/pages/ContractBuilder/ContractBuilder.tsx` (lignes 377-384)

---

## EXEMPLE 5: Tarification Échelonnée (Tiered)

### Scénario: Location 7 jours avec réduction par palier

```
Configuration Pricing Rule (Tiered):
Tiers:
1. 1-3 jours: 0% de réduction
2. 4-7 jours: 10% de réduction
3. 8-14 jours: 15% de réduction
4. 15+ jours: 20% de réduction

Cas: 7 jours de location
```

### Calcul du Prix

```
Prix de base (sans réduction):
- Robe: 40€/jour TTC
- 7 jours * 40€ = 280€ TTC

Palier applicable: 4-7 jours → 10% de réduction

Après réduction:
280€ * (1 - 10%) = 280€ * 0.90 = 252€ TTC

Économie: 280€ - 252€ = 28€

Calcul HT:
252€ TTC / 1.20 = 210€ HT
```

### Montants Contrat avec Réduction

```
totalTTC = 252€ (après réduction)
totalHT = 210€

Acompte (50%):
  depositTTC = 252€ * 0.5 = 126€
  depositHT = 126€ / 1.20 = 105€

Caution: 500€ (fixe, pas affectée par réduction)

Payload:
{
  total_price_ttc: 252,
  total_price_ht: 210,
  account_ttc: 126,
  account_ht: 105,
  caution_ttc: 500,
  caution_ht: 416.67
}
```

**Fichier**: `/src/pages/Settings/PricingRules.tsx` (lignes 162-170)

---

## EXEMPLE 6: Permissions et Modifications

### Contrat en Statut DRAFT

```typescript
// User: COLLABORATOR, Status: DRAFT

Permissions:
- canGeneratePdf: true
- canEdit: true
- canSendSignature: true
- canSoftDelete: true
- canReactivate: false

Actions possibles:
✓ Générer le PDF
✓ Modifier tous les champs
✓ Envoyer lien de signature électronique
✓ Désactiver le contrat
```

### Contrat en Statut SIGNED

```typescript
// User: COLLABORATOR, Status: SIGNED

Permissions:
- canGeneratePdf: false
- canEdit: false
- canSendSignature: false
- canSoftDelete: false
- canReactivate: false
- canUploadSigned: false
- canViewSigned: true

Actions possibles:
✓ Voir le contrat (lecture seule)

Actions INTERDITES:
✗ Modifier le contrat
✗ Générer nouveau PDF
✗ Supprimer ou désactiver
```

### Contrat Désactivé (deleted_at set)

```typescript
// User: COLLABORATOR, Status: DRAFT, Deleted: true

Permissions:
- canReactivate: false  // Seul ADMIN/MANAGER peuvent
- Toutes autres permissions: false

// User: ADMIN, Status: DRAFT, Deleted: true
Permissions:
- canReactivate: true  // Peut réactiver le contrat
```

**Fichier**: `/src/utils/contractPermissions.ts` (lignes 44-121)

---

## EXEMPLE 7: Vérification Disponibilité Temps Réel

### Scénario
Deux utilisateurs tentent de louer la même robe sur des périodes différentes.

```
Robe "Mariée Blanche" louée du 1er au 5 septembre
(contrat déjà créé et actif)

Utilisateur A: Veut louer du 1er au 5 septembre
Utilisateur B: Veut louer du 3 au 8 septembre
```

### Appel API

```typescript
// ContractBuilder.tsx lignes 142-157
const response = await DressesAPI.listAvailability(
  "2024-09-03T00:00:00Z",  // Utilisateur B start
  "2024-09-08T23:59:59Z"   // Utilisateur B end
);

// Réponse du serveur:
{
  data: [
    {
      id: "robe-123",  // Mariée Blanche
      name: "Mariée Blanche",
      isAvailable: false,  // CONFLICT: Louée du 1-5
      current_contract: {
        start_datetime: "2024-09-01T00:00:00Z",
        end_datetime: "2024-09-05T23:59:59Z"
      }
    },
    // ... autres robes ...
  ]
}

Résultat:
availabilityInfo.set("robe-123", false)

UI Affichage:
- La robe est affichée avec un badge "Indisponible"
- Tooltip montre les dates du conflit
```

### Évitement du Conflit

```typescript
// Utilisateur B modifie ses dates au 6-8 septembre
// Nouvelle requête:

response = await DressesAPI.listAvailability(
  "2024-09-06T00:00:00Z",
  "2024-09-08T23:59:59Z"
);

// Réponse:
{
  isAvailable: true,  // OK - Après libération
  current_contract: null
}

availabilityInfo.set("robe-123", true)
// Utilisateur B peut maintenant créer le contrat
```

**Fichier**: `/src/api/endpoints/dresses.ts` (lignes 341-365)

---

## EXEMPLE 8: Workflow Complet de Signature

### Étape 1: Contrat Créé (DRAFT)

```typescript
// Création du contrat
const created = await ContractsAPI.create(payload);
// Status = "DRAFT"
```

### Étape 2: Génération du Lien de Signature

```typescript
// Utilisateur clique "Envoyer signature"
const response = await ContractsAPI.generateSignature(contractId);

// Réponse:
{
  sign_link: {
    id: "sign-link-456",
    contract_id: "contract-123",
    token: "eyJhbGc...",  // JWT token
    expires_at: "2024-09-30T23:59:59Z"
  },
  emailSentTo: "client@example.com"
}

// Status change to: "PENDING_SIGNATURE"
```

### Étape 3: Client Reçoit Email avec Lien

```
Email reçu:
Sujet: Veuillez signer votre contrat de location

Lien: https://app.velvena.fr/sign/eyJhbGc...
```

### Étape 4: Client Accède au Lien

```typescript
// Client accède à: /sign/:token
const contract = await ContractsAPI.getSignatureByToken(token);

// Affichage du contrat + formulaire de signature
```

### Étape 5: Signature Électronique

```typescript
// Client signe et valide
const response = await ContractsAPI.signByToken(token);

// Réponse: Contract avec signed_at, signed_pdf_url, etc.
// Status change to: "SIGNED_ELECTRONICALLY"
```

**Fichiers**:
- `/src/api/endpoints/contracts.ts` (lignes 217-408)
- `/src/pages/Public/ContractSignPage.tsx`

---

## RÉSUMÉ FORMULES CRITIQUES

### Calculs TVA (20%)

```
HT → TTC: ttc = ht * 1.20
TTC → HT: ht = ttc * 0.8333...
TVA: vat = ht * 0.20
```

### Montants du Contrat

```
Acompte (50%):
  depositTTC = totalTTC * 0.5
  depositHT = depositTTC / 1.20

Caution (Fixe):
  cautionTTC = 500€
  cautionHT = 416.67€

Total Contrat:
  totalTTC = (robes + addons) * 1.20
  totalHT = totalTTC / 1.20
```

### Validations Critiques

```
1. Durée: days > 0
2. Forfait: items.length <= package.num_dresses
3. Dates: startDate < endDate
4. Disponibilité: isAvailable == true
5. Complet: type + robes + dates + customer
```

