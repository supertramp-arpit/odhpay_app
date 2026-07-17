# ODH Pay app — UI Redesign Master Plan

> Produced by the design studio on **2026-07-17** from a full audit of all **137 UI files**
> (5 parallel audit agents, every file read). Baseline score: **30/100** — recorded as Iteration 0 in
> `/home/odhpay/design-studio-kit/learning/scores.json` (`dashboard.html` shows the curve).
> Companion report: `/home/odhpay/design-studio-kit/learning/ODHPAY_BASELINE_AUDIT.md`.
>
> **Rules of engagement:** every change follows the `odhpay-ui-ux` skill (monochrome constitution,
> `theme/tokens.js` is the single source of truth). Small reviewable diffs. One screen = one build,
> scored against the rubric. Never mass-reformat.

---

## 0. Global metrics (the honest starting point)

| Metric | Count |
|---|---|
| Files importing canonical `theme/tokens.js` | **5 / 137** (and they score 8–9/10) |
| Files importing legacy `components/Theme.js` | 43 (~99% color usage only → low-risk remap) |
| Files using `fontVariant: tabular-nums` for money | ~5 (token-era only) |
| Icon libraries in use | 3 (`@expo/vector-icons` ×79 files, `lucide` ×24, `react-native-vector-icons` ×7) |
| Files rendering emoji in UI | ≥12 (👋 📋 🚌 ⭐ 🎉 🚀 🔒 ⚠️ ✅ ⏱ 🇵🇰 ✓) |
| `.map()` lists inside ScrollView | 37 files |
| Files with any `accessibilityLabel` | 7 |
| Custom font loaded | none (system font; Inter is the planned upgrade) |
| Shared money formatter | none (3 local `formatINR` copies) |

Rubric baseline: Concept 3 · Typography 2 · Color 2 · Space 3 · Hierarchy 4 · Craft 4 · Content 2 ·
Signature 5 · Accessibility 2 · Technical 3 = **30/100**.

---

## PHASE 0 — Stop the bleeding (security & correctness; do FIRST, tiny surgical diffs)

### 0.1 Strip sensitive `console.log`s (secrets/PII in the UI layer)

- [ ] `screens/SignInScreen.js:82` — logs full login response (access token)
- [ ] `screens/HomeScreen.js:407,447` — logs auth token
- [ ] `screens/auth/OtpVerification.js:191` — logs raw OTP
- [ ] `screens/Security/OtpVerify.js:190` — logs raw OTP (near-duplicate screen)
- [ ] `screens/auth/MPinLockScreen.js:75-77` — logs PIN verification response
- [ ] `screens/auth/CreateSecurityPin.js:133` — logs create_pin response
- [ ] `components/Wallet/SecurityPin.js:134,167,184` — logs PIN plaintext
- [ ] `components/payment/WalletTransactionPin.js:257,275` — logs PIN
- [ ] `components/Settings/SetTransactionPin.js:23,98` — logs old/new/confirm PIN digits
- [ ] `components/ScanPay/ScanPayScreenPin.js:37` — logs payload incl. TransactionPIN
- [ ] `components/selfPayment/SelfPaymentPin.js:36` — logs payload incl. PIN
- [ ] `components/BBPS/ServiceCards/CreditCardItem.js:100,106,121` — logs card digits
- [ ] `components/BBPS/BillerInputForm.js:82-87,220,236,364` — logs consumer input_params (15 logs total)
- [ ] `components/BBPS/PaymentGateway.js:140` — logs amount + mobile
- [ ] `screens/TopServicces/ToMobile.js:125` — logs peer PII
- [ ] `screens/kyc/AadharDetails.js:118` — logs full Aadhaar response
- [ ] `screens/profile/UserProfile.js:43` — logs KYC details; `UserInformation.js:218` logs user object
- [ ] `screens/services/NotificationScreen.js:129` + `ReferralCode.js:105,115` — log API payloads
- [ ] `components/ScanPay/Scan.js:188` — logs scanned QR data
- [ ] `components/ToSelf/StatePopup.js:60,84` (+ CityPopup:68) — API dumps
- [ ] Sweep: `grep -rn "console.log" screens components Ecommerce` and kill any remaining secret/PII logs

