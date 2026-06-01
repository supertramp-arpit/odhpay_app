// utils/apiLogger.js
// Debug API Logger - Logs all API calls with timing, request/response data
// Set DEBUG_API=true in your environment or toggle isEnabled below

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Toggle this to enable/disable logging
const DEBUG_CONFIG = {
  isEnabled: __DEV__, // Auto-enable in development mode
  logRequests: true,
  logResponses: true,
  logErrors: true,
  logTiming: true,
  logHeaders: false, // Set true to see auth headers (careful with tokens)
  maxBodyLength: 500, // Truncate long request/response bodies
};

// Color codes for console (works in React Native debugger)
const COLORS = {
  request: "\x1b[36m", // Cyan
  response: "\x1b[32m", // Green
  error: "\x1b[31m", // Red
  timing: "\x1b[33m", // Yellow
  reset: "\x1b[0m",
};

// Request counter for matching requests to responses
let requestCounter = 0;

// Store pending requests for timing
const pendingRequests = new Map();

const formatBody = (body, maxLength = DEBUG_CONFIG.maxBodyLength) => {
  if (!body) return "null";
  try {
    const str = typeof body === "string" ? body : JSON.stringify(body, null, 2);
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + `... [truncated, ${str.length} chars total]`;
    }
    return str;
  } catch (e) {
    return "[Unable to stringify body]";
  }
};

const getTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }) + "." + String(now.getMilliseconds()).padStart(3, "0");
};

// Extract endpoint from full URL
const getEndpoint = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
};

// Log API request
const logRequest = (config, requestId) => {
  if (!DEBUG_CONFIG.isEnabled || !DEBUG_CONFIG.logRequests) return;

  const endpoint = getEndpoint(config.url);
  const method = (config.method || "GET").toUpperCase();

  console.log("\n" + "=".repeat(80));
  console.log(
    `${COLORS.request}[API REQUEST #${requestId}] ${getTimestamp()}${COLORS.reset}`
  );
  console.log(`${COLORS.request}➡️  ${method} ${endpoint}${COLORS.reset}`);

  if (DEBUG_CONFIG.logHeaders && config.headers) {
    console.log("📋 Headers:", JSON.stringify(config.headers, null, 2));
  }

  if (config.data) {
    console.log("📦 Body:", formatBody(config.data));
  }

  if (config.params) {
    console.log("🔍 Params:", JSON.stringify(config.params, null, 2));
  }

  console.log("-".repeat(80));
};

// Log API response
const logResponse = (response, requestId, duration) => {
  if (!DEBUG_CONFIG.isEnabled || !DEBUG_CONFIG.logResponses) return;

  const endpoint = getEndpoint(response.config?.url || "");
  const method = (response.config?.method || "GET").toUpperCase();
  const status = response.status;

  console.log(
    `${COLORS.response}[API RESPONSE #${requestId}] ${getTimestamp()}${COLORS.reset}`
  );
  console.log(
    `${COLORS.response}✅ ${method} ${endpoint} → ${status}${COLORS.reset}`
  );

  if (DEBUG_CONFIG.logTiming) {
    console.log(`${COLORS.timing}⏱️  Duration: ${duration}ms${COLORS.reset}`);
  }

  if (response.data) {
    console.log("📥 Response:", formatBody(response.data));
  }

  console.log("=".repeat(80) + "\n");
};

// Log API error
const logError = (error, requestId, duration) => {
  if (!DEBUG_CONFIG.isEnabled || !DEBUG_CONFIG.logErrors) return;

  const config = error.config || {};
  const endpoint = getEndpoint(config.url || "");
  const method = (config.method || "GET").toUpperCase();
  const status = error.response?.status || "NETWORK_ERROR";

  console.log(
    `${COLORS.error}[API ERROR #${requestId}] ${getTimestamp()}${COLORS.reset}`
  );
  console.log(`${COLORS.error}❌ ${method} ${endpoint} → ${status}${COLORS.reset}`);

  if (DEBUG_CONFIG.logTiming && duration) {
    console.log(`${COLORS.timing}⏱️  Duration: ${duration}ms${COLORS.reset}`);
  }

  console.log(`${COLORS.error}💬 Message: ${error.message}${COLORS.reset}`);

  if (error.response?.data) {
    console.log("📥 Error Response:", formatBody(error.response.data));
  }

  console.log("=".repeat(80) + "\n");
};

