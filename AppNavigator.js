import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, View } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { PaperProvider } from "react-native-paper";
import UserContext from "./context/UserContext";
import BottomTabNavigator from "./navigation/BottomTabNavigator";

import Register from "./screens/auth/Register";
import OtpVerification from "./screens/auth/OtpVerification";
import ContactUs from "./screens/services/ContactUs";
import AadharDetails from "./screens/kyc/AadharDetails";
import EmailVerification from "./screens/Security/EmailVerification";
import UpdateNumber from "./screens/Security/updateNumber";
import ReferralCode from "./screens/services/ReferralCode";
import AboutUs from "./screens/services/AboutUs";
import PanDetails from "./screens/kyc/PanDetails";
import TermsAndConditions from "./screens/services/TermsAndConditions";
import PrivacyAndPolicy from "./screens/services/PrivacyAndPolicy";
import checkWalletBalance from "./screens/Security/CheckWalletBalance";
import NotificationScreen from "./screens/services/NotificationScreen";
import UserProfileScreen from "./screens/profile/UserProfileScreen";
import ManageBanksScreen from "./screens/profile/ManageBanksScreen";
import PrimeMembershipScreen from "./screens/profile/PrimeMembershipScreen";
import AllServicesScreen from "./screens/AllServicesScreen";




import SplashScreen from "./screens/SplashScreen";
import ToSelf from "./components/ToSelf";

import ToMobile from "./screens/TopServicces/ToMobile";
import ChatScreen from "./components/ChatScreen";


import Wallet from "./components/Wallet";
import TransactionSuccessScreen from "./components/ScanPay/TransactionSuccessScreen";
import ReferralScreen from "./components/ReferralScreen";
import ScratchCardScreen from "./components/reward/ScratchCardScreen";

import ToBank from "./screens/TopServicces/ToBank";
import AddUpiScreen from "./components/AddUpiScreen";
import NewBank from "./components/NewBank";

import Reward from "./components/Reward";



import BillerSearch from "./components/BBPS/BillerSearch";
import MobilePrepaid from "./components/MobileRecharge/MobilePrepaid";
import SignInScreen from "./screens/SignInScreen";

import BillerInputForm from "./components/BBPS/BillerInputForm";



import UserProfile from "./screens/profile/UserProfile";

import ServiceCategory from "./components/BBPS/ServiceCategory";

// #bus booking
import SearchPage from "./components/Travel/SearchPage";
import MakeBooking from "./components/Travel/MakeBooking";
import AboutOffer from "./components/Travel/AboutOffer";
import SingleSearch from "./components/Travel/SingleSearch";
import Theme from "./components/Theme";
import PaymentStatus from "./components/payment/PaymentStatus";

import MembershipSuccess from "./components/Membership/MembershipSuccess";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EnterBillAmount from "./components/BBPS/EnterBillAmount";
import BillConfirmation from "./components/BBPS/BillConfirmation";
import SettingScreen from "./components/Settings/SettingScreen";
import TransactionPin from "./components/Settings/TransactionPin";

