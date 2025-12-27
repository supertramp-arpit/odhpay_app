// stores/useCityStore.js
import { create } from 'zustand';

const BASE_URL = 'https://newapi.odhpay.com';

/**
 * Zustand store for city data
 * Replaces citySlice from Redux
 */
export const useCityStore = create((set, get) => ({
  cities: [],
  loading: false,
  error: null,

  // Fetch all cities
  fetchCities: async () => {
    const { cities, loading } = get();
    
    // Avoid duplicate requests
    if (loading) return;
    
    // Return cached cities if available
    if (cities.length > 0) return cities;

    set({ loading: true, error: null });

    try {
      const resp = await fetch(`${BASE_URL}/cityList`);
      
      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }
      
      const result = await resp.json();
      set({ cities: result.data || [], loading: false });
      return result.data;
    } catch (error) {
      console.error('Error fetching cities:', error);
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Reset cities
  resetCities: () => set({ cities: [], loading: false, error: null }),
}));
