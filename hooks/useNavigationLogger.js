// hooks/useNavigationLogger.js
// Logs all navigation events in debug mode

import { useEffect, useRef } from "react";
import { useNavigationState, useRoute } from "@react-navigation/native";

const DEBUG_NAVIGATION = __DEV__;

const getTimestamp = () => {
  const now = new Date();
  return (
    now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) +
    "." +
    String(now.getMilliseconds()).padStart(3, "0")
  );
};

const formatParams = (params, maxLength = 200) => {
  if (!params || Object.keys(params).length === 0) return "";
  try {
    const str = JSON.stringify(params, null, 2);
    if (str.length > maxLength) {
      return str.substring(0, maxLength) + "... [truncated]";
    }
    return str;
  } catch {
    return "[Unable to stringify params]";
  }
};

export const useNavigationLogger = () => {
  const route = useRoute();
  const prevRouteRef = useRef(null);

  useEffect(() => {
    if (!DEBUG_NAVIGATION) return;

    const currentRoute = route.name;
    const prevRoute = prevRouteRef.current;

    if (prevRoute !== currentRoute) {
      console.log("\n" + "📱".repeat(40));
      console.log(`[SCREEN] ${getTimestamp()}`);
      if (prevRoute) {
        console.log(`  From: ${prevRoute}`);
      }
      console.log(`  To:   ${currentRoute}`);

      const params = route.params;
      if (params && Object.keys(params).length > 0) {
        console.log(`  Params: ${formatParams(params)}`);
      }
      console.log("📱".repeat(40) + "\n");

      prevRouteRef.current = currentRoute;
    }
  }, [route.name, route.params]);
};

export default useNavigationLogger;
