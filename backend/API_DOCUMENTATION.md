# WorkoutPartner Backend API Documentation

## 🚀 Visão Geral

Este documento descreve todas as APIs implementadas no backend NestJS do WorkoutPartner, um aplicativo de matching para parceiros de treino.

**Base URL**: `http://localhost:3000/api`

## 🔐 Autenticação

Todas as rotas protegidas requerem um token JWT no header:
```
Authorization: Bearer <jwt_token>
```

## 📝 APIs de Usuário

### Perfil do Usuário

#### `GET /users/me`
Obter perfil completo do usuário autenticado.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "João Silva",
  "height": 180.5,
  "weight": 75.0,
  "bio": "Apaixonado por fitness",
  "birthDate": "1990-01-01",
  "experienceLevel": "Intermediário",
  "gender": "male",
  "profilePicture": "/uploads/profile-photos/user-123.jpg",
  "workoutPreferences": [...],
  "gym": {...}
}
```

#### `PUT /users/me`
Atualizar perfil do usuário.

**Body:**
```json
{
  "name": "João Silva",
  "height": 180.5,
  "weight": 75.0,
  "bio": "Apaixonado por fitness e vida saudável",
  "birthDate": "1990-01-01",
  "experienceLevel": "Intermediário",
  "gender": "male",
  "location": "São Paulo, SP"
}
```

#### `POST /users/me/upload-photo`
Upload de foto de perfil via multipart/form-data.

**Body:** `FormData` com campo `photo`

#### `PUT /users/me/photo`
Atualizar URL da foto de perfil.

**Body:**
```json
{
  "photoUrl": "https://example.com/photo.jpg"
}
```

#### `PUT /users/me/settings`
Atualizar configurações do perfil.

**Body:**
```json
{
  "notifications": true,
  "darkMode": false,
  "showOnline": true
}
```

#### `GET /users/me/stats`
Obter estatísticas do usuário.

**Response:**
```json
{
  "totalMatches": 15,
  "completedWorkouts": 42,
  "profileViews": 128,
  "joinedAt": "2024-01-01T00:00:00Z"
}
```

## ⚙️ APIs de Preferências de Treino

#### `GET /workout-preferences`
Listar preferências de treino com filtros.

**Query Params:**
- `category`: Filtrar por categoria
- `search`: Buscar por nome

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Musculação",
    "description": "Treinamento com pesos",
    "category": "Força",
    "icon": "fitness",
    "usersCount": 1250,
    "isPopular": true
  }
]
```

#### `GET /workout-preferences/categories`
Obter categorias disponíveis.

**Response:**
```json
[
  {
    "category": "Força",
    "count": 5
  },
  {
    "category": "Cardio",
    "count": 8
  }
]
```

#### `GET /workout-preferences/popular`
Obter preferências populares.

**Query Params:**
- `limit`: Número máximo de resultados (padrão: 10)

## 🔍 APIs de Descoberta e Matching

#### `GET /matches/discover`
Descobrir usuários compatíveis.

**Query Params:**
- `distance`: Distância em km (padrão: 10)
- `workoutType`: ID da preferência de treino
- `minHeight`, `maxHeight`: Faixa de altura
- `minWeight`, `maxWeight`: Faixa de peso
- `experienceLevel`: Nível de experiência
- `gender`: Gênero
- `minAge`, `maxAge`: Faixa de idade
- `city`, `state`: Localização
- `gymId`: ID da academia
- `onlineOnly`: Apenas usuários online
- `limit`: Limite de resultados (padrão: 20)
- `offset`: Offset para paginação

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Maria Santos",
      "age": 28,
      "compatibilityScore": 85,
      "distance": 2.5,
      "workoutPreferences": [...],
      "profilePicture": "..."
    }
  ],
  "total": 15,
  "hasMore": true
}
```

#### `POST /matches/discover/advanced`
Descoberta avançada via POST body.

**Body:** Mesmo formato dos query params do GET discover

#### `GET /matches/nearby`
Usuários próximos por geolocalização.

**Query Params:**
- `distance`: Distância em km (padrão: 5)

#### `GET /matches/suggestions`
Sugestões inteligentes baseadas em compatibilidade.

**Query Params:**
- `limit`: Número de sugestões (padrão: 10)

#### `POST /matches/like/:userId`
Dar like em um usuário.

**Body (opcional):**
```json
{
  "message": "Oi! Vamos treinar juntos?"
}
```

**Response:**
```json
{
  "matchStatus": "accepted", // ou "pending"
  "matchId": "uuid",
  "isNewMatch": true
}
```

#### `POST /matches/super-like/:userId`
Dar super like em um usuário.

#### `POST /matches/skip/:userId`
Pular um usuário.

**Body (opcional):**
```json
{
  "reason": "Não compatível"
}
```

#### `GET /matches`
Listar matches do usuário.

**Query Params:**
- `unreadOnly`: Apenas matches com mensagens não lidas
- `recentOnly`: Apenas matches recentes (7 dias)
- `search`: Buscar por nome
- `limit`, `offset`: Paginação

#### `GET /matches/stats`
Estatísticas de matching.

**Response:**
```json
{
  "totalMatches": 15,
  "totalLikes": 45,
  "totalLikesReceived": 32,
  "recentMatches": 3,
  "matchRate": 33.33
}
```

#### `GET /matches/compatibility/:userId`
Score de compatibilidade com outro usuário.

**Response:**
```json
{
  "score": 85,
  "factors": [
    "3 preferências de treino em comum",
    "Mesma academia",
    "Idades similares"
  ]
}
```

## 📱 APIs de Notificações

#### `POST /notifications/register-token`
Registrar token de push notification.

**Body:**
```json
{
  "token": "firebase_token_here",
  "deviceType": "android", // ou "ios", "web"
  "deviceId": "device_unique_id",
  "appVersion": "1.0.0"
}
```

#### `GET /notifications`
Listar notificações do usuário.

**Query Params:**
- `type`: Filtrar por tipo
- `unreadOnly`: Apenas não lidas
- `limit`, `offset`: Paginação

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "match",
      "title": "Novo Match! 🎉",
      "message": "Vocês deram match! Que tal começar uma conversa?",
      "status": "unread",
      "data": {
        "matchId": "uuid",
        "userId": "uuid"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 5,
  "hasMore": false
}
```

