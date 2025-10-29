# 🚀 Guia Completo de Deploy - ChefIA Backend

## ⚠️ SEGURANÇA - LEIA ANTES DE FAZER DEPLOY

### Credenciais Expostas (AÇÃO NECESSÁRIA)

Seu arquivo `.env` foi encontrado com credenciais REAIS. **NÃO COMMITE ISTO NO GIT!**

✅ Já está no `.gitignore`, mas certifique-se:

```bash
# Verificar status do git
git status

# Se .env está ainda na staging area, remova:
git reset .env
git rm --cached .env
```

### Regenerar Credenciais (RECOMENDADO)

Por segurança, regenere todas as chaves que podem ter sido expostas:

1. **Google Gemini API Key**
   - Acesse: https://makersuite.google.com/app/apikey
   - Delete a chave anterior
   - Crie uma nova chave
   - Atualize em `.env` (local) e Render Dashboard (produção)

2. **Supabase Keys**
   - Acesse: https://supabase.com/dashboard
   - Vá para Settings → API Keys
   - Clique em "Reveal" e regenere as chaves
   - Atualize em `.env` (local) e Render Dashboard (produção)

---

## 📋 Checklist Pré-Deploy

- [ ] `.env` foi removido do git (`git status` deve estar limpo)
- [ ] Credenciais regeneradas (Gemini e Supabase)
- [ ] `.env.example` preenchido com valores de EXEMPLO (sem credenciais reais)
- [ ] `npm install` executado
- [ ] `npm run lint` passou sem erros
- [ ] `npm run build` gerou pasta `dist/`
- [ ] `npm run validate:deploy` passou
- [ ] Testes passando: `npm test`
- [ ] Testado localmente em produção: `NODE_ENV=production npm run start:prod`
- [ ] Health check respondendo: `curl http://localhost:3000/health`

---

## 🔧 Preparação Local

### 1. Validar Ambiente

```bash
# Validar variáveis de ambiente
npm run validate:deploy

# Deve exibir:
# ✅ NODE_ENV - configured
# ✅ GEMINI_API_KEY - ****...****
# ✅ SUPABASE_URL - ****...****
# etc.
```

### 2. Build Local

```bash
# Limpeza
rm -rf dist node_modules

# Reinstalar dependências
npm install

# Build
npm run build

# Deve gerar pasta dist/ com sucesso
```

### 3. Testar em "Produção" Localmente

```bash
# Rodando como seria em produção
NODE_ENV=production \
GEMINI_API_KEY=seu_key_aqui \
SUPABASE_URL=sua_url_aqui \
SUPABASE_ANON_KEY=sua_key_aqui \
SUPABASE_SERVICE_ROLE_KEY=sua_key_aqui \
PORT=3000 \
npm run start:prod

# Em outro terminal, testar:
curl http://localhost:3000/health

# Deve retornar:
# {
#   "status": "ok",
#   "timestamp": "2025-10-29T...",
#   "uptime": 2.3,
#   "environment": "production",
#   "version": "1.0.0"
# }
```

### 4. Testes

```bash
# Rodar todos os testes
npm test

# Com coverage
npm run test:cov

# E2E
npm run test:e2e
```

---

## 🌐 Deploy no Render.com

### Passo 1: Preparar Repositório

```bash
# Verificar status
git status

# Commit das mudanças
git add .
git commit -m "Deploy: Preparado para produção

- Atualizado configuração CORS para produção
- Adicionado script de validação pré-deploy
- Adicionado README.md com instruções
- Adicionado DEPLOYMENT.md
- Atualizado .env.example com todas as variáveis"

# Push para main
git push origin main
```

### Passo 2: Criar Serviço no Render

1. Acesse: https://render.com/dashboard
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório GitHub
4. Configure:

| Campo | Valor |
|-------|-------|
| **Name** | `chefia-api` (ou nome de sua escolha) |
| **Environment** | `Node` |
| **Region** | `Ohio` (ou próximo a você) |
| **Branch** | `main` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Node Version** | `18` |

### Passo 3: Configurar Variáveis de Ambiente

1. Na página do serviço, vá para **"Environment"**
2. Clique em **"Add Environment Variable"** para cada:

```
NODE_ENV = production
PORT = 3000
GEMINI_API_KEY = [SUA_CHAVE_REAL_AQUI]
SUPABASE_URL = [SUA_URL_REAL_AQUI]
SUPABASE_ANON_KEY = [SUA_KEY_REAL_AQUI]
SUPABASE_SERVICE_ROLE_KEY = [SUA_KEY_REAL_AQUI]
CORS_ORIGINS = https://seu-frontend.com,https://outro-frontend.com
RATE_LIMIT_TTL = 60000
RATE_LIMIT_MAX = 100
CACHE_TTL = 3600000
CACHE_MAX_ITEMS = 100
```

