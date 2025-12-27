// File: AadhaarDetailsWb.js  (Light theme • keep card design • buttons fit + icons • share image)
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Dimensions, ScrollView, Alert, Animated, StatusBar, } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAadharStore } from "../../store";
import Theme from "../../components/Theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

// NEW: for screenshot + image share
import ViewShot from "react-native-view-shot";
import RNShare from "react-native-share";

// Optional gradient (safe fallback)
let LinearGradient;
try {
  LinearGradient = require("react-native-linear-gradient").default;
} catch {
  LinearGradient = ({ style, children }) => <View style={style}>{children}</View>;
}

const PRIMARY = Theme?.colors?.primary || "#ff8a00";
const CARD_RADIUS = 18;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;

const AadharDetails = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animations
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(cardAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulsing icon animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(iconAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const iconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  // Zustand store
  const { AadharDetail, loading, getAadharDetail } = useAadharStore();

  const [circularloading, setCircularLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorText, setErrorText] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // NEW: ref for card screenshot
  const cardRef = useRef(null);

  const handleAddharData = async () => {
    try {
      setErrorText("");
      setCircularLoading(true);
      const token = await AsyncStorage.getItem("access_token");
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };
      const response = await axios.get(`https://newapi.odhpay.com/userAadharDetail/`, { headers });
      if (response.status === 200) {
        setResult(response.data);
        console.log("Aadhaar details fetched:", response.data);
        setLastUpdated(new Date());
      }
      else setErrorText("Unable to fetch Aadhaar details. Please try again.");
    } catch (error) {
      setErrorText("Error fetching Aadhaar details. Please try again.");
      console.log("Error fetching data:", error?.response?.data || error?.message);
    } finally {
      setCircularLoading(false);
    }
  };

  useEffect(() => {
    handleAddharData();
  }, []);

  useEffect(() => {
    getAadharDetail();
  }, []);

  const aadharDetails = useMemo(() => {
    return (
      result?.aadhar_details ||
      AadharDetail?.aadhar_details ||
      AadharDetail?.aadhaar_details ||
      {}
    );
  }, [result, AadharDetail]);

  const address = aadharDetails?.address || {};

  const fullAddress = useMemo(() => {
    if (result?.address) return result.address;
    const parts = [
      address.careOf,
      address.house,
      address.street,
      address.landmark,
      address.locality,
      address.vtc || address.city,
      address.district,
      address.state,
      address.country,
      address.pin,
    ]
      .filter(Boolean)
      .join(", ");
    return parts || "N/A";
  }, [result, address]);

  const maskedNumber = useMemo(() => {
    const num = aadharDetails?.maskedNumber || aadharDetails?.masked_aadhaar || aadharDetails?.aadharNumber || "";
    const digits = num.replace(/\D/g, "");
    if (!digits) return "N/A";
    const last4 = digits.slice(-4);
    return `xxxx xxxx xxxx ${last4}`;
  }, [aadharDetails?.maskedNumber, aadharDetails?.masked_aadhaar, aadharDetails?.aadharNumber]);

  const genderLabel = useMemo(() => {
    const g = (aadharDetails?.gender || "").toUpperCase();
    if (g === "M") return "Male";
    if (g === "F") return "Female";
    if (g === "T") return "Transgender";
    return "N/A";
  }, [aadharDetails?.gender]);

  // ✅ ONLY CHANGE: format DOB as dd-mm-yyyy (zero-padded), handling common inputs
  const dobFormatted = useMemo(() => {
    const raw = aadharDetails?.dateOfBirth || aadharDetails?.dob;
    if (!raw) return "N/A";
    const cleaned = String(raw).trim();

    // handle ISO with time e.g. 1990-07-05T00:00:00Z
    const datePart = cleaned.includes("T")
      ? cleaned.split("T")[0]
      : cleaned.split(" ")[0];

    const sep = datePart.includes("-") ? "-" : (datePart.includes("/") ? "/" : null);
    if (!sep) return cleaned;

    const p = datePart.split(sep);
    if (p.length !== 3) return cleaned;

    // yyyy-mm-dd → dd-mm-yyyy
    if (p[0].length === 4) {
      const [yyyy, mm, dd] = p;
      return `${dd.padStart(2, "0")}-${mm.padStart(2, "0")}-${yyyy}`;
    }

    // assume dd-mm-yyyy or dd/mm/yyyy → dd-mm-yyyy
    const [dd, mm, yyyy] = p;
    return `${dd.padStart(2, "0")}-${mm.padStart(2, "0")}-${yyyy}`;
  }, [aadharDetails?.dateOfBirth]);

  const isBusy = loading || circularloading;
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return "Just now";
    return new Date(lastUpdated).toLocaleTimeString();
  }, [lastUpdated]);

  // NEW: Share image (not text)
  const handleShare = async () => {
    try {
      if (!cardRef.current) return;
      const uri = await cardRef.current.capture?.({
        format: "png",
        quality: 0.95,
        result: "tmpfile", // returns file:// URI (best for sharing)
      });
      await RNShare.open({
        url: uri,
        type: "image/png",
        failOnCancel: false,
      });
    } catch (e) {
      console.log("Share error:", e);
      Alert.alert("Share failed", "Couldn't share the Aadhaar card image.");
    }
  };

  return (
    <View style={styles.safe}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {isBusy && (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingCard}>
              <View style={styles.loadingIconContainer}>
                <ActivityIndicator size="large" color={PRIMARY} />
              </View>
              <Text style={styles.loadingTitle}>Fetching Details</Text>
              <Text style={styles.loadingText}>Please wait while we fetch your Aadhaar information...</Text>
            </View>
          </View>
        )}

        {!isBusy && errorText ? (
          <View style={styles.errorWrap}>
            <Text style={styles.warningText}>⚠ {errorText}</Text>
            <TouchableOpacity
              style={[styles.btn, styles.primaryBtn, styles.btnFull]}
              onPress={handleAddharData}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={18} color="#fff" style={styles.btnIcon} />
              <Text style={styles.btnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}


        {/* Kyc Required */}
        {!isBusy && !errorText && result?.status == "error" ? (
          <View style={styles.container}>

            {/* Content Section */}
            <Animated.View
              style={[
                styles.contentContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              {/* Icon Container with Animation */}
              <Animated.View
                pointerEvents="box-none"
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: iconScale }],
                  },
                ]}
              >
                <MaterialIcons name="description" size={80} color={Theme.colors.primary} />
              </Animated.View>

              {/* Title */}
              <Text style={styles.title}>KYC Required</Text>

              {/* Description */}
              <Text style={styles.description}>
                Your KYC is required to continue. Please complete your verification.
              </Text>

              {/* Complete KYC Button */}
              <TouchableOpacity
                style={styles.kycButton}
                onPress={() => navigation.navigate('AadharKyc')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="description" size={24} color={Theme.colors.secondary} />
                <Text style={styles.kycButtonText}>Complete Your KYC</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Bottom Decorative Element */}
            <View style={styles.bottomDecor} pointerEvents="none">
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
            </View>
          </View>
        ) : null}

        {!isBusy && result?.status !== "error" && (
          <>
            
          <View style={styles.cardOuter}>
            {/* DO NOT change card design: wrapped in ViewShot only */}
            <ViewShot ref={cardRef} options={{ format: "png", quality: 0.95, result: "tmpfile" }}>
              <LinearGradient
                pointerEvents="none"
                colors={["#FF9933", "#FFFFFF", "#138808"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.borderGlow}
              >
                <View style={styles.cardInner}>
                  {/* Header */}
                  <View style={styles.header}>
                    <Image source={require("../../assets/gov.png")} style={styles.logo} />
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text style={styles.headerLineHindi}>भारत सरकार</Text>
                      <Text style={styles.headerLineEn}>GOVERNMENT OF INDIA</Text>
                    </View>
                    <Image source={require("../../assets/aadhar.png")} style={styles.logo} />
                  </View>

                  {/* Thin hologram strip */}
                  <LinearGradient
                    colors={["#f6f6f6", "#ededed", "#f6f6f6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.holo}
                  />

                  {/* Body */}
                  <View style={styles.bodyRow}>
                    {/* Left - Photo */}
                    <View style={styles.leftCol}>
                      <View style={styles.photoWrap}>
                        <Image
                          source={
                            aadharDetails.photo || aadharDetails.profile_image_b64
                              ? { uri: `data:image/jpeg;base64,${aadharDetails.photo || aadharDetails.profile_image_b64}` }
                              : require("../../assets/profile.png")
                          }
                          style={styles.photo}
                        />
                      </View>

                      {/* QR (black/white, no tint) */}
                      <View style={styles.qrWrap}>
                        {aadharDetails.qrCode ? (
                          <Image
                            source={{ uri: `data:image/png;base64,${aadharDetails.qrCode}` }}
                            style={styles.qr}
                          />
                        ) : (
                          <Image source={require("../../assets/Qr_Code.png")} style={styles.qr} />
                        )}
                        <Text style={styles.qrHint}>Scan to verify</Text>
                      </View>
                    </View>

                    {/* Right - Details */}
                    <View style={styles.rightCol}>
                      <Text
                        style={styles.nameText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {aadharDetails?.name || aadharDetails?.full_name || "N/A"}
                      </Text>

                      <View style={styles.kv}>
                        <Text style={styles.k}>DOB</Text>
                        {/* ✅ Using formatted DOB */}
                        <Text style={styles.v}>{dobFormatted}</Text>
                      </View>

                      <View style={styles.kv}>
                        <Text style={styles.k}>Gender</Text>
                        <Text style={styles.v}>{genderLabel}</Text>
                      </View>

                      {/* Aadhaar number: heading line + value line */}
                      <View style={styles.kvBlock}>
                        <Text style={styles.k}>Aadhaar No.</Text>
                        <Text
                          style={[styles.v, styles.aadhaarNumber]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                        >
                          {maskedNumber}
                        </Text>
                      </View>

                      <View style={styles.addrBox}>
                        <Text style={styles.addrTitle}>Address</Text>
                        <Text style={styles.addrText}>{fullAddress}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.footerBand}>
                    <LinearGradient
                      colors={["#FF9933", "#FFFFFF", "#138808"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.footerText}>आधार — आम आदमी का अधिकार</Text>
                  </View>
                </View>
              </LinearGradient>
            </ViewShot>

            {/* ACTIONS — SAME COLOR + ICONS + FIT IN ONE ROW */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleAddharData} activeOpacity={0.85}>
                <Ionicons name="refresh" size={18} color="#fff" style={styles.btnIcon} />
                <Text style={styles.btnText}>Refresh</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleShare} activeOpacity={0.85}>
                <Ionicons name="share-social" size={18} color="#fff" style={styles.btnIcon} />
                <Text style={styles.btnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.secondary },
  
  // Header styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Theme.colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${Theme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Theme.colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
  },

  scroll: { 
    padding: isSmallDevice ? 16 : isMediumDevice ? 20 : 24, 
    paddingBottom: isSmallDevice ? 32 : 40 
  },

  // Loading State
  loadingWrap: { alignItems: "center", marginTop: 80 },
  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: isSmallDevice ? 28 : 36,
    alignItems: "center",
    width: SCREEN_WIDTH - (isSmallDevice ? 48 : 64),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  loadingIconContainer: {
    width: isSmallDevice ? 64 : 76,
    height: isSmallDevice ? 64 : 76,
    borderRadius: isSmallDevice ? 32 : 38,
    backgroundColor: `${PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  loadingText: { 
    color: "#6b7280", 
    fontSize: isSmallDevice ? 14 : 15, 
    textAlign: "center", 
    lineHeight: 22,
    fontWeight: "400",
  },

  // Error State
  errorWrap: { alignItems: "center", marginTop: 40, paddingHorizontal: 16 },
  warningText: { 
    fontSize: isSmallDevice ? 16 : 18, 
    fontWeight: "800", 
    color: "#dc2626", 
    textAlign: "center", 
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  btnFull: { alignSelf: "stretch", marginTop: 10 },

  // KYC States
  kycWrap: { alignItems: "center", marginTop: 40, paddingHorizontal: 16 },
  bigTitle: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 8 },
  subText: { fontSize: 15, color: "#4b5563", textAlign: "center", marginBottom: 16 },

  // Buttons
  btn: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: isSmallDevice ? 15 : 16,
    paddingHorizontal: isSmallDevice ? 12 : 16,
    borderRadius: 14,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnIcon: { marginRight: 8 },
  primaryBtn: { backgroundColor: PRIMARY },
  btnText: { 
    color: "#fff", 
    fontSize: isSmallDevice ? 14 : 15, 
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // Action row
  actionsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    alignSelf: "stretch",
    gap: isSmallDevice ? 10 : 12,
    marginTop: isSmallDevice ? 16 : 20,
  },

  metaCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metaPill: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  metaPillLabel: { color: "#6b7280", fontSize: 12, marginBottom: 4 },
  metaPillValue: { color: "#0f172a", fontSize: 14, fontWeight: "700" },

  // Card
  cardOuter: { 
    marginTop: isSmallDevice ? 12 : 16,
    marginBottom: isSmallDevice ? 8 : 12,
  },
  borderGlow: { borderRadius: CARD_RADIUS + 4, padding: 2, backgroundColor: "#fff" },
  cardInner: {
    backgroundColor: "#ffffff",
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  headerRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  logo: { width: 42, height: 36, resizeMode: "contain" },
  headerLineHindi: { color: "#111827", fontSize: 13, fontWeight: "800" },
  headerLineEn: { color: "#4b5563", fontSize: 11, fontWeight: "700" },

  holo: { marginHorizontal: 14, height: 6, borderRadius: 4, opacity: 1, marginBottom: 10 },

  bodyRow: { flexDirection: "row", gap: 12, paddingHorizontal: 14, paddingBottom: 14 },
  leftCol: { width: 120, alignItems: "center" },
  rightCol: { flex: 1 },

  photoWrap: {
    width: 110,
    height: 132,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    marginBottom: 10,
  },
  photo: { width: "100%", height: "100%", resizeMode: "cover" },

  qrWrap: { alignItems: "center", marginTop: 18 },
  qr: {
    width: 92,
    height: 92,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    tintColor: undefined,
  },
  qrHint: { marginTop: 6, color: "#6b7280", fontSize: 11 },

  nameText: { 
    color: "#111827", 
    fontSize: isSmallDevice ? 18 : 20, 
    fontWeight: "900", 
    marginTop: 2, 
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  kv: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  kvBlock: { marginBottom: 10 },
  k: { 
    color: "#6b7280", 
    fontSize: isSmallDevice ? 12 : 13, 
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  v: { 
    color: "#111827", 
    fontSize: isSmallDevice ? 13 : 14, 
    fontWeight: "800" 
  },
  aadhaarNumber: { 
    marginTop: 4, 
    letterSpacing: isSmallDevice ? 0.8 : 1, 
    fontSize: isSmallDevice ? 15 : 16, 
    fontWeight: "800", 
    flexShrink: 1 
  },

  addrBox: {
    marginTop: 12,
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: isSmallDevice ? 10 : 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  addrTitle: { color: "#6b7280", fontSize: 12, fontWeight: "800", marginBottom: 4 },
  addrText: { 
    color: "#111827", 
    fontSize: isSmallDevice ? 12 : 13, 
    lineHeight: isSmallDevice ? 18 : 20,
    fontWeight: "500",
  },

  footerBand: { height: 40, justifyContent: "center", alignItems: "center", marginTop: 8 },
  footerText: { fontSize: 12, fontWeight: "900", color: "#0f172a", backgroundColor: "transparent" },

  // KYC Required Section
  container: {
    flex: 1,
    minHeight: Dimensions.get('window').height - 100,
    backgroundColor: Theme.colors.secondary,
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: isSmallDevice ? 24 : 32,
    paddingVertical: 40,
  },
  iconContainer: {
    width: isSmallDevice ? 120 : 140,
    height: isSmallDevice ? 120 : 140,
    borderRadius: isSmallDevice ? 60 : 70,
    backgroundColor: `${Theme.colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    borderWidth: 3,
    borderColor: `${Theme.colors.primary}25`,
  },
  title: {
    fontSize: isSmallDevice ? 24 : 28,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: isSmallDevice ? 14 : 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 36,
    paddingHorizontal: isSmallDevice ? 8 : 12,
    fontWeight: '400',
  },
  kycButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallDevice ? 16 : 18,
    paddingHorizontal: isSmallDevice ? 28 : 36,
    borderRadius: 16,
    width: '100%',
    maxWidth: isSmallDevice ? 300 : 340,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  kycButtonText: {
    color: Theme.colors.secondary,
    fontSize: isSmallDevice ? 15 : 17,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  bottomDecor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${Theme.colors.primary}08`,
    bottom: -100,
    left: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${Theme.colors.primary}12`,
    bottom: -50,
    right: -30,
  },
});

export default AadharDetails;
