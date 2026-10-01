// Wallet withdrawal + bank-account API (/api/v1/wallet/*).
// Every route here requires the admin-controlled `wallet_enabled` flag (403 otherwise).
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { integrityHeaders } from './secureRequest';

export const WALLET_API = 'https://newapi.odhpay.com/api/v1/wallet';

export const authHeaders = async (extra = {}) => {
  const token = await AsyncStorage.getItem('access_token');
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra };
};

// Money-moving routes are behind require_fresh_integrity on the backend.
export const signedAuthHeaders = async () => authHeaders(await integrityHeaders());

// FastAPI errors: { detail: "msg" } or 422 { detail: [{ msg }] }
export const apiErrorMessage = (e, fallback = 'Something went wrong. Please try again.') => {
  const detail = e?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg).replace(/^Value error, /, '');
  if (detail && typeof detail === 'object' && detail.message) return String(detail.message);
  if (e?.message === 'Network Error') return 'No internet connection. Please try again.';
  return fallback;
};

export const isWalletDisabledError = (e) => e?.response?.status === 403;

export async function getWithdrawConfig() {
  const res = await axios.get(`${WALLET_API}/withdraw/config`, { headers: await authHeaders() });
  return res.data; // { min_amount, max_amount, fee_percent }
}

export async function getWithdrawals(page = 1, pageSize = 10) {
  const res = await axios.get(`${WALLET_API}/withdrawals`, {
    params: { page, page_size: pageSize },
    headers: await authHeaders(),
  });
  return res.data; // { total, withdrawals: [...] }
}

export async function requestWithdrawal({ bankAccountId, amount, pin }) {
  const res = await axios.post(
    `${WALLET_API}/withdraw`,
    { bank_account_id: bankAccountId, amount: Number(amount).toFixed(2), transaction_pin: pin },
    { headers: await signedAuthHeaders() }
  );
  return res.data; // { withdrawal, balance_after, message }
}
