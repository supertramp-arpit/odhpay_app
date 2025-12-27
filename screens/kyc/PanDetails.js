import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAadharStore } from "../../store";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import ViewShot from "react-native-view-shot";
import RNShare from "react-native-share";
import Theme from "../../components/Theme";

// Optional gradient (fallback to View)
let LinearGradient;
try {
  LinearGradient = require("react-native-linear-gradient").default;
} catch {
  LinearGradient = ({ style, children }) => <View style={style}>{children}</View>;
}

const PRIMARY = Theme?.colors?.primary || "#ff8a00";
const CARD_RADIUS = 16;
const SCREEN_W = Dimensions.get("window").width;
const H_PAD = 32;
const CARD_MAX_WIDTH = Math.min(Math.max(SCREEN_W - H_PAD, 300), 900);
const PHOTO_SIZE = Math.max(88, Math.round(CARD_MAX_WIDTH * 0.18));
const LEFT_COL_WIDTH = PHOTO_SIZE + 28;

const PATTERN_WAVE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVElEQVQ4T2NkoBAwUqifYbCxYf9HMBgYGMQwYGB4xJwMZkK4Zy9c+ePfsWjUQ2g0Qkhi2bNn4yqVKo6QxYwzMTA8g0E0CkQzQyB8k2k2gqQ6kQwD4qDMBpQFQkVgqg0wGkFqEAALrIh0QbK3mQAAAAASUVORK5CYII=";
const PATTERN_DOTS =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAKUlEQVQoU2NkIBIwEqmOgYGBwSCGQBdIMcJxgpgMxAqhYGBgQBGCBwAAM6QGCunZfIMAAAAASUVORK5CYII=";

