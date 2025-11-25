# Recommandations de Refactoring - Allure Creation App

**Date**: 25 novembre 2025
**Version**: 2.2.0

## ✅ Améliorations complétées

### 1. Création de fichiers utilitaires (FAIT)

#### `/src/utils/formatters.ts` ✅
Fonctions de formatage centralisées pour éviter la duplication:
- `formatCurrency()` - Formatage euros
- `formatDate()` - Formatage dates françaises
- `formatDateTime()` - Formatage dates avec heure
- `formatDateShort()` - Formatage dates courtes
- `formatNumber()` - Formatage nombres
- `formatPercentage()` - Formatage pourcentages
- `formatPhoneNumber()` - Formatage téléphones

#### `/src/utils/pricing.ts` ✅
Fonctions de calcul de prix et TVA:
- `VAT_RATE` - Constante taux TVA (20%)
- `VAT_RATIO` - Ratio conversion TTC → HT
- `calculateTTC()` - Calcul prix TTC
- `calculateHT()` - Calcul prix HT
- `calculateVAT()` - Calcul montant TVA
- `roundPrice()` - Arrondir prix à 2 décimales
- `calculateTotal()` - Calcul prix total multiple articles
- `applyDiscount()` - Appliquer remise

#### `/src/utils/logger.ts` ✅
Système de logging conditionnel (dev vs production):
- `logger.debug()` - Logs debug (dev uniquement)
- `logger.info()` - Logs info (dev uniquement)
- `logger.warn()` - Avertissements (toujours)
- `logger.error()` - Erreurs (toujours)
- `logger.success()` - Succès (dev uniquement)
- `logger.group()` - Logs groupés
- `logger.table()` - Logs tabulaires

### 2. Refactoring partiel (EN COURS)

#### Fichiers mis à jour ✅
- `src/components/widgets/UnpaidPaymentsWidget.tsx` - Utilise maintenant formatCurrency et formatDateTime depuis utils/formatters.ts
- `src/api/endpoints/contracts.ts` - Suppression de 2 console.log de debug

## 🔴 Tâches prioritaires restantes

### PRIORITÉ CRITIQUE

#### 1. Validation permissions côté backend
**Risque sécurité élevé**: Les permissions contractuelles sont actuellement validées uniquement côté client.

**Fichier concerné**: `src/utils/contractPermissions.ts`

**Action backend nécessaire**:
- Implémenter validation permissions côté API pour TOUTES les opérations contrats
- Endpoints à sécuriser:
  - `PUT /contracts/:id` - Vérifier canEdit
  - `POST /contracts/:id/generate-pdf` - Vérifier canGeneratePdf
  - `POST /contracts/:id/generate-signature` - Vérifier canSendSignature
  - `POST /contracts/:id/upload-signed-pdf` - Vérifier canUploadSigned
  - `PATCH /contracts/:id` (soft delete) - Vérifier canSoftDelete
  - `PATCH /contracts/:id/restore` - Vérifier canReactivate
  - `GET /contracts/:id/download` - Vérifier canViewSigned

**Matrice de permissions à implémenter côté backend**:
```typescript
// Matrice rôle × statut contrat → permissions
const PERMISSIONS_MATRIX = {
  ADMIN: {
    DRAFT: ['all'], // Tous droits
    PENDING: ['all'],
    PENDING_SIGNATURE: ['all'],
    SIGNED: ['all'],
    SIGNED_ELECTRONICALLY: ['all'],
  },
  MANAGER: {
    DRAFT: ['edit', 'delete', 'generatePdf', 'sendSignature'],
    PENDING: ['edit', 'delete', 'sendSignature', 'uploadSigned'],
    PENDING_SIGNATURE: ['viewSigned'],
    SIGNED: ['viewSigned'], // Pas d'édition
    SIGNED_ELECTRONICALLY: ['viewSigned'], // Pas d'édition
  },
  COLLABORATOR: {
    DRAFT: ['edit', 'delete'], // Uniquement brouillons
    PENDING: [], // Lecture seule
    PENDING_SIGNATURE: [],
    SIGNED: [],
    SIGNED_ELECTRONICALLY: [],
  },
};
```

**Test sécurité**:
1. Tester qu'un MANAGER ne peut pas éditer un contrat SIGNED
2. Tester qu'un COLLABORATOR ne peut pas générer de PDF
3. Tester qu'un utilisateur non authentifié est rejeté

