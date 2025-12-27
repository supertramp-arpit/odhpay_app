/**
 * OTP Auto-Read Utility (Blinkit/Zepto Style)
 * 
 * HOW BLINKIT/ZEPTO DO IT:
 * 1. App hash is included in EVERY SMS from their backend
 * 2. SMS Retriever starts BEFORE OTP is requested
 * 3. SMS arrives -> Auto-read works silently (no dialog)
 * 
 * CRITICAL: Your SMS must look like this:
 * "Your ODH Pay OTP is 123456. Valid for 5 mins.
 * FA+9qCX9VSu"  <-- This is your app hash (11 characters)
 * 
 * Without the hash, SMS Retriever won't work silently!
 */

import { Platform, AppState } from 'react-native';
import RNSmsRetriever from 'react-native-sms-retriever';

// Store app hash globally so it can be sent to backend
let cachedAppHash = null;

/**
 * Get your app's unique hash (MUST be added to SMS template)
 * Send this to your backend team!
 */
export const getAppSignatureHash = async () => {
  if (Platform.OS !== 'android') return null;
  if (cachedAppHash) return cachedAppHash;
  
  try {
    const hash = await RNSmsRetriever.getAppSignature();
    cachedAppHash = hash;
    console.log('═══════════════════════════════════════════════════════');
    console.log('📱 YOUR APP HASH (Send to backend team):');
    console.log(`   ${hash}`);
    console.log('');
    console.log('📝 SMS TEMPLATE FORMAT:');
    console.log(`   Your ODH Pay OTP is {{OTP}}. Valid for 5 mins.`);
    console.log(`   ${hash}`);
    console.log('═══════════════════════════════════════════════════════');
    return hash;
  } catch (error) {
    console.warn('[OTP] Could not get app signature:', error);
    return null;
  }
};

/**
 * Extract OTP from message
 */
const extractOtp = (message, length = 6) => {
  if (!message) return null;
  const pattern = new RegExp(`\\b(\\d{${length}})\\b`);
  const match = message.match(pattern);
  return match ? match[1] : null;
};

/**
 * Blinkit-style OTP Reader
 * Simple, fast, reliable
 */
class OtpReader {
  constructor(options = {}) {
    this.onOtpReceived = options.onOtpReceived || (() => {});
    this.otpLength = options.otpLength || 6;
    this.timeout = options.timeout || 120000; // 2 minutes
    
    this.smsListener = null;
    this.timeoutId = null;
    this.isActive = false;
    this.hasReceivedOtp = false;
  }

  /**
   * Handle SMS received
   */
  onSmsReceived = (event) => {
    if (this.hasReceivedOtp) return;
    
    const message = event?.message;
    if (!message) return;
    
    console.log('[OTP] SMS detected, checking for OTP...');
    
    const otp = extractOtp(message, this.otpLength);
    if (otp) {
      console.log('[OTP] ✅ OTP extracted:', otp);
      this.hasReceivedOtp = true;
      this.stop();
      this.onOtpReceived(otp);
    }
  };

  /**
   * Start listening - Call this BEFORE requesting OTP from server
   */
  start = async () => {
    if (Platform.OS !== 'android') {
      console.log('[OTP] Only works on Android');
      return false;
    }

    if (this.isActive) return true;
    
    this.isActive = true;
    this.hasReceivedOtp = false;
    
    console.log('[OTP] 🚀 Starting SMS Retriever...');

    try {
      // Start SMS Retriever API (this is what Blinkit uses)
      await RNSmsRetriever.startSmsRetriever();
      console.log('[OTP] ✅ SMS Retriever started successfully');
      
      // Add listener for incoming SMS
      this.smsListener = RNSmsRetriever.addSmsListener(this.onSmsReceived);
      
    } catch (error) {
      console.log('[OTP] SMS Retriever failed, trying User Consent...');
      
      // Fallback: User Consent API (shows a dialog but works without hash)
      try {
        await RNSmsRetriever.startSmsUserConsent(null);
        this.smsListener = RNSmsRetriever.addSmsListener(this.onSmsReceived);
        console.log('[OTP] ✅ User Consent API started');
      } catch (e) {
        console.warn('[OTP] Both APIs failed:', e);
      }
    }

    // Set timeout
    this.timeoutId = setTimeout(() => {
      if (!this.hasReceivedOtp) {
        console.log('[OTP] ⏱️ Timeout - user must enter manually');
        this.stop();
      }
    }, this.timeout);

    return true;
  };

  /**
   * Stop listening
   */
  stop = () => {
    this.isActive = false;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.smsListener) {
      try {
        this.smsListener.remove();
      } catch (e) {}
      this.smsListener = null;
    }
    
    console.log('[OTP] 🛑 Stopped');
  };
}

/**
 * Create OTP reader instance
 */
export const createOtpReader = (options) => new OtpReader(options);

export default OtpReader;
