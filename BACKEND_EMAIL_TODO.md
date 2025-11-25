# 📧 Backend Email - État de l'implémentation

## ✅ Endpoints fonctionnels (9/11 - 82%)

### 1. POST /mails/send
**Status** : ✅ Fonctionnel

**Exemple d'utilisation** :
```bash
curl -X POST https://api.allure-creation.fr/mails/send \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "client@example.com",
    "subject": "Test",
    "html": "<p>Bonjour</p>",
    "text": "Bonjour"
  }'
```

**Réponse** :
```json
{
  "success": true,
  "message": "Email envoyé avec succès"
}
```

---

### 2. GET /mails/mailboxes
**Status** : ✅ Fonctionnel

**Description** : Liste des boîtes mail avec compteurs

**Appelé par** : `EmailsAPI.getMailboxes()`

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "name": "INBOX",
      "displayName": "Boîte de réception",
      "total": 9,
      "new": 3
    },
    {
      "name": "Sent",
      "displayName": "Envoyés",
      "total": 1,
      "new": 0
    },
    {
      "name": "Trash",
      "displayName": "Corbeille",
      "total": 0,
      "new": 0
    },
    {
      "name": "Junk",
      "displayName": "Courrier indésirable",
      "total": 1,
      "new": 1
    },
    {
      "name": "Drafts",
      "displayName": "Brouillons",
      "total": 0,
      "new": 0
    }
  ]
}
```

---

### 3. GET /mails/{mailbox}
**Status** : ✅ Fonctionnel

**Description** : Liste des emails d'une boîte (inbox, sent, trash, junk)

**Appelé par** : `EmailsAPI.getInboxEmails({ mailbox: 'inbox', limit: 50, offset: 0 })`

**Paramètres** :
- `mailbox` : inbox, sent, trash, junk (drafts non supporté)
- `limit` : nombre d'emails (défaut: 50)
- `offset` : pagination (défaut: 0)

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": "<message-id@domain.com>",
      "uid": 9,
      "subject": "Sujet de l'email",
      "from": [{"address": "sender@example.com", "name": "John Doe"}],
      "to": [{"address": "contact@allure-creation.fr", "name": ""}],
      "date": "2025-11-23T15:47:04.000Z",
      "attachments": [
        {
          "filename": "document.pdf",
          "contentType": "application/pdf",
          "size": 575,
          "content": {"type": "Buffer", "data": [31,139,8,...]}
        }
      ],
      "flags": ["\\Seen"],
      "hasAttachments": true,
      "html": "<p>Corps du message...</p>",
      "text": "Corps du message..."
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 5
  }
}
```

---

### 4. PATCH /mails/{mailbox}/{uid}/flag/add
**Status** : ✅ Fonctionnel

**Description** : Ajouter un flag à un email (étoile)

**Appelé par** : `EmailsAPI.toggleFlag(uid, mailbox, true)`

**Exemple** :
```bash
curl -X 'PATCH' \
  'https://api.allure-creation.fr/mails/inbox/5/flag/add' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"flag": "\\Flagged"}'
```

**Réponse** :
```json
{
  "success": true,
  "message": "Flag \\Flagged ajouté avec succès"
}
```

---

### 5. PATCH /mails/{mailbox}/{uid}/flag/remove
**Status** : ✅ Fonctionnel

**Description** : Retirer un flag d'un email (étoile)

**Appelé par** : `EmailsAPI.toggleFlag(uid, mailbox, false)`

**Exemple** :
```bash
curl -X 'PATCH' \
  'https://api.allure-creation.fr/mails/inbox/5/flag/remove' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"flag": "\\Flagged"}'
```

**Réponse** :
```json
{
  "success": true,
  "message": "Flag \\Flagged retiré avec succès"
}
```

---

### 6. PATCH /mails/{mailbox}/{uid}/read
**Status** : ✅ Fonctionnel

**Description** : Marquer un email comme lu

**Appelé par** : `EmailsAPI.markAsRead(uid, mailbox, true)`

