// stores/useRegisterStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';

const BASE_URL = 'https://newapi.odhpay.com';

// Get auth token
const getToken = async () => {
  return await AsyncStorage.getItem('access_token');
};

/**
 * Zustand store for user registration and authentication
 * Replaces RegisterSlice from Redux
 */
export const useRegisterStore = create(
  persist(
    (set, get) => ({
      logout: false,
      user: [],
      updatePassword: [],
      Register: [],
      loading: false,
      otpSent: false,
      EmailData: [],
      setPassword: null,
      error: null,

      // Reset OTP state
      resetOtpState: (value) => set({ otpSent: value ?? false }),

      // Reset set password state
      resetSetPassword: () => set({ setPassword: null }),

      // Reset update password state
      resetUpdatePassword: () => set({ updatePassword: [] }),

      // User registration - send OTP
      userRegister: async (mobileNumber) => {
        if (!mobileNumber) throw new Error('Mobile number is required');

        set({ loading: true, error: null });

        try {
          // Send as query params (matching original apiRequest behavior)
          const response = await axios.post(`${BASE_URL}/misc/send-otp`, null, {
            params: { mobile_number: mobileNumber.trim() },
            headers: { 'Content-Type': 'application/json' },
          });

          set({ loading: false, Register: response.data });
          return response.data;
        } catch (error) {
          console.error('Error in registration:', error);
          
          if (error.response?.status === 429) {
            Alert.alert('Too many requests');
          } else if (error.response?.status === 404) {
            Alert.alert('Error', 'Requested resource not found (404)');
          }
          
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Verify OTP
      userVerifyOtp: async (phoneNumber, otp) => {
        if (!phoneNumber || !otp) throw new Error('Mobile number and OTP are required');

        set({ loading: true, error: null });

        try {
          // Send as query params (matching original apiRequest behavior)
          const response = await axios.post(`${BASE_URL}/misc/verify-otp`, null, {
            params: {
              otp: otp.trim(),
              mobile_number: phoneNumber.trim(),
            },
            headers: { 'Content-Type': 'application/json' },
          });

          // Store token if available
          if (response.data?.access_token) {
            await AsyncStorage.setItem('access_token', response.data.access_token);
          }

          set({ loading: false, Register: response.data });
          return response.data;
        } catch (error) {
          console.error('Error verifying OTP:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Set password
      userPassword: async (data) => {
        if (!data.password && !data.fname) throw new Error('Password & Username is required');

        set({ loading: true, setPassword: 'pending', error: null });

        try {
          const token = await getToken();
          const response = await axios.post(`${BASE_URL}/register/setPassword/`, data, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          set({ loading: false, setPassword: 'success' });
          return response.data;
        } catch (error) {
          console.error('Error setting password:', error);
          set({ loading: false, setPassword: 'rejected', error: error.message });
          throw error;
        }
      },

      // Email generate OTP
      emailGenerateOtp: async (email) => {
        set({ loading: true, error: null });

        try {
          const token = await getToken();
          const response = await axios.post(
            `${BASE_URL}/register/emailVerification/`,
            { email },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          set({ loading: false, otpSent: true });
          return response.data;
        } catch (error) {
          console.error('Error generating email OTP:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Email verify OTP
      emailVerifyOtp: async (data) => {
        set({ loading: true, error: null });

        try {
          const token = await getToken();
          const response = await axios.post(
            `${BASE_URL}/register/VerifyEmailOtp/`,
            data,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          set({ loading: false, otpSent: true, EmailData: response.data });
          return response.data;
        } catch (error) {
          console.error('Error verifying email OTP:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Get user data
      fetchUserData: async () => {
        set({ loading: true, error: null });

        try {
          const token = await getToken();
          const response = await axios.get(`${BASE_URL}/register/check_user`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          set({ loading: false, user: response.data });
          return response.data;
        } catch (error) {
          console.error('Error fetching user data:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Update password
      updateUserPassword: async (data) => {
        set({ loading: true, error: null });

        try {
          const token = await getToken();
          const response = await axios.post(
            `${BASE_URL}/register/change_password`,
            data,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          set({ loading: false, updatePassword: response.data });
          return response.data;
        } catch (error) {
          console.error('Error updating password:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Logout
      logOut: async () => {
        try {
          await AsyncStorage.removeItem('access_token');
          set({ logout: true, user: [], Register: [] });
        } catch (error) {
          console.error('Error logging out:', error);
        }
      },

      // Check if user is logged in
      checkUser: async () => {
        const token = await AsyncStorage.getItem('access_token');
        return token ? true : false;
      },

      // Test API (for development)
      testApi: async () => {
        set({ loading: true, error: null });

        try {
          const response = await fetch('https://jsonplaceholder.typicode.com/todos/1');
          const data = await response.json();

          set({ loading: false, otpSent: true });
          return data;
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Reset register state
      resetRegister: () => set({
        logout: false,
        user: [],
        updatePassword: [],
        Register: [],
        loading: false,
        otpSent: false,
        EmailData: [],
        setPassword: null,
        error: null,
      }),

      // Send OTP for profile update
      sendProfileUpdateOtp: async (mobile) => {
        set({ loading: true, error: null, otpSent: false });

        try {
          const token = await getToken();
          const response = await axios.post(
            `${BASE_URL}/misc/send-otp`,
            null,
            {
              params: { mobile_number: mobile.trim() },
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          set({ loading: false, otpSent: true });
          return response.data;
        } catch (error) {
          console.error('Error sending profile update OTP:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Update user profile details (occupation, education, address)
      updateUserProfile: async (data) => {
        set({ loading: true, error: null });

        try {
          const token = await getToken();
          const response = await axios.post(
            `${BASE_URL}/register/update_profile/`,
            data,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          set({ loading: false });
          return response.data;
        } catch (error) {
          console.error('Error updating profile:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Verify OTP for profile update
      verifyProfileUpdateOtp: async (mobile, otp, updateData) => {
        set({ loading: true, error: null });

        try {
          const token = await getToken();
          // First verify OTP
          const verifyResponse = await axios.post(
            `${BASE_URL}/misc/verify-otp`,
            null,
            {
              params: {
                otp: otp.trim(),
                mobile_number: mobile.trim(),
              },
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Then update profile
          const updateResponse = await axios.post(
            `${BASE_URL}/register/update_profile/`,
            updateData,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          );

          set({ loading: false });
          return { verified: true, updated: updateResponse.data };
        } catch (error) {
          console.error('Error verifying OTP or updating profile:', error);
          set({ loading: false, error: error.message });
          throw error;
        }
      },
    }),
    {
      name: 'register-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
