import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
  Dimensions,
  StyleSheet,
  Animated,
  Modal,
  BackHandler,
  Alert,
  Button,
  Linking,
} from "react-native";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { Bell } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCameraPermissions } from "expo-camera";
import Theme from "../components/Theme";
import * as LocalAuthentication from "expo-local-authentication";
import { useUserStore } from "../store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKycDetailStore } from "../store/useKycStore";
const images = [
  require("../assets/promotion.jpg"),
  require("../assets/promotion2.jpg"),
  require("../assets/promotion3.jpg"),
  require("../assets/promotion.jpg"),
  require("../assets/promotion2.jpg"),
];

const CATEGORY_ICONS = {
  "Electricity": { icon: "bolt", color: "#FFC107", bg: "#FFF8E1" },
  "Fastag": { icon: "directions-car", color: "#FF9800", bg: "#FFF3E0" },
  "Mobile Postpaid": { icon: "phone-in-talk", color: "#2196F3", bg: "#E3F2FD" },
  "Mobile Prepaid": { icon: "phone-android", color: "#10B981", bg: "#E8F5E9" },
  "LPG Gas": { icon: "local-fire-department", color: "#F44336", bg: "#FFEBEE" },
  "Gas": { icon: "fireplace", color: "#E91E63", bg: "#FCE4EC" },
  "Water": { icon: "water-drop", color: "#03A9F4", bg: "#E1F5FE" },
  "Credit Card": { icon: "credit-card", color: "#3F51B5", bg: "#E8EAF6" },
  "Insurance": { icon: "health-and-safety", color: "#EF5350", bg: "#FFEBEE" },
  "Loan Repayment": { icon: "payments", color: "#00BCD4", bg: "#E0F7FA" },
  "DTH": { icon: "tv", color: "#9C27B0", bg: "#F3E5F5" },
  "Broadband": { icon: "wifi", color: "#673AB7", bg: "#EDE7F6" },
  "Landline Postpaid": { icon: "phone", color: "#9C27B0", bg: "#F3E5F5" },
  "default": { icon: "receipt", color: "#607D8B", bg: "#ECEFF1" },
};

// Curated promo cards for the home "Hot Offers" strip. Pure presentation —
// no remote dependency yet, so a flaky network never leaves the row empty.
// Wire each `target` to an existing screen in AppNavigator.
const OFFER_CARDS = [
  {
    tag: "FLAT 5% OFF",
    title: "Recharge Cashback",
    subtitle: "On every Jio, Airtel & Vi prepaid plan",
    cta: "Recharge Now",
    accent: "#A78BFA",
    icon: "smartphone",
    target: "MobilePrepaid",
  },
  {
    tag: "₹50 EXTRA",
    title: "Refer & Earn ₹50",
    subtitle: "For every friend who joins ODH Pay",
    cta: "Invite Friends",
    accent: "#FB923C",
    icon: "card-giftcard",
    target: "ReferralScreen",
  },
  {
    tag: "₹100 BACK",
    title: "Electricity Bill Pay",
    subtitle: "Pay any discom bill, get ₹100 cashback",
    cta: "Pay Bill",
    accent: "#38BDF8",
    icon: "bolt",
    target: "AllServices",
  },
  {
    tag: "ZERO FEE",
    title: "FASTag Recharge",
    subtitle: "Top up any FASTag with zero fee",
    cta: "Recharge",
    accent: "#34D399",
    icon: "directions-car",
    target: "AllServices",
  },
];

const { width, height: screenHeight } = Dimensions.get("window");
const isSmallDevice = width < 360;
const horizontalGutter = Math.max(12, width * 0.04);
const baseFont = isSmallDevice ? 12 : 14;

