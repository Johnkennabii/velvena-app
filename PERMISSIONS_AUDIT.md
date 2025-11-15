# Audit des Permissions - Gestion des Contrats

## Problèmes identifiés

### 1. Logique éparpillée et complexe
Actuellement, les permissions sont gérées par de multiples variables booléennes:
- `canManage` (ADMIN || MANAGER || COLLABORATOR)
- `canManageContracts` (ADMIN || MANAGER)
- `canGeneratePDF` (ADMIN || MANAGER || COLLABORATOR)
- `canUseSignature` (ADMIN || MANAGER || COLLABORATOR)
- `canSoftDelete` (ADMIN || MANAGER || COLLABORATOR)
- `canReactivate` (ADMIN || MANAGER)
- `isCollaborator` (dérivé de canManage && !canManageContracts)
- `cannotModifyAsCollaborator` (isCollaborator && !isDraft)
- `cannotModifyAsNonAdmin` (!isAdmin && isSigned)

### 2. Conditions de désactivation complexes sur chaque bouton

#### Bouton "Générer le PDF"
```typescript
disabled={!canGeneratePDF || pdfGeneratingId === contract.id || isDisabled || hasSignatureSent || cannotModifyAsCollaborator}
```

#### Bouton "Modifier contrat"
```typescript
disabled={!canManage || isDisabled || cannotModifyAsNonAdmin || cannotModifyAsCollaborator || isPendingManualUpload}
```

#### Bouton "Désactiver/Activer contrat"
```typescript
disabled={(!canSoftDelete || softDeletingId === contract.id) || (isDisabled && !canReactivate) || isCollaborator || cannotModifyAsNonAdmin}
```

#### Bouton "Signature électronique"
```typescript
disabled={!canUseSignature || signatureLoadingId === contract.id || isDisabled || cannotModifyAsNonAdmin || hasSignatureSent || isSigned || isPendingManualUpload}
```

### 3. Logs de debug en production
Des console.log sont présents dans le code de production (lignes 315-324, 520-530)

---

## Matrice des permissions souhaitées

### Par Rôle et Statut de Contrat

| Action | ADMIN | MANAGER | COLLABORATOR |
|--------|-------|---------|--------------|
| **Créer un contrat** | ✅ | ✅ | ❌ |
| **Voir un contrat** | ✅ | ✅ | ✅ |

### Statut: DRAFT (Brouillon)

| Action | ADMIN | MANAGER | COLLABORATOR |
|--------|-------|---------|--------------|
| Générer PDF | ✅ | ✅ | ✅ |
| Modifier | ✅ | ✅ | ✅ |
| Désactiver | ✅ | ✅ | ❌ |
| Signature électronique | ✅ | ✅ | ✅ |

### Statut: PENDING (En attente de PDF manuel)

| Action | ADMIN | MANAGER | COLLABORATOR |
|--------|-------|---------|--------------|
| Générer PDF | N/A | N/A | N/A |
| Modifier | ✅ | ✅ | ❌ |
| Désactiver | ✅ | ✅ | ❌ |
| Signature électronique | ❌ | ❌ | ❌ |
| Importer contrat signé | ✅ | ✅ | ❌ |

### Statut: PENDING_SIGNATURE (Lien envoyé)

| Action | ADMIN | MANAGER | COLLABORATOR |
|--------|-------|---------|--------------|
| Générer PDF | ❌ | ❌ | ❌ |
| Modifier | ✅ | ✅ | ❌ |
| Désactiver | ✅ | ✅ | ❌ |
| Signature électronique | ❌ | ❌ | ❌ |
| Voir lien signature | ✅ | ✅ | ✅ |

### Statut: CONFIRMED (Confirmé)

| Action | ADMIN | MANAGER | COLLABORATOR |
|--------|-------|---------|--------------|
| Générer PDF | ❌ | ❌ | ❌ |
| Modifier | ✅ | ✅ | ❌ |
| Désactiver | ✅ | ✅ | ❌ |
| Signature électronique | ❌ | ❌ | ❌ |

### Statut: SIGNED / SIGNED_ELECTRONICALLY (Signé)

| Action | ADMIN | MANAGER | COLLABORATOR |
|--------|-------|---------|--------------|
| Générer PDF | ❌ | ❌ | ❌ |
| Modifier | ✅ | ❌ | ❌ |
| Désactiver | ✅ | ✅ | ❌ |
| Signature électronique | ❌ | ❌ | ❌ |
| Voir contrat signé | ✅ | ✅ | ✅ |
| Importer contrat signé | ✅ | ❌ | ❌ |

### Contrat désactivé (deleted_at !== null)

| Action | ADMIN | MANAGER | COLLABORATOR |
|--------|-------|---------|--------------|
| Toutes actions | ❌ | ❌ | ❌ |
| Réactiver | ✅ | ✅ | ❌ |

---

## Système simplifié proposé

### 1. Créer une fonction centralisée de permissions

```typescript
type ContractAction =
  | 'generate_pdf'
  | 'edit'
  | 'soft_delete'
  | 'reactivate'
  | 'send_signature'
  | 'upload_signed'
  | 'view_signed';

interface ContractPermissions {
  canGeneratePdf: boolean;
  canEdit: boolean;
  canSoftDelete: boolean;
  canReactivate: boolean;
  canSendSignature: boolean;
  canUploadSigned: boolean;
  canViewSigned: boolean;
}

function getContractPermissions(
  userRole: 'ADMIN' | 'MANAGER' | 'COLLABORATOR' | 'USER',
  contractStatus: ContractStatus,
  isDeleted: boolean
): ContractPermissions
```

### 2. Simplifier les conditions des boutons

```typescript
const permissions = getContractPermissions(userRole, contract.status, Boolean(contract.deleted_at));

// Au lieu de:
disabled={!canGeneratePDF || pdfGeneratingId === contract.id || isDisabled || hasSignatureSent || cannotModifyAsCollaborator}

// Avoir:
disabled={!permissions.canGeneratePdf || pdfGeneratingId === contract.id}
```

### 3. Avantages du nouveau système

- ✅ **Centralisé**: Toute la logique au même endroit
- ✅ **Testable**: Facile de tester toutes les combinaisons
- ✅ **Maintenable**: Modifier une règle = un seul endroit
- ✅ **Lisible**: Matrice claire role/status/action
- ✅ **Documenté**: La fonction sert de documentation
- ✅ **Type-safe**: TypeScript garantit qu'on n'oublie rien

---

## Plan d'implémentation

1. ✅ Créer la branche `refactor/simplify-contract-permissions`
2. ⏳ Créer le fichier `src/utils/contractPermissions.ts`
3. ⏳ Implémenter la fonction `getContractPermissions()`
4. ⏳ Ajouter des tests unitaires
5. ⏳ Migrer `Customers.tsx` vers le nouveau système
6. ⏳ Supprimer les logs de debug
7. ⏳ Tester manuellement avec chaque rôle
8. ⏳ Merger dans main

---

## Notes supplémentaires

### Loading states à gérer séparément
Les états de chargement (`pdfGeneratingId`, `signatureLoadingId`, etc.) doivent rester dans les composants car ils sont liés à l'UI, pas aux permissions business.

### Gestion des erreurs
Actuellement aucune gestion d'erreur si l'utilisateur tente une action non autorisée. À considérer pour la sécurité.
