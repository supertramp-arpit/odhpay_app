// stores/useAppStore.js
import { create } from 'zustand';

export const useAppStore = create((set) => ({
    // Scratch Cards
    scratchCards: [
        {
            id: 1,
            IsScratched: false,
            receivedDate: '2024-06-01',
            amount: 100,
            IsRedeemable: true
        },
        {
            id: 2,
            IsScratched: true,
            receivedDate: '2024-06-01',
            amount: 100,
            IsRedeemable: true
        }
    ],
    setScratchCards: (updatedCards) => set({ scratchCards: updatedCards }),
    updateScratchStatus: (id) => set((state) => ({
        scratchCards: state.scratchCards.map(card =>
            card.id === id ? { ...card, IsScratched: true } : card
        ),
    })),

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