**Exemple** :
```bash
curl -X 'PATCH' 'https://api.allure-creation.fr/mails/inbox/1/read' \
  -H 'Authorization: Bearer <token>'
```

**Réponse** :
```json
{
  "success": true,
  "message": "Email marqué comme lu"
}
```

---

### 7. PATCH /mails/{mailbox}/{uid}/unread
**Status** : ✅ Fonctionnel

**Description** : Marquer un email comme non lu

**Appelé par** : `EmailsAPI.markAsRead(uid, mailbox, false)`

**Exemple** :
```bash
curl -X 'PATCH' 'https://api.allure-creation.fr/mails/inbox/1/unread' \
  -H 'Authorization: Bearer <token>'
```

**Réponse** :
```json
{
  "success": true,
  "message": "Email marqué comme non lu"
}
```

---

### 8. PATCH /mails/{mailbox}/{uid}/move
**Status** : ✅ Fonctionnel

**Description** : Déplacer un email vers un autre dossier

**Appelé par** : `EmailsAPI.move(uid, fromMailbox, toMailbox)`

**Exemple** :
```bash
curl -X 'PATCH' 'https://api.allure-creation.fr/mails/spam/1/move' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"toMailbox": "inbox"}'
```

**Réponse** :
```json
{
  "success": true,
  "message": "Email déplacé de Spam vers Inbox"
}
```

---

### 9. DELETE /mails/{mailbox}/{uid}
**Status** : ✅ Fonctionnel

**Description** : Déplacer un email vers la corbeille

**Appelé par** : `EmailsAPI.delete(uid, mailbox, false)`

**Exemple** :
```bash
curl -X 'DELETE' 'https://api.allure-creation.fr/mails/inbox/8' \
  -H 'Authorization: Bearer <token>'
```

**Réponse** :
```json
{
  "success": true,
  "message": "Email déplacé vers la corbeille"
}
```

---

### 10. DELETE /mails/{mailbox}/{uid}/permanent
**Status** : ✅ Fonctionnel

**Description** : Supprimer définitivement un email (depuis la corbeille)

**Appelé par** : `EmailsAPI.delete(uid, mailbox, true)`

**Exemple** :
```bash
curl -X 'DELETE' 'https://api.allure-creation.fr/mails/trash/4/permanent' \
  -H 'Authorization: Bearer <token>'
```

**Réponse** :
```json
{
  "success": true,
  "message": "Email supprimé définitivement"
}
```

---

## ❌ Endpoints manquants

### 1. GET /emails/{emailId}/attachments/{index}
**Status** : ❌ Non implémenté

**Appelé par** : `EmailsAPI.downloadAttachment(emailId, index, folder)` (ligne 228 de emails.ts)

**Note** : Les pièces jointes sont déjà incluses en base64 dans la réponse `/mails/{mailbox}`, mais pas de système de téléchargement séparé pour les gros fichiers

---

### 2. GET /emails/config
**Status** : ❌ Non implémenté

**Appelé par** : `EmailsAPI.getConfig()` (ligne 248 de emails.ts)

**Note** : Configuration email utilisateur (optionnel)

---

## 📊 Résumé de l'état actuel

### ✅ Fonctionnel (10/12 - 83%)
1. POST /mails/send - Envoi d'emails
2. GET /mails/mailboxes - Liste des boîtes avec compteurs
3. GET /mails/{mailbox} - Liste des emails (inbox, sent, trash, junk, drafts)
4. PATCH /mails/{mailbox}/{uid}/flag/add - Ajouter une étoile
5. PATCH /mails/{mailbox}/{uid}/flag/remove - Retirer une étoile
6. PATCH /mails/{mailbox}/{uid}/read - Marquer comme lu
7. PATCH /mails/{mailbox}/{uid}/unread - Marquer comme non lu
8. PATCH /mails/{mailbox}/{uid}/move - Déplacer un email
9. DELETE /mails/{mailbox}/{uid} - Déplacer vers corbeille
10. DELETE /mails/{mailbox}/{uid}/permanent - Suppression définitive

### ❌ Non implémenté (2/12 - 17%)
1. GET /emails/{emailId}/attachments/{index} - Télécharger PJ séparément
2. GET /emails/config - Config email utilisateur (optionnel)