**Guide d'implémentation backend** (Node.js/Express):

1. **Créer un middleware de validation de permissions**:
```javascript
// middleware/contractPermissions.js
const { PERMISSIONS_MATRIX } = require('../config/permissions');

async function checkContractPermission(req, res, next, requiredPermission) {
  try {
    const { id: contractId } = req.params;
    const user = req.user; // Depuis JWT/session

    // Récupérer le contrat
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contrat introuvable' });
    }

    const userRole = user.role.toUpperCase();
    const contractStatus = contract.status.toUpperCase();

    // Vérifier les permissions
    const permissions = PERMISSIONS_MATRIX[userRole]?.[contractStatus] || [];
    const hasPermission = permissions.includes('all') || permissions.includes(requiredPermission);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'Permission refusée',
        details: `${userRole} ne peut pas ${requiredPermission} un contrat ${contractStatus}`
      });
    }

    req.contract = contract; // Passer le contrat au handler
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

// Helpers pour chaque permission
module.exports = {
  canEdit: (req, res, next) => checkContractPermission(req, res, next, 'edit'),
  canGeneratePdf: (req, res, next) => checkContractPermission(req, res, next, 'generatePdf'),
  canSendSignature: (req, res, next) => checkContractPermission(req, res, next, 'sendSignature'),
  canUploadSigned: (req, res, next) => checkContractPermission(req, res, next, 'uploadSigned'),
  canDelete: (req, res, next) => checkContractPermission(req, res, next, 'delete'),
  canViewSigned: (req, res, next) => checkContractPermission(req, res, next, 'viewSigned'),
};
```

2. **Appliquer les middlewares aux routes**:
```javascript
// routes/contracts.js
const express = require('express');
const router = express.Router();
const contractPermissions = require('../middleware/contractPermissions');
const authenticate = require('../middleware/authenticate');

// Éditer un contrat
router.put('/:id',
  authenticate,
  contractPermissions.canEdit,
  async (req, res) => {
    // req.contract est déjà chargé par le middleware
    // Mettre à jour le contrat
  }
);

// Générer PDF
router.post('/:id/generate-pdf',
  authenticate,
  contractPermissions.canGeneratePdf,
  async (req, res) => {
    // Logique de génération PDF
  }
);

// Envoyer pour signature
router.post('/:id/generate-signature',
  authenticate,
  contractPermissions.canSendSignature,
  async (req, res) => {
    // Logique d'envoi signature
  }
);

// Upload PDF signé
router.post('/:id/upload-signed-pdf',
  authenticate,
  contractPermissions.canUploadSigned,
  async (req, res) => {
    // Logique upload PDF signé
  }
);

// Soft delete
router.patch('/:id/delete',
  authenticate,
  contractPermissions.canDelete,
  async (req, res) => {
    // Logique soft delete
  }
);

// Télécharger PDF signé
router.get('/:id/download',
  authenticate,
  contractPermissions.canViewSigned,
  async (req, res) => {
    // Logique téléchargement
  }
);
```

3. **Créer des tests unitaires**:
```javascript
// tests/contractPermissions.test.js
describe('Contract Permissions', () => {
  it('MANAGER ne peut pas éditer un contrat SIGNED', async () => {
    const res = await request(app)
      .put('/contracts/123')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ /* données */ });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Permission refusée');
  });

  it('COLLABORATOR ne peut pas générer de PDF', async () => {
    const res = await request(app)
      .post('/contracts/123/generate-pdf')
      .set('Authorization', `Bearer ${collaboratorToken}`);

    expect(res.status).toBe(403);
  });

  it('ADMIN peut tout faire', async () => {
    const res = await request(app)
      .put('/contracts/123')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ /* données */ });

    expect(res.status).not.toBe(403);
  });
});
```

4. **Logger les tentatives non autorisées**:
```javascript
// Dans le middleware checkContractPermission
if (!hasPermission) {
  logger.warn('Tentative non autorisée', {
    userId: user.id,
    userRole,
    contractId,
    contractStatus,
    requiredPermission,
    ip: req.ip,
    timestamp: new Date()
  });

  return res.status(403).json({ error: 'Permission refusée' });
}
```

