// stores/useAppStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Scratched-card ids revealed on this device. The reward money is already
// credited server-side (lcrmoney rows) — the backend has no "scratched" flag,
// so the reveal state lives locally. Ids are lcrmoney.srno (globally unique).
export const SCRATCHED_IDS_KEY = '@odhpay/scratched_card_ids';

export const loadScratchedIds = async () => {
    try {
        const raw = await AsyncStorage.getItem(SCRATCHED_IDS_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
        return new Set();
    }
};

const persistScratchedId = async (id) => {
    try {
        const ids = await loadScratchedIds();
        ids.add(String(id));
        await AsyncStorage.setItem(SCRATCHED_IDS_KEY, JSON.stringify([...ids]));
    } catch {
        // non-fatal: card will show unscratched again next launch
    }
};

export const useAppStore = create((set) => ({
    // Scratch Cards
    scratchCards: [],
    setScratchCards: (updatedCards) => set({ scratchCards: updatedCards }),
    updateScratchStatus: (id) => {
        persistScratchedId(id);
        set((state) => ({
            scratchCards: state.scratchCards.map(card =>
                card.id === id ? { ...card, IsScratched: true } : card
            ),
        }));
    },

    // Bank Data
    AllBankData: [],
    setAllBankData: (data) => set({ AllBankData: data }),

    // IFSC
    selecedIFSC: '',
    setSelectedIFSC: (data) => set({ selecedIFSC: data }),

    // Operator Circle
    operatorCircle: '',
    setSelectedOperator: (data) => set({ operatorCircle: data })
}));

export const useMobileStore = create((set) => ({
    mobileNumber: '',
    balance: 0,
    setMobileNumber: (number) => set({ mobileNumber: number }),
    setBalance: (balance) => set({ balance: balance }),
}));
