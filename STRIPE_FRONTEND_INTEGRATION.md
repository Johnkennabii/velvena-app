# 🎨 Guide d'intégration Frontend Stripe

Guide complet pour intégrer Stripe dans votre application frontend (React, Vue, ou JavaScript vanilla).

---

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Configuration](#configuration)
3. [Page de Pricing](#page-de-pricing)
4. [Processus de Checkout](#processus-de-checkout)
5. [Page de Succès](#page-de-succès)
6. [Affichage du statut d'abonnement](#affichage-du-statut-dabonnement)
7. [Customer Portal](#customer-portal)
8. [Exemples complets](#exemples-complets)

---

## 🏗️ Architecture

```
Frontend                              Backend                    Stripe
--------                              -------                    ------

1. Utilisateur clique "S'abonner"
   → POST /api/billing/create-checkout-session
                                      → Créer session Checkout
                                                                → Session créée
   ← Retour URL session

2. Redirection vers Stripe
   ────────────────────────────────────────────────────────────→ Page Checkout

3. Utilisateur paie
                                      ← Webhook: checkout.session.completed
                                      → Activer abonnement en DB

4. Redirection vers success_url
   ← Afficher page de succès
```

---

## ⚙️ Configuration

### 1. Récupérer la clé publique Stripe

```javascript
// Appeler l'API pour obtenir la clé publique
const response = await fetch('http://127.0.0.1:3000/api/billing/config', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const config = await response.json();
// config.publishableKey = "pk_test_..."
```

### 2. Variables d'environnement Frontend

```bash
# .env (frontend)
VITE_API_URL=http://127.0.0.1:3000
# ou
NEXT_PUBLIC_API_URL=http://127.0.0.1:3000
# ou
REACT_APP_API_URL=http://127.0.0.1:3000
```

---

## 💰 Page de Pricing

### HTML/CSS Structure

```html
<!-- Page Pricing -->
<div class="pricing-page">
  <h1>Choisissez votre plan</h1>

  <!-- Toggle mensuel/annuel -->
  <div class="billing-toggle">
    <button class="active" data-interval="month">Mensuel</button>
    <button data-interval="year">Annuel (2 mois gratuits)</button>
  </div>

  <!-- Cartes de plans -->
  <div class="pricing-cards">
    <!-- Plan Free -->
    <div class="pricing-card">
      <h3>Free</h3>
      <p class="price">0€<span>/mois</span></p>
      <ul class="features">
        <li>✓ 5 robes</li>
        <li>✓ 10 clients</li>
        <li>✓ Gestion de contrats</li>
        <li>✓ Portail client</li>
      </ul>
      <button class="btn-free" disabled>Plan actuel</button>
    </div>

    <!-- Plan Basic -->
    <div class="pricing-card">
      <h3>Basic</h3>
      <p class="price" data-monthly="19" data-yearly="190">
        19€<span>/mois</span>
      </p>
      <ul class="features">
        <li>✓ 120 robes</li>
        <li>✓ 1000 clients</li>
        <li>✓ 50 contrats/mois</li>
        <li>✓ 3 utilisateurs</li>
      </ul>
      <button class="btn-subscribe" data-plan="basic">
        Essayer gratuitement
      </button>
      <p class="trial-info">14 jours d'essai gratuit</p>
    </div>

    <!-- Plan Pro (Populaire) -->
    <div class="pricing-card popular">
      <span class="badge">Populaire</span>
      <h3>Pro</h3>
      <p class="price" data-monthly="49" data-yearly="490">
        49€<span>/mois</span>
      </p>
      <ul class="features">
        <li>✓ 350 robes</li>
        <li>✓ 700 clients</li>
        <li>✓ 500 contrats/mois</li>
        <li>✓ 5 utilisateurs</li>
        <li>✓ Planning avancé</li>
        <li>✓ Dashboard analytics</li>
        <li>✓ Signature électronique</li>
        <li>✓ Notifications push</li>
      </ul>
      <button class="btn-subscribe" data-plan="pro">
        Essayer gratuitement
      </button>
      <p class="trial-info">14 jours d'essai gratuit</p>
    </div>

    <!-- Plan Enterprise -->
    <div class="pricing-card">
      <h3>Enterprise</h3>
      <p class="price" data-monthly="149" data-yearly="1490">
        149€<span>/mois</span>
      </p>
      <ul class="features">
        <li>✓ 1000 robes</li>
        <li>✓ 3000 clients</li>
        <li>✓ 5000 contrats/mois</li>
        <li>✓ 15 utilisateurs</li>
        <li>✓ Gestion de prospects</li>
        <li>✓ Export de données</li>
        <li>✓ Support prioritaire</li>
      </ul>
      <button class="btn-subscribe" data-plan="enterprise">
        Essayer gratuitement
      </button>
      <p class="trial-info">30 jours d'essai gratuit</p>
    </div>
  </div>
</div>
```

---

## 🛒 Processus de Checkout

### Exemple React

```jsx
// components/PricingPage.jsx
import { useState } from 'react';
import axios from 'axios';

function PricingPage() {
  const [billingInterval, setBillingInterval] = useState('month');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planCode) => {
    setLoading(true);

    try {
      // 1. Créer une session Checkout
      const response = await axios.post(
        'http://127.0.0.1:3000/api/billing/create-checkout-session',
        {
          plan_code: planCode,
          billing_interval: billingInterval,
          success_url: window.location.origin + '/subscription/success',
          cancel_url: window.location.origin + '/pricing'
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // 2. Rediriger vers Stripe
      const { url } = response.data;
      window.location.href = url;

    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
      alert('Erreur lors de la création de la session de paiement');
      setLoading(false);
    }
  };

  return (
    <div className="pricing-page">
      <h1>Choisissez votre plan</h1>

      {/* Toggle mensuel/annuel */}
      <div className="billing-toggle">
        <button
          className={billingInterval === 'month' ? 'active' : ''}
          onClick={() => setBillingInterval('month')}
        >
          Mensuel
        </button>
        <button
          className={billingInterval === 'year' ? 'active' : ''}
          onClick={() => setBillingInterval('year')}
        >
          Annuel (économisez 17%)
        </button>
      </div>

      {/* Cartes de plans */}
      <div className="pricing-cards">
        {/* Plan Basic */}
        <div className="pricing-card">
          <h3>Basic</h3>
          <p className="price">
            {billingInterval === 'month' ? '19€' : '190€'}
            <span>/{billingInterval === 'month' ? 'mois' : 'an'}</span>
          </p>
          <button
            onClick={() => handleSubscribe('basic')}
            disabled={loading}
            className="btn-subscribe"
          >
            {loading ? 'Chargement...' : 'S\'abonner'}
          </button>
        </div>

        {/* Plan Pro */}
        <div className="pricing-card popular">
          <span className="badge">Populaire</span>
          <h3>Pro</h3>
          <p className="price">
            {billingInterval === 'month' ? '49€' : '490€'}
            <span>/{billingInterval === 'month' ? 'mois' : 'an'}</span>
          </p>
          <button
            onClick={() => handleSubscribe('pro')}
            disabled={loading}
            className="btn-subscribe"
          >
            {loading ? 'Chargement...' : 'S\'abonner'}
          </button>
        </div>

        {/* Plan Enterprise */}
        <div className="pricing-card">
          <h3>Enterprise</h3>
          <p className="price">
            {billingInterval === 'month' ? '149€' : '1490€'}
            <span>/{billingInterval === 'month' ? 'mois' : 'an'}</span>
          </p>
          <button
            onClick={() => handleSubscribe('enterprise')}
            disabled={loading}
            className="btn-subscribe"
          >
            {loading ? 'Chargement...' : 'S\'abonner'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
```

### Exemple Vue 3

```vue
<!-- views/PricingPage.vue -->
<template>
  <div class="pricing-page">
    <h1>Choisissez votre plan</h1>

    <!-- Toggle mensuel/annuel -->
    <div class="billing-toggle">
      <button
        :class="{ active: billingInterval === 'month' }"
        @click="billingInterval = 'month'"
      >
        Mensuel
      </button>
      <button
        :class="{ active: billingInterval === 'year' }"
        @click="billingInterval = 'year'"
      >
        Annuel (économisez 17%)
      </button>
    </div>

    <!-- Cartes de plans -->
    <div class="pricing-cards">
      <div
        v-for="plan in plans"
        :key="plan.code"
        class="pricing-card"
        :class="{ popular: plan.isPopular }"
      >
        <span v-if="plan.isPopular" class="badge">Populaire</span>
        <h3>{{ plan.name }}</h3>
        <p class="price">
          {{ billingInterval === 'month' ? plan.priceMonthly : plan.priceYearly }}€
          <span>/{{ billingInterval === 'month' ? 'mois' : 'an' }}</span>
        </p>
        <ul class="features">
          <li v-for="feature in plan.features" :key="feature">
            ✓ {{ feature }}
          </li>
        </ul>
        <button
          @click="handleSubscribe(plan.code)"
          :disabled="loading"
          class="btn-subscribe"
        >
          {{ loading ? 'Chargement...' : 'S\'abonner' }}
        </button>
        <p class="trial-info">{{ plan.trialDays }} jours d'essai gratuit</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const billingInterval = ref('month');
const loading = ref(false);

const plans = [
  {
    code: 'basic',
    name: 'Basic',
    priceMonthly: 19,
    priceYearly: 190,
    trialDays: 14,
    isPopular: false,
    features: ['120 robes', '1000 clients', '50 contrats/mois']
  },
  {
    code: 'pro',
    name: 'Pro',
    priceMonthly: 49,
    priceYearly: 490,
    trialDays: 14,
    isPopular: true,
    features: ['350 robes', '700 clients', '500 contrats/mois', 'Planning', 'Dashboard']
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 149,
    priceYearly: 1490,
    trialDays: 30,
    isPopular: false,
    features: ['1000 robes', '3000 clients', '5000 contrats/mois', 'Export données']
  }
];

const handleSubscribe = async (planCode) => {
  loading.value = true;

  try {
    const token = localStorage.getItem('token');

    const response = await axios.post(
      'http://127.0.0.1:3000/api/billing/create-checkout-session',
      {
        plan_code: planCode,
        billing_interval: billingInterval.value,
        success_url: window.location.origin + '/subscription/success',
        cancel_url: window.location.origin + '/pricing'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Rediriger vers Stripe
    window.location.href = response.data.url;

  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création de la session de paiement');
    loading.value = false;
  }
};
</script>
```

### Exemple JavaScript Vanilla

```javascript
// pricing.js
const API_URL = 'http://127.0.0.1:3000';
let billingInterval = 'month';
let loading = false;

// Gérer le toggle mensuel/annuel
document.querySelectorAll('.billing-toggle button').forEach(button => {
  button.addEventListener('click', (e) => {
    // Retirer la classe active de tous les boutons
    document.querySelectorAll('.billing-toggle button').forEach(btn => {
      btn.classList.remove('active');
    });

    // Ajouter la classe active au bouton cliqué
    e.target.classList.add('active');

    // Mettre à jour l'intervalle
    billingInterval = e.target.dataset.interval;

    // Mettre à jour les prix affichés
    updatePrices();
  });
});

function updatePrices() {
  document.querySelectorAll('.price').forEach(priceEl => {
    const monthly = priceEl.dataset.monthly;
    const yearly = priceEl.dataset.yearly;

    if (billingInterval === 'month') {
      priceEl.innerHTML = `${monthly}€<span>/mois</span>`;
    } else {
      priceEl.innerHTML = `${yearly}€<span>/an</span>`;
    }
  });
}

// Gérer les clics sur les boutons d'abonnement
document.querySelectorAll('.btn-subscribe').forEach(button => {
  button.addEventListener('click', async (e) => {
    if (loading) return;

    const planCode = e.target.dataset.plan;
    await handleSubscribe(planCode);
  });
});

async function handleSubscribe(planCode) {
  loading = true;

  // Désactiver tous les boutons
  document.querySelectorAll('.btn-subscribe').forEach(btn => {
    btn.disabled = true;
    btn.textContent = 'Chargement...';
  });

  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/api/billing/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        plan_code: planCode,
        billing_interval: billingInterval,
        success_url: window.location.origin + '/subscription/success.html',
        cancel_url: window.location.origin + '/pricing.html'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la création de la session');
    }

    // Rediriger vers Stripe
    window.location.href = data.url;

  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création de la session de paiement: ' + error.message);

    // Réactiver les boutons
    document.querySelectorAll('.btn-subscribe').forEach(btn => {
      btn.disabled = false;
      btn.textContent = 'S\'abonner';
    });

    loading = false;
  }
}
```

---

## ✅ Page de Succès

### success.html

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Abonnement réussi !</title>
  <style>
    .success-page {
      max-width: 600px;
      margin: 100px auto;
      text-align: center;
      padding: 40px;
    }

    .success-icon {
      font-size: 80px;
      color: #10b981;
      margin-bottom: 20px;
    }

    h1 {
      color: #1f2937;
      margin-bottom: 10px;
    }

    p {
      color: #6b7280;
      margin-bottom: 30px;
    }

    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }

    .btn:hover {
      background: #2563eb;
    }
  </style>
</head>
<body>
  <div class="success-page">
    <div class="success-icon">✓</div>
    <h1>Paiement réussi !</h1>
    <p>
      Votre abonnement a été activé avec succès.<br>
      Vous pouvez maintenant profiter de toutes les fonctionnalités de votre plan.
    </p>
    <a href="/dashboard" class="btn">Accéder au tableau de bord</a>
  </div>

  <script>
    // Optionnel : Charger le statut d'abonnement
    async function loadSubscriptionStatus() {
      const token = localStorage.getItem('token');

      const response = await fetch('http://127.0.0.1:3000/api/billing/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log('Statut abonnement:', data);
    }

    loadSubscriptionStatus();
  </script>
</body>
</html>
```

---

## 📊 Affichage du statut d'abonnement

### Exemple React

```jsx
// components/SubscriptionStatus.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function SubscriptionStatus() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://127.0.0.1:3000/api/billing/status',
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setSubscription(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!subscription) {
    return <div>Erreur de chargement</div>;
  }

  return (
    <div className="subscription-status">
      <h2>Mon abonnement</h2>

      <div className="status-card">
        <div className="status-header">
          <h3>{subscription.plan?.name || 'Free'}</h3>
          <span className={`badge badge-${subscription.status}`}>
            {subscription.status === 'active' ? 'Actif' :
             subscription.status === 'trial' ? 'Essai gratuit' :
             subscription.status === 'cancelled' ? 'Annulé' :
             'Suspendu'}
          </span>
        </div>

        {subscription.is_trial && (
          <p className="trial-info">
            ⏰ Votre période d'essai se termine dans {subscription.days_remaining} jours
          </p>
        )}

        {subscription.plan && (
          <>
            <p className="price">
              {subscription.plan.price_monthly}€/mois
            </p>

            <div className="features">
              <h4>Fonctionnalités incluses :</h4>
              <ul>
                <li>✓ {subscription.plan.limits?.dresses || 0} robes</li>
                <li>✓ {subscription.plan.limits?.customers || 0} clients</li>
                <li>✓ {subscription.plan.limits?.users || 0} utilisateurs</li>
              </ul>
            </div>
          </>
        )}

        <div className="actions">
          {subscription.status === 'active' && (
            <button onClick={handleManageSubscription} className="btn-manage">
              Gérer mon abonnement
            </button>
          )}

          {subscription.status === 'trial' && (
            <a href="/pricing" className="btn-upgrade">
              Mettre à niveau
            </a>
          )}
        </div>
      </div>
    </div>
  );

  async function handleManageSubscription() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://127.0.0.1:3000/api/billing/create-portal-session',
        {
          return_url: window.location.href
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Rediriger vers le Customer Portal Stripe
      window.location.href = response.data.url;

    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'ouverture du portail de gestion');
    }
  }
}

export default SubscriptionStatus;
```

---

## 🎛️ Customer Portal

Le Customer Portal Stripe permet aux clients de :
- ✓ Modifier leur carte bancaire
- ✓ Consulter leurs factures
- ✓ Annuler leur abonnement
- ✓ Mettre à jour leurs informations de facturation

### Bouton "Gérer mon abonnement"

```javascript
async function openCustomerPortal() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch('http://127.0.0.1:3000/api/billing/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        return_url: window.location.href
      })
    });

    const data = await response.json();

    if (response.ok) {
      // Rediriger vers le Customer Portal
      window.location.href = data.url;
    } else {
      alert('Erreur: ' + data.error);
    }

  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de l\'ouverture du portail de gestion');
  }
}
```

---

## 🎨 Styles CSS recommandés

```css
/* pricing.css */

