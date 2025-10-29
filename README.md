# ChefIA Backend

API REST para geração de receitas com IA usando NestJS, Google Gemini e Supabase.

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Google (para Gemini API)
- Conta Supabase (autenticação)
- Conta Render (para deploy)

## 🚀 Início Rápido

### 1. Instalação

```bash
npm install
```

### 2. Configuração de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Preencha as variáveis de ambiente:

```env
# Google Gemini API
GEMINI_API_KEY=sua-chave-aqui

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Aplicação
NODE_ENV=development
PORT=3000
```

### 3. Desenvolvimento

```bash
# Executar em modo desenvolvimento (com hot-reload)
npm run start:dev

# Executar em modo debug
npm run start:debug

# Testar
npm test

# Cobertura de testes
npm run test:cov
```

### 4. Build para Produção

```bash
# Compilar TypeScript
npm run build

# Executar em modo produção
NODE_ENV=production npm run start:prod
```

## 📚 API Endpoints

### Health Check
```
GET /health
```

### Gerar Receitas
```
POST /api/v1/recipes/generate
Authorization: Bearer <supabase-jwt-token>

Body:
{
  "ingredients": ["tomate", "frango", "cebola"]
}
```

### Teste de Geração
```
POST /api/v1/recipes/test
```

## 🔐 Segurança

- ✅ Autenticação via Supabase JWT
- ✅ Validação de entrada com class-validator
- ✅ Rate limiting (100 req/min)
- ✅ CORS configurável
- ✅ Caching de resultados (1 hora)

### Variáveis de Ambiente em Produção

**NUNCA** committar `.env` com valores reais no repositório. Use apenas `.env.example`.

Para deploy no Render:
1. Vá para Render Dashboard
2. Selecione seu serviço
3. Abra "Environment"
4. Configure cada variável necessária

## 📦 Deploy no Render

### Opção 1: Via GitHub (Recomendado)

1. Push seu código para GitHub:
   ```bash
   git add .
   git commit -m "Preparado para deploy"
   git push origin main
   ```

2. No Render Dashboard:
   - Clique em "New +"
   - Selecione "Web Service"
   - Conecte seu repositório GitHub
   - Configure:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run start:prod`
     - **Node Version**: 18
   
3. Configure as variáveis de ambiente:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: [Sua chave real]
   - `SUPABASE_URL`: [Sua URL]
   - `SUPABASE_ANON_KEY`: [Sua key]
   - `SUPABASE_SERVICE_ROLE_KEY`: [Sua key]
   - `CORS_ORIGINS`: [URLs do seu frontend]
   - `PORT`: `3000`

4. Clique em "Deploy"

### Opção 2: Deploy Manual

1. Build local:
   ```bash
   npm run build
   ```

2. Upload da pasta `dist/` e `package.json` para Render via CLI:
   ```bash
   npm install -g render-cli
   render deploy
   ```

## 🐛 Troubleshooting

### Erro: GEMINI_API_KEY não configurada
- Verifique se `.env` existe no diretório raiz
- Confira se `GEMINI_API_KEY` está preenchida
- Em produção, configure no Render Dashboard

### Erro: Supabase não conectado
- Verifique URLs e chaves do Supabase
- Teste em https://supabase.com - Verificar Status

### Erro 401 - Unauthorized
- Verifique se está enviando o token JWT correto no header `Authorization: Bearer <token>`
- Confira se o token não expirou

## 📊 Logs e Monitoramento

Todos os endpoints registram logs via Winston. Em produção, considere integrar com:
- Sentry (error tracking)
- LogRocket (session replay)
- New Relic (APM)

## 🧪 Testes

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 📝 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run build` | Compila TypeScript |
| `npm start` | Executa em produção |
| `npm run start:dev` | Desenvolvimento com hot-reload |
| `npm run start:debug` | Debug mode |
| `npm run start:prod` | Produção |
| `npm run format` | Formata código com Prettier |
| `npm run lint` | Lint com ESLint |
| `npm test` | Testes unitários |
| `npm run test:e2e` | Testes E2E |
| `npm run test:cov` | Cobertura de testes |

## 🔄 CI/CD

O projeto está pronto para CI/CD. Configure via:
- GitHub Actions
- GitLab CI
- Render Deploys (automático ao fazer push)

## 📝 Estrutura do Projeto

```
src/
├── main.ts                 # Entry point
├── app.module.ts          # Module raiz
├── guards/
│   └── auth.guard.ts      # Guard de autenticação
└── modules/
    └── recipes/
        ├── recipes.controller.ts
        ├── recipes.service.ts
        ├── recipes.module.ts
        ├── dto/
        │   └── generate-recipes.dto.ts
        └── services/
            ├── gemini.service.ts      # Integração com Gemini AI
            └── supabase.service.ts    # Integração com Supabase
```

## 🤝 Contribuindo

1. Crie uma branch para sua feature: `git checkout -b feature/MinhaFeature`
2. Commit: `git commit -m "Adiciona MinhaFeature"`
3. Push: `git push origin feature/MinhaFeature`
4. Abra um Pull Request

## 📄 Licença

MIT

## 👥 Autor

ChefIA Team

## 📞 Suporte

Para problemas ou dúvidas:
- Abra uma issue no GitHub
- Verificar logs em Render Dashboard
- Contatar o time de desenvolvimento
