# APP22 - Video Pitch Applicatie

Dit is een React Native applicatie gebouwd met Expo en TypeScript voor het delen en bekijken van video pitches.

## Projectstructuur

```
app/                    - Schermen en routing (file-based routing via expo-router)
  (tabs)/              - Tab navigatie schermen (home, chat, profiel)
  _layout.tsx          - Root layout configuratie
  login.tsx            - Login scherm
  register.tsx         - Registratie scherm
  chat.tsx             - Chat functionaliteit
  pitch.tsx            - Pitch creation scherm
  
components/            - Herbruikbare UI componenten
  login-screen.tsx     - Login component
  register-screen.tsx  - Registratie component
  video-feed-item.tsx  - Video item weergave
  ui/                  - Basis UI componenten
  
constants/             - Configuratie en constanten
  api.ts               - API endpoints en configuratie
  pitch-store.ts       - State management voor pitches
  theme.ts             - Thema kleuren en stijlen
  
hooks/                 - Custom React hooks
  useAuthApi.ts        - Authenticatie API logica
  useVideoApi.ts       - Video API integratie
  usePushNotifications.ts - Push notificatie functionaliteit
  authStorage.ts       - Veilige token opslag
```

## Installatie

1. Installeer dependencies:
   ```bash
   npm install
   ```

2. Start de ontwikkelserver:
   ```bash
   npx expo start
   ```

3. Open de app via:
   - Expo Go app (iOS/Android)
   - Android emulator
   - iOS simulator

## Backend Services

De applicatie communiceert met meerdere microservices op OpenShift:

### User Service
- Authenticatie en gebruikersbeheer
- Primary: `userservice-userservice-projectgroup1-prod.apps.inholland-minor.openshift.eu`
- Fallback: `userservice-projectgroup1-prod.apps.inholland-minor.openshift.eu`

### Chat Service
- Directe berichten tussen gebruikers
- Primary: `chatservice-chatservice-projectgroup1-prod.apps.inholland-minor.openshift.eu`
- Fallback: `chatservice-projectgroup1-prod.apps.inholland-minor.openshift.eu`

### Video Service
- Video upload en streaming
- Primary: `videoservice-videoservice-projectgroup1-prod.apps.inholland-minor.openshift.eu`
- Fallback: `videoservice-projectgroup1-prod.apps.inholland-minor.openshift.eu`

### Notification Service
- Push notificaties
- Primary: `notificationservice-notificationservice-projectgroup1-prod.apps.inholland-minor.openshift.eu`

Zie [constants/api.ts](constants/api.ts) voor de volledige configuratie.

## Functionaliteit

### Authenticatie
- Login/registratie via JWT tokens
- Secure token storage met expo-secure-store
- Automatische token refresh
- Implementatie: [hooks/useAuthApi.ts](hooks/useAuthApi.ts)

### Video Feed
- Swipeable video feed (TikTok-stijl)
- Video upload met camera of media library
- Like functionaliteit
- Implementatie: [components/video-feed-item.tsx](components/video-feed-item.tsx)

### Chat
- Direct messaging tussen gebruikers
- Real-time berichten
- Implementatie: [app/chat.tsx](app/chat.tsx)

### Profiel
- Gebruikersprofiel beheer
- Eigen video's bekijken
- Account instellingen

### Push Notificaties
- Expo notifications integratie
- Token registratie bij backend
- Implementatie: [hooks/usePushNotifications.ts](hooks/usePushNotifications.ts)

## Inzicht en Monitoring

### API Calls Traceren
Alle API calls gaan via `useAuthApi.ts` en `useVideoApi.ts`. Voor debugging:
- Check console logs voor request/response data
- Network tab in React Native Debugger
- API endpoints worden automatisch geprobeerd via fallback lijst

### State Management
- Pitch store: [constants/pitch-store.ts](constants/pitch-store.ts)
- Auth state via secure storage: [hooks/authStorage.ts](hooks/authStorage.ts)

### Error Handling
- API errors worden geconsole.logged met volledige context
- Fallback URLs worden automatisch geprobeerd bij connectie problemen
- Token expiration wordt afgehandeld met automatische refresh

### Logging Locaties
- API communicatie: `useAuthApi.ts` en `useVideoApi.ts`
- Notificaties: `usePushNotifications.ts`
- Video operaties: `useVideoApi.ts`
- Storage operaties: `authStorage.ts`

## Ontwikkeling

### Environment Variabelen
Gebruik `.env` voor custom API configuratie:
```
EXPO_PUBLIC_API_URL=https://custom-api-url.com
```

### Testing
```bash
npm run android  # Android build
npm run ios      # iOS build
npm run web      # Web versie
npm run lint     # Code linting
```

### File-Based Routing
De app gebruikt expo-router voor navigatie. Nieuwe routes worden automatisch gegenereerd op basis van bestanden in de `app/` folder.

## Technische Stack

- React Native 0.81.5
- Expo SDK 54
- TypeScript
- Expo Router voor navigatie
- Expo AV voor video playback
- Expo Camera voor video opname
- Expo Secure Store voor credentials
- React Native Reanimated voor animaties

## Dependencies

Zie [package.json](package.json) voor volledige lijst. Belangrijkste packages:
- `expo-router` - File-based routing
- `expo-av` - Video/audio playback
- `expo-camera` - Camera functionaliteit
- `expo-notifications` - Push notifications
- `expo-secure-store` - Veilige data opslag
- `react-native-reanimated` - Animaties

## Troubleshooting

### API Connection Issues
- Check of de OpenShift services bereikbaar zijn
- Bekijk fallback URLs in `constants/api.ts`
- Controleer network logs in debugger

### Token Expiration
- Tokens worden automatisch gerefresht via `useAuthApi.ts`
- Bij problemen: logout/login om nieuwe tokens te krijgen
- Check `authStorage.ts` voor opgeslagen tokens

### Video Playback Issues
- Controleer video service beschikbaarheid
- Bekijk logs in `useVideoApi.ts`
- Test met verschillende video formaten
