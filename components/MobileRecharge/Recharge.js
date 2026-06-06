// File: RechargeScreen.js — global search across all categories + refined UI

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Theme, { getResponsiveValue } from "../Theme";
import { useNavigation, useRoute } from "@react-navigation/native";
import OperatorPopup from "./OperatorPopup";
import { useAppStore } from "../../store/useAppStore";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 375;

/* ---------------- Session cache ---------------- */
export const GlobalPlans = {
  raw: null,
  categoryList: [],
  planById: {},
  categoryToPlanIds: {},
  lastUpdated: null,
};

// Plans now come from the backend /recharge/plans* endpoints which proxy
// letsautomate.forum (PhonePe-backed). Each plan is already flat: {plan_id,
// amount, description, validity, data, talktime, category, ...}.
const planToPack = (p) => ({
  planId: String(p.plan_id ?? `${p.amount}-${(p.description || "").slice(0, 24)}`),
  price: Number(p.amount) || 0,
  validity: p.validity || "NA",
  data: p.data || (p.talktime ? `Talktime ₹${p.talktime}` : "-"),
  description: p.description || "",
  raw: p,
});

// Map the MNP operator_code (JIO/AIRTEL/AIRTELPRE/VI/BSNL) to the app's
// hard-coded operator name + freecharge operatorId (kept so downstream
// payment screens / commission lookup that key off operator_name still work).
const OPERATOR_CODE_TO_LOCAL = {
  JIO: { name: "Jio Prepaid", operatorId: 652 },
  JIOPRE: { name: "Jio Prepaid", operatorId: 652 },
  AIRTEL: { name: "Airtel Prepaid", operatorId: 650 },
  AIRTELPRE: { name: "Airtel Prepaid", operatorId: 650 },
  // The PhonePe upstream returns "VILPRE" (Vi-limited prepaid) for ported and
  // native Vi numbers — add every plausible alias so the chip resolves.
  VI: { name: "Vi Prepaid", operatorId: 653 },
  VIPRE: { name: "Vi Prepaid", operatorId: 653 },
  VILPRE: { name: "Vi Prepaid", operatorId: 653 },
  VIL: { name: "Vi Prepaid", operatorId: 653 },
  VODAFONE: { name: "Vi Prepaid", operatorId: 653 },
  VODAPRE: { name: "Vi Prepaid", operatorId: 653 },
  IDEA: { name: "Vi Prepaid", operatorId: 653 },
  IDEAPRE: { name: "Vi Prepaid", operatorId: 653 },
  BSNL: { name: "BSNL Prepaid", operatorId: 651 },
  BSNLPRE: { name: "BSNL Prepaid", operatorId: 651 },
};

// Reverse: the OperatorPopup hands back the local display name (e.g. "Jio Prepaid").
// We need the PhonePe code for /recharge/plans + the post-payment dispatch.
const LOCAL_NAME_TO_OPERATOR_CODE = {
  "jio prepaid": "JIO",
  "airtel prepaid": "AIRTEL",
  "vi prepaid": "VI",
  "bsnl prepaid": "BSNL",
};

// CirclePopup yields a CircleName like "Delhi" / "UP East" but the recharge
// plans API needs the short code. Map best-effort; anything missing falls
// back to "DL" (BillAvenue accepts unknown circles, server-side maps to "All").
const CIRCLE_NAME_TO_CODE = {
  delhi: "DL", mumbai: "MU", maharashtra: "MH", kolkata: "KO",
  chennai: "CH", karnataka: "KA", "tamil nadu": "TN", tamilnadu: "TN",
  "andhra pradesh": "AP", telangana: "TG", gujarat: "GJ", gujrat: "GJ",
  rajasthan: "RJ", "madhya pradesh": "MP", "west bengal": "WB",
  bihar: "BR", jharkhand: "BR", odisha: "OR", orissa: "OR",
  assam: "AS", "north east": "NE", northeast: "NE",
  "j&k": "JK", "jammu kashmir": "JK", uttaranchal: "UC", uttarakhand: "UC",
  "himachal pradesh": "HP", haryana: "HR", punjab: "PB", kerala: "KL",
  "up east": "UP_EAST", "uttar pradesh east": "UP_EAST",
  "utter pradesh (east)": "UP_EAST", "uttar pradesh (east)": "UP_EAST",
  "up west": "UP_WEST", "uttar pradesh west": "UP_WEST",
  "uttar pradesh (west)": "UP_WEST",
};
const toCircleCode = (name) => {
  if (!name) return null;
  return CIRCLE_NAME_TO_CODE[name.toString().toLowerCase().trim()] || null;
};