import UserInformation from "./screens/profile/UserInformation";
import UpdateOccupation from "./screens/profile/UpdateOccupation";
import UpdateEducation from "./screens/profile/UpdateEducation";
import UpdateAddress from "./screens/profile/UpdateAddress";
import ProfileOtpVerification from "./screens/profile/ProfileOtpVerification";
import OperatorPopup from "./components/MobileRecharge/OperatorPopup";
import RechargeScreenPay from "./components/MobileRecharge/RechargeScreenPay";
import RechargeScreen from "./components/MobileRecharge/Recharge";
import SelfPaymentPin from "./components/selfPayment/SelfPaymentPin";
import SelfPaymentStatus from "./components/selfPayment/SelfPaymentStatus";
import PaymentScreen from "./components/ScanPay/PaymentScreen";
import ScanPayScreenPin from "./components/ScanPay/ScanPayScreenPin";
import SetTransactionPin from "./components/Settings/SetTransactionPin";
import BankDetails from "./components/ToSelf/BankDetails";
import Proceed from "./components/WalletToBank/Proceed";
import AddAmount from "./components/WalletToBank/AddAmount";
import RechargeTrxPin from "./components/MobileRecharge/RechargeTrxPin";
import RechargeSuccess from "./components/MobileRecharge/RechargeSuccess";
import TransactionSuccess from "./components/BBPS/TransactionSuccess";
import PaymentGateway from "./components/BBPS/PaymentGateway";
import Dashboard from "./Ecommerce/Dashboard";
import ProductDetails from "./Ecommerce/ProductDetails";
import Categories from "./Ecommerce/Categories";
import MyCart from "./Ecommerce/MyCart";
import Wishlist from "./Ecommerce/WishList";
import EProfile from "./Ecommerce/Profile";
import HelpSupport from "./screens/services/HelpSupport";
import CreateSecurityPin from "./screens/auth/CreateSecurityPin";
import MPinLockScreen from "./screens/auth/MPinLockScreen";
import axios from "axios";
import OtpVerify from "./screens/Security/OtpVerify";
import OdhRupees from "./components/Wallet/odhRupees";
import OdhMoney from "./components/Wallet/odhMoney";
import SecurityPin from "./components/Wallet/SecurityPin";
import Scan from "./components/ScanPay/Scan";
import AadharKyc from "./screens/kyc/AadharKyc";
import PanKyc from "./screens/kyc/PanKyc";
import EmailVerify from "./screens/auth/EmailVerify";
import PayFromWallet from "./components/payment/PayFromWallet";
import WalletTransactionPin from "./components/payment/WalletTransactionPin";
import ProceedToPayment from "./components/BBPS/ProceedToPayment";

// Travel Screens
import TravelResultsScreen from "./screens/Travel/ResultsScreen";
import TravelSeatSelectionScreen from "./screens/Travel/SeatSelectionScreen";
import TravelPassengerDetailsScreen from "./screens/Travel/PassengerDetailsScreen";
import TravelPaymentScreen from "./screens/Travel/PaymentScreen";
import TravelBoardingPassScreen from "./screens/Travel/BoardingPassScreen";
import TravelBookingHistoryScreen from "./screens/Travel/BookingHistoryScreen";
import TravelOffersScreen from "./screens/Travel/OffersScreen";


