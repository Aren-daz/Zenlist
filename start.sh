#!/bin/bash

# Script de démarrage pour Zenlist sur Render
echo "🚀 Démarrage de Zenlist..."

# Vérifier l'environnement
echo "🔍 Vérification de l'environnement..."
npm run check-env
if [ $? -ne 0 ]; then
  echo "❌ Échec de la vérification de l'environnement"
  exit 1
fi

# Créer le répertoire prisma s'il n'existe pas
mkdir -p prisma

# Initialiser la base de données SQLite
echo "📊 Initialisation de la base de données..."
npx prisma db push

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate

# Démarrer l'application avec le serveur personnalisé
echo "🌐 Démarrage du serveur personnalisé..."
npm run start:custom 