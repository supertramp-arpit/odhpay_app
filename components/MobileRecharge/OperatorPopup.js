import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CirclePopup from "./CirclePopup";
import Theme, { getResponsiveValue } from "../Theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
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
  overlay: "rgba(0,0,0,0.5)",
};

// Operator data with FreeCharge operatorId mapping
const OPERATORS = [
  { 
    name: "Airtel Prepaid", 
    logo: require("../../assets/airtel.png"), 
    color: "#FF0000",
    operatorId: 650,
  },
  { 
    name: "BSNL Prepaid", 
    logo: require("../../assets/bsnl2.png"), 
    color: "#FFCF00",
    operatorId: 651,
  },
  { 
    name: "Jio Prepaid", 
    logo: require("../../assets/jio.png"), 
    color: "#0A2885",
    operatorId: 652,
  },
  { 
    name: "Vi Prepaid", 
    logo: require("../../assets/vi.png"), 
    color: "#E60000",
    operatorId: 653,
  },
];

const OperatorPopup = ({ visible, onClose, onSelectOperator }) => {
  const [circlePopupVisible, setCirclePopupVisible] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState(null);

  const handleOperatorSelect = (operator) => {
    setSelectedOperator(operator);
    onClose();
    setTimeout(() => {
      setCirclePopupVisible(true);
    }, 300);
  };

  const handleCircleSelect = (circleData) => {
    setCirclePopupVisible(false);
    
    if (onSelectOperator && selectedOperator) {
      onSelectOperator({
        operator: selectedOperator.name,
        operatorId: selectedOperator.operatorId,
        operatorLogo: selectedOperator.logo,
        circle: circleData.CircleName,
        circleId: circleData.CircleID,
      });
    }
  };

  const handleCircleClose = () => {
    setCirclePopupVisible(false);
    setSelectedOperator(null);
  };

  // Debug log for modal visibility
  // console.log("OperatorPopup visible:", visible);

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
        statusBarTranslucent={true}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handleBar} />
            
            <View style={styles.header}>
              <Text style={styles.modalTitle}>Select Operator</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={isSmallDevice ? 18 : 20} color={COLORS.subtext} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={OPERATORS}
              keyExtractor={(item) => item.name}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.operatorItem}
                  onPress={() => handleOperatorSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.logoContainer, { backgroundColor: `${item.color}10` }]}>
                    <Image source={item.logo} style={styles.operatorLogo} />
                  </View>
                  <View style={styles.operatorInfo}>
                    <Text style={styles.operatorText}>{item.name}</Text>
                    <Text style={styles.operatorSubtext}>Prepaid Recharge</Text>
                  </View>
                  <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={isSmallDevice ? 18 : 20} color={COLORS.subtext} />
                  </View>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <CirclePopup
        visible={circlePopupVisible}
        onClose={handleCircleClose}
        onSelectCircle={handleCircleSelect}
        selectedOperator={selectedOperator?.name || ""}
      />
    </>
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
    maxHeight: "60%",
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
  listContent: {
    paddingBottom: getResponsiveValue(8, 10, 12),
  },
  operatorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: getResponsiveValue(12, 14, 16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    width: getResponsiveValue(48, 56, 64),
    height: getResponsiveValue(48, 56, 64),
    borderRadius: getResponsiveValue(12, 16, 18),
    justifyContent: "center",
    alignItems: "center",
    marginRight: getResponsiveValue(10, 14, 16),
  },
  operatorLogo: {
    width: getResponsiveValue(32, 38, 44),
    height: getResponsiveValue(32, 38, 44),
    resizeMode: "contain",
  },
  operatorInfo: {
    flex: 1,
  },
  operatorText: {
    fontSize: getResponsiveValue(14, 16, 18),
    fontWeight: "600",
    color: COLORS.text,
  },
  operatorSubtext: {
    fontSize: getResponsiveValue(11, 13, 14),
    color: COLORS.subtext,
    marginTop: 3,
  },
  arrowContainer: {
    width: getResponsiveValue(28, 32, 36),
    height: getResponsiveValue(28, 32, 36),
    borderRadius: getResponsiveValue(14, 16, 18),
    backgroundColor: COLORS.inputBg,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default OperatorPopup;
