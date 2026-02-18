# Guia de Deploy - Relatório Termografia

## Deploy via Coolify com Nixpacks

### Configurações Recomendadas

#### Build Command
```bash
npm install && npm run build
```

#### Start Command (para preview)
```bash
npm run preview
```

### Variáveis de Ambiente

**Obrigatória:**

- `VITE_API_URL` - URL base da API para buscar dados dos relatórios
  - Exemplo: `https://api.jundpred.com.br/api`
  - Padrão (se não configurada): `/api`

**Como configurar no Coolify:**

1. Acesse seu projeto no Coolify
2. Vá em **Environment Variables**
3. Adicione a variável:
   - Nome: `VITE_API_URL`
   - Valor: URL completa da sua API
4. Salve e faça o redeploy

### Configurações de Build

O projeto usa:
- **Node.js**: v18 ou superior
- **Package Manager**: npm
- **Builder**: Vite
- **TypeScript**: 5.8.3

### Estrutura de Build

```
build/
├── tsc           # TypeScript compiler validation
└── vite build    # Production build com otimizações
```

### Output

O build gera arquivos estáticos na pasta `dist/`:
- `index.html` - Entry point
- `assets/` - JavaScript, CSS e imagens otimizadas

### Troubleshooting

#### Erro: Module not found

**Causa**: Configuração incorreta de `moduleResolution` no tsconfig.

**Solução**: O projeto foi configurado com `moduleResolution: "node"` para máxima compatibilidade com ambientes CI/CD.

#### Erro: @import CSS

**Causa**: @import deve vir antes das diretivas @tailwind.

**Solução**: Já corrigido no `src/index.css`.

#### Build lento no Nixpacks

**Dica**: Certifique-se de que o cache do npm está habilitado no Coolify para acelerar builds subsequentes.

### Deploy em Outros Ambientes

#### Vercel
```bash
npm run build
# Configure output directory: dist
```

#### Netlify
```bash
npm run build
# Publish directory: dist
```

#### Ambiente Docker
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Verificação Local

Para testar o build localmente:

```bash
# Build
npm run build

# Preview do build
npm run preview
```

### Performance

O build otimizado inclui:
- ✅ Tree shaking
- ✅ Minificação de JavaScript
- ✅ Minificação de CSS
- ✅ Otimização de imagens
- ✅ Code splitting automático
- ✅ Compression gzip

### Suporte

Para problemas específicos do Coolify/Nixpacks, verifique:
1. Logs de build no Coolify
2. Versão do Node.js usada
3. Variáveis de ambiente configuradas
