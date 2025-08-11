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

# Générer le client Prisma
RUN npx prisma generate

# Construire l'application
RUN npm run build

# Rendre le script de démarrage exécutable
RUN chmod +x start.sh

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["./start.sh"] 