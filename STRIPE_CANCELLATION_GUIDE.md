# Guide de Résiliation d'Abonnement Stripe

Ce document explique comment fonctionne la résiliation d'un abonnement dans Velvena.

## Deux Méthodes de Résiliation

### 1. Via l'API (recommandé pour le frontend)

**Endpoint** : `POST /api/billing/cancel-subscription`

#### Résiliation à la fin de la période (recommandé)

L'utilisateur continue à avoir accès jusqu'à la fin de la période payée.

```bash
POST /api/billing/cancel-subscription
Authorization: Bearer <token>
Content-Type: application/json

{
  "immediately": false
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Subscription will be cancelled at period end"
}
```

#### Résiliation immédiate

L'utilisateur perd l'accès immédiatement.

```bash
POST /api/billing/cancel-subscription
Authorization: Bearer <token>
Content-Type: application/json

{
  "immediately": true
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Subscription cancelled immediately"
}
```

### 2. Via le Customer Portal de Stripe

L'utilisateur peut aussi gérer son abonnement directement via Stripe.

**Endpoint** : `POST /api/billing/create-portal-session`

```bash
POST /api/billing/create-portal-session
Authorization: Bearer <token>
Content-Type: application/json

{
  "return_url": "https://velvena.fr/dashboard"
}
```

**Réponse** :
```json
{
  "url": "https://billing.stripe.com/p/session/..."
}
```

Redirigez l'utilisateur vers cette URL. Il pourra :
- Voir son abonnement actuel
- Voir l'historique des factures
- Télécharger les factures en PDF
- Modifier son moyen de paiement
- **Annuler son abonnement**
- Réactiver un abonnement annulé (si encore dans la période)

## Processus de Résiliation

### Étape 1 : L'utilisateur demande la résiliation

**Option A** : Résiliation à la fin de la période (défaut)
```
Aujourd'hui : 10 décembre 2025
Fin de période : 10 janvier 2026
→ L'utilisateur garde accès jusqu'au 10 janvier 2026
→ Après le 10 janvier, passage en plan "Free"
```

**Option B** : Résiliation immédiate
```
Aujourd'hui : 10 décembre 2025
→ Accès coupé immédiatement
→ Passage en plan "Free" immédiatement
```

### Étape 2 : Mise à jour dans Stripe

L'API appelle Stripe pour :

**Résiliation à la fin de période** :
```typescript
stripe.subscriptions.update(subscription_id, {
  cancel_at_period_end: true
});
```

**Résiliation immédiate** :
```typescript
stripe.subscriptions.cancel(subscription_id);
```

### Étape 3 : Webhook Stripe

Stripe envoie un webhook à votre serveur :

**Pour résiliation à la fin de période** :
- Événement : `customer.subscription.updated`
- Le statut reste `active` mais avec `cancel_at_period_end: true`
- L'utilisateur garde l'accès

**Pour résiliation immédiate** :
- Événement : `customer.subscription.deleted`
- Le statut passe à `cancelled`
- L'utilisateur perd l'accès

### Étape 4 : Mise à jour de la base de données

Le webhook met à jour automatiquement l'organisation :

**Résiliation à la fin de période** :
```sql
UPDATE Organization SET
  subscription_status = 'active',  -- Reste actif jusqu'à la fin
  subscription_ends_at = '2026-01-10'  -- Date de fin
WHERE id = '<organization_id>';
```

**Résiliation immédiate** :
```sql
UPDATE Organization SET
  subscription_status = 'cancelled',
  subscription_ends_at = NOW(),
  stripe_subscription_id = NULL  -- Supprime l'ID Stripe
WHERE id = '<organization_id>';
```

### Étape 5 : Fin de la période (résiliation différée)

À la date de fin (10 janvier 2026), Stripe envoie :
- Événement : `customer.subscription.deleted`

Le webhook met à jour :
```sql
UPDATE Organization SET
  subscription_status = 'cancelled',
  subscription_ends_at = NOW(),
  stripe_subscription_id = NULL,
  subscription_plan_id = '<free_plan_id>'  -- Retour au plan Free
WHERE id = '<organization_id>';
```

## Comportement dans l'Application

### Accès aux fonctionnalités

