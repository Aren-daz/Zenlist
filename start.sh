#!/bin/bash

# Script de démarrage pour Zenlist sur Render
echo "🚀 Démarrage de Zenlist..."

# Créer le répertoire prisma s'il n'existe pas
mkdir -p prisma

# Initialiser la base de données SQLite
echo "📊 Initialisation de la base de données..."
npx prisma db push

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate

# Démarrer l'application
echo "🌐 Démarrage du serveur..."
npm start 