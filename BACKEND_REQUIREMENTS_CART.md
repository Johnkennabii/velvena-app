# Besoins Backend - Fonctionnalité Panier & Contract Builder

## 📋 Vue d'ensemble
Cette fonctionnalité permet aux utilisateurs de sélectionner plusieurs robes depuis le catalogue et de créer un contrat complet via une interface dédiée avec drag & drop et prévisualisation.

---

## 🔴 PRIORITÉ HAUTE

### 1. Endpoint de vérification de disponibilité batch
**Endpoint**: `POST /dresses/availability/batch`

**Raison d'être**: Actuellement, `/dresses/availability` vérifie toutes les robes pour une période donnée. Nous avons besoin de vérifier uniquement des robes spécifiques (celles dans le panier) en une seule requête.

**Request Body**:
```json
{
  "dress_ids": ["uuid1", "uuid2", "uuid3"],
  "start": "2025-12-01T00:00:00.000Z",
  "end": "2025-12-05T23:59:59.999Z"
}
```

**Response**:
```json
{
  "data": [
    {
      "dress_id": "uuid1",
      "isAvailable": true,
      "conflicts": null
    },
    {
      "dress_id": "uuid2",
      "isAvailable": false,
      "conflicts": [
        {
          "start_datetime": "2025-12-02T10:00:00.000Z",
          "end_datetime": "2025-12-04T18:00:00.000Z",
          "contract_id": "contract-uuid",
          "contract_number": "CTR-2025-001"
        }
      ]
    }
  ],
  "filters": {
    "start": "2025-12-01T00:00:00.000Z",
    "end": "2025-12-05T23:59:59.999Z"
  }
}
```

**Notes d'implémentation**:
- Optimiser pour éviter les N+1 queries (utiliser un seul SELECT avec IN clause)
- Retourner les conflits avec détails pour affichage à l'utilisateur
- Utiliser les mêmes règles de disponibilité que l'endpoint existant

---

## 🟡 PRIORITÉ MOYENNE

### 2. Endpoint de validation de panier
**Endpoint**: `POST /contracts/validate-cart`

**Raison d'être**: Valider toutes les règles métier avant la création du contrat (disponibilité + forfait + pricing + règles spécifiques).

**Request Body**:
```json
{
  "dress_ids": ["uuid1", "uuid2"],
  "main_dress_id": "uuid1",
  "start_datetime": "2025-12-01T10:00:00.000Z",
  "end_datetime": "2025-12-05T18:00:00.000Z",
  "package_id": "package-uuid",
  "contract_type_id": "type-uuid",
  "addon_ids": ["addon1", "addon2"]
}
```

**Response (succès)**:
```json
{
  "valid": true,
  "errors": [],
  "pricing": {
    "total_ht": 500.00,
    "total_ttc": 600.00,
    "main_dress_ht": 300.00,
    "main_dress_ttc": 360.00,
    "additional_dresses_ht": 100.00,
    "additional_dresses_ttc": 120.00,
    "addons_ht": 100.00,
    "addons_ttc": 120.00,
    "package_discount_ht": 0.00,
    "package_discount_ttc": 0.00,
    "details": {
      "dresses": [
        {
          "dress_id": "uuid1",
          "is_main": true,
          "price_ht": 300.00,
          "price_ttc": 360.00
        }
      ],
      "addons": [...]
    }
  },
  "warnings": [
    "La robe 'Robe Princesse' a déjà été louée 10 fois ce mois"
  ]
}
```

