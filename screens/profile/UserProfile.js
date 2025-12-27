import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  InteractionManager,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import Theme from "../../components/Theme";
import useUserStore from '../../store/useUserStore';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions, useFocusEffect } from "@react-navigation/native";
import { useKycDetailStore } from "../../store/useKycStore";

const { width } = Dimensions.get('window');

const UserProfile = ({ navigation }) => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const user = useUserStore(s => s.user);
  const payload = user?.user ? user.user : user;


  const kycDetails = useKycDetailStore(s => s.data);
  const fetchKyc = useKycDetailStore(s => s.fetchKyc);
  const kycStatus = useKycDetailStore(s => s.status);
  const kycError = useKycDetailStore(s => s.error);
  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        fetchKyc({ ttlMs: 10 * 60 * 1000 }); // 10 min TTL
      });
      return () => task.cancel?.();
    }, [fetchKyc])
  );

  console.log("KYC DETAILS IN PROFILE:", kycDetails);


  useEffect(() => {
    // Fetch user only if missing or stale
    const { user: storeUser, updatedAt } = useUserStore.getState();
    const ttlMs = 5 * 60 * 1000;
    if (!storeUser || Date.now() - (updatedAt || 0) > ttlMs) {
      useUserStore.getState().fetchUser().catch(() => {});
    }
  }, []);

  const aadhaar =
    kycDetails?.aadhar_details ||
    kycDetails?.aadhaar_details ||
    kycDetails?.aadhaar ||
    kycDetails;

  const maskedAadhaar = aadhaar?.maskedNumber || aadhaar?.masked_aadhaar || aadhaar?.aadharNumber || "Not linked";
  const dob = aadhaar?.dateOfBirth || aadhaar?.dob;
  const gender = aadhaar?.gender;
  const address = aadhaar?.address;
  const aadhaarVerified = !!aadhaar?.maskedNumber || !!aadhaar?.masked_aadhaar;

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await AsyncStorage.removeItem("fingerPrintStatus");
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("refresh_token");
      await AsyncStorage.removeItem('fcm_registered_map');

      await AsyncStorage.clear();
      setLogoutModalVisible(false);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Register" }],
        })
      );

    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const menuItems = [
    {
      label: "Personal Information",
      sublabel: "Name, email, phone & address",
      icon: "person-outline",
      iconPack: "Ionicons",
      onPress: () => navigation.navigate("UserInformation")
    },
    {
      label: "KYC Documents",
      sublabel: aadhaarVerified ? "Verified" : "Complete verification",
      icon: "shield-checkmark-outline",
      iconPack: "Ionicons",
      verified: aadhaarVerified,
      onPress: () => navigation.navigate("AadharDetails")
    },
    {
      label: "PAN Card",
      sublabel: "Link your PAN for tax benefits",
      icon: "card-outline",
      iconPack: "Ionicons",
      onPress: () => navigation.navigate("PanDetails")
    },
  ];

  const moreItems = [
    {
      label: "Invite & Earn",
      sublabel: "Refer friends, earn rewards",
      icon: "gift-outline",
      iconPack: "Ionicons",
      onPress: () => navigation.navigate("ReferralScreen")
    },
    {
      label: "Security",
      sublabel: "PIN, biometrics & password",
      icon: "lock-closed-outline",
      iconPack: "Ionicons",
      onPress: () => navigation.navigate("SecurityScreen")
    },
    {
      label: "Help & Support",
      sublabel: "FAQs and contact us",
      icon: "help-circle-outline",
      iconPack: "Ionicons",
      onPress: () => navigation.navigate("ContactUs")
    },
  ];
  function correctPath(url) {
    return url.replace(/\\/g, '/');
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate("UserInformation")}>
          <Feather name="edit-2" size={18} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {payload?.profile || aadhaar?.photo ? (
              <Image
                source={
                  payload?.profile
                    ? { uri: correctPath(`https://newapi.odhpay.com/${payload?.profile}`) }
                    : { uri: `data:image/jpeg;base64,${aadhaar?.photo}` }
                }
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {getInitials(payload?.fullname || aadhaar?.name)}
                </Text>
              </View>
            )}
            {aadhaarVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="#FFF" />
              </View>
            )}
          </View>

          <Text style={styles.profileName}>{payload?.fullname || aadhaar?.name || "User"}</Text>
          <Text style={styles.profilePhone}>{payload?.MobileNumber || aadhaar?.phone || "Add phone number"}</Text>
          
          {(payload?.Email || aadhaar?.email) && (
            <Text style={styles.profileEmail}>{payload?.Email || aadhaar?.email}</Text>
          )}

          <View style={styles.kycBadge}>
            <Ionicons 
              name={aadhaarVerified ? "shield-checkmark" : "shield-outline"} 
              size={14} 
              color={aadhaarVerified ? "#10B981" : "#F59E0B"} 
            />
            <Text style={[styles.kycText, !aadhaarVerified && styles.kycTextPending]}>
              {aadhaarVerified ? "KYC Verified" : "KYC Pending"}
            </Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, index === menuItems.length - 1 && styles.menuItemLast]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={20} color="#1a1a1a" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={[styles.menuSublabel, item.verified && styles.menuSublabelVerified]}>
                    {item.sublabel}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* More Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.menuCard}>
            {moreItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, index === moreItems.length - 1 && styles.menuItemLast]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon} size={20} color="#1a1a1a" />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSublabel}>{item.sublabel}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="log-out-outline" size={32} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>Log Out?</Text>
            <Text style={styles.modalText}>
              You'll need to sign in again to access your account
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Profile Card
  profileCard: {
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#F0F0F0",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFF",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  profilePhone: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  kycBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  kycText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10B981",
  },
  kycTextPending: {
    color: "#F59E0B",
  },
  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  menuSublabel: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  menuSublabelVerified: {
    color: "#10B981",
  },
  // Logout Button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  // Footer
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 13,
    color: "#D1D5DB",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default UserProfile;