⚠️ **IMPORTANTE**: Estas variáveis são armazenadas SEGURAMENTE no Render (não no git)

### Passo 4: Deploy

1. Clique em **"Create Web Service"**
2. Render começará o build automaticamente
3. Monitorar em **"Logs"** enquanto faz build e start

Esperado ver:
```
> npm run start:prod
🚀 ChefIA Backend running on port 3000
📍 Environment: production
🔗 Health check: http://localhost:3000/health
📚 API docs: http://localhost:3000/api/v1
```

### Passo 5: Testar Deploy

```bash
# Substitua URL_DO_SEU_RENDER pela URL que recebeu
RENDER_URL="https://seu-app-render.onrender.com"

# Testar health check
curl $RENDER_URL/health

# Deve retornar JSON com status ok
```

---

## 📱 Configurar Frontend para Conectar

### Flutter/Mobile

```dart
// No seu cliente HTTP, use:
const String API_BASE_URL = 'https://seu-app-render.onrender.com/api/v1';

// Exemplo de requisição:
final response = await http.post(
  Uri.parse('$API_BASE_URL/recipes/generate'),
  headers: {
    'Authorization': 'Bearer $supabaseToken',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({
    'ingredients': ['tomate', 'frango', 'cebola']
  }),
);
```

### Web (React, Vue, etc)

```javascript
// No seu cliente fetch/axios:
const API_BASE_URL = 'https://seu-app-render.onrender.com/api/v1';

// Exemplo:
const response = await fetch(`${API_BASE_URL}/recipes/generate`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ingredients: ['tomate', 'frango', 'cebola']
  })
});
```

---

## 🔍 Troubleshooting Deploy

### Build falha com "EACCES: permission denied"

```bash
# Limpar cache npm
npm cache clean --force

# Reinstalar
npm install

# Build novamente
npm run build
```

### Erro "Cannot find module"

```bash
# Verificar package.json
npm ls

# Reinstalar node_modules
rm -rf node_modules package-lock.json
npm install
```

### Erro de variáveis de ambiente no Render

1. Verifique se TODAS as variáveis estão no Render Dashboard
2. Restart o serviço: Render Dashboard → Service → "Manual Deploy"
3. Verificar logs: Render Dashboard → Logs

### Erro 502 Bad Gateway

Geralmente significa que a aplicação não iniciou corretamente:
1. Verificar logs no Render
2. Validar variáveis de ambiente
3. Tentar fazer re-deploy

```bash
# No Render Dashboard
Click "Manual Deploy" → "Latest Commit"
```

---

## 📊 Monitoramento em Produção

### Health Check Contínuo

```bash
# Verificar se está rodando
while true; do
  curl -s https://seu-app-render.onrender.com/health | jq .
  sleep 60
done
```

### Visualizar Logs em Tempo Real

1. Acesse Render Dashboard
2. Selecione seu serviço
3. Clique em **"Logs"**
4. Veja logs em tempo real

### Alertas e Notificações

Configure no Render Dashboard:
1. Settings → Notifications
2. Adicione email para alerts
3. Configure alertas para:
   - Build failure
   - Deploy failure
   - Service crashes

---

## 🔄 Updates e Redeploy

### Deploy de Nova Versão

```bash
# Fazer mudanças no código
# ... editar arquivos ...

# Testar localmente
npm run start:dev
npm test

# Commit e push
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

Render fará redeploy automaticamente quando detectar push no branch `main`.

### Rollback

Se algo der errado:

1. Render Dashboard → Deployments
2. Localize deploy anterior que funcionava
3. Clique em "Redeploy"

---

## 🎯 Próximos Passos

- [ ] Configurar domínio customizado (Render permite)
- [ ] Adicionar Swagger/OpenAPI documentation
- [ ] Configurar logs centralizados (Datadog, LogRocket, Sentry)
- [ ] Adicionar testes E2E
- [ ] Configurar rate limiting mais agressivo em produção
- [ ] Adicionar cache com Redis
- [ ] Implementar API versioning

---

## 📞 Suporte

Se encontrar problemas:

1. **Verifique logs**: `Render Dashboard → Logs`
2. **Teste localmente**: `NODE_ENV=production npm run start:prod`
3. **Valide config**: `npm run validate:deploy`
4. **Verifique credenciais**: Abra `.env.example` e compare com Render Dashboard

---

**🎉 Parabéns! Seu backend está pronto para produção!**