#### Pendant la période de résiliation différée
```javascript
// L'utilisateur a encore accès à tout
{
  "subscription": {
    "status": "active",
    "plan_code": "pro",
    "cancel_at_period_end": true,  // Important !
    "subscription_ends_at": "2026-01-10T00:00:00.000Z"
  },
  "features": {
    "planning": true,
    "dashboard": true,
    "export_data": false,
    // ... toutes les features du plan Pro
  }
}
```

**Affichage recommandé dans le frontend** :
```
⚠️ Votre abonnement sera résilié le 10 janvier 2026.
Vous pouvez encore profiter de toutes les fonctionnalités jusqu'à cette date.

[Annuler la résiliation] [Voir les détails]
```

#### Après la résiliation

```javascript
{
  "subscription": {
    "status": "cancelled",
    "plan_code": "free",
    "subscription_ends_at": "2026-01-10T00:00:00.000Z"
  },
  "features": {
    "planning": false,
    "dashboard": false,
    "customer_portal": true,
    "contract_generation": true,
    "inventory_management": true
  }
}
```

### Quotas après résiliation

Le système vérifie automatiquement les quotas :

```javascript
// Exemple : Plan Pro → Free
// Avant : 50 robes max
// Après : 10 robes max

{
  "quotas": {
    "dresses": {
      "used": 35,      // 35 robes créées
      "limit": 10,     // Nouveau limite : 10
      "exceeded": true // ⚠️ Quota dépassé !
    }
  }
}
```

**Comportement recommandé** :
- L'utilisateur peut encore **voir** ses 35 robes
- Mais il ne peut **plus créer** de nouvelles robes tant qu'il n'en supprime pas ou ne re-upgrade pas

## Annulation de la Résiliation

Si l'utilisateur change d'avis **avant la fin de la période**, il peut annuler la résiliation.

### Via le Customer Portal

1. Rediriger vers le Customer Portal
2. Cliquer sur "Renew subscription" ou "Cancel cancellation"

### Via l'API

Il n'y a pas d'endpoint dédié actuellement, mais vous pouvez :

**Option 1** : Réactiver via Stripe
```typescript
await stripe.subscriptions.update(subscription_id, {
  cancel_at_period_end: false
});
```

**Option 2** : Créer un nouvel abonnement
```typescript
// Utiliser l'endpoint existant
POST /api/billing/create-checkout-session
```

## Exemple d'Implémentation Frontend

### Bouton de résiliation

```javascript
async function cancelSubscription(immediate = false) {
  // Confirmation
  const confirmed = confirm(
    immediate
      ? "Êtes-vous sûr de vouloir annuler immédiatement ? Vous perdrez l'accès tout de suite."
      : "Êtes-vous sûr ? Vous garderez l'accès jusqu'à la fin de votre période."
  );

  if (!confirmed) return;

  try {
    const response = await fetch('/api/billing/cancel-subscription', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        immediately: immediate
      })
    });

    const data = await response.json();

    if (data.success) {
      alert(data.message);
      // Rafraîchir le statut de l'abonnement
      await fetchSubscriptionStatus();
    } else {
      alert('Erreur : ' + data.error);
    }
  } catch (err) {
    console.error('Erreur lors de la résiliation:', err);
    alert('Une erreur est survenue');
  }
}

// Utilisation
document.getElementById('cancel-btn').onclick = () => cancelSubscription(false);
document.getElementById('cancel-immediate-btn').onclick = () => cancelSubscription(true);
```

### Affichage du statut

```javascript
async function displaySubscriptionStatus() {
  const response = await fetch('/api/billing/status', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const { subscription, plan } = await response.json();

  // Vérifier si résiliation programmée
  if (subscription.status === 'active' && subscription.cancel_at_period_end) {
    const endDate = new Date(subscription.subscription_ends_at);
    showWarning(`
      ⚠️ Votre abonnement ${plan.name} sera résilié le ${endDate.toLocaleDateString()}.

      <button onclick="renewSubscription()">Annuler la résiliation</button>
    `);
  }

  // Vérifier si déjà résilié
  if (subscription.status === 'cancelled') {
    showInfo(`
      ℹ️ Votre abonnement a été résilié.
      Vous êtes actuellement sur le plan ${plan.name}.

      <button onclick="upgrade()">Souscrire à nouveau</button>
    `);
  }
}
```

### Redirection vers le Customer Portal