// Try the biller-asset CDN first; fall back to the category icon if the logo
// 404s (only ~1.2k of 22k billers have a logo, so misses are normal).
const QuickPayAvatar = ({ billerId, iconInfo }) => {
  const [failed, setFailed] = useState(false);
  if (billerId && !failed) {
    return (
      <View style={[styles.quickPayAvatar, { backgroundColor: "#FFF" }]}>
        <Image
          source={{ uri: `https://assetcdn.odhpay.com/biller-assets/${billerId}.png?v=2` }}
          style={styles.quickPayAvatarImage}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }
  return (
    <View style={[styles.quickPayAvatar, { backgroundColor: iconInfo.bg }]}>
      <MaterialIcons name={iconInfo.icon} size={22} color={iconInfo.color} />
    </View>
  );
};

// =============================================================================
// Home category swiper
// =============================================================================
// Each home section shows its categories in a horizontally paged swiper — 4
// icons per page, swipe to reveal the rest. Item shape:
//   { key, label, icon (MaterialIcons), color, bg, screen? , params? }
// `screen` → navigation.navigate(screen); otherwise navigate("ServiceCategory",
// params). Category nav params mirror AllServicesScreen so behaviour is identical.

const RECHARGE_ITEMS = [
  { key: "mobile-prepaid", label: "Mobile\nPrepaid", icon: "phone-android", color: "#10B981", bg: "#E8F5E9", screen: "MobilePrepaid" },
  { key: "mobile-postpaid", label: "Mobile\nPostpaid", icon: "phone-in-talk", color: "#2196F3", bg: "#E3F2FD", params: { endpoint: "Mobile Postpaid", name: "Postpaid Recharge", btnName: "PostPaid Recharge", reminder: "pay Postpaid Recharge" } },
  { key: "fastag", label: "FASTag", icon: "directions-car", color: "#FF9800", bg: "#FFF3E0", params: { endpoint: "Fastag", name: "FASTAG Recharge", btnName: "Add New Vehicle", reminder: "Zip through toll Plazas" } },
  { key: "landline", label: "Landline", icon: "phone", color: "#9C27B0", bg: "#F3E5F5", params: { endpoint: "Landline Postpaid", name: "Landline Postpaid Recharge", btnName: "Add New Landline", reminder: "Pay Landline Plans" } },
  { key: "dth", label: "DTH", icon: "tv", color: "#7C3AED", bg: "#EDE7F6", params: { endpoint: "DTH", name: "DTH Recharge", btnName: "Recharge DTH", reminder: "Pay DTH Recharge" } },
  { key: "broadband", label: "Broadband", icon: "wifi", color: "#673AB7", bg: "#EDE7F6", params: { endpoint: "Broadband Postpaid", name: "Broadband Recharge", btnName: "Broadband Recharge", reminder: "Pay Broadband Recharge" } },
  { key: "cable-tv", label: "Cable TV", icon: "settings-input-antenna", color: "#0EA5E9", bg: "#E1F5FE", params: { endpoint: "Cable TV", name: "Cable TV Recharge", btnName: "Recharge Cable TV", reminder: "Pay Cable TV Recharge" } },
  { key: "subscription", label: "Subscription", icon: "subscriptions", color: "#EC407A", bg: "#FCE4EC", params: { endpoint: "Subscription", name: "Subscription Recharge", btnName: "Recharge Subscription", reminder: "Pay Subscription Fees" } },
];

const HOUSING_ITEMS = [
  { key: "electricity", label: "Electricity", icon: "bolt", color: "#FFC107", bg: "#FFF8E1", params: { endpoint: "Electricity", name: "Electricity Recharge", btnName: "Pay Electricity Bill", reminder: "Pay Electricity Plans" } },
  { key: "lpg", label: "LPG", icon: "local-fire-department", color: "#F44336", bg: "#FFEBEE", params: { endpoint: "LPG Gas", name: "LPG Recharge", btnName: "Pay LPG Bill", reminder: "Pay LPG Bill" } },
  { key: "piped-gas", label: "Piped Gas", icon: "fireplace", color: "#E91E63", bg: "#FCE4EC", params: { endpoint: "Gas", name: "piped Gas Recharge", btnName: "Pay Gas Bill", reminder: "Pay Gas Bill" } },
  { key: "rent", label: "Rent", icon: "home", color: "#009688", bg: "#E0F2F1", params: { endpoint: "Rental", name: "Rent payment", btnName: "Pay Rent", reminder: "Pay Rent payment" } },
  { key: "water", label: "Water", icon: "water-drop", color: "#03A9F4", bg: "#E1F5FE", params: { endpoint: "Water", name: "Water Bill payment", btnName: "Pay Water Bill", reminder: "Pay Water Bill" } },
  { key: "prepaid-meter", label: "Prepaid\nMeter", icon: "electric-meter", color: "#FB8C00", bg: "#FFF3E0", params: { endpoint: "Prepaid Meter", name: "Prepaid Meter Recharge", btnName: "Recharge Prepaid Meter", reminder: "Recharge Prepaid Meter" } },
  { key: "municipal-taxes", label: "Municipal\nTaxes", icon: "account-balance", color: "#795548", bg: "#EFEBE9", params: { endpoint: "Municipal Taxes", name: "Municipal Taxes payment", btnName: "Pay Municipal Taxes", reminder: "Pay Municipal Taxes" } },
  { key: "municipal-services", label: "Municipal\nServices", icon: "location-city", color: "#607D8B", bg: "#ECEFF1", params: { endpoint: "Municipal Services", name: "Municipal Services payment", btnName: "Pay Municipal Services", reminder: "Pay Municipal Services" } },
  { key: "housing-society", label: "Housing\nSociety", icon: "apartment", color: "#5C6BC0", bg: "#E8EAF6", params: { endpoint: "Housing Society", name: "Housing Society payment", btnName: "Pay Housing Society", reminder: "Pay Housing Society" } },
  { key: "clubs", label: "Clubs &\nAssoc.", icon: "groups", color: "#00897B", bg: "#E0F2F1", params: { endpoint: "Clubs and Associations", name: "Clubs and Associations payment", btnName: "Pay Clubs & AssociationsBill", reminder: "Pay AssociationsBill" } },
];

const FINANCE_ITEMS = [
  { key: "credit-card", label: "Credit\nCard", icon: "credit-card", color: "#3F51B5", bg: "#E8EAF6", params: { endpoint: "Credit Card", name: "Credit card Bill", btnName: "Pay Credit card Bill", reminder: "Pay Credit card Bill" } },
  { key: "loan", label: "Loan\nRepayment", icon: "payments", color: "#00BCD4", bg: "#E0F7FA", params: { endpoint: "Loan Repayment", name: "Loan Repayment", btnName: "Pay Loan premium", reminder: "Pay Loan premium" } },
  { key: "insurance", label: "Insurance", icon: "health-and-safety", color: "#EF5350", bg: "#FFEBEE", params: { endpoint: "Insurance", name: "Insurance premium", btnName: "Pay Insurance premium", reminder: "Pay Insurance premium" } },
  { key: "recurring-deposit", label: "Recurring\nDeposit", icon: "currency-exchange", color: "#AB47BC", bg: "#F3E5F5", params: { endpoint: "Recurring Deposit", name: "Recurring Deposit", btnName: "Pay Recurring Deposit", reminder: "Pay Recurring Deposit" } },
  { key: "education", label: "Education\nFees", icon: "school", color: "#FF7043", bg: "#FBE9E7", params: { endpoint: "Education Fees", name: "Education payment", btnName: "Pay Education Fees", reminder: "Pay Education Fees" } },
  { key: "nps", label: "NPS", icon: "savings", color: "#43A047", bg: "#E8F5E9", params: { endpoint: "National Pension System", name: "NPS payment", btnName: "Pay NPS", reminder: "Pay National Pension" } },
  { key: "donation", label: "Donation", icon: "volunteer-activism", color: "#EC407A", bg: "#FCE4EC", params: { endpoint: "Donation", name: "Donation", btnName: "Make Donation", reminder: "Make Donation" } },
  { key: "agent-collection", label: "Agent\nCollection", icon: "badge", color: "#5E35B1", bg: "#EDE7F6", params: { endpoint: "Agent Collection", name: "Agent Collection", btnName: "Pay Agent Collection", reminder: "Pay Agent Collection" } },
];

// Card inner content width (screen − card margins (14×2) − card padding (15×2)).
const SWIPER_PAGE_WIDTH = width - 58;
const SWIPER_CELL_WIDTH = SWIPER_PAGE_WIDTH / 4;

const chunkIntoPages = (arr, size = 4) => {
  const pages = [];
  for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
  return pages;
};

const CategorySwiper = ({ items, navigation }) => {
  const [page, setPage] = useState(0);
  const pages = chunkIntoPages(items, 4);

  const onMomentumEnd = (e) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / SWIPER_PAGE_WIDTH);
    if (p !== page) setPage(p);
  };

  const handlePress = (item) => {
    if (item.screen) navigation.navigate(item.screen);
    else navigation.navigate("ServiceCategory", item.params);
  };

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEnabled={pages.length > 1}
      >
        {pages.map((grp, gi) => (
          <View key={gi} style={{ width: SWIPER_PAGE_WIDTH, flexDirection: "row" }}>
            {grp.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={{ width: SWIPER_CELL_WIDTH, alignItems: "center" }}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
                  <MaterialIcons name={item.icon} size={24} color={item.color} />
                </View>
                <Text style={styles.swiperOptionText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {pages.length > 1 && (
        <View style={styles.swiperDotsRow}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.swiperDot, i === page && styles.swiperDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
};

const HomeScreen = () => {
  const [quickPayContacts, setQuickPayContacts] = useState([]);
  const [quickPayLoading, setQuickPayLoading] = useState(false);

  const user = useUserStore(s => s.user);
  const { top: safeTop } = useSafeAreaInsets();
  const payload = user?.user ? user.user : user;
  const kycDetails = useKycDetailStore(s => s.data);
  const fetchKyc = useKycDetailStore(s => s.fetchKyc);




  const fetchQuickPayContacts = useCallback(async () => {
    try {
      setQuickPayLoading(true);
      const access_token = await AsyncStorage.getItem("access_token");
      if (!access_token) return;

      const categories = ["Electricity", "Fastag", "Mobile Postpaid", "LPG Gas", "Credit Card"];
      const allContacts = [];

      for (const category of categories) {
        try {
          const response = await axios.get(
            "https://newapi.odhpay.com/v2/payments/bill-fetch/unique-consumers",
            {
              params: { category, skip: 0, limit: 3 },
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${access_token}`,
              },
            }
          );
          const data = response.data?.data;
          const items = Array.isArray(data) ? data : (data?.results || data?.data || []);
          items.forEach((item) => {
            allContacts.push({ ...item, category });
          });
        } catch (e) {
          // Skip failed category
        }
      }

      setQuickPayContacts(allContacts.slice(0, 10));
    } catch (error) {
      console.log("QuickPay fetch error:", error);
    } finally {
      setQuickPayLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Only fetch user if missing or stale (avoid forcing every focus to prevent repeated store updates)
      const state = useUserStore.getState();
      const ttlMs = 5 * 60 * 1000;
      const isStale = !state.user || Date.now() - (state.updatedAt || 0) > ttlMs;
      if (isStale) {
        useUserStore.getState().fetchUser().catch(() => { });
      }
      fetchKyc({ ttlMs: 10 * 60 * 1000 });
      fetchQuickPayContacts();
    }, [fetchKyc, fetchQuickPayContacts])
  );



  const scrollX = useRef(new Animated.Value(0)).current;
  const heroScrollY = useRef(new Animated.Value(0)).current;
  const [heroHeight, setHeroHeight] = useState(0);
  const scrollViewRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bannerImages, setBannerImages] = useState(images);

  // NOTE: the hero used to be "pinned" with a translateY driven by scroll
  // (native driver). That desynced the header buttons' touch areas from where
  // they were drawn once the user scrolled — taps on search/rewards did
  // nothing. The hero now scrolls naturally so touch and visuals always align.

  useEffect(() => {
    const listener = scrollX.addListener(({ value }) => {
      const list = bannerImages.length ? bannerImages : images;
      const index = list.length ? Math.floor(value / width) % list.length : 0;
      setCurrentIndex(index);
    });

    return () => scrollX.removeListener(listener);
  }, [scrollX, bannerImages]);

  useEffect(() => {
    const interval = setInterval(() => {
      const list = bannerImages.length ? bannerImages : images;
      const nextIndex = (currentIndex + 1) % list.length;
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, 2000);

    return () => clearInterval(interval);
  }, [currentIndex, bannerImages]);

  useEffect(() => {
    // optional remote banner fetch; fallback to local assets
    const fetchBanners = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get('https://newapi.odhpay.com/misc/get_home_banners', { headers });
        if (Array.isArray(res.data?.banners) && res.data.banners.length) {
          setBannerImages(res.data.banners);
        }
      } catch (e) {
        console.log("Banner fetch skipped, using defaults.");
      }
    };
    fetchBanners();
  }, []);

  const navigation = useNavigation();






  const [permission, requestPermission] = useCameraPermissions();
  const isPermissionGranted = permission?.granted ?? false;

  const OpenScanner = async () => {
    if (isPermissionGranted) {
      navigation.navigate("Scan");
    } else {
      const response = await requestPermission();
      if (response.granted) {
        navigation.navigate("Scan");
      } else {
        Alert.alert(
          "Camera Permission Required",
          "Please enable camera access in your device settings to scan QR codes.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
      }
    }
  };


  // ============================================================================================================================
  // Handle Online Offline Kyc Mode through Admin Dyanmically
  // ============================================================================================================================



  const handlekyc = async () => {
    if (user?.aadharKycStatus === "pending") {
      return navigation.navigate('AadharKyc');
    }

    if (user?.panKycStatus === "pending") {
      return navigation.navigate('PanKyc');
    }

  };


  // ============================================================================================================================
  // user Bio-metric code come here 
  // ============================================================================================================================
  const [fingerPrintStatus, setFingerPrintStatus] = useState();


  const handleGetFingerPrintStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      console.log(token)

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const response = await axios.get(
        `https://newapi.odhpay.com/misc/get_fingerprint_status`,

        { headers }
      );

      console.log(` Get fingerPrint status ------->`, response.data);
      setFingerPrintStatus(response.data.fingerprint_status);

      const storedStatus = await AsyncStorage.getItem('fingerPrintStatus');

      console.log("this is Local storage ----->", storedStatus)

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios Error:", error.response?.status, error.response?.data);

        if (error.response?.status === 404) {
          Alert.alert("Error", "Requested resource not found (404)");
        }
      } else {
        console.error("Unexpected Error:", error);
        Alert.alert("Error", "Something went wrong!");
      }
    }
  }



  // this is set function for fingerPrint status by default
  const handleSetFingerPrintStatus = async (setType) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      console.log(token)

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const response = await axios.post(
        `https://newapi.odhpay.com/misc/set_fingerprint_status`, {
        "type": setType
      },
        { headers }
      );
      console.log(`set PingerPrint status ------->`, response.data);

      // if()
      if (response.status == 200) {
        if (response.data.fingerprint_status == 1) {

          const fingerprintStatus = String(response.data?.fingerprint_status || "0");

          await AsyncStorage.setItem('fingerPrintStatus', fingerprintStatus);

        }


      }
      setModalVisible(false);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios Error:", error.response?.status, error.response?.data);

        if (error.response?.status === 404) {
          Alert.alert("Error", "Requested resource not found (404)");
        }
      } else {
        console.error("Unexpected Error:", error);
        Alert.alert("Error", "Something went wrong!");
      }
    }
  }


  useEffect(() => {
    handleGetFingerPrintStatus();
  }, [])




  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  }, []);

  const handleBiometricAuth = async () => {
    const isBiometricAvailable = await LocalAuthentication.hasHardwareAsync();

    if (!isBiometricAvailable) {
      return Alert.alert(
        "Biometric not supported",
        "Please use your password to log in",
        [{ text: "OK", onPress: () => setModalVisible(false) }]
      );
    }

    const savedBiometrics = await LocalAuthentication.isEnrolledAsync();

    if (!savedBiometrics) {
      return Alert.alert(
        "No Biometric Record Found",
        "Please log in using your password",
        [{ text: "OK", onPress: () => setModalVisible(false) }]
      );
    }

    const biometricAuth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Enable Secure Login",
      cancelLabel: "Cancel",
      disableDeviceFallback: true,
    });

    if (biometricAuth.success) {
      setModalVisible(false);
    }
  };




  function correctPath(url) {
    return url.replace(/\\/g, '/');
  }

  const aadhaar =
    kycDetails?.aadhar_details ||
    kycDetails?.aadhaar_details ||
    kycDetails?.aadhaar ||
    kycDetails;

  const aadhaarPhoto = aadhaar?.photo || aadhaar?.profile_image_b64;
  const profileSource = aadhaarPhoto
    ? { uri: `data:image/jpeg;base64,${aadhaarPhoto}` }
    : payload?.profile
      ? { uri: correctPath(`https://newapi.odhpay.com/${payload?.profile}`) }
      : require("../assets/Profilee.png");

  const handleQuickPayPress = (contact) => {
    const iconInfo = CATEGORY_ICONS[contact.category] || CATEGORY_ICONS.default;
    navigation.navigate("ServiceCategory", {
      endpoint: contact.category,
      name: contact.category,
      btnName: `Pay ${contact.category}`,
      reminder: `Pay ${contact.category}`,
    });
  };

  const getContactInitials = (contact) => {
    const name = contact.biller_name || contact.customer_name || contact.category || "";
    const words = name.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getContactDisplayName = (contact) => {
    if (contact.customer_name) return contact.customer_name;
    if (contact.biller_name) {
      const parts = contact.biller_name.split(" ");
      return parts.slice(0, 2).join(" ");
    }
    const inputParams = contact.input_params;
    if (inputParams && typeof inputParams === "object") {
      const firstValue = Object.values(inputParams)[0];
      if (firstValue) return String(firstValue).substring(0, 12);
    }
    return contact.category;
  };

  const renderQuickPayItem = (contact, index) => {
    const iconInfo = CATEGORY_ICONS[contact.category] || CATEGORY_ICONS.default;
    return (
      <TouchableOpacity
        key={`quickpay-${index}`}
        style={styles.quickPayItem}
        onPress={() => handleQuickPayPress(contact)}
        activeOpacity={0.7}
      >
        <QuickPayAvatar billerId={contact.biller_id} iconInfo={iconInfo} />
        <Text style={styles.quickPayName} numberOfLines={1}>
          {getContactDisplayName(contact)}
        </Text>
        <Text style={styles.quickPayCategory} numberOfLines={1}>
          {contact.category}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} >


      {(fingerPrintStatus === 0) && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          statusBarTranslucent={true}
        >
          <View style={styles.modalBackground}>
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.modalContainer}>
                <Image
                  source={require("../assets/FingerPrint4.png")}
                  style={styles.fingerprintImage}
                />
                <Text style={styles.modalTitle}>Enable Secure Login</Text>
                <Text style={styles.modalSubtitle}>
                  Going forward, for added security, we’ll ask you to unlock before
                  you make any transaction.
                </Text>

                <TouchableOpacity
                  style={styles.enableButton}
                  onPress={() => {
                    handleBiometricAuth();
                    handleSetFingerPrintStatus(1);
                  }}
                >
                  <Text style={styles.enableButtonText}>Enable Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipTextContainer}
                  onPress={() => {
                    handleSetFingerPrintStatus(2);
                    setModalVisible(false)
                  }}
                >
                  <Text style={styles.skipText}>I don’t want to add Security</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )
      }




      {/* Fixed top bar — a sibling ABOVE the ScrollView, so it never moves
          while the page scrolls (and its touch areas can never desync). */}
      <View
        style={[
          styles.heroTopBar,
          {
            backgroundColor: "#000000",
            paddingHorizontal: horizontalGutter,
            paddingTop: Math.max(safeTop - 20, 8),
          },
        ]}
      >
        <View style={styles.heroTopLeft}>
          <TouchableOpacity
            onPress={() => navigation.navigate("UserProfileScreen")}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Your profile"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <View style={styles.avatarWrap}>
              <Image source={profileSource} style={styles.avatarImg} />
            </View>
          </TouchableOpacity>
          <View style={{ marginLeft: 10, flexShrink: 1 }}>
            <TouchableOpacity
              style={styles.balanceRow}
              onPress={() => {
                payload?.TransactionPIN
                  ? navigation.navigate("checkWallet")
                  : navigation.navigate("TransactionPin");
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.balanceText}>
                Balance: ₹{payload?.balance ?? payload?.MainBalance ?? 0}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.upiIdText} numberOfLines={1}>
              UPI ID: {payload?.MobileNumber || "—"}@odh
            </Text>
          </View>
        </View>

        <View style={styles.heroTopRight}>
          <TouchableOpacity
            style={styles.heroIconBtn}
            onPress={() => navigation.navigate("NotificationScreen")}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Bell size={18} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroIconBtn}
            onPress={() => navigation.navigate("AllServices")}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Search services"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroIconBtn}
            onPress={() => navigation.navigate("ScratchCardScreen")}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Rewards"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <FontAwesome5 name="trophy" size={17} color="#FFD54A" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: heroScrollY } } }],
          { useNativeDriver: true }
        )}
      >
      <Animated.View style={{ zIndex: 0 }}>
      <LinearGradient
        colors={["#000000", "#000000"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        onLayout={(e) => setHeroHeight(e.nativeEvent.layout.height)}
        style={[
          styles.heroWrap,
          { paddingTop: 8 },
        ]}
      >
        {(user?.aadharKycStatus !== "verified" && user?.panKycStatus !== "verified") && (
          <TouchableOpacity onPress={handlekyc} style={styles.kycPill} activeOpacity={0.8}>
            <MaterialIcons name="info-outline" size={13} color="#7A1B1B" />
            <Text style={styles.kycPillText}>Your KYC Is Pending</Text>
          </TouchableOpacity>
        )}

        {/* Hero illustration */}
        <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 0, paddingBottom: 8 }}>
          <Image
            source={require("../assets/hero_odhpay_card.png")}
            style={{
              width: width * 0.46,
              height: width * 0.46 * (1016 / 680),
            }}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>
      </Animated.View>

      {/* White sheet that slides up over the pinned hero */}
      <View style={styles.sheet}>

        {/* Quick Pay / Favorites Section */}
        {quickPayContacts.length > 0 && (
          <View style={[styles.card, styles.quickPayContainer]}>
            <View style={styles.quickPayHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionTitleAccent}>
                  <MaterialIcons name="flash-on" size={15} color="#7C3AED" />
                </View>
                <Text style={styles.quickPayTitle}>Quick Pay</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("AllServices")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.quickPayViewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPayScroll}
            >
              {quickPayContacts.map((contact, index) => renderQuickPayItem(contact, index))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.card, styles.features]}>
          {/* Wallet shortcut intentionally inert (owner request, 2026-07-14) —
              looks normal but doesn't navigate. Re-enable by restoring
              onPress={() => navigation.navigate("Wallet")}. */}
          <TouchableOpacity disabled>
            <View style={styles.feature}>
              <LinearGradient
                colors={["#34D399", "#059669"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.feature3dIcon}
              >
                <MaterialIcons name="account-balance-wallet" size={22} color="#FFF" />
              </LinearGradient>
              <Text style={styles.featureText}>Wallet</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ScratchCardScreen")}>
            <View style={styles.feature}>
              <LinearGradient
                colors={["#FBBF24", "#D97706"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.feature3dIcon}
              >
                <MaterialIcons name="card-giftcard" size={22} color="#FFF" />
              </LinearGradient>
              <Text style={styles.featureText}>Explore{"\n"}Rewards</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ReferralScreen")}>
            <View style={styles.feature}>
              <LinearGradient
                colors={["#60A5FA", "#2563EB"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.feature3dIcon}
              >
                <MaterialIcons name="group-add" size={22} color="#FFF" />
              </LinearGradient>
              <Text style={styles.featureText}>Refer &{"\n"}Earn ₹50</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ----- Hot Offers strip — attention-grabbing horizontal carousel ----- */}
        <View style={styles.offersSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionTitleAccent, { backgroundColor: "#FEE2E2" }]}>
                <MaterialIcons name="local-fire-department" size={15} color="#EF4444" />
              </View>
              <Text style={styles.offersTitle}>Hot Offers</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("ScratchCardScreen")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.quickPayViewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offersScroll}
            decelerationRate="fast"
            snapToInterval={width * 0.82 + 10}
          >
            {OFFER_CARDS.map((offer, i) => (
              <TouchableOpacity
                key={`offer-${i}`}
                activeOpacity={0.92}
                onPress={() => offer.target && navigation.navigate(offer.target)}
                style={styles.offerCardWrap}
              >
                <LinearGradient
                  colors={["#2A2A2E", "#050505"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={styles.offerCard}
                >
                  {/* accent glows + top edge for a premium, lit-from-within look */}
                  <View style={[styles.offerGlow, { backgroundColor: offer.accent }]} />
                  <View style={[styles.offerGlowSm, { backgroundColor: offer.accent }]} />
                  <View style={[styles.offerAccentBar, { backgroundColor: offer.accent }]} />

                  <View style={styles.offerCardTextBox}>
                    <View style={[styles.offerCardTag, { backgroundColor: offer.accent }]}>
                      <Text style={styles.offerCardTagText}>{offer.tag}</Text>
                    </View>
                    <View>
                      <Text style={styles.offerCardTitle} numberOfLines={1}>{offer.title}</Text>
                      <Text style={styles.offerCardSub} numberOfLines={2}>{offer.subtitle}</Text>
                    </View>
                    <View style={styles.offerCta}>
                      <Text style={styles.offerCtaText}>{offer.cta}</Text>
                      <MaterialIcons name="arrow-forward" size={14} color="#000" />
                    </View>
                  </View>

                  <View
                    style={[
                      styles.offerCardIconWrap,
                      { backgroundColor: offer.accent + "26", borderColor: offer.accent + "55" },
                    ]}
                  >
                    <MaterialIcons name={offer.icon} size={30} color={offer.accent} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.rechargeAndPayBillsContainer}>
          <View style={styles.rechargeAndPayBills}>
            <Text style={styles.sectionTitle}>Recharge & Bill Pay</Text>
            <CategorySwiper items={RECHARGE_ITEMS} navigation={navigation} />

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate("AllServices")}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.loanSectionContainer}>
          <View style={styles.loanSection}>
            <Text style={styles.sectionTitle}>Housing & Utilities</Text>
            <CategorySwiper items={HOUSING_ITEMS} navigation={navigation} />

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate("AllServices")}
            >
              <Text style={styles.viewAllButtonText}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.insuranceSection}>
          <Text style={styles.sectionTitle}>Finance</Text>
          <CategorySwiper items={FINANCE_ITEMS} navigation={navigation} />
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate("AllServices")}
          >
            <Text style={styles.viewAllButtonText}>View All</Text>
          </TouchableOpacity>
        </View>

      </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  // Light-grey canvas that slides up over the pinned hero. White section
  // cards float on top of it so each block reads as its own surface.
  sheet: {
    backgroundColor: "#F2F4F7",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -26,
    paddingTop: 18,
    zIndex: 2,
    elevation: 12,
    minHeight: screenHeight,
  },

  // Shared "floating card" surface for every home section.
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 14,
    marginBottom: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },

  // ===== Sticky white panel (overlaps the hero, sticks on scroll) =====
  stickyTopPanel: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -32,
    paddingTop: 14,
    paddingBottom: 6,
    zIndex: 10,
    elevation: 6,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },

  // KYC alert chip (renders inside the blue hero when pending)
  kycPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE3E3",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginBottom: 8,
  },
  kycPillText: {
    color: "#7A1B1B",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 5,
    textDecorationLine: "underline",
  },

  // ===== Blue hero =====
  heroWrap: {
    paddingHorizontal: horizontalGutter,
    paddingBottom: 30,
    overflow: "hidden",
    position: "relative",
  },
  heroSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  ring: {
    position: "absolute",
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: "center",
  },
  ring1: {
    width: 260,
    height: 260,
    top: 130,
    borderColor: "rgba(255,255,255,0.12)",
  },
  ring2: {
    width: 360,
    height: 360,
    top: 80,
    borderColor: "rgba(255,255,255,0.07)",
  },
  ring3: {
    width: 460,
    height: 460,
    top: 30,
    borderColor: "rgba(255,255,255,0.04)",
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
  },
  heroTopLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    position: "relative",
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#FF3D4D",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 22,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#000000",
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 4,
  },
  upiIdText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 11,
    marginTop: 1,
  },
  heroTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    fontStyle: "italic",
    color: "#5DEAFF",
    textAlign: "center",
    marginTop: 14,
    marginBottom: 2,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.20)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Card illustration stage
  heroCardStage: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    position: "relative",
  },
  heroCard: {
    width: 220,
    height: 138,
    borderRadius: 12,
    padding: 14,
    transform: [{ rotate: "-6deg" }],
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  heroCardSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  heroCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroCardBrand: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroCardLogoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFC107",
    shadowColor: "#FFC107",
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  heroCardChip: {
    width: 32,
    height: 24,
    borderRadius: 5,
    backgroundColor: "#D4A613",
    marginTop: 22,
    paddingHorizontal: 4,
    justifyContent: "center",
    overflow: "hidden",
  },
  heroCardChipLine: {
    height: 1.5,
    backgroundColor: "rgba(0,0,0,0.4)",
    marginVertical: 2,
  },
  heroCardNumber: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginTop: 14,
  },

  // Coins
  coin: {
    position: "absolute",
    backgroundColor: "#F6CB45",
    borderWidth: 1.5,
    borderColor: "#C49210",
    borderRadius: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  coinA: { width: 18, height: 18, top: 12, left: "22%" },
  coinB: { width: 14, height: 14, top: 36, right: "16%" },
  coinC: { width: 22, height: 22, bottom: 18, left: "14%" },
  coinD: { width: 16, height: 16, bottom: 4, right: "20%" },
  coinE: { width: 12, height: 12, top: "50%", left: "8%" },

  // Legacy header styles kept for backwards-compat with anything else referencing them
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: horizontalGutter,
    paddingBottom: isSmallDevice ? 8 : 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: isSmallDevice ? 36 : 44,
    height: isSmallDevice ? 36 : 44,
    padding: 20,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: Theme.colors.secondary,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressText: {
    color: Theme.colors.secondary,
    fontSize: baseFont,
    marginRight: 5,
  },
  headerRight: {
    flexDirection: "column",
    alignItems: "center",
  },
  headerRightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  kycButton: {
    backgroundColor: "#ffcccc",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  kycText: {
    color: "black",
    fontSize: 12,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  imageContainer: {
    width: width,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  bannerScrollContainer: {
    height: 150,
    marginVertical: 5,
  },
  image: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
    borderRadius: 10,
  },
  indexText: {
    position: "absolute",
    bottom: 10,
    fontSize: 18,
    color: Theme.colors.secondary,
  },
  navigationButtons: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    width: width * 0.9,
  },
  buttonText: {
    fontSize: 18,
    color: Theme.colors.secondary,
  },

  moneyTransfersContainer: {
    backgroundColor: Theme.colors.secondary,
    // paddingVertical: 10,
    borderRadius: 10,
    marginVertical: 5,
    alignSelf: "center",
    width: "95%",
    elevation: 3,
  },
  moneyTransfers: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
  transferOption: {
    alignItems: "center",
  },
  transferOptionText: {
    color: Theme.colors.primary,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  iconContainer: {
    backgroundColor: Theme.colors.secondary,
    padding: 10,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 5,
  },
  upiContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    marginVertical: 10,
  },
  upiLite: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: Theme.colors.primary,
  },
  upiLiteText: {
    color: "black",
    fontSize: 10,
  },
  upiId: {
    flexDirection: "row",
    alignItems: "center",
    width: "45%",
    borderRadius: 5,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 0.5,
    borderColor: Theme.colors.primary,
  },
  upiIdText: {
    color: "black",
    fontSize: 10,
    marginLeft: 10,
  },
  featuresContainer: {
    // backgroundColor: Theme.colors.secondary,
    paddingVertical: 10,
    marginVertical: -20,
    // borderRadius: 10,
    width: "107%",
    alignSelf: "center",
    overflow: "hidden",
  },
  features: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    flexWrap: "nowrap",
    paddingVertical: 6,
  },
  feature: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 4,
    flexShrink: 1,
  },
  iconContainerr: {
    backgroundColor: Theme.colors.secondary,
    padding: 5,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginRight: 5,
  },
  // Gradient-filled circle with layered shadow for a "3D" feel on the
  // top-of-page feature chips (Wallet / Rewards / Refer).
  feature3dIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  // ---- Hot Offers strip ----
  offersSection: {
    marginTop: 2,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  offersTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  offersScroll: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  offerCardWrap: {
    marginHorizontal: 5,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 10,
  },
  offerCard: {
    width: width * 0.82,
    height: 152,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  offerGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -60,
    right: -40,
    opacity: 0.28,
  },
  offerGlowSm: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    bottom: -38,
    left: 70,
    opacity: 0.16,
  },
  offerAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.95,
  },
  offerCardTextBox: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
    zIndex: 2,
  },
  offerCardTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  offerCardTagText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  offerCardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  offerCardSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 3,
    lineHeight: 16,
  },
  offerCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
  },
  offerCtaText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
  },
  offerCardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    borderWidth: 1,
    zIndex: 2,
  },
  featureText: {
    color: Theme.colors.primary,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  rechargeAndPayBillsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 14,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  rechargeAndPayBills: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    // marginBottom: 10,
    color: "black",
    textAlign: "center",
  },
  billOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  billOption: {
    alignItems: "center",
    // marginVertical: 10,
  },
  billOptionText: {
    color: Theme.colors.primary,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  loanSectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 14,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  loanSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    // marginBottom: 10,
    color: "black",
    textAlign: "center",
  },
  loanOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  loanOption: {
    alignItems: "center",
    // marginVertical: 10,
  },
  loanOptionText: {
    color: Theme.colors.primary,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  viewAllButton: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  viewAllButtonText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  insuranceSection: {
    padding: 15,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 14,
    marginBottom: 14,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  insuranceOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  insuranceOption: {
    alignItems: "center",
  },
  insuranceOptionText: {
    color: Theme.colors.primary,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  // ---- Category swiper ----
  swiperOptionText: {
    color: Theme.colors.primary,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  swiperDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    gap: 6,
  },
  swiperDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D1D5DB",
  },
  swiperDotActive: {
    width: 18,
    backgroundColor: Theme.colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: Theme.colors.primary,
    // textAlign: "center",
    textAlign: "left",
    paddingLeft: 15,
  },
  moreSectionContainer: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: 10,
    borderRadius: 10,
    marginVertical: 5,
    width: "95%",
    alignSelf: "center",
  },
  moreSection: {
    padding: 15,
  },
  moreOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  moreOption: {
    alignItems: "center",
    // marginVertical: 10,
  },
  moreOptionText: {
    color: "green",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  skipText: {
    color: "#888888",
    fontSize: isSmallDevice ? 13 : 14,
    fontWeight: "500",
    textAlign: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: isSmallDevice ? 30 : 50,
    paddingHorizontal: horizontalGutter,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: isSmallDevice ? 20 : 30,
    alignItems: "center",
    width: "100%",
    maxWidth: isSmallDevice ? 320 : 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalIconCircle: {
    width: isSmallDevice ? 90 : 110,
    height: isSmallDevice ? 90 : 110,
    borderRadius: isSmallDevice ? 45 : 55,
    backgroundColor: Theme.colors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Theme.colors.primary + "30",
  },
  fingerprintImage: {
    width: isSmallDevice ? 50 : 60,
    height: isSmallDevice ? 50 : 60,
    resizeMode: "contain",
    tintColor: Theme.colors.primary,
  },
  modalTitle: {
    fontSize: isSmallDevice ? 20 : 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: isSmallDevice ? 13 : 15,
    color: "#666666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: isSmallDevice ? 20 : 22,
    paddingHorizontal: 10,
  },
  modalFeatureList: {
    width: "100%",
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  modalFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalFeatureText: {
    fontSize: isSmallDevice ? 13 : 14,
    color: "#444444",
    marginLeft: 12,
    flex: 1,
  },
  enableButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: isSmallDevice ? 14 : 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: Theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  enableButtonText: {
    color: Theme.colors.secondary,
    fontSize: isSmallDevice ? 15 : 16,
    fontWeight: "700",
  },
  skipTextContainer: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  quickPayContainer: {
    paddingHorizontal: 14,
  },

  // Shared section-header pieces (title + small coloured accent chip)
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitleAccent: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  quickPayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  quickPayTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  quickPayViewAll: {
    fontSize: 13,
    color: "#7C3AED",
    fontWeight: "700",
  },
  quickPayScroll: {
    paddingRight: 8,
    gap: 18,
  },
  quickPayItem: {
    alignItems: "center",
    width: 68,
  },
  quickPayAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF1F5",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  quickPayAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    resizeMode: "contain",
  },
  quickPayName: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
  quickPayCategory: {
    fontSize: 9.5,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 2,
  },
});

export default HomeScreen;
