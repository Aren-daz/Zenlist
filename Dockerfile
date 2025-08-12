# Dockerfile pour Zenlist avec SQLite
FROM node:18-alpine

# Installer les dépendances nécessaires
RUN apk add --no-cache libc6-compat sqlite

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Créer le dossier de base de données si on utilise un fichier custom
RUN mkdir -p db

# Générer le client Prisma
RUN npx prisma generate

# Construire l'application
RUN npm run build

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
# Fallback si DATABASE_URL n'est pas fourni par l'environnement Render
ENV DATABASE_URL=file:./db/custom.db

# Exposer le port
EXPOSE 3000

# Commande de démarrage (appliquer le schéma Prisma avant de démarrer)
# Force Next à écouter sur le PORT Render (fallback 3000) et 0.0.0.0
CMD ["sh", "-c", "npx prisma db push && next start -p ${PORT:-3000} -H 0.0.0.0"]