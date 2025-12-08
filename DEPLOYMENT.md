# 🚀 Guide de Déploiement - Velvena App

## 📋 Prérequis

- VPS avec Docker installé
- Accès SSH au VPS
- Repository GitHub avec les permissions appropriées
- Port 4173 (ou autre) disponible sur le VPS

## 🔐 Configuration des Secrets GitHub

Pour que le déploiement automatique fonctionne, vous devez configurer les secrets suivants dans votre repository GitHub :

### 1. Aller dans les Settings du Repository

```
GitHub Repository → Settings → Secrets and variables → Actions → New repository secret
```

### 2. Ajouter les Secrets Suivants

| Secret | Description | Exemple |
|--------|-------------|---------|
| `VPS_HOST` | Adresse IP ou domaine de votre VPS | `123.45.67.89` ou `vps.velvena.fr` |
| `VPS_USERNAME` | Nom d'utilisateur SSH | `root` ou `deploy` |
| `VPS_SSH_KEY` | Clé privée SSH pour se connecter au VPS | Contenu de `~/.ssh/id_rsa` |
| `VPS_SSH_PORT` | Port SSH (optionnel, défaut: 22) | `22` ou `2222` |

### 3. Générer une Clé SSH (si vous n'en avez pas)

Sur votre machine locale :

```bash
# Générer une nouvelle clé SSH
ssh-keygen -t ed25519 -C "github-actions-velvena" -f ~/.ssh/velvena_deploy

# Copier la clé publique sur le VPS
ssh-copy-id -i ~/.ssh/velvena_deploy.pub user@votre-vps-ip

# Afficher la clé privée pour la copier dans GitHub Secrets
cat ~/.ssh/velvena_deploy
```

Copiez **tout le contenu** de la clé privée (y compris les lignes `-----BEGIN` et `-----END`) dans le secret `VPS_SSH_KEY`.

## 🔄 Déploiement Automatique

### Déclenchement Automatique

Le workflow se déclenche automatiquement à chaque :
- ✅ Push sur la branche `main`
- ✅ Déclenchement manuel via l'interface GitHub Actions

### Pipeline CI/CD

1. **🧪 Run Tests** - Exécute les tests et vérifications de code
2. **🏗️ Build Docker Image** - Construit l'image Docker
3. **📦 Push to Registry** - Push l'image vers GitHub Container Registry
4. **🔒 Security Scan** - Scan de sécurité avec Trivy
5. **🚀 Deploy to Server** - Déploiement sur le VPS
6. **✅ Health Check** - Vérification que l'application fonctionne

### Déploiement Manuel

Pour déclencher manuellement un déploiement :

1. Aller sur GitHub → Actions
2. Sélectionner le workflow "Deploy Velvena App"
3. Cliquer sur "Run workflow"
4. Sélectionner la branche `main`
5. Cliquer sur "Run workflow"

## 📦 Structure du Déploiement

```
VPS:
├── Docker Container: velvena-frontend
│   ├── Image: ghcr.io/johnkennabii/velvena-app:latest
│   ├── Port: 127.0.0.1:4173:80
│   └── Restart Policy: unless-stopped
│
└── Nginx/Traefik (Reverse Proxy)
    └── Proxy: app.velvena.fr → localhost:4173
```

## 🔧 Configuration du Reverse Proxy

### Si vous utilisez Nginx

Créer un fichier `/etc/nginx/sites-available/velvena-app` :

```nginx
server {
    listen 80;
    server_name app.velvena.fr;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.velvena.fr;

    # SSL Configuration (avec Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/app.velvena.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.velvena.fr/privkey.pem;

    # Reverse Proxy vers le conteneur Docker
    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for socket.io
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer le site :

```bash
sudo ln -s /etc/nginx/sites-available/velvena-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Obtenir un Certificat SSL avec Certbot

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d app.velvena.fr
```

## 🛠️ Commandes Utiles sur le VPS

### Vérifier le Statut du Conteneur

```bash
docker ps | grep velvena-frontend
docker logs velvena-frontend
docker logs -f velvena-frontend  # Suivre les logs en temps réel
```

### Redémarrer l'Application

```bash
docker restart velvena-frontend
```

### Mettre à Jour Manuellement

```bash
# Stopper et supprimer le conteneur
docker stop velvena-frontend
docker rm velvena-frontend

# Télécharger la dernière image
docker pull ghcr.io/johnkennabii/velvena-app:latest

# Relancer le conteneur
docker run -d \
  --name velvena-frontend \
  --restart unless-stopped \
  -p 127.0.0.1:4173:80 \
  ghcr.io/johnkennabii/velvena-app:latest
```

### Nettoyer les Images Inutilisées

```bash
docker image prune -f
docker system prune -a --volumes -f  # Attention : supprime TOUT ce qui n'est pas utilisé
```

## 🐛 Dépannage

### Le Container est "unhealthy"

```bash
# Vérifier les logs
docker logs velvena-frontend

# Vérifier le health check
curl http://localhost:4173/health.html

# Tester l'accès au site
curl -I http://localhost:4173/
```

### Le Déploiement Échoue

1. Vérifier les secrets GitHub
2. Vérifier les logs de l'action GitHub
3. Se connecter au VPS et vérifier les logs Docker
4. Vérifier que le port 4173 n'est pas déjà utilisé

### Impossible de Se Connecter au Site

1. Vérifier que le conteneur tourne : `docker ps`
2. Vérifier Nginx/Traefik : `sudo nginx -t && sudo systemctl status nginx`
3. Vérifier les certificats SSL : `sudo certbot certificates`
4. Vérifier les DNS : `nslookup app.velvena.fr`

## 📊 Monitoring

### Vérifier la Santé de l'Application

```bash
# Health check endpoint
curl http://localhost:4173/health.html

# Vérifier les ressources utilisées
docker stats velvena-frontend

# Vérifier l'espace disque
docker system df
```

### Logs

```bash
# Logs du conteneur
docker logs velvena-frontend --tail 100

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🔄 Rollback en Cas de Problème

Si la nouvelle version pose problème, vous pouvez revenir à la version précédente :

```bash
# Lister les images disponibles
docker images | grep velvena-app

# Revenir à une version spécifique (SHA)
docker stop velvena-frontend
docker rm velvena-frontend
docker run -d \
  --name velvena-frontend \
  --restart unless-stopped \
  -p 127.0.0.1:4173:80 \
  ghcr.io/johnkennabii/velvena-app:main-abc1234
```

## 📝 Variables d'Environnement

Les variables d'environnement sont définies au moment du build de l'image Docker :

- `VITE_API_URL` : URL de l'API backend (défaut: `https://api.velvena.fr`)
- `VITE_APP_NAME` : Nom de l'application (défaut: `Velvena`)
- `VITE_APP_ENVIRONMENT` : Environnement (défaut: `production`)

Pour modifier ces variables, éditez le fichier `.github/workflows/deploy.yml`.

## 🎯 Prochaines Étapes

1. ✅ Configurer les secrets GitHub
2. ✅ Push le code sur `main` pour déclencher le déploiement
3. ✅ Configurer le reverse proxy Nginx
4. ✅ Obtenir un certificat SSL
5. ✅ Tester l'application sur https://app.velvena.fr

## 💡 Support

En cas de problème :
1. Vérifier les logs GitHub Actions
2. Vérifier les logs Docker sur le VPS
3. Vérifier la configuration Nginx
4. Contacter l'équipe de support

---

**Documentation créée le :** $(date)
**Version :** 1.0.0