```javascript
async function openCustomerPortal() {
  try {
    const response = await fetch('/api/billing/create-portal-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        return_url: window.location.href
      })
    });

    const { url } = await response.json();

    // Rediriger vers le portail Stripe
    window.location.href = url;
  } catch (err) {
    console.error('Erreur:', err);
  }
}
```

## Flux Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utilisateur clique sur "Annuler mon abonnement"         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend affiche une confirmation                        │
│    - "Annuler maintenant" (immediately: true)               │
│    - "Annuler à la fin de la période" (immediately: false)  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. POST /api/billing/cancel-subscription                    │
│    { "immediately": false }                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend appelle Stripe API                               │
│    stripe.subscriptions.update(sub_id, {                    │
│      cancel_at_period_end: true                             │
│    })                                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Stripe envoie webhook : customer.subscription.updated    │
│    → Backend reçoit le webhook via Stripe CLI (local)       │
│    → Met à jour la DB (status reste "active")               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Frontend affiche :                                        │
│    "⚠️ Résiliation programmée le 10 janvier 2026"          │
│    [Annuler la résiliation]                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
                   (10 janvier 2026)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Stripe envoie webhook : customer.subscription.deleted    │
│    → Backend met à jour la DB                               │
│    → status = "cancelled"                                   │
│    → plan = "free"                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Frontend détecte le changement de plan                   │
│    → Masque les fonctionnalités Premium                     │
│    → Affiche "Souscrire à nouveau"                          │
└─────────────────────────────────────────────────────────────┘
```

## Recommandations UX

### 1. Toujours proposer la résiliation différée par défaut
```
[ ] Annuler immédiatement (perte d'accès immédiate)
[x] Annuler à la fin de la période (accès jusqu'au 10 janvier)

[Confirmer l'annulation]
```

### 2. Afficher clairement l'impact
```
❌ Vous allez perdre :
   - Planning avancé
   - Dashboard analytique
   - Export de données
   - Notifications push
   - Signature électronique

✅ Vous garderez :
   - Gestion de base de l'inventaire
   - Génération de contrats (limitée)
   - Portail client

💡 Vous pourrez réactiver à tout moment
```

### 3. Proposer des alternatives
```
Avant d'annuler, avez-vous pensé à :
[ ] Passer au plan Standard (moins cher)
[ ] Mettre en pause temporairement
[ ] Contacter le support pour un tarif personnalisé

[Non merci, annuler quand même]
```

### 4. Email de confirmation
Après la résiliation, envoyez un email :
```
Bonjour,

Votre abonnement Pro a été programmé pour résiliation.

Date de fin : 10 janvier 2026
Accès restant : 31 jours

Vous pouvez annuler cette résiliation à tout moment depuis :
https://velvena.fr/settings/billing

Cordialement,
L'équipe Velvena
```

## Questions Fréquentes

### Que se passe-t-il avec les données ?

Les données ne sont **jamais supprimées** automatiquement :
- Les robes restent dans la base
- Les contrats restent accessibles
- Les clients restent dans le système

**Mais** : certaines fonctionnalités deviennent inaccessibles selon le plan.

### L'utilisateur peut-il revenir ?

Oui, à tout moment :
1. Créer un nouveau Checkout Session
2. Payer à nouveau
3. Retrouver toutes ses données

### Que se passe-t-il si le paiement échoue ?

Si un paiement échoue pendant un abonnement actif :
1. Stripe envoie `invoice.payment_failed`
2. Le statut passe à `past_due` (pas `cancelled`)
3. L'utilisateur reçoit un email pour mettre à jour son moyen de paiement
4. Stripe réessaye automatiquement plusieurs fois
5. Après X échecs, Stripe annule l'abonnement automatiquement

## Résumé

| Action | Endpoint | Comportement |
|--------|----------|--------------|
| **Résiliation différée** | `POST /api/billing/cancel-subscription` `{"immediately": false}` | Garde accès jusqu'à la fin de la période |
| **Résiliation immédiate** | `POST /api/billing/cancel-subscription` `{"immediately": true}` | Perd accès immédiatement |
| **Customer Portal** | `POST /api/billing/create-portal-session` | L'utilisateur gère lui-même |
| **Annuler la résiliation** | Via Customer Portal | Réactive l'abonnement |
| **Voir les factures** | `GET /api/billing/invoices` | Liste toutes les factures |

✅ **Best Practice** : Toujours utiliser la résiliation différée par défaut et proposer le Customer Portal pour plus de flexibilité.