### 0.2 Hardcoded secrets & fake security

- [ ] `components/payment/PhonepePayment.js:10-11` — **hardcoded saltKey + merchantId in source** (rotate + move server-side; SDK is dead code — consider deleting file)
- [ ] `components/WalletToBank/AddAmount.js:31,420` — client-side PIN `"123456"` **with on-screen hint** on a real-looking ₹ transfer → needs backend PIN verification
- [ ] `screens/profile/PrimeMembershipScreen.js:34,235` — same hardcoded `CORRECT_PIN="123456"` + simulated transaction on a real-money activation flow
- [ ] `screens/auth/LoginSignUp.js:10-11` — hardcoded credential bypass (`+11`/`a`)

### 0.3 Fabricated financial data shown as real

- [ ] `components/ScanPay/TransactionSuccessScreen.js:56,74` — **hardcoded** Transaction ID + UTR shown to every user → render server values only
- [ ] `components/payment/PaymentStatus.js:63` — `Math.random()` transaction ID + client-side timestamp
- [ ] `components/selfPayment/SelfPaymentStatus.js:66` — `Math.random()` transaction ID
- [ ] `components/WalletToBank/AddAmount.js:212` — dummy `TXN+Date.now()` id
- [ ] `screens/Travel/BoardingPassScreen.js:27-29` — random client-side ticket#/barcode

### 0.4 Crashes & broken code paths

- [ ] `screens/auth/LoginSignUp.js:67,85,105` — references `Theme` in styles but **never imports it → crash on mount**
- [ ] `screens/Security/EmailVerification.js:153` — `info.loading` undefined → crash
- [ ] `components/WalletToBank/TransactionModal.js:71` — `Platform` used but not imported → crash; also :30 failure icon aliased to empty `Circle` → **failure state visually indistinguishable**
- [ ] `Ecommerce/Checkout/Shipping.js:3`, `Payment.js`, `Review.js` — import `expo-router` in a React-Navigation app → broken
- [ ] `components/payment/RazorpayPayScreen.js:21` — broken import `../utils/integrity` (should be `../../`)
- [ ] `components/MobileRecharge/RechargeScreenPay.js:54` — "Change Plan" navigates to `""` (dead route)
- [ ] `components/Settings/SetTransactionPin.js:38-40` — `useRef()` inside `.map` (Rules-of-Hooks violation)

### 0.5 Money-safety UX

- [ ] `components/WalletToBank/Proceed.js:190-192` — real `withdraw_fund` API with **no disabled/in-flight lock → double-tap fires twice**. Copy the `editable={!loading}` + overlay pattern from `components/payment/WalletTransactionPin.js:353`
- [ ] Mask PAN wherever displayed: `screens/kyc/PanDetails.js:349`, `PanKyc.js:276` (success screen), `screens/profile/UserInformation.js` (incl. plaintext nominee Aadhaar input :779)
- [ ] `components/NewBank.js:209-217` — account number input not masked/secureTextEntry (ToSelf.js does it right at :376)
- [ ] `screens/auth/MPinLockScreen.js:398` — "Forgot Security Code?" only shakes (dead action) → wire or remove

---

## PHASE 1 — Foundation (bedrock; no visible redesign yet)

- [ ] **1.1 Primitives** in `theme/` (built on `tokens.js`; model on the gold-standard files):
  - [ ] `Screen` — safe-area + background + StatusBar handling (Ecommerce hardcodes `paddingTop:50`)
  - [ ] `AppText` — type variants (display/h1/h2/h3/body/label/caption), no raw fontSize anywhere
  - [ ] `AmountText` — shared `formatINR` (₹ + en-IN grouping + 2dp) + `tabularNums` + credit/debit
        semantics (**credit = green, debit = ink, red = failure only**). Seed from
        `screens/Security/CheckWalletBalance.js:31` + `screens/HistoryScreen.js:92` (`Intl.NumberFormat('en-IN')`)
  - [ ] `Button` — primary/secondary/ghost, pressed state, in-flight lock, ≥44px, a11y role
  - [ ] `Card`, `Skeleton` (from HistoryScreen SkeletonCard :126 + Recharge.js :517), `EmptyState` (with action), `ErrorState` (honest message + retry)
  - [ ] `icons.js` — lucide-only registry (sizes/stroke tokens); ban other libs in new code
  - [ ] Promote `components/payment/PayFromWallet.js` `NoticeModal` → shared; fix `miscellaneous/SweetAlert.js` `info:'#5F259F'` → tokens info blue
