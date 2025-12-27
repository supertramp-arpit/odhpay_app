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
import { MaterialIcons } from "@expo/vector-icons";

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

const { width } = Dimensions.get("window");
const isSmallDevice = width < 360;
const horizontalGutter = Math.max(12, width * 0.04);
const baseFont = isSmallDevice ? 12 : 14;

const HomeScreen = () => {



  const user = useUserStore(s => s.user);
  const { top: safeTop } = useSafeAreaInsets();
  const payload = user?.user ? user.user : user;
  const kycDetails = useKycDetailStore(s => s.data);
  const fetchKyc = useKycDetailStore(s => s.fetchKyc);




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
    }, [fetchKyc])
  );



  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bannerImages, setBannerImages] = useState(images);

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




      {
        (user?.aadharKycStatus !== "verified" && user?.panKycStatus !== "verified") && (
          <TouchableOpacity
            onPress={handlekyc}
            style={styles.kycButton}
          >

            <Text style={styles.kycText}>Your KYC Is Pending</Text>

          </TouchableOpacity>

        )
      }


      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(safeTop, 8),
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate("UserProfileScreen")}>
            <Image
              // source={require("../assets/Profilee.png")}
              source={profileSource}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addressContainer}>
            <Text style={styles.addressText}>{payload?.MobileNumber || "Loading..."}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity onPress={() => navigation.navigate("NotificationScreen")}>
              <MaterialIcons
                name="notifications"
                size={24}
                color={Theme.colors.secondary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("HelpSupport")}>
              <MaterialIcons
                name="help-outline"
                size={24}
                color={Theme.colors.secondary}
              />
            </TouchableOpacity>

          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.moneyTransfersContainer}>
          <View style={styles.moneyTransfers}>
            <TouchableOpacity
              style={styles.transferOption}
              onPress={() => navigation.navigate("ToMobile")}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="phone" size={24} color="#000000" />
              </View>
              <Text style={styles.transferOptionText}>
                To Mobile{"\n"}Number
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.transferOption}
              onPress={() => navigation.navigate("ToBank")}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons
                  name="account-balance-wallet"
                  size={24}
                  color="#000000"
                />
              </View>
              <Text style={styles.transferOptionText}>
                To Bank/{"\n"}UPI ID
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.transferOption}
              onPress={() => navigation.navigate("BankDetails")}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="account-box" size={24} color="#000000" />
              </View>
              <Text style={styles.transferOptionText}>
                To Self{"\n"}Account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.transferOption}
              onPress={() => {
                payload?.TransactionPIN
                  ? navigation.navigate('checkWallet')
                  : navigation.navigate('TransactionPin');
              }}
            >
              <View style={styles.iconContainer}>
                <MaterialIcons
                  name="account-balance"
                  size={24}
                  color="#000000"
                />
              </View>
              <Text style={styles.transferOptionText}>
                Check{"\n"}Balance
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.upiContainer}>
            <View style={styles.upiLite}>
              <Text style={styles.upiLiteText}>UPI Lite: Try Now</Text>
            </View>
            <View style={styles.upiId}>
              <MaterialIcons name="qr-code-scanner" size={24} color="black" />
              <Text style={styles.upiIdText}>UPI ID: {payload?.MobileNumber || "Loading"}@axl</Text>
            </View>
          </View>
        </View>

        <View style={styles.bannerScrollContainer}>
          <Animated.ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
          >
            {(bannerImages.length ? bannerImages : images).map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={typeof image === "number" ? image : { uri: image }} style={styles.image} />
              </View>
            ))}
          </Animated.ScrollView>
        </View>

        <View style={styles.features}>
          <TouchableOpacity onPress={() => navigation.navigate("Wallet")}>
            <View style={styles.feature}>
              <TouchableOpacity style={styles.iconContainerr}>
                <MaterialIcons name="account-balance-wallet" size={15} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.featureText}>Wallet</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("ScratchCardScreen")}
          >
            <View style={styles.feature}>
              <TouchableOpacity style={styles.iconContainerr}>
                <MaterialIcons name="card-giftcard" size={15} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.featureText}>Explore{"\n"}Rewards</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("ReferralScreen")}
          >
            <View style={styles.feature}>
              <TouchableOpacity style={styles.iconContainerr}>
                <MaterialIcons name="group-add" size={15} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.featureText}>Refer &{"\n"}Earn ₹50</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.rechargeAndPayBillsContainer}>
          <View style={styles.rechargeAndPayBills}>
            <Text style={styles.sectionTitle}>Recharge & Bill Pay</Text>
            <View style={styles.billOptions}>
              <TouchableOpacity
                style={styles.billOption}
                onPress={() => navigation.navigate("MobilePrepaid")}
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name="phone-android"
                    size={24}
                    color="#000000"
                  />
                </View>
                <Text style={styles.billOptionText}>Mobile{"\n"}Prepaid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.billOption}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Mobile Postpaid", name: "Postpaid Recharge", btnName: "PostPaid Recharge", reminder: "pay Postpaid Recharge" })
                }
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name="phone-in-talk"
                    size={24}
                    color="#000000"
                  />
                </View>
                <Text style={styles.billOptionText}>Mobile{"\n"}Postpaid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.billOption}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Fastag", name: "FASTAG Recharge", btnName: "Add New Vehicle", reminder: "Zip through toll Plazas" })
                }
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="directions-car" size={24} color="#000000" />
                </View>
                <Text style={styles.billOptionText}>FASTag</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.billOption}
                onPress={() =>
                  navigation.navigate("ServiceCategory", { endpoint: "Landline Postpaid", name: "Landline Postpaid Recharge", btnName: "Add New Landline", reminder: "Pay Landline Plans" })
                }
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name="phone"
                    size={24}
                    color="#000000"
                  />
                </View>
                <Text style={styles.billOptionText}>Landline</Text>
              </TouchableOpacity>
            </View>

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
            <View style={styles.loanOptions}>
              <TouchableOpacity
                style={styles.loanOption}
                onPress={() =>
                  navigation.navigate("ServiceCategory", {
                    endpoint: "Electricity",
                    name: "Electricity Recharge",
                    btnName: "Pay Electricity Bill",
                    reminder: "Pay Electricity Plans",
                  })
                }
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="bolt" size={24} color="#000000" />
                </View>
                <Text style={styles.loanOptionText}>Electricity</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loanOption}
                onPress={() =>
                  navigation.navigate("ServiceCategory", {
                    endpoint: "LPG Gas",
                    name: "LPG Recharge",
                    btnName: "Pay LPG Bill",
                    reminder: "Pay LPG Bill",
                  })
                }
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons
                    name="local-fire-department"
                    size={24}
                    color="#000000"
                  />
                </View>
                <Text style={styles.loanOptionText}>LPG</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loanOption}
                onPress={() =>
                  navigation.navigate("ServiceCategory", {
                    endpoint: "Gas",
                    name: "piped Gas Recharge",
                    btnName: "Pay Gas Bill",
                    reminder: "Pay Gas Bill",
                  })
                }
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="fireplace" size={24} color="#000000" />
                </View>
                <Text style={styles.loanOptionText}>Piped Gas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loanOption}
                onPress={() =>
                  navigation.navigate("ServiceCategory", {
                    endpoint: "Rental",
                    name: "Rent payment",
                    btnName: "Pay Rent",
                    reminder: "Pay Rent payment",
                  })
                }
              >
                <View style={styles.iconContainer}>
                  <MaterialIcons name="home" size={24} color="#000000" />
                </View>
                <Text style={styles.loanOptionText}>Rent</Text>
              </TouchableOpacity>
            </View>

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
          <View style={styles.insuranceOptions}>
            <TouchableOpacity
              style={styles.insuranceOption}
              onPress={() =>
                navigation.navigate("ServiceCategory", {
                  endpoint: "Credit Card",
                  name: "Credit card Bill",
                  btnName: "Pay Credit card Bill",
                  reminder: "Pay Credit card Bill",
                })
              }
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="credit-card" size={24} color="#000000" />
              </View>
              <Text style={styles.insuranceOptionText}>Credit{"\n"}Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.insuranceOption}
              onPress={() =>
                navigation.navigate("ServiceCategory", {
                  endpoint: "Loan Repayment",
                  name: "Loan Repayment",
                  btnName: "Pay Loan premium",
                  reminder: "Pay Loan premium",
                })
              }
            >
              <View style={styles.iconContainer}>
                <MaterialIcons name="payments" size={24} color="#000000" />
              </View>
              <Text style={styles.insuranceOptionText}>
                Loan{"\n"}Repayment
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.insuranceOption}
              onPress={() =>
                navigation.navigate("ServiceCategory", {
                  endpoint: "Insurance",
                  name: "Insurance premium",
                  btnName: "Pay Insurance premium",
                  reminder: "Pay Insurance premium",
                })
              }
            >
              <View style={styles.iconContainer}>
                <MaterialIcons
                  name="health-and-safety"
                  size={24}
                  color="#000000"
                />
              </View>
              <Text style={styles.insuranceOptionText}>Insurance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.insuranceOption}
              onPress={() =>
                navigation.navigate("ServiceCategory", {
                  endpoint: "Recurring Deposit",
                  name: "Recurring Deposit",
                  btnName: "Pay Recurring Deposit",
                  reminder: "Pay Recurring Deposit",
                })
              }
            >
              <View style={styles.iconContainer}>
                <MaterialIcons
                  name="currency-exchange"
                  size={24}
                  color="#000000"
                />
              </View>
              <Text style={styles.insuranceOptionText}>
                Recurring{"\n"}Deposit
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate("AllServices")}
          >
            <Text style={styles.viewAllButtonText}>View All</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
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
    justifyContent: "space-evenly",
    padding: 5,
    flexWrap: "wrap",
  },
  feature: {
    alignItems: "center",
    backgroundColor: Theme.colors.secondary,
    height: 60,
    width: 110,
    borderRadius: 10,
    justifyContent: "center",
    flexDirection: "row",
    // padding: 10,
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
  featureText: {
    color: Theme.colors.primary,
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
  },
  rechargeAndPayBillsContainer: {
    backgroundColor: Theme.colors.secondary,
    // paddingVertical: 10,
    borderRadius: 10,
    marginVertical: 1,
    width: "95%",
    alignSelf: "center",
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
    backgroundColor: Theme.colors.secondary,
    // paddingVertical: 10,
    borderRadius: 10,
    marginVertical: 5,
    width: "95%",
    alignSelf: "center",
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Theme.colors.secondary,
    borderRadius: 10,
    marginVertical: 1,
    width: "95%",
    alignSelf: "center",
  },
  insuranceOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
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
});

export default HomeScreen;
