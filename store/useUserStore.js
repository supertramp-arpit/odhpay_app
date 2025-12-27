import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://newapi.odhpay.com';

// Get auth token from AsyncStorage
const getToken = async () => {
  return await AsyncStorage.getItem('access_token');
};

// Get user info from API
const getUserInfo = async () => {
  const token = await getToken();
  if (!token) return null;
  
  const response = await axios.get(`${BASE_URL}/register/check_user`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  return response?.data || null;
};

// Module-level promise to dedupe parallel requests
let inflightRequest = null;

export const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      updatedAt: 0,
      status: 'idle',
      error: null,
      
      // Legacy properties from zustand/Store.js for compatibility
      mobileNumber: '',
      balance: 0,
      setMobileNumber: (number) => set({ mobileNumber: number }),
      setBalance: (balance) => set({ balance: balance }),

      /**
       * Fetch user info from backend with TTL caching and in-flight dedupe
       * opts: { force: boolean, ttlMs: number }
       */
      fetchUser: async (opts = {}) => {
        const { force = false, ttlMs = 5 * 60 * 1000 } = opts;
        const { user, updatedAt, status } = get();

        // Serve from cache if still fresh
        if (!force && user && Date.now() - updatedAt < ttlMs) {
          return user;
        }

        // If there's an in-flight request, return that
        if (inflightRequest) {
          try {
            return await inflightRequest;
          } catch (err) {
            throw err;
          }
        }

        // Start new request
        set({ status: status === 'success' ? 'loading' : 'loading', error: null });

        inflightRequest = (async () => {
          try {
            // If helper getUserInfo exists, use it. Otherwise perform direct request.
            const token = await getToken();
            if (!token) {
              // no token: clear user state
              set({ user: null, updatedAt: 0, status: 'idle', error: null });
              return null;
            }

            // prefer getUserInfo helper
            let payload = null;
            try {
              payload = await getUserInfo();
            } catch (e) {
              // fallback: direct axios call
              const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
              const resp = await axios.get('https://newapi.odhpay.com/register/check_user', { headers });
              payload = resp?.data || null;
            }

            if (!payload) {
              throw new Error('No user payload returned');
            }

            set({ user: payload, updatedAt: Date.now(), status: 'success', error: null });

            return payload;
          } catch (e) {
            const message = e?.response?.data?.message || e?.message || String(e);
            set({ status: 'error', error: message });
            throw new Error(message);
          } finally {
            inflightRequest = null;
          }
        })();

        return inflightRequest;
      },

      setUser: (payload) => set({ user: payload, updatedAt: Date.now(), status: 'success', error: null }),
      resetUser: () => set({ user: null, updatedAt: 0, status: 'idle', error: null }),
    }),
    {
      name: 'user_store_v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);

export default useUserStore;