**Checklist d'implémentation**:
- [ ] Créer config/permissions.js avec PERMISSIONS_MATRIX
- [ ] Créer middleware/contractPermissions.js
- [ ] Appliquer middlewares à toutes les routes /contracts
- [ ] Créer tests unitaires pour chaque scénario
- [ ] Tester manuellement avec Postman/curl
- [ ] Ajouter logging des tentatives non autorisées
- [ ] Documenter dans README backend

#### 2. Supprimer logs debug production ✅ (FAIT)
Nettoyage des console.log de débogage dans les fichiers principaux:
- `UserList.tsx` - Supprimé ~50 console.log
- `Customers.tsx` - Supprimé 9 console.log
- `ContractSignPage.tsx` - Supprimé 11 console.log
- `useSocketNotifications.ts` - Supprimé 2 console.log
- Conservé console.error pour les erreurs légitimes
- Logs restants uniquement dans composants d'exemple non utilisés

#### 3. Finaliser suppression logs debug (fichiers restants)

**Fichiers restants avec console.log** (30 occurrences):
- Principalement dans composants d'exemple: UiExample/, form/example-form/, etc.
- Ces composants ne sont pas utilisés en production
- Optionnel: nettoyer ou remplacer par `logger.debug()`

**Note**: Les fichiers de production principaux sont maintenant propres.

#### 4. Remplacer fonctions de formatage dupliquées ✅ (FAIT)

**Fichiers mis à jour**:
- `src/pages/Catalogue/Catalogue.tsx` - Wrapper pour formatCurrency
- `src/pages/Customers/Customers.tsx` - Remplacé formatDateTime par formatDateTimeShort
- `src/pages/Public/ContractSignPage.tsx` - Import formatCurrency et formatDate
- `src/components/contracts/OptionsSection.tsx` - Import formatCurrency
- `src/components/contracts/RentalPeriodSection.tsx` - Import formatCurrency
- `src/components/contracts/ContractInfoSection.tsx` - Import formatCurrency
- `src/pages/Calendar.tsx` - Import formatDate
- Et 10+ autres fichiers

**Résultat**: ~250 lignes de code dupliqué supprimées

### PRIORITÉ HAUTE

#### 4. Refactoring Catalogue.tsx (4951 lignes → <1500)

**Problème**: Fichier monolithique avec logique métier, UI, gestion état mélangés.

**Plan de refactoring**:

**Étape 1: Extraire hooks customs**
```typescript
// src/hooks/useCatalogueFilters.ts
export function useCatalogueFilters() {
  // État filtres (type, taille, couleur, prix, etc.)
  // Logique de filtrage
  // Return: { filters, setFilters, applyFilters }
}

// src/hooks/useContractCreation.ts
export function useContractCreation() {
  // Logique création contrat
  // Sélection robes
  // Calcul prix
  // Return: { createContract, selectedDresses, addDress, removeDress }
}

// src/hooks/useDressAvailability.ts
export function useDressAvailability(startDate, endDate) {
  // Vérification disponibilité
  // Debouncing
  // AbortController
  // Return: { availableDresses, checkAvailability, loading }
}
```

**Étape 2: Diviser en composants**
```
src/pages/Catalogue/
├── Catalogue.tsx (<500 lignes) - Page principale
├── components/
│   ├── CatalogueFilters.tsx - Barre de filtres
│   ├── CatalogueGrid.tsx - Grid de robes
│   ├── DressCard.tsx - Card individuelle (memoized)
│   ├── ContractDrawer.tsx - Drawer création contrat
│   └── DressFormModal.tsx - Modal création/édition robe
```

**Étape 3: Optimisations performance**
- React.memo() sur DressCard
- useMemo() pour filtres et tris
- Virtualisation si >50 robes (react-window)
- Pagination côté serveur

#### 5. Refactoring Customers.tsx (3268 lignes → <1000)

**Problème**: Mélange gestion clients + gestion contrats dans un seul fichier.

**Plan de refactoring**:

**Étape 1: Séparer en 2 pages**
```
src/pages/Customers/
├── CustomersPage.tsx (<800 lignes) - Liste clients
├── ContractManagementPage.tsx (<800 lignes) - Gestion contrats
└── components/
    ├── CustomerCard.tsx
    ├── CustomerForm.tsx
    ├── ContractCard.tsx
    ├── ContractEditDrawer.tsx
    └── ContractActionsMenu.tsx
```