---

## 🎯 Priorités recommandées

### Optionnel (améliorer l'UX pour gros fichiers)
1. **GET /emails/{emailId}/attachments/{index}** - Téléchargement de PJ séparé (actuellement inclus en base64)
2. **GET /emails/config** - Config email utilisateur (admin)

---

## 💡 Recommandations techniques

1. **Pagination** : Le système de pagination fonctionne bien avec limit/offset
2. **Pièces jointes** : Actuellement en base64 dans la réponse - préférer un endpoint dédié pour les gros fichiers
3. **Gandi.net** : La configuration IMAP/SMTP fonctionne correctement
4. **Frontend** : Bien structuré, tous les hooks API sont prêts
5. **Mailboxes** : Tous les dossiers sont supportés (inbox, sent, trash, junk, drafts)

---

## 📝 Notes d'implémentation

### Backend
- ✅ Le frontend utilise la bonne structure d'API
- ✅ Les mailboxes supportées : inbox, sent, trash, junk, drafts
- ✅ Les flags IMAP sont correctement gérés : `\Seen`, `\Flagged`
- ✅ Format de date : ISO 8601 (2025-11-23T15:47:04.000Z)
- ✅ Structure d'API backend : `/mails/{mailbox}/{uid}/action`
- ✅ **Toutes les fonctionnalités principales sont implémentées** (83%)
- ⚠️ Les pièces jointes sont en base64 dans la liste (pas d'endpoint séparé)

### Frontend
- ✅ Le composant EmailComposeModal est fonctionnel
- ✅ Le bouton étoile est connecté à l'API (avec optimistic update)
- ✅ La pagination est fonctionnelle (avec limit/offset)
- ✅ Marquer lu/non-lu implémenté (dropdown checkbox + icônes sur chaque ligne)
- ✅ Supprimer définitivement implémenté (bouton poubelle + icônes sur chaque ligne)
- ✅ Déplacer vers corbeille implémenté (bouton archiver)
- ✅ **Option 1** : Barre d'actions avec sélection multiple (Gmail-like)
  - Affiche le nombre d'emails sélectionnés
  - **Dropdown avec checkbox** : Marquer comme lu/non-lu (emails sélectionnés)
  - **Bouton Actualiser** : Rafraîchit le mailbox courant
  - **Bouton Poubelle** : Suppression définitive (permanent delete)
  - **Bouton Archiver** : Déplacer vers la corbeille
  - **Menu "Plus" (3 points)** : "Voir tous les emails" (sans pagination)
  - Désactivation automatique si aucun email sélectionné
- ✅ **Option 3** : Icônes d'action sur chaque ligne d'email
  - Apparaissent au survol de chaque email (remplace la date)
  - Icône "Marquer comme lu/non-lu" (enveloppe ouverte/fermée)
  - Icône "Déplacer vers..." (avec dropdown : inbox, trash, spam, sent)
  - Icône "Supprimer définitivement" (poubelle)
  - Actions sur email individuel sans avoir à sélectionner
- ✅ Fonction "Voir tous" : Affiche tous les emails du mailbox sans pagination
- ✅ **Optimistic updates** : Actions instantanées sans rechargement visible
  - Mise à jour immédiate de l'UI avant l'appel API
  - Rollback automatique en cas d'erreur
  - Expérience utilisateur fluide et réactive
- ✅ **Notifications informatives** : Système de notifications intégré
  - Notifications de succès pour toutes les actions (marquer lu/non-lu, déplacer, supprimer)
  - Notifications d'erreur en cas d'échec des opérations
  - Messages détaillés avec nombre d'emails affectés
  - Utilisation du NotificationContext existant
- ✅ **Confirmation de suppression** : Dialog de confirmation avant suppression définitive
  - Confirmation pour suppression multiple (barre d'actions)
  - Confirmation pour suppression individuelle (icône poubelle)
  - Message clair sur l'irréversibilité de l'action
  - Boutons "Annuler" et "Confirmer"
- ✅ Gestion des erreurs avec console.error
