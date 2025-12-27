// stores/useKycStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Get auth token from AsyncStorage
const getToken = async () => {
  return await AsyncStorage.getItem('access_token');
};

// Optional: keep a module-level in-flight promise to dedupe parallel calls
let inflight = null;

export const useKycDetailStore = create(
  persist(
    (set, get) => ({
      data: null,          // full KYC payload
      updatedAt: 0,        // epoch ms when last fetched
      status: 'idle',      // 'idle' | 'loading' | 'success' | 'error'
      error: null,

      /**
       * Fetch from API with TTL caching + in-flight dedupe
       * @param {Object} opts
       * @param {boolean} opts.force - ignore TTL and refetch
       * @param {number} opts.ttlMs - cache TTL in ms
       */
      fetchKyc: async (opts = {}) => {
        const { force = false, ttlMs = 5 * 60 * 1000 } = opts;
        const { data, updatedAt, status } = get();

        // Serve from cache if fresh
        if (!force && data && Date.now() - updatedAt < ttlMs) {
          return data;
        }

        // If a request is already running, await it
        if (inflight) {
          try { return await inflight; } catch (e) { throw e; }
        }

        // Start a new request
        set({ status: status === 'success' ? 'loading' : 'loading', error: null });

        inflight = (async () => {
          try {
            const token = await getToken();
            if (!token) {
              throw new Error('Auth token missing');
            }

            const response = await axios.get('https://newapi.odhpay.com/userAadharDetail/', {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });

            if (response.status !== 200 || !response.data) {
              throw new Error('Unable to fetch Aadhaar details');
            }

            const payload = response.data;

            // (Optional) strip very large fields before persisting to AsyncStorage
            // const safe = { ...res, aadhaar: { ...res?.aadhaar, profile_image_b64: undefined } };

            set({
              data: payload,
              updatedAt: Date.now(),
              status: 'success',
              error: null,
            });

            return payload;
          } catch (e) {
            const message = e?.response?.data?.message || e?.message || String(e);
            set({ status: 'error', error: message });
            throw new Error(message);
          } finally {
            inflight = null;
          }
        })();

        return inflight;
      },

      // Allow manual set (e.g., after onboarding step)
      setKycData: (payload) => set({
        data: payload,
        updatedAt: Date.now(),
        status: 'success',
        error: null,
      }),

      // Force clear cache (e.g., on logout)
      resetKyc: () => set({ data: null, updatedAt: 0, status: 'idle', error: null }),
    }),
    {
      name: 'kyc_store_v1',
      storage: createJSONStorage(() => AsyncStorage),
      // If you want to keep AsyncStorage small, drop the base64 image from persistence:
      // partialize: (state) => ({
      //   ...state,
      //   data: state?.data
      //     ? { ...state.data, aadhaar: { ...state.data.aadhaar, profile_image_b64: undefined } }
      //     : null,
      // }),
      version: 1,
    }
  )
);
