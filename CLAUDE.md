# odhpay_updated — Mobile App

React Native / Expo mobile app. Android-focused (no `ios/` dir; iOS via EAS if at all).

## Stack
- Expo SDK 54.0.27, React Native 0.81.5, React 19.1.0, **New Architecture enabled** ([app.json:9](app.json#L9))
- Navigation: `@react-navigation/{native,stack,bottom-tabs}`
- State: **Zustand** (primary, in [store/](store/)). Context is a no-op wrapper. Redux installed but unused.
- HTTP: `axios` (wrapper at [utils/api.js](utils/api.js))
- Auth: Firebase Auth + Google Sign-In; tokens in **AsyncStorage** (not SecureStore — see gotcha)
- Notifications: Notifee + Firebase Messaging + expo-notifications

## Entry / boot
- [index.js](index.js) → registers root + Notifee background handler
- [App.js](App.js) → providers, in-app update check, token rehydration from AsyncStorage
- [AppNavigator.js](AppNavigator.js) → root stack; `check_user` call at [AppNavigator.js:168](AppNavigator.js#L168) decides between SplashScreen / MainApp / MPinLockScreen
- [navigation/BottomTabNavigator.js](navigation/BottomTabNavigator.js) → 5 tabs: Home, Travel, History, Services, Scan

## Directory map
- [screens/](screens/) — main screens; subdirs `auth/`, `kyc/`, `profile/`, `services/`, `Security/`, `TopServicces/`, `Travel/`
- [components/](components/) — reusable; `BBPS/`, `MobileRecharge/`, `ScanPay/`, `Wallet/`, `ToSelf/`, `WalletToBank/`, etc.
- [Ecommerce/](Ecommerce/) — separate e-commerce feature (Dashboard, ProductDetails, MyCart, Checkout/)
- [store/](store/) — Zustand stores (useUserStore, useAppStore, useWalletStore, useKycStore, useTravelStore, etc.)
- [hooks/](hooks/) — `useNotifee` (FCM + deep links), `useInAppUpdate`
- [utils/api.js](utils/api.js) — axios instance, Bearer attach
- [config/](config/) — static data (BBPS categories, cities)
- [myHashCode/](myHashCode/) — **DANGER**: contains keystores + deployment certs. Should not be in repo. Leave alone unless cleaning.
- [Animation/](Animation/) — Lottie JSON files

## API
- **Base URL hardcoded everywhere**: `https://newapi.odhpay.com/` in 100+ files. No `.env`, no environment switching. To change it, grep-and-replace.
- Token storage: `AsyncStorage` key `"access_token"`. Attached via `Authorization: Bearer ${token}` in [utils/api.js:20](utils/api.js#L20).
- External: PhonePe status (`api.phonepe.com`), Clearbit bank logos, LCR biller assets CDN (`assetcdn.lcrpay.com`).

## Auth flow
1. SignInScreen → POST `/register/user_login/` → save `access_token` to AsyncStorage
2. On next launch, AppNavigator GETs `/register/check_user` to hydrate user
3. If user has `LoginPIN`, gates with MPinLockScreen (biometric + PIN) before MainApp

## Run
```sh
npm install
npm run android      # builds & runs on emulator/device
npm start            # Expo dev server
```
If you see `EACCES /android/gradlew` → `chmod +x android/gradlew`.

## Gotchas
- **API URLs are NOT centralized.** Don't assume changing one file changes them all.
- **Tokens in plain AsyncStorage**, not SecureStore (despite `expo-secure-store` being installed).
- **No `.env` files.** No environment switching — staging vs prod is a code change.
- **`myHashCode/` contains secrets** (keystores, certs). Don't `git add -A`.
- **UserContext is a no-op.** Don't add to it; use Zustand stores.
- **Redux installed but dead.** Don't add reducers; use Zustand.
- Hardcoded PhonePe payment-status URL → no abstraction.
- **First-launch decision tree** is in [AppNavigator.js](AppNavigator.js) — read carefully before changing splash/onboarding behavior.