- [ ] **1.2 Legacy `components/Theme.js` → tokens remap** (43 importers, ~99% colors: `primary`×516, `textSecondary`×224, `text`×211, `surface`×148, `secondary`×125, `border`×121…):
  - [ ] Repoint `Theme.colors.*` values at `tokens.color.*` equivalents (drift: `background #F8F9FE`→`#F7F8FA` etc.)
  - [ ] **Purge purple rot inside Theme.js itself**: `primaryLight:#8B85FF`, `accent:#FF6B6B`, `shadow rgba(108,99,255)`, `gradient #6C63FF→#8B85FF`, `shadows.lg.shadowColor #6C63FF` (typography export is consumed 0× — droppable)
- [ ] **1.3 Inter font** via `expo-font` (design-system upgrade path = one token switch); font-gated splash
- [ ] **1.4 Tab bar fix** (`navigation/BottomTabNavigator.js`): active vs inactive tint (**both are white today — no active state**); light `#e0e0e0` hairline on black bar → token; a11y labels/roles on tabs + the scan puck (80×80 black disc + white QR ring — **the signature, keep and refine**)
- [ ] **1.5 Global chrome**: keep black StatusBar/headers; stop ad-hoc `headerShown` toggling; kill the copy-pasted custom bottom-nav inside 5 Ecommerce screens

---

## PHASE 2 — Flagship rebuilds (traffic order; each = full studio loop + score)

### 2.1 HomeScreen (`screens/HomeScreen.js` — 6/10, 159 raw hex, worst violation density)
- [ ] Monochrome regrade: 159 hex → tokens; rainbow Material service grid (L39-52,134-165) → ink chips
- [ ] 11 LinearGradients → 0–1; sheet `elevation:12` → `elevation.level2`
- [ ] Balance: masked by default + eye toggle + `AmountText` (currently raw `₹{payload?.balance ?? 0}` L703)
- [ ] Icons → lucide only (currently Material/Ionicons/FontAwesome5 + lucide mixed L17-18)
- [ ] QuickPay: skeleton / empty-with-action / error-with-retry (has only a loading flag)
- [ ] Wire or remove the inert wallet chip (L822)

### 2.2 Unified TransactionResult screen (replaces 4 divergent status screens)
- [ ] One screen: **pending / success / failure** all designed (no pending exists anywhere today); real server data only
- [ ] Replace: `ScanPay/TransactionSuccessScreen.js` (2/10), `payment/PaymentStatus.js`, `selfPayment/SelfPaymentStatus.js`, `WalletToBank/TransactionModal.js`
- [ ] Model on `components/BBPS/TransactionSuccess.js` (7/10 live-status timeline w/ WS+poll, debit-in-ink) — but tokens instead of its 76 raw hex
- [ ] Rebuild `ScanPay/PaymentScreen.js` (2/10: named CSS colors, pink avatar, broken style props, web `alert()`, crash on missing UserName :34) on primitives
- [ ] Fix typo "Payment Falied" (`selfPayment/SelfPaymentPin.js:157`); `.slice(-4)` crash risks :217,250

### 2.3 Wallet cluster
- [ ] `screens/Security/CheckWalletBalance.js` — **remove `#6C63FF` ×2 (:131,:243 — only live instances in app)**; debit red `#FF8B8B` (:433,445) → ink; keep mask toggle; calm the glass/gradient/shadow stack
- [ ] `components/Wallet.js` — debit red :84 → ink; txn `.map` in ScrollView :345 → FlatList; `AmountText`
- [ ] `components/Wallet/odhMoney.js` / `odhRupees.js` — replace DUMMY_ data, debit-red → ink, `.map`→FlatList, rogue stat colors → mono

### 2.4 HistoryScreen polish (bones already good: skeleton + empty + pagination)
- [ ] Amounts: brand-purple → ink + tabular (L1007); local COLORS → tokens; emoji ✓ in Alert :434; download btn hitSlop; a11y labels

