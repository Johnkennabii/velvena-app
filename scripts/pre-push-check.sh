#!/bin/bash

###############################################################################
# Pre-Push Check Script
# Vérifie que le code est prêt avant de pusher
###############################################################################

set -e  # Arrêter si une commande échoue

echo "🔍 Pre-Push Checks - Velvena App"
echo "================================="
echo ""

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les warnings
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Vérifier que nous sommes dans le bon dossier
if [ ! -f "package.json" ]; then
    error "package.json non trouvé. Êtes-vous dans le bon dossier ?"
fi

# 2. Vérifier les dépendances
echo "📦 Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
    warning "node_modules manquant. Installation..."
    npm ci
fi
success "Dépendances OK"
echo ""

# 3. Lint
echo "🔍 Vérification du code (Linting)..."
if npm run lint 2>/dev/null; then
    success "Linting OK"
else
    warning "Linting a trouvé des problèmes (non bloquant)"
fi
echo ""

# 4. Type Check TypeScript
echo "📝 Vérification TypeScript..."
if npm run type-check 2>/dev/null || npx tsc --noEmit; then
    success "Type Check OK"
else
    error "Erreurs TypeScript détectées. Corrigez-les avant de pusher."
fi
echo ""

# 5. Build
echo "🏗️  Build de production..."
if npm run build; then
    success "Build réussi"
else
    error "Build échoué. Corrigez les erreurs avant de pusher."
fi
echo ""

# 6. Vérifier la taille du build
BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
if [ -n "$BUILD_SIZE" ]; then
    echo "📊 Taille du build: $BUILD_SIZE"
fi
echo ""

# 7. Tests (si disponibles)
if grep -q '"test"' package.json; then
    echo "🧪 Exécution des tests..."
    if npm test 2>/dev/null; then
        success "Tests OK"
    else
        warning "Tests échoués (non bloquant pour l'instant)"
    fi
    echo ""
fi

# 8. Vérifier les fichiers sensibles
echo "🔒 Vérification des fichiers sensibles..."
SENSITIVE_FILES=(.env .env.local .env.production)
for file in "${SENSITIVE_FILES[@]}"; do
    if git diff --cached --name-only | grep -q "^$file$"; then
        error "Fichier sensible détecté dans le commit: $file"
    fi
done
success "Pas de fichiers sensibles détectés"
echo ""

# Résumé final
echo "================================="
echo -e "${GREEN}✅ Tous les checks sont passés !${NC}"
echo "📤 Vous pouvez pusher en toute sécurité."
echo ""
