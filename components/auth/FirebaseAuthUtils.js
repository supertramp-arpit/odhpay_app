// FirebaseAuthUtils.js (modular, v22+)
import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged as _onAuthStateChanged,
  signInWithCredential,
  signOut,
} from '@react-native-firebase/auth';


const WEB_CLIENT_ID = '878982490513-6gkcdrfb4j7kgrvuh1m81obsbef3rtjv.apps.googleusercontent.com'

export function configureGoogleSignin() {
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
}

export function onAuthChanged(callback) {
  return _onAuthStateChanged(getAuth(), callback);
}

export async function signInWithGoogle() {
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  // Clear any stale Google session to avoid the “sheet opens then closes” behavior
  try {
    if (await GoogleSignin.isSignedIn()) await GoogleSignin.signOut();
  } catch {}

  const result = await GoogleSignin.signIn();

  // Prefer result.idToken; fallback to getTokens() on devices where it's missing
  let idToken = result?.idToken;
  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    idToken = tokens?.idToken;
  }
  if (!idToken) throw new Error('Google Sign-In failed: missing idToken');

  const credential = GoogleAuthProvider.credential(idToken);
  return await signInWithCredential(getAuth(), credential);
}

export async function userLogout() {
  await signOut(getAuth());
  try {
    if (await GoogleSignin.isSignedIn()) await GoogleSignin.signOut();
  } catch {}
}

export function mapGoogleError(error) {
  if (!error || !error.code) return 'Something went wrong. Please try again.';
  switch (error.code) {
    case statusCodes.SIGN_IN_CANCELLED:
      return 'Sign-in cancelled.';
    case statusCodes.IN_PROGRESS:
      return 'Sign-in already in progress.';
    case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
      return 'Google Play Services not available or outdated.';
    case 10:
      return 'Config error: wrong client ID or SHA fingerprint mismatch.'; // DEVELOPER_ERROR
    case 7:
      return 'Network error during Google Sign-In.'; // NETWORK_ERROR
    case 12500:
      return 'Google Sign-In failed. Check OAuth consent screen & SHA keys.';
    case 12501:
      return 'Sign-in cancelled.';
    default:
      return error.message || 'An unknown error occurred.';
  }
}