### 2.5 BBPS
- [ ] `PaymentGateway.js` (2/10) — rebuild monochrome: whole screen is `#5F259F` purple (bg :649, blobs, buttons) — **regulated NPCI color, lockups only**; 54 hex → tokens; delete dead code (:290 unreachable)
- [ ] `ServiceCards/*` — replace the ~20-variant rainbow/gradient card system (Utility/Finance/Entertainment/CreditCard/FasTag/Default) with ONE monochrome card + lucide glyphs
- [ ] Unify error UX on shared modal (today: SweetAlert vs Alert.alert vs inline, varies per file); keep `BillerInputForm.js` honest bill-fetch failure contract (success===true && !error_message)
- [ ] `EnterBillAmount.js` — bill amount same grey `#9E9E9E` as labels (contrast) → ink hierarchy; quick-amount chips grouped ₹
- [ ] `ServiceCategory.js` — config emoji in empty state (:353) → lucide

---

## PHASE 3 — Breadth migration (folder by folder, opportunistic; templates below)

**Migration templates (gold standard, already in repo):**
`screens/profile/UserProfileScreen.js` (9/10) · `components/reward/ScratchCardScreen.js` +
`ScratchReward.js` (9/10) · `components/ReferralScreen.js` (9/10) · `components/ScanPay/Scan.js` (8/10) ·
`components/MobileRecharge/Recharge.js` (8/10, best legacy-Theme screen) · `components/Settings/TransactionPin.js` (8/10)