// Setup axios interceptors
export const setupApiLogger = (axiosInstance = axios) => {
  // Request interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      if (DEBUG_CONFIG.isEnabled) {
        const requestId = ++requestCounter;
        config._requestId = requestId;
        config._startTime = Date.now();
        pendingRequests.set(requestId, config._startTime);
        logRequest(config, requestId);
      }
      return config;
    },
    (error) => {
      logError(error, "REQ_ERR", null);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      if (DEBUG_CONFIG.isEnabled) {
        const requestId = response.config?._requestId || "?";
        const startTime = response.config?._startTime;
        const duration = startTime ? Date.now() - startTime : null;
        pendingRequests.delete(requestId);
        logResponse(response, requestId, duration);
      }
      return response;
    },
    (error) => {
      if (DEBUG_CONFIG.isEnabled) {
        const requestId = error.config?._requestId || "?";
        const startTime = error.config?._startTime;
        const duration = startTime ? Date.now() - startTime : null;
        pendingRequests.delete(requestId);
        logError(error, requestId, duration);
      }
      return Promise.reject(error);
    }
  );

  console.log("🔧 API Logger initialized (DEBUG_CONFIG.isEnabled:", DEBUG_CONFIG.isEnabled, ")");
};

// Navigation logger for screen transitions
export const logScreenNavigation = (screenName, params = {}) => {
  if (!DEBUG_CONFIG.isEnabled) return;

  console.log("\n" + "🧭".repeat(40));
  console.log(`📱 [NAVIGATION] ${getTimestamp()}`);
  console.log(`   Screen: ${screenName}`);
  if (Object.keys(params).length > 0) {
    console.log(`   Params: ${formatBody(params, 200)}`);
  }
  console.log("🧭".repeat(40) + "\n");
};

// BBPS Flow specific logger
export const logBBPSFlow = (step, data = {}) => {
  if (!DEBUG_CONFIG.isEnabled) return;

  const BBPS_STEPS = {
    SEARCH_BILLERS: "🔍 Search Billers",
    SELECT_BILLER: "✅ Biller Selected",
    GET_BILLER_INFO: "📋 Get Biller UI Info",
    ENTER_PARAMS: "📝 Enter Input Parameters",
    FETCH_BILL: "📄 Fetch Bill",
    VALIDATE_BILL: "✓ Validate Bill",
    CONFIRM_BILL: "💰 Confirm Bill Amount",
    CREATE_PAYMENT: "💳 Create Payment",
    PAYMENT_STATUS: "📊 Check Payment Status",
    PAYMENT_SUCCESS: "🎉 Payment Successful",
    PAYMENT_FAILED: "❌ Payment Failed",
  };

  const stepLabel = BBPS_STEPS[step] || step;

  console.log("\n" + "💡".repeat(40));
  console.log(`[BBPS FLOW] ${getTimestamp()}`);
  console.log(`Step: ${stepLabel}`);
  if (Object.keys(data).length > 0) {
    console.log(`Data: ${formatBody(data, 300)}`);
  }
  console.log("💡".repeat(40) + "\n");
};

// Export config for runtime toggling
export const setDebugEnabled = (enabled) => {
  DEBUG_CONFIG.isEnabled = enabled;
  console.log(`🔧 API Logger ${enabled ? "ENABLED" : "DISABLED"}`);
};

export const getDebugConfig = () => ({ ...DEBUG_CONFIG });

export default {
  setupApiLogger,
  logScreenNavigation,
  logBBPSFlow,
  setDebugEnabled,
  getDebugConfig,
};
