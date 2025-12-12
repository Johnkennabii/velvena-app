# Interface Frontend - Système de Templates de Contrats

## ✅ Ce qui a été implémenté

### 1. **Structure des fichiers**

```
src/
├── types/
│   └── contractTemplate.ts           # Types TypeScript complets
├── api/endpoints/
│   └── contractTemplates.ts          # API client pour les templates
├── components/contractTemplates/
│   ├── VariablesSidebar.tsx          # Sidebar d'aide avec variables
│   ├── TemplateEditor.tsx            # Éditeur de template
│   └── TemplatesList.tsx             # Liste et gestion des templates
├── pages/Gestion/
│   └── ContractTemplates.tsx         # Page principale
├── layout/
│   └── AppSidebar.tsx                # Menu latéral (lien ajouté)
└── App.tsx                           # Routes ajoutées
```

### 2. **Fonctionnalités implémentées**

#### ✅ Types TypeScript (`src/types/contractTemplate.ts`)
- Interface `ContractTemplate` complète
- Types pour création/mise à jour
- Interface `TemplateVariables` avec toutes les variables disponibles
- Constante `TEMPLATE_VARIABLE_CATEGORIES` pour l'aide contextuelle

#### ✅ API Client (`src/api/endpoints/contractTemplates.ts`)
- `list()` - Lister tous les templates (avec filtres)
- `getById()` - Récupérer un template
- `create()` - Créer un nouveau template
- `update()` - Mettre à jour un template
- `delete()` - Supprimer un template (soft delete)
- `duplicate()` - Dupliquer un template
- `preview()` - Prévisualiser le rendu
- `validate()` - Valider la syntaxe Handlebars

#### ✅ Composants

**VariablesSidebar**
- Affiche toutes les variables disponibles par catégories
- Copie dans le presse-papiers au clic
- Sections pliables/dépliables
- Documentation Handlebars intégrée

**TemplateEditor**
- Formulaire complet (nom, description, options)
- Éditeur de code (textarea temporaire)
- Validation de syntaxe Handlebars
- Prévisualisation du rendu
- Gestion erreurs
- Prêt pour Monaco Editor

**TemplatesList**
- Affichage en grille des templates
- Filtres (tous/actifs/inactifs)
- Actions : Éditer, Dupliquer, Activer/Désactiver, Supprimer
- Badges visuels (par défaut, actif/inactif)
- Informations détaillées

**Page ContractTemplates**
- Interface complète de gestion
- Filtres par type de contrat
- Modal d'édition plein écran
- Breadcrumb et méta tags

#### ✅ Intégration
- Route `/gestion/contract-templates` ajoutée dans `App.tsx`
- Lien dans la sidebar (section Gestion)
- Protection par rôles (SUPER_ADMIN, ADMIN)

---

## 🔧 Étapes pour finaliser

### Étape 1 : Corriger les permissions npm

```bash
sudo chown -R $(whoami) "/Users/johnkennabii/.npm"
```

### Étape 2 : Installer Monaco Editor

```bash
npm install @monaco-editor/react
```

### Étape 3 : Activer Monaco dans TemplateEditor

Ouvrir `src/components/contractTemplates/TemplateEditor.tsx` :

1. **Décommenter l'import** (ligne 8) :
```typescript
import Editor from "@monaco-editor/react";
```

2. **Remplacer le textarea** par Monaco (lignes 189-215) :
```tsx
<Editor
  height="100%"
  language="html"
  theme="vs-dark"
  value={content}
  onChange={(value) => setContent(value || "")}
  options={{
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: "on",
    lineNumbers: "on",
    scrollBeyondLastLine: false,
  }}
/>
```

3. **Supprimer le textarea** (actuellement utilisé en fallback)

---

## 📖 Guide d'utilisation

### Accéder à l'interface

1. Se connecter en tant que SUPER_ADMIN ou ADMIN
2. Aller dans **Gestion** > **Templates de contrat**
3. L'interface affiche tous les templates existants

### Créer un nouveau template

1. Cliquer sur **"Nouveau Template"**
2. Sélectionner un type de contrat (obligatoire)
3. Remplir le formulaire :
   - Nom du template
   - Description (optionnelle)
   - Cocher "Template par défaut" si nécessaire
   - Cocher "Actif" pour l'activer immédiatement
4. Écrire le template HTML avec variables Handlebars
5. Utiliser la **Sidebar de droite** pour copier les variables
6. Cliquer sur **"Valider la syntaxe"** pour vérifier
7. Cliquer sur **"Créer"** pour sauvegarder

### Éditer un template existant

1. Cliquer sur l'icône **crayon** à côté du template
2. Modifier le contenu
3. Cliquer sur **"Mettre à jour"**

### Prévisualiser un template

1. Sauvegarder d'abord le template
2. Cliquer sur **"Prévisualiser"**
3. Le rendu s'affiche dans une modal

### Autres actions

- **Dupliquer** : Crée une copie du template
- **Activer/Désactiver** : Toggle l'état actif
- **Supprimer** : Soft delete du template

---

## 🎨 Variables disponibles

### Client
```handlebars
{{client.fullName}}
{{client.firstName}}
{{client.lastName}}
{{client.email}}
{{client.phone}}
{{client.address}}
{{client.city}}
{{client.zipCode}}
```

