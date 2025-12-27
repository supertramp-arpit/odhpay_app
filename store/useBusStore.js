// stores/useBusStore.js
import { create } from 'zustand';

const BASE_URL = 'https://newapi.odhpay.com';

/**
 * Zustand store for bus data
 * Replaces busSlice from Redux
 */
export const useBusStore = create((set, get) => ({
  busAll: [],
  busSeat: [],
  loading: false,
  error: null,

  // Fetch bus data
  fetchBusData: async (data) => {
    set({ loading: true, error: null });

    try {
      const resp = await fetch(`${BASE_URL}/buses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      const result = await resp.json();
      set({ busAll: result.data || [], loading: false });
      return result.data;
    } catch (error) {
      console.error('Error fetching bus data:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Fetch bus seat chart
  fetchBusChart: async (data) => {
    set({ loading: true, error: null });

    try {
      const resp = await fetch(`${BASE_URL}/busChart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      const result = await resp.json();
      set({ busSeat: result.data || [], loading: false });
      return result.data;
    } catch (error) {
      console.error('Error fetching bus chart:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Reset bus state
  resetBus: () => set({ busAll: [], busSeat: [], loading: false, error: null }),
}));
