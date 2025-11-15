/**
 * Système centralisé de gestion des permissions pour les contrats
 *
 * Ce module définit qui peut faire quoi sur un contrat selon:
 * - Le rôle de l'utilisateur (ADMIN, MANAGER, COLLABORATOR, USER)
 * - Le statut du contrat (DRAFT, PENDING, PENDING_SIGNATURE, etc.)
 * - L'état de suppression du contrat
 */

export type UserRole = 'ADMIN' | 'MANAGER' | 'COLLABORATOR';

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PENDING_SIGNATURE'
  | 'SIGNED'
  | 'SIGNED_ELECTRONICALLY';

export interface ContractPermissions {
  /** Peut générer le PDF du contrat */
  canGeneratePdf: boolean;
  /** Peut modifier les détails du contrat */
  canEdit: boolean;
  /** Peut désactiver (soft delete) le contrat */
  canSoftDelete: boolean;
  /** Peut réactiver un contrat désactivé */
  canReactivate: boolean;
  /** Peut envoyer le lien de signature électronique */
  canSendSignature: boolean;
  /** Peut importer un contrat signé manuellement */
  canUploadSigned: boolean;
  /** Peut voir le contrat signé */
  canViewSigned: boolean;
}

/**
 * Détermine les permissions d'un utilisateur sur un contrat donné
 *
 * @param userRole - Rôle de l'utilisateur connecté
 * @param contractStatus - Statut actuel du contrat
 * @param isDeleted - Le contrat est-il désactivé ?
 * @returns Objet contenant toutes les permissions booléennes
 */
export function getContractPermissions(
  userRole: UserRole,
  contractStatus: ContractStatus,
  isDeleted: boolean
): ContractPermissions {
  // Si le contrat est désactivé, seuls ADMIN et MANAGER peuvent le réactiver
  if (isDeleted) {
    return {
      canGeneratePdf: false,
      canEdit: false,
      canSoftDelete: false,
      canReactivate: userRole === 'ADMIN' || userRole === 'MANAGER',
      canSendSignature: false,
      canUploadSigned: false,
      canViewSigned: false,
    };
  }

  // Permissions par statut et rôle
  const permissions: ContractPermissions = {
    canGeneratePdf: false,
    canEdit: false,
    canSoftDelete: false,
    canReactivate: false,
    canSendSignature: false,
    canUploadSigned: false,
    canViewSigned: true,
  };

  // ADMIN a tous les droits sauf restrictions spécifiques par statut
  const isAdmin = userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';

  switch (contractStatus) {
    case 'DRAFT':
      // DRAFT: Tous peuvent générer PDF, modifier et envoyer signature
      // Seuls ADMIN et MANAGER peuvent désactiver
      permissions.canGeneratePdf = true;
      permissions.canEdit = true;
      permissions.canSendSignature = true;
      permissions.canSoftDelete = true;
      permissions.canReactivate = isAdmin || isManager;
      break;

    case 'PENDING':
      // PENDING: En attente de PDF manuel
      // Seuls ADMIN et MANAGER peuvent modifier et importer
      // Pas de signature électronique (on attend un PDF manuel)
      permissions.canEdit = isAdmin || isManager;
      permissions.canSoftDelete = isAdmin || isManager;
      permissions.canUploadSigned = isAdmin || isManager;
      break;

    case 'PENDING_SIGNATURE':
      // PENDING_SIGNATURE: Lien envoyé, en attente de signature
      // Seuls ADMIN et MANAGER peuvent modifier
      // Pas de génération PDF ni envoi signature (déjà envoyé)
      permissions.canEdit = isAdmin || isManager;
      permissions.canSoftDelete = isAdmin || isManager;
      break;



    case 'SIGNED':
    case 'SIGNED_ELECTRONICALLY':
      // SIGNED: Contrat signé
      // Seul ADMIN peut modifier
      // ADMIN et MANAGER peuvent désactiver
      // Seul ADMIN peut importer un nouveau contrat signé
      permissions.canEdit = isAdmin;
      permissions.canSoftDelete = isAdmin || isManager;
      permissions.canUploadSigned = isAdmin;
      break;
  }

  return permissions;
}

/**
 * Vérifie si une action spécifique est autorisée
 *
 * @param permissions - Objet des permissions
 * @param action - Action à vérifier
 * @returns true si l'action est autorisée
 */
export function canPerformAction(
  permissions: ContractPermissions,
  action: keyof ContractPermissions
): boolean {
  return permissions[action];
}

/**
 * Retourne un message d'erreur explicite pour une action non autorisée
 *
 * @param action - Action tentée
 * @param userRole - Rôle de l'utilisateur
 * @param contractStatus - Statut du contrat
 * @returns Message d'erreur descriptif
 */
export function getPermissionErrorMessage(
  action: keyof ContractPermissions,
  userRole: UserRole,
  contractStatus: ContractStatus
): string {
  const actionLabels: Record<keyof ContractPermissions, string> = {
    canGeneratePdf: 'générer le PDF',
    canEdit: 'modifier le contrat',
    canSoftDelete: 'désactiver le contrat',
    canReactivate: 'réactiver le contrat',
    canSendSignature: 'envoyer la signature électronique',
    canUploadSigned: 'importer le contrat signé',
    canViewSigned: 'voir le contrat signé',
  };

  const roleLabels: Record<UserRole, string> = {
    ADMIN: 'Administrateur',
    MANAGER: 'Manager',
    COLLABORATOR: 'Collaborateur',
  };

  const statusLabels: Record<ContractStatus, string> = {
    DRAFT: 'Brouillon',
    PENDING: 'En attente',
    PENDING_SIGNATURE: 'Signature en cours',
    SIGNED: 'Signé',
    SIGNED_ELECTRONICALLY: 'Signé électroniquement',
  };

  return `En tant que ${roleLabels[userRole]}, vous ne pouvez pas ${actionLabels[action]} un contrat au statut "${statusLabels[contractStatus]}".`;
}
