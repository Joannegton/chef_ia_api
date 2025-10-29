#!/usr/bin/env node

/**
 * Script de validação pré-deploy
 * Verifica se todas as variáveis de ambiente estão configuradas
 */

const fs = require('fs');
const path = require('path');

const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'GEMINI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const optionalEnvVars = [
  'CORS_ORIGINS',
  'RATE_LIMIT_TTL',
  'RATE_LIMIT_MAX',
  'CACHE_TTL',
  'CACHE_MAX_ITEMS',
  'GEMINI_TIMEOUT',
  'GEMINI_RETRY_ATTEMPTS',
  'JWT_SECRET',
];

function validateEnvironment() {
  console.log('🔍 Validando variáveis de ambiente...\n');

  let hasErrors = false;
  let missingOptional = [];

  // Verificar variáveis obrigatórias
  console.log('📋 Verificando variáveis obrigatórias:');
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.log(`  ❌ ${envVar} - NÃO CONFIGURADO`);
      hasErrors = true;
    } else {
      const value = process.env[envVar];
      const masked = value.substring(0, 5) + '***' + (value.length > 5 ? value.substring(value.length - 5) : '');
      console.log(`  ✅ ${envVar} - ${masked}`);
    }
  });

  console.log('\n📋 Verificando variáveis opcionais:');
  optionalEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.log(`  ⚠️  ${envVar} - não configurado (usando padrão)`);
      missingOptional.push(envVar);
    } else {
      console.log(`  ✅ ${envVar} - configurado`);
    }
  });

  if (hasErrors) {
    console.log('\n❌ ERRO: Variáveis obrigatórias faltando!');
    console.log('\n📝 Ações necessárias:');
    console.log('   1. Copie .env.example para .env');
    console.log('   2. Preencha todas as variáveis obrigatórias');
    console.log('   3. Tente novamente');
    process.exit(1);
  }

  if (missingOptional.length > 0) {
    console.log(`\n⚠️  ${missingOptional.length} variáveis opcionais não configuradas`);
    console.log('   Valores padrão serão usados');
  }

  console.log('\n✅ Validação bem-sucedida!');
  console.log('   Pronto para deploy 🚀\n');
}

// Executar validação
validateEnvironment();