### Organisation
```handlebars
{{org.name}}
{{org.city}}
{{org.address}}
{{org.phone}}
{{org.email}}
{{org.siret}}
{{org.managerFullName}}
{{org.managerInitials}}
```

### Contrat
```handlebars
{{contract.number}}
{{contract.type}}
{{contract.totalTTC}}
{{contract.totalHT}}
{{contract.totalDeposit}}
{{contract.startDate}}
{{contract.endDate}}
{{contract.createdAt}}
{{contract.notes}}
```

### Signature électronique
```handlebars
{{signature.method}}
{{signature.date}}
{{signature.ipAddress}}
```

### Listes (Boucles)

**Robes :**
```handlebars
{{#each dresses}}
  <li>{{this.name}} - {{currency this.pricePerDay}}</li>
{{/each}}
```

**Options/Addons :**
```handlebars
{{#each addons}}
  <li>{{this.name}} - {{currency this.price}}</li>
{{/each}}
```

**Packages :**
```handlebars
{{#each packages}}
  <li>{{this.name}} - {{currency this.price}}</li>
{{/each}}
```

---

## 🛠️ Helpers Handlebars personnalisés

### `{{currency value}}`
Formate un nombre en monnaie française :
```handlebars
{{currency contract.totalTTC}}
→ 2 500,00 €
```

### `{{date value}}`
Formate une date au format court :
```handlebars
{{date contract.startDate}}
→ 15/06/2025
```

### `{{datetime value}}`
Formate une date avec l'heure :
```handlebars
{{datetime signature.date}}
→ 11/12/2025 14:30
```

### `{{#if condition}}`
Condition simple :
```handlebars
{{#if signature}}
  Signé électroniquement le {{date signature.date}}
{{else}}
  Signature manuelle requise
{{/if}}
```

### `{{#ifEquals a b}}`
Comparaison de valeurs :
```handlebars
{{#ifEquals contract.status 'signed'}}
  ✓ Contrat signé
{{/ifEquals}}
```

---

## 📝 Exemple de template complet

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrat {{contract.number}}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #2563eb; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f3f4f6; }
  </style>
</head>
<body>
  <h1>Contrat de Location Négafa</h1>

  <h2>Informations Client</h2>
  <p>
    <strong>Nom :</strong> {{client.fullName}}<br>
    <strong>Email :</strong> {{client.email}}<br>
    <strong>Téléphone :</strong> {{client.phone}}<br>
    <strong>Adresse :</strong> {{client.address}}, {{client.zipCode}} {{client.city}}
  </p>

  <h2>Prestations</h2>
  <table>
    <thead>
      <tr>
        <th>Article</th>
        <th>Quantité</th>
        <th>Prix unitaire</th>
        <th>Sous-total</th>
      </tr>
    </thead>
    <tbody>
      {{#each dresses}}
      <tr>
        <td>{{this.name}} ({{this.reference}})</td>
        <td>{{this.quantity}}</td>
        <td>{{currency this.pricePerDay}}</td>
        <td>{{currency this.subtotal}}</td>
      </tr>
      {{/each}}

      {{#each addons}}
      <tr>
        <td>{{this.name}}</td>
        <td>{{this.quantity}}</td>
        <td>{{currency this.price}}</td>
        <td>{{currency this.subtotal}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <h2>Totaux</h2>
  <p>
    <strong>Total HT :</strong> {{currency contract.totalHT}}<br>
    <strong>Total TTC :</strong> {{currency contract.totalTTC}}<br>
    <strong>Acompte versé :</strong> {{currency contract.totalDeposit}}
  </p>

  <h2>Signature</h2>
  {{#if signature}}
  <p>
    Signé électroniquement le {{datetime signature.date}}<br>
    IP : {{signature.ipAddress}}
  </p>
  {{else}}
  <p>
    Date : _______________<br>
    Signature du client : _______________
  </p>
  {{/if}}

  <footer>
    <p>{{org.name}} - {{org.address}}, {{org.city}}</p>
    <p>SIRET : {{org.siret}} - Tél : {{org.phone}}</p>
  </footer>
</body>
</html>
```

---

## 🚀 Prochaines améliorations possibles

1. **Autocomplétion dans Monaco** : Suggestions de variables pendant la frappe
2. **Aperçu en temps réel** : Prévisualisation pendant l'édition
3. **Snippets** : Modèles prédéfinis (tableaux, sections, etc.)
4. **Historique des versions** : Voir les modifications
5. **Import/Export** : Partager des templates entre organisations
6. **Bibliothèque de templates** : Templates prédéfinis par type
7. **Éditeur WYSIWYG** : Alternative au code pour utilisateurs non techniques

---

## 📚 Ressources

- **Handlebars Documentation** : https://handlebarsjs.com/
- **Monaco Editor** : https://microsoft.github.io/monaco-editor/
- **Backend API** : Voir `CONTRACT_TEMPLATES_IMPLEMENTATION.md`

---

**Date de création** : 11 Décembre 2025
**Status Frontend** : ✅ Implémenté (sans Monaco, à installer)
**Status Backend** : ⏳ À vérifier dans le repository backend
