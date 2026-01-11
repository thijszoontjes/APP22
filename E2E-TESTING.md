# E2E Testing Setup - Maestro + EAS

## 🎯 Overzicht
Complete End-to-End testing setup met Maestro voor automatische UI flow testing.

---

## 📋 Vereisten

1. **EAS CLI** geïnstalleerd (✅ done)
2. **Expo account** met inloggegevens
3. **Android Emulator** (optioneel voor lokale tests)
4. **Maestro CLI** voor Windows

---

## 🚀 Stap 1: Login bij Expo

```bash
eas login
```

Voer je Expo credentials in.

---

## 🏗️ Stap 2: Build APK voor testing

### Preview build (voor Maestro testing):
```bash
eas build --platform android --profile preview
```

Dit bouwt een APK die je kunt testen met Maestro. De build draait in de cloud en duurt 10-20 minuten.

### Development build (met dev-client):
```bash
eas build --platform android --profile development
```

---

## 🤖 Stap 3: Installeer Maestro (Windows)

### Optie A: Via Scoop (aanbevolen)
```bash
scoop bucket add maestro https://github.com/mobile-dev-inc/maestro
scoop install maestro
```

### Optie B: Handmatig
1. Download van https://github.com/mobile-dev-inc/maestro/releases
2. Extract naar `C:\maestro`
3. Voeg `C:\maestro\bin` toe aan PATH environment variable
4. Herstart terminal/VS Code

### Verificatie:
```bash
maestro --version
```

---

## 📱 Stap 4: Test lokaal met Emulator

### Start Android Emulator
```bash
# Via Android Studio: Tools > Device Manager > Start device
# Of via command line:
emulator -avd <your_device_name>
```

### Installeer APK op emulator
```bash
# Na EAS build, download APK en installeer:
adb install path/to/app.apk

# Of laat EAS het automatisch doen:
eas build --platform android --profile preview --local
```

### Run Maestro tests
```bash
# Enkele test:
maestro test .maestro/home.yml

# Alle tests:
maestro test .maestro/
```

---

## 🧪 Test Flows

### 1. Home Screen Test (`.maestro/home.yml`)
- App launch verificatie
- Tab navigatie (Ontdek → Profiel)
- Basis UI elementen check

### 2. Login Flow Test (`.maestro/login-flow.yml`)
- Navigatie naar login screen
- Input field interactie
- Form submission
- Error/success handling

### 3. Video Feed Test (`.maestro/video-feed.yml`)
- Video feed laden
- Scroll functionaliteit
- Video player components

### 4. Search Flow Test (`.maestro/search-flow.yml`)
- Search screen navigatie
- App stabiliteit na navigatie

---

## ⚙️ EAS Workflow (Automatisch)

### `.eas/workflows/maestro.yml`
Automatische E2E tests na commits:
- Checkout code
- Install dependencies
- Build app
- Run Maestro tests
- Upload results

### Trigger:
- Push naar `main`, `master`, `unit-testing`, `develop`
- Pull requests

---

## 🎬 Maestro Commands

### Basis commands:
```bash
maestro test <file>          # Run single test
maestro test .maestro/       # Run all tests in folder
maestro studio               # Interactive test builder
maestro record <file>        # Record new test flow
```

### Debug commands:
```bash
maestro test --debug <file>  # Verbose output
maestro test --format junit <file>  # JUnit XML output
```

---

## 📊 Expected Output

### Successful test:
```
✓ Launch app
✓ Assert visible "Ontdek*"
✓ Tap on "Profiel"
✓ Assert visible "Instellingen"

All tests passed! (4/4)
```

### Failed test:
```
✓ Launch app
✓ Assert visible "Ontdek*"
✗ Tap on "Profiel" - Element not found

Test failed at step 3
```

---

## 🔧 Troubleshooting

### "adb: command not found"
Voeg Android SDK platform-tools toe aan PATH:
```
C:\Users\<username>\AppData\Local\Android\Sdk\platform-tools
```

### "No devices found"
Start eerst de emulator via Android Studio.

### "App not installed"
Build opnieuw met EAS en installeer APK handmatig:
```bash
eas build --platform android --profile preview
adb install path/to/downloaded.apk
```

### "Element not found" in test
- Check exact text in app UI
- Gebruik wildcards: `"Ontdek*"` ipv `"Ontdek"`
- Gebruik `assertVisible: { id: "..." }` als alternatief

---

## 🏆 Grading Checklist

### ✅ E2E Testing vereisten:
- [x] Maestro geïnstalleerd en geconfigureerd
- [x] 4 E2E test flows geschreven (home, login, video, search)
- [x] EAS workflow voor automatische tests
- [x] APK build configuratie (preview profile)
- [ ] Tests lokaal gedraaid en geslaagd (vereist emulator + APK)
- [ ] Tests automatisch draaien via EAS (vereist Expo token in GitHub secrets)

---

## 🎓 PowerPoint Requirements

### ✅ Voldaan:
- **E2E testing setup**: Maestro configuratie compleet
- **Automated testing**: EAS workflow + GitHub Actions
- **UI flow tests**: Login, navigation, video feed, search

### 🚀 Voor hogere cijfer:
- Run tests succesvol in CI/CD pipeline
- Integreer met EAS Submit voor Play Store deployment
- Voeg meer test scenarios toe (registration, video upload, etc.)

---

## 📚 Resources

- [Maestro Documentation](https://maestro.mobile.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo E2E Testing Guide](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)
- [Maestro GitHub](https://github.com/mobile-dev-inc/maestro)

---

**Status:** ✅ E2E Testing infrastructure compleet  
**Next:** Build APK en run tests lokaal om te verifiëren