**Response (erreurs)**:
```json
{
  "valid": false,
  "errors": [
    {
      "code": "DRESS_UNAVAILABLE",
      "dress_id": "uuid2",
      "message": "La robe 'Robe Sirène' n'est pas disponible pour cette période",
      "details": {
        "conflicting_contract": "CTR-2025-001",
        "conflict_start": "2025-12-02T10:00:00.000Z",
        "conflict_end": "2025-12-04T18:00:00.000Z"
      }
    },
    {
      "code": "PACKAGE_DRESS_LIMIT_EXCEEDED",
      "message": "Le forfait 'Mariée + 1' permet maximum 2 robes, mais 3 ont été sélectionnées",
      "details": {
        "package_name": "Mariée + 1",
        "max_dresses": 2,
        "selected_dresses": 3
      }
    },
    {
      "code": "MAIN_DRESS_REQUIRED",
      "message": "Une robe principale doit être sélectionnée pour ce type de contrat"
    }
  ],
  "pricing": null,
  "warnings": []
}
```

**Règles de validation à implémenter**:
- ✅ Toutes les robes sont disponibles pour la période
- ✅ Le nombre de robes respecte les limites du package (si applicable)
- ✅ Une robe principale est sélectionnée (si contrat forfait)
- ✅ La robe principale fait partie des robes sélectionnées
- ✅ Le type de contrat est compatible avec le package
- ✅ Les addons existent et sont actifs
- ✅ Le calcul des prix est correct selon les règles métier

---

## 🟢 PRIORITÉ BASSE (OPTIONNEL)

### 3. Système de draft de contrat
**Endpoints**:
- `POST /contracts/draft` - Créer un draft
- `GET /contracts/draft/:draftId` - Récupérer un draft
- `PUT /contracts/draft/:draftId` - Mettre à jour un draft
- `DELETE /contracts/draft/:draftId` - Supprimer un draft
- `GET /contracts/draft` - Lister les drafts de l'utilisateur

**Raison d'être**: Sauvegarder le travail en cours. Utile si l'utilisateur ferme la page ou veut préparer plusieurs contrats.

**Model Draft**:
```typescript
{
  id: string;
  user_id: string; // Créateur du draft
  customer_id?: string;
  dress_ids: string[];
  main_dress_id?: string;
  start_datetime?: string;
  end_datetime?: string;
  package_id?: string;
  contract_type_id?: string;
  addon_ids?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string; // Auto-suppression après X jours
}
```

**Notes**:
- Les drafts peuvent être invalides (pas de validation stricte)
- Ajout d'une tâche cron pour supprimer les vieux drafts (>30 jours)
- Un utilisateur peut avoir plusieurs drafts actifs

---

## 🔧 MODIFICATIONS ENDPOINTS EXISTANTS

### 4. Modification de `POST /contracts`

**Ce qui doit changer**:

Actuellement, la création de contrat doit accepter une **seule robe** ou gérer différemment les robes. Avec cette feature, il faut supporter:

```json
{
  "customer_id": "uuid",
  "start_datetime": "2025-12-01T10:00:00.000Z",
  "end_datetime": "2025-12-05T18:00:00.000Z",
  "contract_type_id": "uuid",
  "package_id": "uuid",

  // NOUVEAU: Liste de robes avec ordre et robe principale
  "dresses": [
    {
      "dress_id": "uuid1",
      "is_main": true,
      "order": 0
    },
    {
      "dress_id": "uuid2",
      "is_main": false,
      "order": 1
    }
  ],

  // Ou format simplifié si pas de notion de "main"
  "dress_ids": ["uuid1", "uuid2", "uuid3"],

  "addon_ids": ["addon1", "addon2"],
  "deposit_payment_method": "CB",
  "account_paid_ttc": 200.00,
  "notes": "Préparation pour mariage le 5 décembre"
}
```

**Ce qui doit être ajouté dans la table `contract_dresses`** (ou équivalent):
- `order` (INTEGER) - Pour conserver l'ordre du drag & drop
- `is_main` (BOOLEAN) - Pour identifier la robe principale dans un forfait

**Validations à ajouter**:
- Si `package_id` fourni, vérifier que `dresses.length <= package.num_dresses`
- Si contrat forfait, vérifier qu'il y a exactement une robe avec `is_main = true`
- Vérifier que toutes les robes sont disponibles (appel interne à la logique de disponibilité)