- [ ] **Auth** (`screens/auth/`) — calm re-skin of the templated black-hero + blob + elevation-8 shell (Register/Otp/CreateSecurityPin); OTP/PIN digits tabular; purple-tint discs `#F3E8FF/#E9D5FF` → neutral; rogue `#8A2BE2`, `#9e2828ff` shadow bug (Register :455); inline errors not Alert-only; labels not placeholder-only (EmailVerify)
- [ ] **KYC** (`screens/kyc/`) — de-orange (`#ff8a00` fallback), single icon lib, fix undefined `COLORS.danger/inputBg/accent` refs (AadharKyc :228,391; PanKyc), emoji 🔒/⚠ (:278/:258) → lucide; keep good consent-checkbox a11y + Aadhaar masking (:168-174)
- [ ] **Profile** (`screens/profile/`) — clone UserProfileScreen patterns; `UserInformation.js`: kill third rogue palette (blue `#3B82F6` + purple `#8B5CF6`), move subcomponents out of render (remount bug), `#00000` typo :866, hardcoded phone/whatsApp; `ManageBanksScreen.js`: real masked account (currently `'••••••'+random` :71), FlatList, delete dead modal styles (:390-498)
- [ ] **Security** (`screens/Security/`) — dedupe `OtpVerify.js` vs `auth/OtpVerification.js` (near-copies); LoginCreatePass literal `'red'`; keep `updateNumber.js` shape
- [ ] **Settings** (`components/Settings/`) — `SettingScreen.js`: rainbow gradient icon-tiles → mono, 3 icon families → lucide, wire dead rows (Help/Rate/Privacy/Terms `onPress={()=>{}}`), calm per-row mount animations
- [ ] **Recharge** (`components/MobileRecharge/`) — `RechargeTrxPin.js`: drop per-operator rainbow theming (Jio blue/Airtel red/Vi pink/purple default :26-30) → mono; `RechargeSuccess.js`: ⏱ emoji glyphs (:119) → lucide, 51 hex → tokens; keep Recharge.js skeletons/`MobilePrepaid` contact-list perf; contact avatar rainbow (:51) → mono initials
- [ ] **TopServicces** — `ToMobile.js`: rainbow avatars, dead error state (set but never rendered), "Test User" placeholder :132; `ToBank.js`: keep as states/masking reference, violet bank-avatars → mono, skeleton over spinner
- [ ] **services/** static pages — About/Contact/Terms: remove `react-native-vector-icons` (incl. unused imports), bootstrap `#007bff/#00aaff` + literal `"orange"/"green"/"red"` → tokens, wire ContactUs submit (Alert-only stub), fix deprecated ImagePicker `result.uri`; **`NoInternetScreen.js`: add retry action** (dead error state today); NotificationScreen: add error UI (only logs today), purple-tint surfaces → neutral
- [ ] **ToSelf popups** (State/City/Branch) — lib #2 icons → lucide, tokens, loading/empty states
- [ ] **App-wide sweeps** (do per-file while touching, or as one deliberate pass each):
  - [ ] Emoji-in-UI → lucide (SearchScreen 👋📋🚌, ResultsScreen ⭐, MembershipSuccess 🎉, UpdateModal 🚀, ChatScreen ✅, Wallet/SecurityPin 🔒, ScanPayScreenPin ⚠️, Ecommerce ✓/🇵🇰 …)
  - [ ] `.map`-in-ScrollView → FlatList (37 files)
  - [ ] a11y labels/roles + hitSlop on all touchables (130 files without)
  - [ ] `miscellaneous/CustomSpinner.js` (leftover boilerplate) → `Skeleton`/spinner primitive; `UpdateModal.js` teal + 🚀 → mono

---

## PHASE 4 — Product decisions (USER must decide; blocked on scope, not design)

- [ ] **Travel** — polished UI, but 100% dummy data incl. realistic fake PII bookings (`BookingHistoryScreen.js:26-203`), simulated payment (`PaymentScreen.js:94` setTimeout), buses labeled as trains. **Wire to a real API or hide the tab?**
- [ ] **Ecommerce** — unre-skinned dark-teal template (`#1DD1B0`), **USD `$` prices**, Pakistani placeholder data (Review.js :101-127), John Doe profile, hotlinked Wikipedia payment logos, broken expo-router checkout. **Re-skin to monochrome + ₹, or remove from the app?**
- [ ] **ChatScreen** — pay-as-chat metaphor on fully hardcoded dummy transactions (:248-289), unmasked phone :367, lavender bg. **Build or delete?**
- [ ] **Reward.js** — hardcoded MLM income table (`U1001`, `₹{(j+1)*1000}`). **Build or delete?** (Note: `reward/Scratch*` files are the app's BEST work — unrelated, keep.)
- [ ] **Delete candidates**: `screens/TempScreenShortShare.js` (dev scratch screen in prod), `components/BottomNavigation/BottomNavigation.js` (legacy unused chrome with `"yellow"/"skyblue"/"pink"` icons + invalid `bottom:"-15"`)

---

## Reusable patterns index (steal from these, don't reinvent)

| Pattern | Source |
|---|---|
| Full token + a11y + tabular screen | `screens/profile/UserProfileScreen.js` |
| Async trio (skeleton/empty-action/error-retry) | `components/reward/ScratchCardScreen.js`, `screens/HistoryScreen.js`, `screens/TopServicces/ToBank.js` |
| ₹ formatting (needs tabular added) | `screens/HistoryScreen.js:92`, `screens/Security/CheckWalletBalance.js:31` |
| PII masking | `ToBank.js:46` (`••••1234`), `ReferralScreen.js:34` (`maskMobile`), `ToSelf/BankDetails.js:83`, `AadharDetails.js:168` |
| In-flight lock on money buttons | `components/payment/WalletTransactionPin.js:353` |
| Typed notice modal | `components/payment/PayFromWallet.js` `NoticeModal` |
| Honest bill-fetch failure contract | `components/BBPS/BillerInputForm.js:243-332` |
| Live payment-status timeline | `components/BBPS/TransactionSuccess.js` (re-tokenize) |
| Plan-list skeletons + MNP fallback | `components/MobileRecharge/Recharge.js` |
| Premium micro-interactions (re-skin) | `Ecommerce/ProductDetails.js` toast, `ProductCard.js` press-scale, `CarouselBanner.js` |
| Signature chrome | `navigation/BottomTabNavigator.js` scan puck (fix tints + a11y) |

## Scoring protocol (per the design-studio-kit)

After each Phase 2+ build: score the 10 rubric dimensions honestly, then
`node /home/odhpay/design-studio-kit/scripts/score.mjs add <entry.json>` and distill lessons into
`design-studio-kit/learning/LEARNING_LOG.md`. Baseline to beat: **30/100**. Studio record: 88/100.