.pricing-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
}

.pricing-page h1 {
  text-align: center;
  font-size: 36px;
  margin-bottom: 20px;
  color: #1f2937;
}

/* Toggle mensuel/annuel */
.billing-toggle {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 60px;
}

.billing-toggle button {
  padding: 12px 24px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.billing-toggle button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Cartes de pricing */
.pricing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.pricing-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 40px 30px;
  text-align: center;
  position: relative;
  transition: all 0.3s;
}

.pricing-card:hover {
  border-color: #3b82f6;
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.pricing-card.popular {
  border-color: #3b82f6;
  border-width: 3px;
}

.pricing-card .badge {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background: #3b82f6;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.pricing-card h3 {
  font-size: 24px;
  margin-bottom: 15px;
  color: #1f2937;
}

.pricing-card .price {
  font-size: 48px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 30px;
}

.pricing-card .price span {
  font-size: 18px;
  color: #6b7280;
  font-weight: 400;
}

.pricing-card .features {
  list-style: none;
  padding: 0;
  margin: 30px 0;
  text-align: left;
}

.pricing-card .features li {
  padding: 10px 0;
  color: #4b5563;
  border-bottom: 1px solid #f3f4f6;
}

.pricing-card .features li:last-child {
  border-bottom: none;
}

.btn-subscribe {
  width: 100%;
  padding: 14px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-subscribe:hover {
  background: #2563eb;
}

.btn-subscribe:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.trial-info {
  margin-top: 15px;
  color: #6b7280;
  font-size: 14px;
}

/* Statut d'abonnement */
.subscription-status {
  max-width: 600px;
  margin: 40px auto;
}

.status-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 30px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
}

.badge-active {
  background: #d1fae5;
  color: #065f46;
}

.badge-trial {
  background: #fef3c7;
  color: #92400e;
}

.badge-cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.btn-manage {
  width: 100%;
  padding: 12px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.btn-manage:hover {
  background: #4f46e5;
}
```

---

## 📝 Checklist d'intégration

- [ ] Page de pricing créée avec toggle mensuel/annuel
- [ ] Fonction de création de session Checkout implémentée
- [ ] Page de succès créée
- [ ] Page d'annulation créée
- [ ] Affichage du statut d'abonnement implémenté
- [ ] Bouton "Gérer mon abonnement" (Customer Portal) ajouté
- [ ] Gestion des erreurs implémentée
- [ ] Tests effectués avec des cartes de test Stripe
- [ ] Design responsive testé sur mobile

---

## 🧪 Tester l'intégration

### 1. Cartes de test Stripe

```
Carte valide:     4242 4242 4242 4242
Carte refusée:    4000 0000 0000 0002
3D Secure requis: 4000 0025 0000 3155

Date: N'importe quelle date future
CVC: N'importe quel 3 chiffres
```

### 2. Flux de test complet

1. ✅ Créer un compte utilisateur
2. ✅ Aller sur la page de pricing
3. ✅ Cliquer sur "S'abonner" au plan Pro
4. ✅ Vérifier la redirection vers Stripe Checkout
5. ✅ Entrer les informations de carte de test
6. ✅ Valider le paiement
7. ✅ Vérifier la redirection vers la page de succès
8. ✅ Vérifier que l'abonnement est actif dans le dashboard
9. ✅ Cliquer sur "Gérer mon abonnement"
10. ✅ Vérifier l'accès au Customer Portal

---

## 🎉 Résultat final

Votre frontend pourra maintenant :
- ✅ Afficher les plans avec prix dynamiques
- ✅ Rediriger vers Stripe pour le paiement
- ✅ Gérer les périodes d'essai
- ✅ Afficher le statut d'abonnement en temps réel
- ✅ Permettre aux clients de gérer leur abonnement

Pour plus de détails sur l'API backend, consultez `STRIPE_INTEGRATION.md`.
