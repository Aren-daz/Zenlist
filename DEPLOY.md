# 🚀 Guide de Déploiement Zenlist sur Render

## Configuration des Variables d'Environnement

### Variables Requises

Dans votre dashboard Render, ajoutez ces variables d'environnement :

```env
NODE_ENV=production
DATABASE_URL=file:./db/custom.db
NEXTAUTH_SECRET=votre-secret-ultra-securise-32-caracteres-minimum
NEXTAUTH_URL=https://votre-app.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://votre-app.onrender.com
```

### Génération du NEXTAUTH_SECRET

```bash
# Générer un secret aléatoire sécurisé
openssl rand -base64 32
```

## Configuration du Service Render

### Option 1 : Via render.yaml (Recommandé)

Le fichier `render.yaml` est configuré automatiquement. Assurez-vous que vos variables d'environnement sont définies dans le dashboard.

### Option 2 : Configuration Manuelle

1. **Type de Service** : Web Service
2. **Runtime** : Node
3. **Build Command** : `npm install && npm run build`
4. **Start Command** : `npx prisma db push && npm run start:custom`
5. **Port** : Automatique (Render définit $PORT)

## Vérification Avant Déploiement

Testez localement avec les variables de production :

```bash
# Vérifier la configuration
npm run check-env

# Tester le build
npm run build

# Tester le serveur personnalisé
npm run start:custom
```

## Structure des Fichiers de Déploiement

```
├── render.yaml          # Configuration Render
├── Dockerfile           # Configuration Docker
├── start.sh             # Script de démarrage
├── check-env.js         # Vérification environnement
└── server.ts            # Serveur personnalisé Next.js + Socket.IO
```

## Résolution des Problèmes Courants

### ❌ "sh: next: not found"
- **Cause** : Utilisation de `next start` au lieu du serveur personnalisé
- **Solution** : Utiliser `npm run start:custom`

### ❌ Socket.IO ne fonctionne pas
- **Cause** : Configuration CORS ou URL incorrecte
- **Solution** : Vérifier `NEXT_PUBLIC_SOCKET_URL`

### ❌ Base de données non trouvée
- **Cause** : `DATABASE_URL` mal configurée
- **Solution** : Utiliser `file:./db/custom.db` pour SQLite

### ❌ Erreurs d'authentification
- **Cause** : `NEXTAUTH_SECRET` ou `NEXTAUTH_URL` incorrects
- **Solution** : Régénérer le secret et vérifier l'URL

## Migration vers PostgreSQL (Optionnel)

Pour une base de données PostgreSQL en production :

1. Créer une base PostgreSQL sur Render
2. Modifier `DATABASE_URL` vers PostgreSQL
3. Mettre à jour `prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

4. Exécuter les migrations :

```bash
npx prisma migrate deploy
```

## Surveillance et Logs

- **Health Check** : `/api/health`
- **Logs** : Consultables dans le dashboard Render
- **Monitoring** : Le script `check-env.js` valide la configuration

## Support

En cas de problème :

1. Vérifiez les logs dans le dashboard Render
2. Exécutez `npm run check-env` localement
3. Consultez la documentation Render officielle

---

🎉 **Votre application Zenlist est maintenant prête pour la production !**
