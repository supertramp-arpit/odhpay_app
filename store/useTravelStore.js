// stores/useTravelStore.js
import { create } from 'zustand';

/**
 * Zustand store for travel/search state
 * Replaces UserContext and search-related Redux state
 */
export const useTravelStore = create((set, get) => ({
  // Travel search state
  from_loc: null,
  to_loc: null,
  selectedDate: null,

  // Actions
  setFromLoc: (location) => set({ from_loc: location }),
  setToLoc: (location) => set({ to_loc: location }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  // Compatibility methods for UserContext migration
  onChangeFrom_loc: (location) => set({ from_loc: location }),
  onChangeTo_loc: (location) => set({ to_loc: location }),

  // Swap locations
  swapLocations: () => {
    const { from_loc, to_loc } = get();
    set({ from_loc: to_loc, to_loc: from_loc });
  },

  // Reset travel state
  resetTravel: () => set({
    from_loc: null,
    to_loc: null,
    selectedDate: null,
  }),
}));
