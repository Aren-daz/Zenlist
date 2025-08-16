#!/usr/bin/env node

// Script de vérification de l'environnement pour Render
console.log('🔍 Vérification de l\'environnement Zenlist...\n');

// Vérifier les variables d'environnement essentielles
const requiredEnvVars = [
  'NODE_ENV',
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

const optionalEnvVars = [
  'PORT',
  'NEXT_PUBLIC_SOCKET_URL'
];

console.log('📋 Variables d\'environnement requises:');
let missingRequired = false;

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`  ✅ ${envVar}: ${envVar === 'NEXTAUTH_SECRET' ? '***' : value}`);
  } else {
    console.log(`  ❌ ${envVar}: MANQUANT`);
    missingRequired = true;
  }
});

console.log('\n📋 Variables d\'environnement optionnelles:');
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`  ✅ ${envVar}: ${value}`);
  } else {
    console.log(`  ⚠️  ${envVar}: Non défini (utilise la valeur par défaut)`);
  }
});

// Vérifier la base de données
console.log('\n🗄️  Configuration de la base de données:');
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  if (dbUrl.startsWith('file:')) {
    console.log('  📁 Type: SQLite (fichier local)');
    console.log(`  📍 Chemin: ${dbUrl.replace('file:', '')}`);
  } else if (dbUrl.startsWith('postgresql://')) {
    console.log('  🐘 Type: PostgreSQL');
  } else {
    console.log(`  🔗 Type: ${dbUrl.split('://')[0]}`);
  }
} else {
  console.log('  ❌ DATABASE_URL non définie');
}

// Vérifier la configuration du port
console.log('\n🌐 Configuration du serveur:');
const port = process.env.PORT || '3000';
console.log(`  🔌 Port: ${port}`);
console.log(`  🏠 Host: 0.0.0.0 (configuré pour les containers)`);

// Résumé
console.log('\n📊 Résumé:');
if (missingRequired) {
  console.log('  ❌ Configuration incomplète - Des variables requises sont manquantes');
  process.exit(1);
} else {
  console.log('  ✅ Configuration complète - Prêt pour le déploiement');
  console.log('\n🚀 Pour démarrer: npm run start:custom');
}