#### `GET /notifications/unread-count`
Contador de notificações não lidas.

**Response:**
```json
{
  "count": 3
}
```

#### `PUT /notifications/:id/read`
Marcar notificação como lida.

#### `PUT /notifications/mark-all-read`
Marcar todas as notificações como lidas.

#### `GET /notifications/settings`
Obter configurações de notificação.

**Response:**
```json
{
  "matches": true,
  "messages": true,
  "likes": true,
  "workoutReminders": true,
  "profileViews": false,
  "system": true
}
```

#### `PUT /notifications/settings`
Atualizar configurações de notificação.

## 💬 APIs de Chat

#### `POST /chat/messages`
Enviar mensagem.

**Body:**
```json
{
  "matchId": "uuid",
  "type": "text", // text, image, audio, location, workout_invite
  "content": "Oi! Como vai?",
  "metadata": {}, // dados adicionais dependendo do tipo
  "replyToId": "uuid" // opcional, para responder mensagem
}
```

#### `GET /chat/matches/:matchId/messages`
Listar mensagens de um match.

**Query Params:**
- `type`: Filtrar por tipo de mensagem
- `search`: Buscar no conteúdo
- `limit`: Limite de mensagens (padrão: 50)
- `offset`: Offset para paginação
- `before`: ID da mensagem para paginação

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "type": "text",
      "content": "Oi! Como vai?",
      "sender": {
        "id": "uuid",
        "name": "João"
      },
      "status": "read",
      "createdAt": "2024-01-01T00:00:00Z",
      "readAt": "2024-01-01T00:05:00Z"
    }
  ],
  "total": 25,
  "hasMore": true
}
```

#### `PUT /chat/messages/:messageId`
Editar mensagem (apenas texto).

**Body:**
```json
{
  "content": "Oi! Como você está?"
}
```

#### `PUT /chat/messages/:messageId/read`
Marcar mensagem como lida.

#### `PUT /chat/matches/:matchId/read-all`
Marcar todas as mensagens do match como lidas.

#### `POST /chat/workout-invite`
Enviar convite para treino.

**Body:**
```json
{
  "matchId": "uuid",
  "workoutType": "Musculação",
  "date": "2024-01-15",
  "time": "18:00",
  "location": "Academia XYZ",
  "message": "Vamos treinar juntos?"
}
```

#### `POST /chat/share-location`
Compartilhar localização.

**Body:**
```json
{
  "matchId": "uuid",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "address": "Av. Paulista, 1000",
  "placeName": "Academia Central"
}
```

#### `GET /chat/unread-count`
Contador geral de mensagens não lidas.

#### `GET /chat/matches/:matchId/unread-count`
Contador de mensagens não lidas por match.

#### `GET /chat/search`
Buscar mensagens em todas as conversas.

**Query Params:**
- `q`: Termo de busca
- `limit`: Limite de resultados

## 🎯 Tipos de Dados

### Enums

#### ExperienceLevel
- `Iniciante`
- `Intermediário`
- `Avançado`

#### Gender
- `male`
- `female`
- `other`

#### WorkoutCategory
- `Força`
- `Cardio`
- `Flexibilidade`
- `Funcional`
- `Esportes`
- `Bem-estar`

#### NotificationType
- `match`
- `message`
- `like`
- `super_like`
- `workout_reminder`
- `profile_view`
- `system`

#### MessageType
- `text`
- `image`
- `audio`
- `location`
- `workout_invite`
- `system`

## 🔧 Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `500` - Erro interno do servidor

## 📊 Paginação

Todas as APIs que retornam listas suportam paginação:

**Query Params:**
- `limit`: Número máximo de itens (padrão varia por endpoint)
- `offset`: Número de itens para pular

**Response:**
```json
{
  "items": [...],
  "total": 100,
  "hasMore": true
}
```

## 🚀 Funcionalidades Implementadas

✅ **Autenticação JWT completa**
✅ **Perfil de usuário expandido**
✅ **Upload de fotos**
✅ **Sistema de preferências de treino**
✅ **Algoritmo de compatibilidade**
✅ **Filtros avançados de descoberta**
✅ **Sistema de matching (like/skip/super-like)**
✅ **Notificações push**
✅ **Chat em tempo real**
✅ **Convites para treino**
✅ **Compartilhamento de localização**
✅ **Busca e filtros em todas as funcionalidades**
✅ **Paginação otimizada**
✅ **Contadores de não lidas**
✅ **Estatísticas e analytics**

---

**Desenvolvido para o WorkoutPartner Mobile App** 💪