const Stack = createStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [prevLogged, setPrevLogged] = useState(undefined);

  const [userCheckDone, setUserCheckDone] = useState(false);
  const [prevLoggedDone, setPrevLoggedDone] = useState(false);

  // load prevLogged
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("userLogged");
        if (!cancelled) setPrevLogged(!!stored);
      } catch {
        if (!cancelled) setPrevLogged(false);
      } finally {
        if (!cancelled) setPrevLoggedDone(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);


  // load token + user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await AsyncStorage.getItem("access_token");
        if (!cancelled) setToken(t || null);

        if (!t) return; // no token = no user check
        const headers = { "Content-Type": "application/json", Authorization: `Bearer ${t}` };
        const resp = await axios.get("https://newapi.odhpay.com/register/check_user", { headers });
        console.log(resp.data)
        if (!cancelled) setUser(resp.data?.user ?? null);
      } catch (err) {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setUserCheckDone(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);



  // wait until BOTH are done
  const ready = userCheckDone && prevLoggedDone;

  // decide initial route once everything is ready
  const initialRoute = React.useMemo(() => {
    if (!ready) return "SplashScreen"; // placeholder, won't be used before ready

    if (user?.introducer_id && user?.LoginPIN) return "MPinLockScreen";
    return prevLogged ? "MainApp" : "SplashScreen";

  }, [ready, token, user?.introducer_id, user?.LoginPIN, prevLogged]);

  // remount the STACK (not just the container)
  const stackKey =
    `${Number(ready)}-${Boolean(token)}-${Boolean(user?.introducer_id)}-${Boolean(user?.LoginPIN)}-${Boolean(prevLogged)}`;

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <UserContext>
      <SafeAreaProvider>
        <PaperProvider>
          <SafeAreaView style={styles.container}>
            <NavigationContainer>

              <Stack.Navigator
                key={stackKey}
                initialRouteName={initialRoute || "SplashScreen"}
                // initialRouteName='CreateSecurityPin'
                screenOptions={{
                  headerShown: false,
                  headerTintColor: "white",
                  headerStyle: {
                    backgroundColor: Theme.colors.primary,
                    elevation: 0,
                    shadowColor: "transparent",
                    borderBottomWidth: 0,
                    height: 56,
                  },
                  headerTitleStyle: {
                    color: "white",
                    fontSize: 20,
                    marginVertical: 0,
                    paddingVertical: 0,
                  },
                  headerBackTitleVisible: false,
                  headerStatusBarHeight: 0,
                }}
              >

                <Stack.Screen
                  name="MPinLockScreen"
                  component={MPinLockScreen}
                  options={{
                    headerShown: false,
                  }}
                />





                <Stack.Screen name="EnterBillAmount" component={EnterBillAmount} options={{
                  headerShown: false, headerStyle: {
                    backgroundColor: Theme.colors.primary,

                  },
                  headerTitleStyle: {
                    color: "white",
                    fontSize: 20,
                  },
                }} />




                <Stack.Screen name="BillConfirmation" component={BillConfirmation} options={{
                  headerShown: true,
                  headerStyle: {
                    backgroundColor: Theme.colors.primary,
                  },
                  headerTintColor: Theme.colors.secondary,
                  headerTitleStyle: {
                    color: "white",
                    fontSize: 18,
                  },
                }} />





                <Stack.Screen name="RechargeTrxPin" component={RechargeTrxPin} options={{
                  headerShown: false, headerStyle: {
                    backgroundColor: Theme.colors.primary,

                  },
                  headerTitleStyle: {
                    color: "white",
                    fontSize: 20,
                  },
                }} />

                <Stack.Screen name="RechargeSuccess" component={RechargeSuccess} options={{
                  headerShown: false, headerStyle: {
                    backgroundColor: Theme.colors.primary,

                  },
                  headerTitleStyle: {
                    color: "white",
                    fontSize: 20,
                  },
                }} />





                <Stack.Screen name="OtpVerify" component={OtpVerify} options={{
                  headerTitle: "Verify the OTP",
                  headerShown: false, headerStyle: {
                    backgroundColor: Theme.colors.primary,

                  },
                  headerTitleStyle: {
                    color: "white",
                    fontSize: 20,
                  },
                }} />


                <Stack.Screen name="TransactionSuccess" component={TransactionSuccess} options={{
                  headerShown: false, headerStyle: {
                    backgroundColor: Theme.colors.primary,

                  },
                  headerTitleStyle: {
                    color: "white",
                    fontSize: 20,
                  },
                }} />

                <Stack.Screen name="PaymentGateway" component={PaymentGateway} options={{
                  headerShown: false, headerStyle: {
                    backgroundColor: Theme.colors.primary,
                  },
                  headerTitleStyle: {
                    color: "white",
                    fontSize: 20,
                  },
                }} />



                <Stack.Screen
                  name="NotificationScreen"
                  component={NotificationScreen}
                  options={{
                    headerShown: false,
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />


                <Stack.Screen
                  name="ProceedToPayment"
                  component={ProceedToPayment}
                  options={{
                    headerShown: true,
                    // headerTitle: "Step 4",
                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                    headerTintColor: Theme.colors.HeaderTint,
                    headerRight: () => (
                      <Image
                        source={require("./assets/WHBharatConnect.png")}
                        style={{ width: 60, height: 60, marginRight: 15 }}
                        resizeMode="contain"
                      />
                    ),
                  }}
                />





                <Stack.Screen
                  name="HelpSupport"
                  component={HelpSupport}
                  options={{
                    headerShown: true,
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />




                <Stack.Screen
                  name="AllServices"
                  component={AllServicesScreen}
                  options={{
                    headerShown: true,
                    headerTitle: "All Services",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                    headerRight: () => (
                      <Image
                        source={require("./assets/WHBharatConnect.png")}
                        style={{ width: 60, height: 60, marginRight: 15 }}
                        resizeMode="contain"
                      />
                    ),
                  }}
                />






                <Stack.Screen name="SplashScreen" component={SplashScreen} />

                {/* Travel Screens */}
                <Stack.Screen 
                  name="TravelResults" 
                  component={TravelResultsScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="TravelSeatSelection" 
                  component={TravelSeatSelectionScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="TravelPassengerDetails" 
                  component={TravelPassengerDetailsScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="TravelPayment" 
                  component={TravelPaymentScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="TravelBoardingPass" 
                  component={TravelBoardingPassScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="TravelBookingHistory" 
                  component={TravelBookingHistoryScreen} 
                  options={{ headerShown: false }} 
                />
                <Stack.Screen 
                  name="TravelOffers" 
                  component={TravelOffersScreen} 
                  options={{ headerShown: false }} 
                />


                <Stack.Screen
                  name="Register"
                  component={Register}
                  options={{
                    headerShown: false,
                    headerTitle: "Register",
                    headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 25,
                    },
                  }}
                />


                <Stack.Screen
                  name="PanDetails"
                  component={PanDetails}
                  options={{
                    headerShown: true,
                    headerTitle: "Pan Details",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />





                <Stack.Screen
                  name="SignInScreen"
                  component={SignInScreen}
                  options={{
                    headerShown: true,
                    headerTitle: "Sign In",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />








                <Stack.Screen
                  name="CreateSecurityPin"
                  component={CreateSecurityPin}
                  options={{
                    headerShown: false,
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="ReferralCode"
                  component={ReferralCode}
                  options={{
                    headerShown: true,
                    headerTitle: "Invite and Earn",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />





                <Stack.Screen
                  name="OtpVerification"
                  component={OtpVerification}
                  options={{
                    headerShown: true,
                    headerTitle: "Otp Verification",
                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />



                <Stack.Screen
                  name="ToMobile"
                  component={ToMobile}
                  options={{
                    headerShown: true,
                    headerTitle: "Mobile Transfer",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="ServiceCategory"
                  component={ServiceCategory}
                  options={{
                    headerShown: true,
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                    headerRight: () => (
                      <Image
                        source={require("./assets/WHBharatConnect.png")}
                        style={{ width: 60, height: 60, marginRight: 15 }}
                        resizeMode="contain"
                      />
                    ),
                  }}
                />

                <Stack.Screen
                  name="ToSelf"
                  component={ToSelf}
                  options={{
                    headerShown: true,
                    headerTitle: "To Self Account",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />


                <Stack.Screen
                  name="Proceed"
                  component={Proceed}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="AddAmount"
                  component={AddAmount}
                  options={{
                     headerShown: true,
                    headerTitle: "Add Money To Wallet",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                

                <Stack.Screen
                  name="BankDetails"
                  component={BankDetails}
                  options={{
                    headerShown: true,
                    headerTitle: "Bank Details",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />



                <Stack.Screen
                  name="checkWallet"
                  component={checkWalletBalance}
                  options={{
                    headerShown: true,
                    headerTitle: "Check Wallet Balance",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />


                <Stack.Screen
                  name="UpdateNumber"
                  component={UpdateNumber}
                  options={{
                    headerShown: true,
                    headerTitle: "Update Phone Number",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />


                <Stack.Screen
                  name="PaymentScreen"
                  component={PaymentScreen}
                  options={{
                    headerShown: true,
                    headerTitle: "Pay",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />



                <Stack.Screen
                  name="SelfPaymentPin"
                  component={SelfPaymentPin}
                  options={{
                    headerShown: true,
                    headerTitle: "Make Payment",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />


                <Stack.Screen
                  name="ScanPayScreenPin"
                  component={ScanPayScreenPin}
                  options={{
                    headerShown: true,
                    headerTitle: "Make Payment",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />


                <Stack.Screen
                  name="ChatScreen"
                  component={ChatScreen}
                  options={{
                    headerShown: false,
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="BillerSearch"
                  component={BillerSearch}
                  options={{
                    headerShown: true,
                    // headerTitle: "FASTag",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                    headerRight: () => (
                      <Image
                        source={require("./assets/WHBharatConnect.png")}
                        style={{ width: 60, height: 60, marginRight: 15 }}
                        resizeMode="contain"
                      />
                    ),
                  }}
                />




                <Stack.Screen
                  name="ToBank"
                  component={ToBank}
                  options={{
                    headerShown: true,
                    headerTitle: "Send Money To Bank Account",
                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      // fontWeight: "bold",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="AddUpiScreen"
                  component={AddUpiScreen}
                  options={{
                    headerShown: true,
                    headerTitle: "Add UPI Id",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      // fontWeight: "bold",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="NewBank"
                  component={NewBank}
                  options={{
                    headerShown: true,
                    headerTitle: "Add New Bank",
                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="Wallet"
                  component={Wallet}
                  options={{
                    headerShown: true,
                    headerTitle: "Wallet",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="TransactionSuccessScreen"
                  component={TransactionSuccessScreen}
                  options={{
                    headerShown: true,
                    headerTitle: "Transaction Successful",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="ScratchCardScreen"
                  component={ScratchCardScreen}
                  options={{
                    headerShown: true,
                    headerTitle: "Scratch and win Rewards",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="ReferralScreen"
                  component={ReferralScreen}
                  options={{
                    headerShown: true,
                    headerTitle: "Invite and Earn",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />



















                <Stack.Screen
                  name="OperatorPopup"
                  component={OperatorPopup}
                  options={{
                    headerShown: true,
                    headerTitle: "OperatorPopup",
                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />









                <Stack.Screen
                  name="membershipSuccess"
                  component={MembershipSuccess}
                  options={{
                    headerShown: true,

                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />






                <Stack.Screen
                  name="Reward"
                  component={Reward}
                  options={{
                    headerShown: true,
                    headerTitle: "Reward Income",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />








                <Stack.Screen
                  name="MainApp"
                  component={BottomTabNavigator}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="UserProfileScreen"
                  component={UserProfileScreen}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="ManageBanksScreen"
                  component={ManageBanksScreen}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="PrimeMembershipScreen"
                  component={PrimeMembershipScreen}
                  options={{
                    headerShown: false,
                  }}
                />





                <Stack.Screen
                  name="SetTransactionPin"
                  component={SetTransactionPin}
                  options={{
                    headerShown: true,
                    headerTitle: "Set Transaction Pin",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />


                <Stack.Screen
                  name="RechargeScreenPay"
                  component={RechargeScreenPay}
                  options={{
                    headerShown: true,
                    headerTitle: "Pay",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />
                <Stack.Screen
                  name="MobilePrepaid"
                  component={MobilePrepaid}
                  options={{
                    headerShown: true,
                    headerTitle: "Mobile Prepaid Recharge",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />
                <Stack.Screen
                  name="RechargeScreen"
                  component={RechargeScreen}
                  options={{
                    headerShown: true,
                    headerTitle: "Recharge Plan",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="AadharKyc"
                  component={AadharKyc}
                  options={{
                    headerShown: true,
                    headerTitle: "Aadhar Detail Verification",
                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />





                <Stack.Screen
                  name="AadharDetails"
                  component={AadharDetails}
                  options={{
                    headerShown: true,
                    headerTitle: "Your Aadhar Details",
                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="EmailVerification"
                  component={EmailVerification}
                  options={{
                    headerShown: true,
                    headerTitle: "Email Otp Verification",
                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />





                <Stack.Screen
                  name="PanKyc"
                  component={PanKyc}
                  options={{
                    headerShown: true,
                    headerTitle: "Pan Verification",
                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />

                <Stack.Screen
                  name="EmailVerify"
                  component={EmailVerify}
                  options={{
                    headerShown: true,
                    headerTitle: "Email Verification",
                    // headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />



                <Stack.Screen name="UserProfile" component={UserProfile} />

                <Stack.Screen
                  name="BillerInputForm"
                  component={BillerInputForm}
                  options={{
                    headerShown: true,
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                    headerRight: () => (
                      <Image
                        source={require("./assets/WHBharatConnect.png")}
                        style={{ width: 60, height: 60, marginRight: 15 }}
                        resizeMode="contain"
                      />
                    ),
                  }}
                />

                <Stack.Screen
                  name="AboutUs"
                  component={AboutUs}
                  options={{
                    headerShown: true,
                    headerTitle: "About Us",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />
                <Stack.Screen
                  name="ContactUs"
                  component={ContactUs}
                  options={{
                    headerShown: true,
                    headerTitle: "Contact Us",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />


                <Stack.Screen
                  name="PrivacyAndPolicy"
                  component={PrivacyAndPolicy}
                  options={{
                    headerShown: true,
                    headerTitle: "Privacy And Policy",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />




                <Stack.Screen
                  name="searchpage"
                  component={SearchPage}
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="aboutOffer"
                  options={{ title: "Offers" }}
                  component={AboutOffer}
                />

                <Stack.Screen
                  name="singleSearch"
                  component={SingleSearch}
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="MakeBooking"
                  component={MakeBooking}
                  options={{ headerShown: false }}
                />




                <Stack.Screen
                  name="PaymentStatus"
                  component={PaymentStatus}
                  options={{ headerShown: false }}
                />

                <Stack.Screen
                  name="SelfPaymentStatus"
                  component={SelfPaymentStatus}
                  options={{ headerShown: false }}
                />



                <Stack.Screen
                  name="SettingScreen"
                  component={SettingScreen}
                  options={{
                    headerShown: true,
                    headerTitle: "Setting",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontSize: 20,
                    },
                  }}
                />





                {/* TermsAndConditions.js */}
                <Stack.Screen
                  name="TransactionPin"
                  component={TransactionPin}
                  options={{
                    headerShown: true,
                    headerTitle: "Set Security PIN",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 20,
                    },
                  }}
                />


                <Stack.Screen
                  name="TermsAndConditions"
                  component={TermsAndConditions}
                  options={{
                    headerShown: true,
                    headerTitle: "Terms And Conditions",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 25,
                    },
                  }}
                />

                <Stack.Screen
                  name="UserInformation"
                  component={UserInformation}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="UpdateOccupation"
                  component={UpdateOccupation}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="UpdateEducation"
                  component={UpdateEducation}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="UpdateAddress"
                  component={UpdateAddress}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="ProfileOtpVerification"
                  component={ProfileOtpVerification}
                  options={{
                    headerShown: false,
                  }}
                />



                {/* ================================================================== */}
                {/* ODH  Wallet Balance COme Here  */}
                {/* ================================================================== */}


                <Stack.Screen
                  name="SecurityPin"
                  component={SecurityPin}
                  options={{
                    headerShown: false,

                  }}
                />

                <Stack.Screen
                  name="Scan"
                  component={Scan}
                  options={{
                    headerShown: false,

                  }}
                />

                <Stack.Screen
                  name="odhRupees"
                  component={OdhRupees}
                  options={{
                    headerShown: true,
                    headerTitle: "ODH Rupees Wallet",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 20
                    },
                  }}
                />

                <Stack.Screen
                  name="odhMoney"
                  component={OdhMoney}
                  options={{
                    headerShown: true,
                    headerTitle: "ODH Money Wallet",
                    headerStyle: {
                      backgroundColor: Theme.colors.primary,
                    },
                    headerTitleStyle: {
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 20,
                    },
                  }}
                />



                <Stack.Screen
                  name="PayFromWallet"
                  component={PayFromWallet}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="WalletTransactionPin"
                  component={WalletTransactionPin}
                  options={{
                    headerShown: false,
                  }}
                />









                {/* ================================================================== */}
                {/* Ecommerece Section Come here  */}
                {/* ================================================================== */}

                <Stack.Screen
                  name="Dashboard"
                  component={Dashboard}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="Categories"
                  component={Categories}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="MyCart"
                  component={MyCart}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="Wishlist"
                  component={Wishlist}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="EProfile"
                  component={EProfile}
                  options={{
                    headerShown: false,
                  }}
                />

                <Stack.Screen
                  name="ProductDetails"
                  component={ProductDetails}
                  options={{
                    headerShown: false,
                  }}
                />

              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaView>
        </PaperProvider>
      </SafeAreaProvider>
    </UserContext>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
