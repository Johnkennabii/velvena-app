# Documentation de la Logique Métier - Velvena App

Cette documentation contient une analyse complète et approfondie de la logique métier de l'application Velvena App.

## Structure des Documents

### 1. QUICK_REFERENCE.md (4.5 KB)
**Commencer par ce document !**

Vue d'ensemble synthétique et rapide de tous les concepts clés:
- Statuts des contrats
- Types de montants
- Stratégies de tarification
- Limitations des packages
- Validations critiques
- Permissions par statut
- Formules de calcul

**Idéal pour**: Référence rapide, consultation rapide lors du développement

### 2. BUSINESS_LOGIC_ANALYSIS.md (24 KB)
**Documentation complète et détaillée**

Analyse approfondie section par section:
1. Contrats (types, statuts, montants, validations)
2. Tarification (4 stratégies, TVA, caution, acompte)
3. ServiceTypes (structure, configuration)
4. Packages (limitations, addons inclus)
5. Robes (tarification, disponibilité)
6. Validations (dates, permissions, conflits)
7. Workflow (création à completion, paiements)
8. Permissions (rôles, statuts)
9. Architecture (flux, états)
10. Constantes critiques

Chaque section inclut:
- Définition claire
- Fichiers pertinents avec numéros de ligne
- Formules et calculs
- Exemples de code

**Idéal pour**: Comprendre la logique métier en profondeur, étudier les concepts

### 3. BUSINESS_LOGIC_EXAMPLES.md (11 KB)
**Exemples concrets et cas d'usage réels**

8 exemples pratiques couvrant des scénarios réels:
1. Location journalière simple
2. Location avec forfait + addons
3. Paiement partiel et suivi
4. Validation package vs robes
5. Tarification échelonnée (Tiered)
6. Permissions et modifications
7. Vérification disponibilité temps réel
8. Workflow complet de signature

Chaque exemple inclut:
- Scénario détaillé
- Calculs complets
- Code pertinent
- Fichiers impliqués

**Idéal pour**: Tester votre compréhension, valider les implémentations

## Comment Utiliser Cette Documentation

### Si vous devez...

**Corriger un bug de tarification**
1. Consulter QUICK_REFERENCE.md → Section "MONTANTS: FORMULES"
2. Lire BUSINESS_LOGIC_ANALYSIS.md → Section 2 "TARIFICATION"
3. Chercher un exemple similar dans BUSINESS_LOGIC_EXAMPLES.md

**Implémenter une nouvelle fonctionnalité**
1. Comprendre le concept dans BUSINESS_LOGIC_ANALYSIS.md
2. Voir un exemple dans BUSINESS_LOGIC_EXAMPLES.md
3. Vérifier les fichiers critiques listés

**Débugger une validation**
1. Consulter QUICK_REFERENCE.md → "VALIDATIONS CRITIQUES"
2. Lire BUSINESS_LOGIC_ANALYSIS.md → Section 6 "VALIDATION"
3. Vérifier dans BUSINESS_LOGIC_EXAMPLES.md les validations impliquées

**Comprendre les permissions**
1. QUICK_REFERENCE.md → "PERMISSIONS PAR STATUT"
2. BUSINESS_LOGIC_ANALYSIS.md → Section 8 "PERMISSIONS"
3. Fichier: `/src/utils/contractPermissions.ts`

**Ajouter une règle de tarification**
1. BUSINESS_LOGIC_ANALYSIS.md → Section 2 "TARIFICATION"
2. BUSINESS_LOGIC_EXAMPLES.md → Exemple 5 "Tarification Échelonnée"
3. Fichier: `/src/pages/Settings/PricingRules.tsx`

## Concepts Clés à Retenir

### Les 5 Statuts de Contrat
```
DRAFT → PENDING_SIGNATURE → SIGNED
  ↓
PENDING → SIGNED
```

### Les 4 Types de Montants
- **total_price**: Prix réel du contrat (robes + addons)
- **account**: Acompte (50% du total, montant DÛ)
- **account_paid**: Montant payé (peut être partiel)
- **caution**: 500€ fixe (montant DÛ)
- **caution_paid**: Montant payé (peut être partiel)

### Les 4 Stratégies de Tarification
- **PER_DAY**: Prix/jour * jours
- **TIERED**: Réductions par paliers
- **FLAT_RATE**: Forfait par période
- **FIXED_PRICE**: Montant fixe

### TVA Constante (20%)
- HT → TTC: `* 1.20`
- TTC → HT: `* 0.8333...`

## Fichiers Critiques (11 fichiers)

```
/src/api/endpoints/contracts.ts              Contrats API
/src/utils/contractPermissions.ts            Permissions & Rôles
/src/utils/pricing.ts                        Calculs TVA/HT/TTC
/src/pages/ContractBuilder/ContractBuilder.tsx  LOGIQUE PRINCIPALE
/src/api/endpoints/dresses.ts                Robes API
/src/api/endpoints/contractPackages.ts       Forfaits API
/src/api/endpoints/contractAddons.ts         Addons API
/src/api/endpoints/contractTypes.ts          Types Contrats API
/src/api/endpoints/serviceTypes.ts           ServiceTypes API
/src/api/endpoints/pricingRules.ts           Règles Tarification API
/src/constants/catalogue.ts                  Constantes
```

## Questions Fréquentes

**Q: Comment calculer le total d'un contrat?**
R: Voir QUICK_REFERENCE.md → "MONTANTS: FORMULES" ou BUSINESS_LOGIC_EXAMPLES.md → Exemple 1

**Q: Quand change le statut DRAFT → PENDING_SIGNATURE?**
R: BUSINESS_LOGIC_ANALYSIS.md → Section 7.1, ou BUSINESS_LOGIC_EXAMPLES.md → Exemple 8

**Q: Comment fonctionne la caution?**
R: QUICK_REFERENCE.md ou BUSINESS_LOGIC_ANALYSIS.md → Section 1.3.3

**Q: Quelles sont les limitations du mode forfait?**
R: QUICK_REFERENCE.md → "PACKAGES: LIMITATIONS"

**Q: Comment valider le nombre de robes dans un forfait?**
R: BUSINESS_LOGIC_EXAMPLES.md → Exemple 4

**Q: Comment fonctionne la tarification échelonnée?**
R: BUSINESS_LOGIC_ANALYSIS.md → Section 2.1.2 ou BUSINESS_LOGIC_EXAMPLES.md → Exemple 5

## Maintenance

Cette documentation a été générée le **7 décembre 2024** par une analyse approfondie du codebase.

Elle couvre:
- Frontend TypeScript/React
- API endpoints
- Utilities et calculs
- Workflow complet
- Permissions et contrôle d'accès

Pour mettre à jour la documentation:
1. Identifier les changements dans la logique métier
2. Mettre à jour le fichier approprié
3. Indiquer la date de la dernière mise à jour

## Indices de Fichiers Utiles

Pour chaque concept mentionné dans cette documentation, le fichier et la ligne sont indiqués:

Format: `/chemin/vers/fichier.ts` (lignes XX-YY)

Vous pouvez:
- Accéder directement au fichier
- Consulter le contexte (5-10 lignes avant/après)
- Implémenter ou modifier avec confiance

---

**Dernière mise à jour**: 7 décembre 2024
**Version**: 1.0
**Couverture**: 100% de la logique métier frontend