const PanDetails = () => {
  const navigation = useNavigation();
  
  // Zustand store
  const { PanDetail, loading, getPanDetail } = useAadharStore();

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
  }, [fadeAnim, iconAnim, scaleAnim, slideAnim, headerAnim, cardAnim]);

  const iconScale = iconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const [errorText, setErrorText] = useState("");
  const cardRef = useRef(null);

  useEffect(() => {
    setErrorText("");
    getPanDetail();
  }, []);

  const pan = PanDetail?.data || {};
  const rawHolderName = pan?.pan_holder_name;
  const rawPanNumber = pan?.pan_number;
  const holderName = rawHolderName || "N/A";
  const panNumber = rawPanNumber || "N/A";
  const rawSuccess = PanDetail?.["success"];
  const isSuccess =
    rawSuccess === true ||
    rawSuccess === "true" ||
    rawSuccess === 1 ||
    (!!rawPanNumber && !!rawHolderName);
  const isKycNeeded = rawSuccess === false || rawSuccess === "false" || rawSuccess === 0;

  // Safe DOB => dd-mm-yyyy
  const formattedDob = useMemo(() => {
    const raw = pan?.dateOfBirth;
    if (!raw) return "N/A";
    const cleaned = String(raw).trim();
    const datePart = cleaned.includes("T") ? cleaned.split("T")[0] : cleaned.split(" ")[0];
    const sep = datePart.includes("-") ? "-" : datePart.includes("/") ? "/" : null;
    if (!sep) return cleaned;
    const p = datePart.split(sep);
    if (p.length !== 3) return cleaned;
    if (p[0].length === 4) {
      const [yyyy, mm, dd] = p;
      return `${dd.padStart(2, "0")}-${mm.padStart(2, "0")}-${yyyy}`;
    }
    const [dd, mm, yyyy] = p;
    return `${dd.padStart(2, "0")}-${mm.padStart(2, "0")}-${yyyy}`;
  }, [pan?.dateOfBirth]);

  const handleRefresh = () => {
    setErrorText("");
    getPanDetail();
  };

  const handleShare = async () => {
    try {
      if (!cardRef.current) return;
      const uri = await cardRef.current.capture?.({
        format: "png",
        quality: 0.95,
        result: "tmpfile",
      });
      await RNShare.open({
        url: uri,
        type: "image/png",
        failOnCancel: false,
      });
    } catch (e) {
      Alert.alert("Share failed", "Couldn't share the PAN card image.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView 
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.loadingWrap}>
            <View style={styles.loadingCard}>
              <View style={styles.loadingIconContainer}>
                <ActivityIndicator size="large" color={PRIMARY} />
              </View>
              <Text style={styles.loadingTitle}>Fetching Details</Text>
              <Text style={styles.loadingText}>Please wait while we fetch your PAN information...</Text>
            </View>
          </View>
        )}

        {!loading && errorText ? (
          <View style={styles.errorWrap}>
            <View style={styles.errorBadge}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" />
              <Text style={styles.errorText}>Unable to load PAN right now.</Text>
            </View>
            <Text style={styles.errorHint}>{errorText}</Text>
            <TouchableOpacity
              style={[styles.btn, styles.primaryBtn, styles.btnFull]}
              onPress={handleRefresh}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={18} color="#fff" style={styles.btnIcon} />
              <Text style={styles.btnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !errorText && !isSuccess && !isKycNeeded ? (
          <View style={styles.emptyWrap}>
            <View style={styles.errorBadge}>
              <Ionicons name="document-text" size={18} color="#334155" />
              <Text style={styles.emptyTitle}>No PAN details found</Text>
            </View>
            <Text style={styles.emptyHint}>
              We couldn&apos;t find PAN information yet. Please refresh to fetch the latest data.
            </Text>
            <TouchableOpacity
              style={[styles.btn, styles.primaryBtn, styles.btnFull]}
              onPress={handleRefresh}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={18} color="#fff" style={styles.btnIcon} />
              <Text style={styles.btnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !errorText && isKycNeeded ? (
          <View style={styles.container}>
            <Animated.View
              style={[
                styles.contentContainer,
                { transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
              ]}
            >
              <Animated.View
                pointerEvents="box-none"
                style={[styles.iconContainer, { transform: [{ scale: iconScale }] }]}
              >
                <MaterialIcons name="description" size={80} color={Theme.colors.primary} />
              </Animated.View>

              <Text style={styles.title}>KYC Required</Text>
              <Text style={styles.description}>
                Your KYC is required to continue. Please complete your verification.
              </Text>

              <TouchableOpacity
                style={styles.kycButton}
                onPress={() => navigation.navigate("PanKyc")}
                activeOpacity={0.8}
              >
                <MaterialIcons name="description" size={24} color={Theme.colors.secondary} />
                <Text style={styles.kycButtonText}>Complete Your KYC</Text>
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.bottomDecor} pointerEvents="none">
              <View style={styles.decorCircle1} />
              <View style={styles.decorCircle2} />
            </View>
          </View>
        ) : null}

        {!loading && !errorText && isSuccess && (
          <View style={styles.contentWrap}>
          

            <View style={styles.cardOuter}>
              <ViewShot
                ref={cardRef}
                options={{ format: "png", quality: 0.95, result: "tmpfile" }}
              >
                <View style={styles.cardBorder}>
                  <LinearGradient
                    colors={["#f6f9ff", "#e8f0ff", "#f5f6ff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.card}
                  >
                    <View pointerEvents="none" style={styles.securityLayers}>
                      <Image
                        source={{ uri: PATTERN_WAVE }}
                        style={styles.patternWave}
                        resizeMode="repeat"
                      />
                      <Image
                        source={{ uri: PATTERN_DOTS }}
                        style={styles.patternDots}
                        resizeMode="repeat"
                      />
                    </View>

                    <View style={styles.header}>
                      <Image source={require("../../assets/gov.png")} style={styles.govLogo} />
                      <View style={{ flex: 1, alignItems: "center" }}>
                        <Text style={styles.headerHi}>BHARAT SARKAR</Text>
                        <Text style={styles.headerEn}>GOVERNMENT OF INDIA</Text>
                      </View>
                      <Image source={require("../../assets/IncomeTax.png")} style={styles.itdLogo} />
                    </View>

                    <View style={styles.holo} />

                    <View style={styles.bodyRow}>
                      <View style={styles.leftCol}>
                        <View style={styles.photoWrap}>
                          <Image
                            source={
                              pan?.photo
                                ? { uri: `data:image/jpeg;base64,${pan.photo}` }
                                : require("../../assets/profile.png")
                            }
                            style={styles.photo}
                          />
                        </View>
                       
                      </View>

                      <View style={styles.rightCol}>
                        <View style={styles.kv}>
                          <Text style={styles.k}>Name</Text>
                          <Text
                            style={styles.v}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                          >
                            {holderName}
                          </Text>
                        </View>

                        <View style={styles.kv}>
                          <Text style={styles.k}>Date of Birth</Text>
                          <Text style={styles.v}>{formattedDob}</Text>
                        </View>

                        <View style={[styles.kv, styles.kvHighlighted]}>
                          <Text style={styles.k}>PAN</Text>
                          <Text
                            style={[styles.v, styles.panValue]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                          >
                            {panNumber}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.footerBand}>
                      <Text style={styles.footerText}>Permanent Account Number</Text>
                    </View>
                  </LinearGradient>
                </View>
              </ViewShot>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btn, styles.secondaryBtn]}
                onPress={handleRefresh}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="refresh"
                  size={18}
                  color={Theme.colors.primary}
                  style={styles.btnIcon}
                />
                <Text style={[styles.btnText, styles.btnSecondaryText]}>Refresh</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.primaryBtn]}
                onPress={handleShare}
                activeOpacity={0.85}
              >
                <Ionicons name="share-social" size={18} color="#fff" style={styles.btnIcon} />
                <Text style={styles.btnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Theme.colors.secondary,
  },
  
  // Header styles
  headerBar: {
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
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  headerSubtitleText: {
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
    flexGrow: 1,
    padding: 18,
    paddingBottom: 32,
  },

  // Loading State
  loadingWrap: { alignItems: "center", marginTop: 80 },
  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: SCREEN_W - 64,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: `${PRIMARY}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  loadingText: { color: "#6b7280", fontSize: 14, textAlign: "center", lineHeight: 20 },

  // Error state
  errorWrap: {
    marginTop: 32,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.06)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    gap: 12,
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 15,
  },
  errorHint: { color: "#7f1d1d", fontSize: 13, lineHeight: 18 },
  emptyWrap: {
    marginTop: 32,
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  emptyTitle: { color: "#0f172a", fontWeight: "700", fontSize: 15 },
  emptyHint: { color: "#475569", fontSize: 13, lineHeight: 20 },

  // Success layout
  contentWrap: {
    flex: 1,
    gap: 16,
  },
  hero: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: `${Theme.colors.primary}15`,
    borderRadius: 999,
  },
  badgeText: { color: Theme.colors.primary, fontWeight: "700", fontSize: 13 },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a", marginTop: 12 },
  heroSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 6,
    lineHeight: 22,
  },
  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  heroChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  heroChipAlt: {
    backgroundColor: "#f1f5f9",
  },
  heroChipText: { fontWeight: "700", color: "#111827", fontSize: 14 },

  cardOuter: {
    alignItems: "center",
    marginTop: 8,
  },
  cardBorder: {
    borderRadius: CARD_RADIUS + 3,
    padding: 2,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: CARD_MAX_WIDTH,
    alignSelf: "center",
  },
  card: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dfe7f5",
  },

  // Security layers
  securityLayers: { ...StyleSheet.absoluteFillObject },
  patternWave: { ...StyleSheet.absoluteFillObject },
  patternDots: { ...StyleSheet.absoluteFillObject },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  govLogo: { width: 42, height: 36, resizeMode: "contain" },
  itdLogo: { width: 50, height: 38, resizeMode: "contain" },
  headerHi: { color: "#0f172a", fontSize: 13, fontWeight: "800" },
  headerEn: { color: "#475569", fontSize: 11, fontWeight: "700" },

  holo: {
    marginHorizontal: 14,
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
    marginBottom: 12,
  },

  bodyRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  leftCol: { width: LEFT_COL_WIDTH, alignItems: "center", paddingRight: 6 },
  rightCol: { flex: 1, minWidth: 160 },

  photoWrap: {
    width: PHOTO_SIZE,
    height: Math.round(PHOTO_SIZE * 1.15),
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
  },
  photo: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16,185,129,0.12)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  avatarBadgeText: { color: "#0f766e", fontWeight: "700", fontSize: 12 },

  kv: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 8,
  },
  kvHighlighted: {
    backgroundColor: `${PRIMARY}08`,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  k: { color: "#6b7280", fontSize: 13, fontWeight: "700" },
  v: { color: "#0f172a", fontSize: 15, fontWeight: "800", flexShrink: 1 },
  panValue: { letterSpacing: 1.5, fontSize: 17 },

  footerBand: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.65)",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  footerText: { fontSize: 12, fontWeight: "900", color: "#0f172a" },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
    alignSelf: "stretch",
    marginTop: 16,
    flexWrap: "wrap",
  },
  btn: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnIcon: { marginRight: 8 },
  primaryBtn: { 
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  secondaryBtn: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  btnSecondaryText: { color: Theme.colors.primary },
  btnFull: { alignSelf: "stretch", marginTop: 4, paddingHorizontal: 16 },

  // KYC fallback
  container: {
    flex: 1,
    marginTop: 60,
    backgroundColor: Theme.colors.secondary,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingBottom: 100,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${Theme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    borderWidth: 3,
    borderColor: `${Theme.colors.primary}25`,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  kycButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    maxWidth: 320,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  kycButtonText: {
    color: Theme.colors.secondary,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 10,
  },
  bottomDecor: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
    overflow: "hidden",
  },
  decorCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${Theme.colors.primary}08`,
    bottom: -100,
    left: -50,
  },
  decorCircle2: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: `${Theme.colors.primary}12`,
    bottom: -50,
    right: -30,
  },
});

export default PanDetails;
