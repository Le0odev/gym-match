# WorkoutPartner Mobile 📱

Aplicativo móvel React Native para conexão de parceiros de treino.

## 🚀 Tecnologias

- **React Native** com Expo
- **React Navigation** para navegação
- **NativeWind** para estilização
- **Expo Vector Icons** para ícones
- **React Native Gesture Handler** para gestos
- **React Native Reanimated** para animações

## 🎨 Design System

### Paleta de Cores
- **Primária**: #3A86FF (Azul elétrico)
- **Secundária**: #FF006E (Magenta vivo)
- **Sucesso**: #06D6A0 (Verde limão)
- **Fundo**: #F4F4F8 (Cinza claro)
- **Texto**: #1E1E2F (Cinza escuro)

### Tipografia
- **Títulos**: Poppins (Bold/SemiBold)
- **Texto**: Inter (Regular/Medium)

## 📱 Funcionalidades

### ✅ Implementadas
- **Autenticação completa** (Login/Registro)
- **Dashboard** com estatísticas e ações rápidas
- **Descoberta de parceiros** estilo Tinder com swipe
- **Sistema de matches** com lista de conexões
- **Perfil do usuário** com configurações
- **Navegação por tabs** intuitiva
- **Design responsivo** e moderno

### 🔄 Componentes Reutilizáveis
- `CustomButton` - Botões com variantes
- `CustomInput` - Campos de entrada com validação
- `LoadingSpinner` - Indicadores de carregamento
- `UserCard` - Cards de usuários para descoberta

## 🛠️ Instalação

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn
- Expo CLI
- Expo Go app (para testar no dispositivo)

### Passos

1. **Clone o repositório**
   ```bash
   git clone https://github.com/Le0odev/gym-match.git
   cd gym-match
   git checkout react-native-frontend
   cd workout-partner-mobile
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Inicie o servidor de desenvolvimento**
   ```bash
   npm start
   # ou
   yarn start
   ```

4. **Execute no dispositivo**
   - Escaneie o QR code com o app Expo Go (Android)
   - Ou use a câmera do iPhone (iOS)

## 📱 Executando em Emuladores

### Android
```bash
npm run android
```

### iOS
```bash
npm run ios
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── CustomButton.jsx
│   ├── CustomInput.jsx
│   ├── LoadingSpinner.jsx
│   ├── UserCard.jsx
│   └── index.js
├── contexts/            # Contextos React
│   └── AuthContext.jsx
├── navigation/          # Configuração de navegação
│   ├── AuthNavigator.jsx
│   ├── MainNavigator.jsx
│   ├── RootNavigator.jsx
│   └── index.js
├── pages/              # Telas do aplicativo
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── Discover.jsx
│   ├── Matches.jsx
│   ├── Profile.jsx
│   └── index.js
├── services/           # Serviços e APIs
│   ├── api.js
│   └── userService.js
├── styles/             # Estilos e temas
│   └── colors.js
├── utils/              # Utilitários
│   └── validation.js
└── assets/             # Recursos estáticos
    ├── fonts/
    └── images/
```

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
API_BASE_URL=http://localhost:3000/api
```

### Fontes Personalizadas
As fontes Poppins e Inter são carregadas automaticamente pelo Expo.

## 🎯 Próximos Passos

### 🚧 Funcionalidades Pendentes
- [ ] Chat em tempo real entre matches
- [ ] Sistema de notificações push
- [ ] Integração com APIs de geolocalização
- [ ] Upload de fotos do perfil
- [ ] Filtros avançados de descoberta
- [ ] Sistema de avaliações e feedback
- [ ] Integração com redes sociais
- [ ] Modo offline

### 🔄 Melhorias Técnicas
- [ ] Testes unitários e de integração
- [ ] Otimização de performance
- [ ] Implementação de cache
- [ ] Tratamento de erros aprimorado
- [ ] Acessibilidade (a11y)

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Desenvolvedor

Desenvolvido por [Le0odev](https://github.com/Le0odev)

---

**WorkoutPartner Mobile** - Conectando pessoas através do fitness! 💪