// Use Theme colors
const COLORS = {
  primary: Theme.colors.primary,
  primaryLight: Theme.colors.inputBg,
  secondary: Theme.colors.secondary,
  bg: Theme.colors.background,
  text: Theme.colors.text,
  subtext: Theme.colors.textSecondary,
  border: Theme.colors.border,
  success: Theme.colors.success,
  cardBg: Theme.colors.surface,
};

/* ---------------- Screen ---------------- */
const RechargeScreen = () => {
  const { operatorCircle, setSelectedOperator } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);

  const [circleId, setCircleId] = useState(null);
  const [operatorId, setOperatorId] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [plansVersion, setPlansVersion] = useState(0); // bump to force re-render when plans cache changes
  const [categories, setCategories] = useState([]);

  const navigation = useNavigation();
  const route = useRoute();
  const { contactName, contactNumber } = route.params || {};

  const [selectedCat, setSelectedCat] = useState(null);

  // NOTE: still numeric keyboard (as you wanted), but search now spans ALL categories.
  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // keep a ref to the search input so it never loses focus
  const searchRef = useRef(null);

  useEffect(() => {
    navigation.setOptions({ title: contactName || "Recharge" });
  }, [navigation, contactName]);

  const operatorlistWithImg = [
    { name: "Airtel Prepaid", logo: require("../../assets/airtel.png") },
    { name: "BSNL Prepaid", logo: require("../../assets/bsnl2.png") },
    { name: "Jio Prepaid", logo: require("../../assets/jio.png") },
    { name: "Vi Prepaid", logo: require("../../assets/vi.png") },
  ];
  // Resolve the chip image strictly from the resolved operator; never default
  // to Jio (that was the source of the "Vi number shows Jio logo" bug). When
  // we can't resolve an operator yet, fall through to the app's neutral logo.
  const selectedOperatorImage =
    selectedLogo ||
    operatorlistWithImg.find(
      (item) => item.name.toLowerCase() === (operatorCircle?.operator || "").toLowerCase()
    )?.logo ||
    require("../../assets/LogoN.png");

  const resetPlans = () => {
    GlobalPlans.raw = null;
    GlobalPlans.categoryList = [];
    GlobalPlans.planById = {};
    GlobalPlans.categoryToPlanIds = {};
    GlobalPlans.lastUpdated = Date.now();
    setSelectedCat(null);
    setQuery("");
    setCategories([]);
    setPlansVersion((v) => v + 1);
  };

  // Operator/circle codes from the new MNP API ("JIO", "UP_EAST"); needed for
  // the /recharge/plans call and the post-payment recharge dispatch.
  const [operatorCode, setOperatorCode] = useState(null);
  const [circleCode, setCircleCode] = useState(null);
  // Surface MNP failure so the UI can prompt the user to pick manually.
  const [mnpFailed, setMnpFailed] = useState(false);

  const authHeaders = async () => {
    const token = await AsyncStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const applyLocalOperator = (opCode, circleName) => {
    // Always wipe the previous chip state first, otherwise an unmapped
    // operator code silently keeps the stale logo/name from the last screen
    // (e.g. a prior Jio recharge → chip stuck on "Jio Prepaid" for a Vi number).
    setSelectedLogo(null);
    const codeUpper = (opCode || "").toUpperCase();
    const local = OPERATOR_CODE_TO_LOCAL[codeUpper] || null;
    if (local) {
      setSelectedOperator({
        circle: circleName || operatorCircle?.circle,
        operator: local.name,
      });
      setSelectedLogo(
        operatorlistWithImg.find(
          (item) => item.name.toLowerCase() === local.name.toLowerCase()
        )?.logo || null
      );
      setOperatorId(local.operatorId);
    } else if (codeUpper) {
      // Unknown upstream code — surface the raw code rather than letting the
      // previous operator linger. No logo (chip falls back to initials/default).
      console.warn(
        `Unmapped MNP operator code "${codeUpper}" — add it to OPERATOR_CODE_TO_LOCAL`
      );
      setSelectedOperator({
        circle: circleName || operatorCircle?.circle,
        operator: codeUpper,
      });
      setOperatorId(null);
    }
  };

  const loadPlansFromApi = async (opCode, ciCode) => {
    if (!opCode || !ciCode) return;
    try {
      setLoading(true);
      resetPlans();
      const headers = await authHeaders();
      const res = await axios.get(
        `https://newapi.odhpay.com/recharge/plans?operator=${encodeURIComponent(opCode)}&circle=${encodeURIComponent(ciCode)}`,
        { headers }
      );
      const data = res?.data?.success ? res.data : res?.data?.data || res?.data || {};
      const plansList = Array.isArray(data?.plans) ? data.plans : [];
      ingestPlans(plansList);
    } catch (err) {
      console.log("plans fetch error", err?.response?.data || err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // MNP + plans in one shot (server combines for us). Falls back to manual
  // operator picker if MNP can't identify the number.
  const getSimProvider = async (mobile_no) => {
    try {
      setLoading(true);
      setMnpFailed(false);
      const number = String(mobile_no || "").replace(/[^\d]/g, "").slice(-10);
      if (number.length !== 10) return;

      const headers = await authHeaders();
      const response = await axios.get(
        `https://newapi.odhpay.com/recharge/plans/mobile?mobile=${number}`,
        { headers }
      );
      const body = response?.data?.data || response?.data || {};

      if (!body?.operator_code) {
        // MNP failed (no session / unknown number). Let the user pick manually.
        setMnpFailed(true);
        setTimeout(() => setModalVisible(true), 0);
        return;
      }

      setOperatorCode(body.operator_code);
      setCircleCode(body.circle_code);
      applyLocalOperator(body.operator_code, body.circle);

      // Plans come embedded if the combined endpoint succeeded; otherwise
      // fetch them separately.
      const plansList = Array.isArray(body?.plans) ? body.plans : [];
      if (plansList.length) {
        ingestPlans(plansList);
      } else {
        await loadPlansFromApi(body.operator_code, body.circle_code);
      }
    } catch (err) {
      console.log("MNP error", err?.response?.data || err?.message);
      setMnpFailed(true);
      setTimeout(() => setModalVisible(true), 0);
    } finally {
      setLoading(false);
    }
  };

  // Single place that pushes a flat plan list into the GlobalPlans cache
  // grouped by category. Used by both the auto-MNP path and the operator-popup
  // fallback path.
  const ingestPlans = (plansList) => {
    resetPlans();
    const planById = {};
    const categoryToPlanIds = {};
    const order = [];

    // The upstream returns "discontinued" / "invalid" plans with a ⚠️-prefixed
    // description and no real validity/data — they're not rechargeable, so
    // hide them entirely. (We used to render them with an amber warning pill;
    // turns out users just want a clean list of working plans.)
    const isInvalid = (p) =>
      typeof p?.description === "string" && /^\s*⚠/.test(p.description);
    const cleanList = plansList.filter((p) => !isInvalid(p));

    cleanList.forEach((p) => {
      const pack = planToPack(p);
      planById[pack.planId] = p;
      const cat = (p.category || "All").toString();
      if (!categoryToPlanIds[cat]) {
        categoryToPlanIds[cat] = [];
        order.push(cat);
      }
      categoryToPlanIds[cat].push(pack.planId);
    });

    GlobalPlans.raw = cleanList;
    GlobalPlans.planById = planById;
    GlobalPlans.categoryToPlanIds = categoryToPlanIds;
    GlobalPlans.categoryList = order;
    GlobalPlans.lastUpdated = Date.now();
    setCategories(order);

    const preferred = ["Recommended", "Popular", "Unlimited", "Truly unlimited", "DATA", "All"];
    const pick =
      preferred.find((p) => order.find((c) => c.toLowerCase() === p.toLowerCase())) ||
      order[0] ||
      null;
    setSelectedCat(pick);
    setPlansVersion((v) => v + 1);
  };

  useEffect(() => {
    if (contactNumber) getSimProvider(contactNumber);
  }, [contactNumber]);

  const onRefresh = () => {
    setRefreshing(true);
    if (operatorCode && circleCode) loadPlansFromApi(operatorCode, circleCode);
    else if (contactNumber) getSimProvider(contactNumber);
    else setRefreshing(false);
  };

  /* ---- Build data views ---- */
  // Flatten ALL packs once (memoized) for fast global search
  const allPacks = useMemo(() => {
    const packs = [];
    categories.forEach((cat) => {
      const ids = GlobalPlans.categoryToPlanIds[cat] || [];
      ids.forEach((id) => {
        const p = GlobalPlans.planById[id];
        if (p) packs.push({ ...planToPack(p, id), _cat: cat });
      });
    });
    // remove duplicates if any (same plan id appearing in multiple cats)
    const seen = new Set();
    return packs.filter((pk) => (seen.has(pk.planId) ? false : (seen.add(pk.planId), true)));
  }, [plansVersion, categories]);

  // Packs in selected category (for normal browsing when search empty)
  const selectedCatPacks = useMemo(() => {
    if (!selectedCat) return [];
    const ids = GlobalPlans.categoryToPlanIds[selectedCat] || [];
    return ids
      .map((id) => {
        const p = GlobalPlans.planById[id];
        return p ? { ...planToPack(p, id), _cat: selectedCat } : null;
      })
      .filter(Boolean);
  }, [selectedCat, plansVersion]);

  // ✅ GLOBAL SEARCH: when query is present, search across ALL categories.
  const filteredPack = useMemo(() => {
    const q = query.trim();
    if (!q) return selectedCatPacks;

    // numeric-first search (your requirement) + soft text fallback if pasted
    const isNum = /^[0-9]+(\.[0-9]+)?$/.test(q);
    const qLower = q.toLowerCase();

    return allPacks.filter((pk) => {
      if (isNum) {
        // exact or substring match on price
        return Number(pk.price) === Number(q) || String(pk.price).includes(q);
      }
      // text fallback: rare, but works if user pastes a word
      return (
        pk.description?.toLowerCase().includes(qLower) ||
        pk.validity?.toLowerCase().includes(qLower) ||
        pk.data?.toLowerCase().includes(qLower) ||
        String(pk.price).includes(qLower) ||
        pk._cat?.toLowerCase().includes(qLower)
      );
    });
  }, [query, allPacks, selectedCatPacks]);

  // small summary when searching globally
  const searchSummary = useMemo(() => {
    if (!query.trim()) return null;
    const cats = new Set(filteredPack.map((p) => p._cat));
    return { count: filteredPack.length, catCount: cats.size };
  }, [filteredPack, query]);

  /* ---------------- UI parts ---------------- */
  const TabChip = ({ category }) => {
    const active = selectedCat === category;
    return (
      <TouchableOpacity
        onPress={() => setSelectedCat(category)}
        activeOpacity={0.85}
        style={[styles.tabBtn, active && styles.tabBtnActive]}
      >
        <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  const InfoChip = ({ icon, label, value, tone = "neutral" }) => (
    <View
      style={[
        styles.infoChip,
        tone === "primary" && styles.infoChipPrimary,
      ]}
    >
      <Ionicons
        name={icon}
        size={12}
        color={tone === "primary" ? COLORS.primary : COLORS.subtext}
        style={{ marginRight: 4 }}
      />
      <Text style={styles.infoChipLabel}>{label}</Text>
      <Text style={[styles.infoChipValue, tone === "primary" && { color: COLORS.primary }]}>
        {value || "—"}
      </Text>
    </View>
  );

  const PlanCard = ({ pack }) => {
    const hasValidity = pack.validity && pack.validity !== "NA";
    const hasData = pack.data && pack.data !== "-";
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        style={styles.planCard}
        onPress={() =>
          navigation.navigate("RechargeScreenPay", {
            contactName,
            contactNumber,
            pack,
            img: selectedOperatorImage,
            operator_code: operatorCode || operatorId,
            circle: operatorCircle?.circle,
            circle_code: circleCode,
          })
        }
      >
        <View style={styles.cardRow}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceCurrency}>₹</Text>
            <Text style={styles.priceValue}>{pack.price}</Text>
          </View>
          <View style={styles.cardBody}>
            {(hasValidity || hasData) && (
              <View style={styles.chipsRow}>
                {hasValidity && (
                  <InfoChip
                    icon="time-outline"
                    label="Validity"
                    value={pack.validity}
                    tone="primary"
                  />
                )}
                {hasData && (
                  <InfoChip
                    icon="cellular-outline"
                    label="Data"
                    value={pack.data}
                  />
                )}
              </View>
            )}
            {!!pack.description && (
              <Text style={styles.desc} numberOfLines={2}>{pack.description}</Text>
            )}
            {!!query.trim() && !!pack._cat && (
              <View style={styles.catTag}>
                <Text style={styles.catTagText}>{pack._cat}</Text>
              </View>
            )}
          </View>
          <MaterialIcons name="chevron-right" size={22} color={COLORS.subtext} />
        </View>
      </TouchableOpacity>
    );
  };

  const SkeletonCard = () => (
    <View style={styles.planCard}>
      <View style={styles.cardRow}>
        <View style={[styles.priceBlock, { backgroundColor: "#F0F0F0" }]}>
          <View style={{ width: 36, height: 22, backgroundColor: "#E6E6E6", borderRadius: 6 }} />
        </View>
        <View style={styles.cardBody}>
          <View style={{ height: 22, backgroundColor: "#EEE", borderRadius: 11, marginBottom: 6, width: "60%" }} />
          <View style={{ height: 12, backgroundColor: "#EEE", borderRadius: 6, width: "85%" }} />
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
    
      
      {/* Move OperatorPopup OUTSIDE TouchableWithoutFeedback */}
      <OperatorPopup
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelectOperator={(op) => {
          setModalVisible(false);
          resetPlans();
          setMnpFailed(false);
          if (op?.operator) {
            setSelectedOperator({ operator: op.operator, circle: op.circle });
          }
          if (op?.operatorLogo) setSelectedLogo(op.operatorLogo);
          if (op?.operatorId) setOperatorId(op.operatorId);
          if (op?.circleId) setCircleId(op.circleId);

          // Resolve to the PhonePe/BillAvenue codes the new APIs need.
          const opCode = LOCAL_NAME_TO_OPERATOR_CODE[(op?.operator || "").toLowerCase()] || null;
          const ciCode = toCircleCode(op?.circle);
          setOperatorCode(opCode);
          setCircleCode(ciCode);
          if (opCode && ciCode) loadPlansFromApi(opCode, ciCode);
        }}
      />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.screen}>
          {/* ----- Premium Header card (SIM/number) ----- */}
          <View style={styles.headerCard}>
            <View style={styles.headerGradient}>
              <View style={styles.headerLeft}>
                <View style={styles.logoWrapper}>
                  <Image source={selectedOperatorImage} style={styles.logo} />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.operatorName}>{operatorCircle?.operator || "Select Operator"}</Text>
                  {contactNumber ? (
                    <View style={styles.numberRow}>
                      <MaterialIcons name="phone-android" size={isSmallDevice ? 12 : 14} color={COLORS.primary} />
                      <Text style={styles.number}>{contactNumber}</Text>
                    </View>
                  ) : (
                    <View style={styles.numberRow}>
                      <MaterialIcons name="touch-app" size={isSmallDevice ? 12 : 14} color={COLORS.subtext} />
                      <Text style={[styles.number, { color: COLORS.subtext }]}>Tap Change to select</Text>
                    </View>
                  )}
                  {operatorCircle?.circle && (
                    <View style={styles.circleRow}>
                      <Ionicons name="location-outline" size={isSmallDevice ? 10 : 12} color={COLORS.subtext} />
                      <Text style={styles.circleText}>{operatorCircle.circle}</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  // console.log("Change button pressed, setting modalVisible to true");
                  setModalVisible(true);
                }} 
                style={styles.changeBtn} 
                activeOpacity={0.8}
              >
                <MaterialIcons name="swap-horiz" size={isSmallDevice ? 14 : 16} color={COLORS.secondary} />
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ----- Modern Search Bar ----- */}
          <View style={styles.searchContainer}>
            <View style={styles.searchIconWrap}>
              <Ionicons name="search" size={isSmallDevice ? 16 : 18} color={COLORS.primary} />
            </View>
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Search plans by amount (e.g., 349)"
              placeholderTextColor={COLORS.subtext}
              value={query}
              onChangeText={(t) => {
                setQuery(t);
                if (searchRef.current) {
                  searchRef.current.isFocused?.() || searchRef.current.focus?.();
                }
              }}
              keyboardType={Platform.OS === "ios" ? "number-pad" : "numeric"}
              inputMode="numeric"
              returnKeyType="search"
              blurOnSubmit={false}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={20} color={COLORS.subtext} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Search results summary */}
          {!!searchSummary && (
            <View style={styles.searchHint}>
              <View style={styles.searchHintIcon}>
                <Ionicons name="search" size={14} color={COLORS.primary} />
              </View>
              <Text style={styles.searchHintText}>
                Found <Text style={styles.searchHintBold}>{searchSummary.count}</Text> plan{searchSummary.count === 1 ? "" : "s"} across{" "}
                <Text style={styles.searchHintBold}>{searchSummary.catCount}</Text> categor{searchSummary.catCount === 1 ? "y" : "ies"}
              </Text>
            </View>
          )}

          {/* ----- Category Tabs ----- */}
          <View style={styles.tabsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScroll}
              keyboardShouldPersistTaps="handled"
            >
              {categories.map((c) => (
                <TabChip key={c} category={c} />
              ))}
            </ScrollView>
          </View>

          {/* ----- Plans List ----- */}
          <FlatList
            data={filteredPack}
            keyExtractor={(item) => String(item.planId)}
            renderItem={({ item }) => <PlanCard pack={item} />}
            ListEmptyComponent={
              loading ? (
                <View style={styles.skeletonContainer}>
                  {[...Array(4)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIcon}>
                    <MaterialCommunityIcons name="package-variant" size={40} color={COLORS.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {selectedCat
                      ? query.trim()
                        ? "No matching plans"
                        : "No plans available"
                      : "Select a category"}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {selectedCat
                      ? query.trim()
                        ? "Try searching with a different amount"
                        : "No plans found in this category"
                      : "Choose a category above to view plans"}
                  </Text>
                </View>
              )
            }
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
            }
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />

          {/* Floating loader indicator */}
          {loading && (
            <View style={styles.floatingLoader}>
              <ActivityIndicator size="small" color="#FFF" />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },

  /* Header Card - Premium Design */
  headerCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: "hidden",
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: COLORS.cardBg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  logo: { 
    width: 40, 
    height: 40, 
    borderRadius: 10,
    resizeMode: "contain",
  },
  headerInfo: {
    flex: 1,
  },
  operatorName: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: COLORS.text,
    marginBottom: 4,
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  number: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: COLORS.text,
    marginLeft: 4,
  },
  circleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  circleText: { 
    fontSize: 12, 
    color: COLORS.subtext,
    marginLeft: 3,
  },
  changeBtn: { 
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  changeText: { 
    fontSize: 13, 
    color: "#FFF", 
    fontWeight: "700",
  },

  /* Search Bar - Modern */
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 4,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  searchIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 15, 
    color: COLORS.text, 
    paddingVertical: 0,
    fontWeight: "500",
  },
  clearBtn: {
    padding: 8,
  },

  /* Search Hint */
  searchHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight,
    marginTop: 10,
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + "20",
  },
  searchHintIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  searchHintText: { 
    color: COLORS.text, 
    fontSize: 13, 
    fontWeight: "500",
  },
  searchHintBold: {
    fontWeight: "700",
    color: COLORS.primary,
  },

  /* Category Tabs — pill style, no underline */
  tabsWrap: {
    marginTop: 14,
    paddingBottom: 6,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    color: COLORS.subtext,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },

  /* Plan Cards — modern, breathable */
  listContent: {
    paddingBottom: 80,
    paddingTop: 8,
  },
  skeletonContainer: {
    paddingHorizontal: 16,
  },
  planCard: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  planCardMuted: {
    opacity: 0.85,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceBlock: {
    minWidth: 84,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  priceCurrency: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
    marginRight: 1,
    marginTop: 4,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    lineHeight: 26,
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
    marginRight: 4,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F4F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  infoChipPrimary: {
    backgroundColor: COLORS.primaryLight,
  },
  infoChipLabel: {
    fontSize: 11,
    color: COLORS.subtext,
    fontWeight: "600",
    marginRight: 4,
  },
  infoChipValue: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: "700",
  },

  desc: { fontSize: 12.5, color: COLORS.subtext, lineHeight: 18 },

  warnBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  warnText: {
    flex: 1,
    fontSize: 12,
    color: "#92400E",
    fontWeight: "600",
    lineHeight: 16,
  },

  catTag: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  catTagText: { fontSize: 10, fontWeight: "700", color: COLORS.primary, letterSpacing: 0.2 },

  /* Empty State */
  emptyWrap: { 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { 
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text, 
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.subtext,
    textAlign: "center",
    lineHeight: 20,
  },

  /* Floating Loader */
  floatingLoader: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});

export default RechargeScreen;
