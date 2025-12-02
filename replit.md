# Lavei App

**Aplicativo mobile nativo para intermediação de serviços de lavagem automotiva.**

- **Empresa**: Lavei Intermediação e Negócios Digitais Ltda.
- **Domínio em Produção**: https://lavei.app
- **Última atualização**: Dezembro 2025

## Branding

- **Amarelo Lavei**: `#f0b100` (cor principal)
- **Azul Escuro**: `#071121` (contraste)
- **Ícone SVG**: `assets/Ico-LAVEI.svg`

## Stack Tecnológico

### Mobile (React Native + Expo)
- **Expo SDK 52** com Expo Router (navegação por arquivos)
- **expo-notifications** para push em background/foreground
- **expo-secure-store** para dados sensíveis
- **TypeScript**

### Backend (Express.js)
- **Express 5** + TypeScript
- **Drizzle ORM** com PostgreSQL (Neon)
- **Autenticação**: Email/Senha + Google OAuth (Passport.js)

## Estrutura do Projeto

```
├── app/                    # Telas Expo Router
│   ├── index.tsx          # Login
│   └── (tabs)/            # Navegação principal
│       ├── index.tsx      # Início
│       ├── history.tsx    # Histórico
│       └── account.tsx    # Conta
├── server/                # Backend Express
│   ├── routes.ts          # Endpoints API
│   ├── storage.ts         # Drizzle + BD
│   ├── auth.ts            # Autenticação (Email/Senha + Google)
│   └── index.ts           # Entry point
├── lib/                   # Hooks & utilitários
│   ├── useAuth.ts        # Hook autenticação
│   └── notifications.ts  # Serviço push
├── shared/               # Código compartilhado
│   └── schema.ts         # Schema Drizzle
└── assets/               # Ícones & imagens
```

## Comandos

```bash
npm start              # Expo (mobile)
npm run server         # Backend API
npm run android/ios    # Nativo
npm run db:push        # Sincronizar schema
```

## API Endpoints

### Notificações
- `POST /api/notifications/register` - Registrar token push
- `POST /api/notifications/send` - Enviar notificação
- `POST /api/notifications/broadcast` - Enviar para todos

### Autenticação
- `POST /api/register` - Criar conta (email/senha)
- `POST /api/login` - Login (email/senha)
- `POST /api/logout` - Logout
- `GET /api/auth/user` - Usuário autenticado
- `GET /api/auth/google` - Login com Google OAuth
- `GET /api/auth/google/callback` - Callback do Google
- `GET /api/health` - Health check

## Como Testar

1. Baixe **Expo Go** no celular
2. Execute `npm start`
3. Escaneie o QR code

## Notificações Push

O app registra automaticamente o token push do dispositivo após login. As notificações chegam mesmo com a tela desligada (background). Para produção:
- Gerar build standalone via EAS
- Configurar `EXPO_ACCESS_TOKEN` para Expo Push Service

## Ambiente

- `DATABASE_URL` - PostgreSQL (Replit)
- `SESSION_SECRET` - Sessão
- `GOOGLE_CLIENT_ID` - ID do cliente Google OAuth
- `GOOGLE_CLIENT_SECRET` - Secret do cliente Google OAuth
- `GOOGLE_CALLBACK_URL` - URL de callback do Google OAuth
- `EXPO_ACCESS_TOKEN` - Para Push (opcional em dev)
