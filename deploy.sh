#!/bin/bash

# Script de déploiement Allure Creation App
# Usage: ./deploy.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 Démarrage du déploiement..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
VPS_HOST="root@65.21.53.243"
VPS_PATH="/var/www/allure-creation-app"
LOCAL_DIST="./dist"

echo -e "${BLUE}📦 Étape 1/4: Build de l'application...${NC}"
npm run build

if [ ! -d "$LOCAL_DIST" ]; then
    echo -e "${RED}❌ Erreur: Le dossier dist/ n'existe pas après le build${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build terminé${NC}"

echo -e "${BLUE}📤 Étape 2/4: Push sur GitHub...${NC}"
# Vérifier s'il y a des changements non commités
if [[ -n $(git status -s) ]]; then
    echo -e "${RED}⚠️  Attention: Il y a des modifications non commitées${NC}"
    git status -s
    read -p "Voulez-vous continuer sans les commiter? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Déploiement annulé${NC}"
        exit 1
    fi
fi

git push origin main
echo -e "${GREEN}✅ Push GitHub terminé${NC}"

echo -e "${BLUE}🚀 Étape 3/4: Création de l'archive du build...${NC}"
cd dist
tar -czf ../dist.tar.gz .
cd ..
echo -e "${GREEN}✅ Archive créée${NC}"

echo -e "${BLUE}📡 Étape 4/4: Déploiement sur le VPS...${NC}"

# Backup de l'ancien build sur le VPS
echo "   → Sauvegarde de l'ancien build..."
ssh $VPS_HOST "cd $VPS_PATH && mkdir -p backups && tar -czf backups/backup.$(date +%Y%m%d-%H%M%S).tar.gz assets images index.html favicon.png 2>/dev/null || true"

# Suppression des anciens fichiers
echo "   → Nettoyage des anciens fichiers..."
ssh $VPS_HOST "cd $VPS_PATH && rm -rf assets images index.html favicon.png .DS_Store"

# Upload de l'archive
echo "   → Upload de l'archive..."
scp dist.tar.gz $VPS_HOST:$VPS_PATH/

# Extraction sur le VPS (directement dans le dossier racine)
echo "   → Extraction sur le VPS..."
ssh $VPS_HOST "cd $VPS_PATH && tar -xzf dist.tar.gz && rm dist.tar.gz && rm -f .DS_Store ._* 2>/dev/null || true"

# Rechargement de Nginx
echo "   → Rechargement de Nginx..."
ssh $VPS_HOST "systemctl reload nginx"

# Nettoyage local
rm dist.tar.gz

echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo -e "${GREEN}🌐 L'application est maintenant en ligne sur le VPS${NC}"
echo -e "${GREEN}🔄 Nginx rechargé${NC}"
echo ""
echo "URL de l'application: https://allure-creation.fr (ou votre domaine)"
