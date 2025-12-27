// stores/index.js
// Central export for all Zustand stores

export { useAppStore, useMobileStore } from './useAppStore';
// Note: useUserStore from zustand/Store.js only has mobile/balance
// Use the full useUserStore from store/useUserStore.js which has fetchUser
export { default as useUserStore } from './useUserStore';
export { useTravelStore } from './useTravelStore';
export { useCityStore } from './useCityStore';
export { useBusStore } from './useBusStore';
export { useAadharStore } from './useAadharStore';
export { useRegisterStore } from './useRegisterStore';
export { useWalletStore } from './useWalletStore';
export { useKycDetailStore } from './useKycStore';