---

## 📊 Nouvelles Tables Suggérées

### Table: `contract_drafts`
```sql
CREATE TABLE contract_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  start_datetime TIMESTAMP,
  end_datetime TIMESTAMP,
  contract_type_id UUID REFERENCES contract_types(id) ON DELETE SET NULL,
  package_id UUID REFERENCES contract_packages(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE contract_draft_dresses (
  draft_id UUID REFERENCES contract_drafts(id) ON DELETE CASCADE,
  dress_id UUID REFERENCES dresses(id) ON DELETE CASCADE,
  is_main BOOLEAN DEFAULT FALSE,
  "order" INTEGER DEFAULT 0,
  PRIMARY KEY (draft_id, dress_id)
);

CREATE TABLE contract_draft_addons (
  draft_id UUID REFERENCES contract_drafts(id) ON DELETE CASCADE,
  addon_id UUID REFERENCES contract_addons(id) ON DELETE CASCADE,
  PRIMARY KEY (draft_id, addon_id)
);
```

### Modification Table: `contract_dresses`
```sql
ALTER TABLE contract_dresses ADD COLUMN "order" INTEGER DEFAULT 0;
ALTER TABLE contract_dresses ADD COLUMN is_main BOOLEAN DEFAULT FALSE;
```

---

## 🧪 Tests Suggérés

### Endpoint `/dresses/availability/batch`
- [ ] Teste avec 0 dress_ids → doit retourner data vide
- [ ] Teste avec 1 dress disponible → isAvailable = true
- [ ] Teste avec 1 dress non disponible → isAvailable = false + conflicts
- [ ] Teste avec mélange disponible/non disponible
- [ ] Teste avec dress_id invalide → erreur ou ignore?
- [ ] Teste performance avec 100+ dress_ids

### Endpoint `/contracts/validate-cart`
- [ ] Panier valide avec forfait → valid = true + pricing correct
- [ ] Panier avec robe non disponible → valid = false + erreur DRESS_UNAVAILABLE
- [ ] Panier dépassant limite forfait → valid = false + PACKAGE_DRESS_LIMIT_EXCEEDED
- [ ] Forfait sans robe principale → valid = false + MAIN_DRESS_REQUIRED
- [ ] Calcul pricing avec addons
- [ ] Calcul pricing avec remise forfait

---

## 📝 Notes Supplémentaires

### Performance
- Les endpoints batch doivent être optimisés (éviter N+1)
- Considérer un cache pour les packages/addons (souvent lus, rarement modifiés)
- Indexer `contract_dresses` sur `dress_id` et `contract_id`

### Sécurité
- Tous les endpoints nécessitent authentification
- Vérifier les permissions (ADMIN, MANAGER, COLLABORATOR)
- Les drafts sont privés (un user ne peut voir que ses drafts)
- Validation des UUIDs pour éviter injection

### Rétrocompatibilité
- L'ancien flow de création de contrat (une seule robe) doit continuer de fonctionner
- Champs `order` et `is_main` peuvent être NULL pour anciens contrats

---

## 🚀 Plan de Déploiement Backend Suggéré

1. **Phase 1** (PRIORITÉ HAUTE):
   - Implémenter `/dresses/availability/batch`
   - Tester et valider

2. **Phase 2** (PRIORITÉ MOYENNE):
   - Implémenter `/contracts/validate-cart`
   - Ajouter colonnes `order` et `is_main` à `contract_dresses`
   - Modifier `POST /contracts` pour supporter multi-robes
   - Tester et valider

3. **Phase 3** (PRIORITÉ BASSE - OPTIONNEL):
   - Créer tables de draft
   - Implémenter endpoints draft
   - Ajouter cron job de nettoyage
   - Tester et valider

---

**Dernière mise à jour**: 2025-11-29
**Auteur**: Feature Cart & Contract Builder