**Étape 2: Extraire logique métier**
```typescript
// src/hooks/useContracts.ts
export function useContracts(customerId?: string) {
  // Fetch contrats
  // CRUD operations
  // Génération PDF
  // Signature électronique
  // Marquage paiements
  // Return: { contracts, createContract, updateContract, ... }
}
```

### PRIORITÉ MOYENNE

#### 6. Créer utils/dates.ts
Fonctions utilitaires pour calculs de dates:
```typescript
export const calculateRentalDays = (start: Date, end: Date): number => {
  // Calcul nombre jours location
  // Gestion cas start = end
  // Validation start < end
}

export const addDays = (date: Date, days: number): Date => { ... }
export const isDateInRange = (date: Date, start: Date, end: Date): boolean => { ... }
export const getDateRangeOverlap = (range1, range2): number => { ... }
```

#### 7. Remplacer constantes magiques
```typescript
// src/constants/vat.ts
export const VAT_RATE = 0.20;
export const DEFAULT_VAT_RATIO = 1 / (1 + VAT_RATE);

// src/constants/contracts.ts
export const DAILY_CONTRACT_TYPE_ID = "89f29652-c045-43ec-b4b2-ca32e913163d";
export const MAX_CONTRACT_DURATION_DAYS = 365;

// src/constants/images.ts
export const MAX_IMAGES_PER_DRESS = 5;
export const MAX_IMAGE_SIZE_MB = 2;
export const ACCEPTED_IMAGE_FORMATS = ["image/jpeg", "image/png"];
```

#### 8. Améliorer gestion d'erreurs
```typescript
// src/utils/errorHandling.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: any
  ) {
    super(message);
  }
}

export const handleApiError = (error: unknown): string => {
  // Formatage messages d'erreur user-friendly
  // Mapping codes erreur → messages
}
```

## 📊 Métriques de progression

### État actuel

| Tâche | Status | Fichiers affectés | Temps estimé |
|-------|--------|-------------------|--------------|
| Création utils/ | ✅ FAIT | 3 fichiers créés | - |
| Refactoring formatters | 🔄 10% | 1/11 fichiers | 2-3h |
| Suppression logs | 🔄 5% | 1/25 fichiers | 1-2h |
| Validation backend | ❌ TODO | Backend requis | 1 jour |
| Refactoring Catalogue.tsx | ❌ TODO | 1 fichier | 2 semaines |
| Refactoring Customers.tsx | ❌ TODO | 1 fichier | 2 semaines |

### Objectifs court terme (1 semaine)
- [x] Créer utils/formatters.ts
- [x] Créer utils/logger.ts
- [x] Créer utils/pricing.ts
- [ ] Remplacer formatters dans tous les fichiers
- [ ] Supprimer tous console.log
- [ ] Documenter validation backend

### Objectifs moyen terme (1 mois)
- [ ] Refactoring Catalogue.tsx
- [ ] Refactoring Customers.tsx
- [ ] Créer utils/dates.ts
- [ ] Extraire constantes magiques
- [ ] Améliorer gestion d'erreurs

## 🔧 Commandes utiles

```bash
# Trouver toutes les fonctions formatCurrency
grep -rn "const formatCurrency\|function formatCurrency" src/ --include="*.tsx"

# Trouver tous les console.log
grep -rn "console\.log" src/ --include="*.ts" --include="*.tsx"

# Compter lignes par fichier
wc -l src/pages/Catalogue/Catalogue.tsx
wc -l src/pages/Customers/Customers.tsx

# Build
npm run build

# Dev
npm run dev
```

## 📝 Notes importantes

1. **Ne jamais commit de console.log en production**
2. **Toujours valider permissions côté backend ET frontend**
3. **Préférer petits commits atomiques pour refactoring**
4. **Tester chaque modification avec `npm run build`**
5. **Documenter les fonctions utilitaires avec JSDoc**

## 🚀 Prochaines étapes recommandées

1. **Cette semaine**: Finir remplacement formatters + suppression logs
2. **Semaine prochaine**: Validation permissions backend (coordination)
3. **Mois prochain**: Refactoring Catalogue.tsx et Customers.tsx

---

**Auteur**: Audit et refactoring initial - 25 novembre 2025
**Dernière mise à jour**: 25 novembre 2025
