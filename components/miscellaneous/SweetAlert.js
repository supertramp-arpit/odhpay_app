import React, { useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function SweetAlert({
  visible,
  type = "error",
  title,
  message,
  onClose,
}) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset values
      scale.setValue(0.5);
      opacity.setValue(0);
      iconScale.setValue(0);
      iconRotate.setValue(0);

      // Card animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Icon animation with delay
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(iconScale, {
            toValue: 1,
            friction: 4,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.timing(iconRotate, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 150);
    } else {
      opacity.setValue(0);
      scale.setValue(0.5);
      iconScale.setValue(0);
      iconRotate.setValue(0);
    }
  }, [visible]);

  const colors = {
    error: {
      primary: "#ef4444",
      secondary: "#fef2f2",
      border: "#fecaca",
    },
    warning: {
      primary: "#f59e0b",
      secondary: "#fffbeb",
      border: "#fde68a",
    },
    success: {
      primary: "#10b981",
      secondary: "#ecfdf5",
      border: "#a7f3d0",
    },
    info: {
      primary: "#5F259F",
      secondary: "#f5f3ff",
      border: "#c4b5fd",
    },
  };

  const icons = {
    error: "close-circle",
    warning: "warning",
    success: "checkmark-circle",
    info: "information-circle",
  };

  const spin = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const currentColors = colors[type] || colors.error;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale }],
            },
          ]}
        >
          {/* Icon Container with colored background */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: currentColors.secondary },
            ]}
          >
            <Animated.View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: currentColors.primary,
                  transform: [
                    { scale: iconScale },
                    { rotate: type === "success" ? spin : "0deg" },
                  ],
                },
              ]}
            >
              <Ionicons name={icons[type]} size={40} color="#fff" />
            </Animated.View>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: currentColors.primary }]}>
              {title}
            </Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: currentColors.primary }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: Math.min(width * 0.85, 340),
    backgroundColor: "#fff",
    borderRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  iconContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    color: "#6b7280",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 20,
    marginTop: 8,
  },
  button: {
    marginHorizontal: 24,
    marginVertical: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
