import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Lock } from "lucide-react-native";
import { color, space, radius, type } from "../../theme/tokens";
import { useWalletAccess, useUserStore } from "../../store";

/**
 * Renders children only for accounts an admin has wallet-enabled.
 * Every wallet screen is wrapped in this, so a stale route / deep link can't
 * show wallet UI to an account without access (the API would 403 anyway).
 */
export default function WalletGate({ children }) {
  const access = useWalletAccess();
  const loadError = useUserStore((s) => s.status === "error");
  const navigation = useNavigation();

  if (access === "enabled") return children;

  if (access === "unknown") {
    if (loadError) {
      return (
        <View style={styles.center}>
          <Text style={styles.title}>Couldn't load your account</Text>
          <Text style={styles.body}>Check your connection and try again.</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => useUserStore.getState().fetchUser({ force: true }).catch(() => {})}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <ActivityIndicator color={color.text} accessibilityLabel="Loading" />
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <View style={styles.iconWrap}>
        <Lock size={24} color={color.text} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>Wallet isn't available on your account</Text>
      <Text style={styles.body}>
        ODH Pay enables the wallet for eligible accounts. Contact support if you'd like access.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("MainApp"))}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xl,
    backgroundColor: color.background,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: color.surfaceSunken,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.base,
  },
  title: {
    ...type.h3,
    color: color.text,
    textAlign: "center",
    marginBottom: space.sm,
  },
  body: {
    ...type.body,
    color: color.textSecondary,
    textAlign: "center",
    marginBottom: space.xl,
  },
  button: {
    minHeight: 48,
    paddingHorizontal: space.xxl,
    borderRadius: radius.md,
    backgroundColor: color.ink900,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    ...type.button,
    color: color.textInverse,
  },
});
