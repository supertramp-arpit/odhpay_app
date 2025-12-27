import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppStore } from "../../store/useAppStore";
import Theme, { getResponsiveValue } from "../Theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 375;

// Theme-based colors
const COLORS = {
  primary: Theme.colors.primary,
  secondary: Theme.colors.secondary,
  background: Theme.colors.background,
  text: Theme.colors.text,
  subtext: Theme.colors.textSecondary,
  border: Theme.colors.border,
  inputBg: Theme.colors.inputBg,
  primaryLight: Theme.colors.primary + "10",
  overlay: "rgba(0,0,0,0.5)",
};

const CirclePopup = ({
  visible,
  onClose,
  onSelectCircle,
  selectedOperator,
}) => {
  const [circles, setCircles] = useState([]);
  const [loading, setLoading] = useState(false);

  const { setSelectedOperator: setOperator } = useAppStore();

  const handleOperatorCircle = (item) => {
    // Pass circle data
    onSelectCircle({
      CircleName: item.CircleName,
      CircleID: item.CircleID,
    });

    setOperator({
      operator: selectedOperator,
      circle: item.CircleName,
    });
  };

  const fetchCircleCode = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        console.error("Token is missing!");
        setLoading(false);
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.get(
        "https://newapi.odhpay.com/recharge/circlecode",
        { headers }
      );

      console.log("Circle API response:", response.data);

      if (response.status === 200 && Array.isArray(response.data.data)) {
        setCircles(response.data.data);
      } else {
        setCircles([]);
        Alert.alert("Error", "Failed to load circles");
      }
    } catch (error) {
      console.error("Error fetching circles:", error);
      setCircles([]);

      if (axios.isAxiosError(error)) {
        console.error(
          "Axios Error:",
          error.response?.status,
          error.response?.data
        );

        if (error.response?.status === 404) {
          Alert.alert("Error", "Requested resource not found (404)");
        } else if (error.response?.status === 401) {
          Alert.alert("Error", "Authentication failed. Please login again.");
        }
      } else {
        Alert.alert("Error", "Something went wrong while fetching circles!");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCircleCode();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          <View style={styles.header}>
            <Text style={styles.modalTitle}>Select Your Circle</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={isSmallDevice ? 18 : 20} color={COLORS.subtext} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading circles...</Text>
            </View>
          ) : (
            <FlatList
              data={circles}
              keyExtractor={(item) => String(item.CircleID)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.circleItem}
                  onPress={() => handleOperatorCircle(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.circleIcon}>
                    <Ionicons name="location-outline" size={isSmallDevice ? 16 : 18} color={COLORS.primary} />
                  </View>
                  <Text style={styles.circleText}>{item.CircleName}</Text>
                  <Ionicons name="chevron-forward" size={isSmallDevice ? 18 : 20} color={COLORS.subtext} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="location-outline" size={isSmallDevice ? 40 : 48} color={COLORS.subtext} />
                  <Text style={styles.emptyText}>No circles found</Text>
                  <TouchableOpacity 
                    style={styles.retryBtn} 
                    onPress={fetchCircleCode}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={16} color={COLORS.secondary} />
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: COLORS.secondary,
    borderTopLeftRadius: getResponsiveValue(20, 24, 28),
    borderTopRightRadius: getResponsiveValue(20, 24, 28),
    paddingHorizontal: getResponsiveValue(16, 20, 24),
    paddingBottom: getResponsiveValue(28, 34, 40),
    maxHeight: "80%",
  },
  handleBar: {
    width: getResponsiveValue(36, 40, 44),
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: getResponsiveValue(10, 12, 14),
    marginBottom: getResponsiveValue(16, 20, 24),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getResponsiveValue(12, 16, 20),
  },
  modalTitle: {
    fontSize: getResponsiveValue(18, 20, 22),
    fontWeight: "700",
    color: COLORS.text,
  },
  closeBtn: {
    width: getResponsiveValue(32, 36, 40),
    height: getResponsiveValue(32, 36, 40),
    borderRadius: getResponsiveValue(16, 18, 20),
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getResponsiveValue(40, 50, 60),
  },
  loadingText: {
    marginTop: getResponsiveValue(10, 14, 16),
    fontSize: getResponsiveValue(13, 14, 15),
    color: COLORS.subtext,
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: getResponsiveValue(8, 10, 12),
  },
  circleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: getResponsiveValue(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  circleIcon: {
    width: getResponsiveValue(40, 44, 48),
    height: getResponsiveValue(40, 44, 48),
    borderRadius: getResponsiveValue(12, 14, 16),
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: getResponsiveValue(10, 14, 16),
  },
  circleText: {
    flex: 1,
    fontSize: getResponsiveValue(14, 15, 16),
    fontWeight: "600",
    color: COLORS.text,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: getResponsiveValue(40, 50, 60),
  },
  emptyText: {
    marginTop: getResponsiveValue(10, 14, 16),
    fontSize: getResponsiveValue(13, 14, 15),
    color: COLORS.subtext,
    fontWeight: "500",
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: getResponsiveValue(16, 20, 24),
    paddingVertical: getResponsiveValue(10, 12, 14),
    borderRadius: getResponsiveValue(10, 12, 14),
    marginTop: getResponsiveValue(12, 16, 20),
    gap: 6,
  },
  retryText: {
    fontSize: getResponsiveValue(13, 14, 15),
    fontWeight: "600",
    color: COLORS.secondary,
  },
});

export default CirclePopup;
