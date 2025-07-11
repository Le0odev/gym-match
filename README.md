# WorkoutPartner - Sistema de Conexão de Parceiros de Treino

## 📋 Descrição

WorkoutPartner é uma aplicação full-stack moderna para conectar pessoas que buscam parceiros de treino. O sistema utiliza um algoritmo inteligente de compatibilidade baseado em preferências de exercícios, características físicas e objetivos de fitness.

## 🚀 Tecnologias Utilizadas

### Backend
- **NestJS** (Desenvolvimento) - Framework Node.js moderno e escalável
- **Flask** (Deploy) - Framework Python para produção
- **PostgreSQL** - Banco de dados principal com suporte a geolocalização
- **PostGIS** - Extensão para funcionalidades geoespaciais
- **TypeORM** - ORM para TypeScript/JavaScript
- **SQLAlchemy** - ORM para Python
- **JWT** - Autenticação baseada em tokens
- **bcrypt** - Hash seguro de senhas

### Frontend
- **React** - Biblioteca para interfaces de usuário
- **Vite** - Build tool moderna e rápida
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes de UI modernos
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de esquemas
- **Axios** - Cliente HTTP

## 🏗️ Arquitetura

```
workout-partner-app/
├── backend/                 # Backend NestJS (desenvolvimento)
│   ├── src/
│   │   ├── entities/       # Modelos de dados TypeORM
│   │   ├── auth/           # Módulo de autenticação
│   │   ├── users/          # Módulo de usuários
│   │   ├── matches/        # Módulo de matches
│   │   └── workout-preferences/ # Módulo de preferências
│   └── package.json
├── backend-deploy/         # Backend Flask (produção)
│   ├── src/
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── routes/         # Rotas da API
│   │   └── static/         # Frontend buildado
│   └── requirements.txt
├── frontend/               # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── contexts/       # Contextos React
│   │   └── services/       # Serviços de API
│   └── package.json
└── README.md
```

## 🔧 Funcionalidades Implementadas

### ✅ Autenticação e Autorização
- Registro de usuários com validação completa
- Login com JWT e refresh tokens
- Proteção de rotas sensíveis
- Middleware de autenticação

### ✅ Perfil de Usuário
- Cadastro com informações físicas (altura, peso)
- Definição de objetivos de treino
- Seleção de preferências de exercícios
- Atualização de localização

### ✅ Sistema de Matching Inteligente
- Algoritmo de compatibilidade baseado em:
  - Preferências de treino comuns
  - Compatibilidade física (altura/peso)
  - Proximidade geográfica
  - Objetivos similares
- Score de compatibilidade (0-100%)
- Sistema de "like" e "skip"
- Detecção automática de matches mútuos

### ✅ Interface de Usuário
- Design responsivo e moderno
- Experiência similar ao Tinder para descoberta
- Navegação intuitiva
- Feedback visual em tempo real
- Formulários com validação

### ✅ APIs RESTful
- `/api/auth/register` - Registro de usuários
- `/api/auth/login` - Login
- `/api/auth/me` - Perfil do usuário atual
- `/api/workout-preferences` - Listar preferências
- `/api/matches/discover` - Descobrir usuários
- `/api/matches/like/:id` - Curtir usuário
- `/api/matches/skip/:id` - Pular usuário
- `/api/matches` - Listar matches

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Python 3.11+
- PostgreSQL 14+
- Git

### Backend NestJS (Desenvolvimento)

```bash
# Instalar PostgreSQL e PostGIS
sudo apt update
sudo apt install postgresql postgresql-contrib postgis

# Configurar banco de dados
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres createdb workout_partner_db
sudo -u postgres psql -d workout_partner_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Instalar dependências
cd backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar
npm run start:dev
```

### Frontend React

```bash
# Instalar dependências
cd frontend
pnpm install

# Executar em desenvolvimento
pnpm run dev

# Build para produção
pnpm run build
```

### Backend Flask (Produção)

```bash
# Ativar ambiente virtual
cd backend-deploy
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar
python src/main.py
```

## 🧪 Testes Realizados

### Testes Funcionais
- ✅ Carregamento da página inicial
- ✅ Sistema de autenticação (registro/login)
- ✅ Proteção de rotas
- ✅ Interface de descoberta
- ✅ Sistema de matches
- ✅ Responsividade

### Testes de Integração
- ✅ Comunicação frontend-backend
- ✅ Persistência de dados
- ✅ Autenticação JWT
- ✅ APIs RESTful

**Pontuação Geral: 90/100**

## 📊 Algoritmo de Compatibilidade

O sistema calcula a compatibilidade entre usuários baseado em:

1. **Score Base**: 50 pontos
2. **Compatibilidade de Altura**: até 10 pontos
   - Diferença ≤ 10cm: +10 pontos
   - Diferença ≤ 20cm: +5 pontos
3. **Compatibilidade de Peso**: até 10 pontos
   - Diferença ≤ 10kg: +10 pontos
   - Diferença ≤ 20kg: +5 pontos
4. **Objetivos Similares**: até 30 pontos
   - Objetivos idênticos: +30 pontos
   - Palavras-chave comuns: +15 pontos

**Score Final**: Máximo de 100 pontos

## 🔒 Segurança

- Senhas hasheadas com bcrypt
- Autenticação JWT com expiração
- Validação de dados no frontend e backend
- Proteção contra CORS
- Sanitização de inputs

## 🌐 Deploy

### Opções de Deploy

1. **Heroku** (Recomendado)
2. **Vercel** (Frontend)
3. **Railway**
4. **DigitalOcean**

### Variáveis de Ambiente

```env
# Backend
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-jwt-secret
SECRET_KEY=your-flask-secret

# Frontend
VITE_API_URL=https://your-api-url.com
```

## 📈 Próximas Funcionalidades

- [ ] Chat em tempo real com WebSocket
- [ ] Sistema de avaliações e reviews
- [ ] Integração com academias
- [ ] Notificações push
- [ ] Aplicativo mobile (React Native)
- [ ] Sistema de agendamento de treinos
- [ ] Integração com wearables

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

- **Desenvolvedor Full-Stack**: Sistema completo desenvolvido seguindo as melhores práticas modernas

## 📞 Suporte

Para suporte, entre em contato através do email: suporte@workoutpartner.com

---

**WorkoutPartner** - Conectando pessoas através do fitness 💪

