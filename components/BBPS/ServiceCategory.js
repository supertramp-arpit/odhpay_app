import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Theme from "../Theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { getCategoryDetails } from "../../config/bbpsCategories";
import { useRegisterStore } from "../../store";
import { handleRecentTransactionPress } from "./ServiceCards/Condition/HistorCardCond";

// Import service card components
import {
  CreditCardItem,
  FasTagItem,
  DefaultBillerItem,
  ElectricityBillItem,
  WaterBillItem,
  GasBillItem,
  LPGBillItem,
  InsuranceItem,
  LoanItem,
  RecurringDepositItem,
  EducationItem,
  DTHItem,
  BroadbandItem,
  CableTVItem,
  SubscriptionItem,
  MobilePostpaidItem,
  LandlineItem,
  HousingSocietyItem,
  MunicipalItem,
  RentalItem,
  ClubsItem,
} from "./ServiceCards";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 375;

const ServiceCategory = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    endpoint = "Fastag Transaction",
    btnName = "Add vehicle",
    reminder,
  } = route.params || {};

  // State management
  const [recentRecharges, setRecentRecharges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;
  const user = useRegisterStore((state) => state.user);
  const mobile = user?.user?.MobileNumber ? String(user.user.MobileNumber) : "";

  useEffect(() => {
    navigation.setOptions({
      title: endpoint,
    });
  }, [endpoint, navigation]);

  // Fetch recent transactions
  const fetchRecentTransactions = useCallback(
    async ({ append = false, nextSkip = 0, showMainLoader = true } = {}) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else if (showMainLoader) {
          setLoading(true);
        }
        setError("");

        const access_token = await AsyncStorage.getItem("access_token");
        if (!access_token) {
          setError("Please sign in to view transactions.");
          if (append) {
            setLoadingMore(false);
          } else if (showMainLoader) {
            setLoading(false);
          }
          return;
        }

        const response = await axios.get(
          "https://newapi.odhpay.com/v2/payments/bill-fetch/unique-consumers",
          {
            params: {
              category: endpoint,
              skip: nextSkip,
              limit: limit,
            },
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${access_token}`,
            },
          }
        );


        console.log(response.data?.data)


        // Extract data from response
        let incoming = [];
        if (Array.isArray(response.data?.data)) {
          incoming = response.data.data;
        } else if (Array.isArray(response.data?.data?.results)) {
          incoming = response.data.data.results;
        } else if (Array.isArray(response.data?.data?.data)) {
          incoming = response.data.data.data;
        }

        console.log("Extracted transactions:", incoming.length);

        // Map transactions to display format - preserve all fields for card components
        const mappedTransactions = incoming.map((transaction, index) => {
          const rawInputParams =
            transaction.input_params &&
            typeof transaction.input_params === "object" &&
            !Array.isArray(transaction.input_params)
              ? transaction.input_params
              : null;

          const formattedInputParams =
            typeof transaction.input_params === "string"
              ? transaction.input_params
              : rawInputParams
              ? Object.values(rawInputParams).join(", ")
              : "N/A";

          return {
            id: transaction.id || `${endpoint}-${nextSkip + index}`,
            biller_name: transaction.biller_name || transaction.blr_name || "Unknown Biller",
            amount: transaction.amount || transaction.bill_amount || 0,
            date: transaction.fetched_at || transaction.created_at || new Date().toISOString(),
            status: transaction.status || "Completed",
            description: transaction.description || `Payment to ${transaction.biller_name}`,
            registration_number: transaction.registration_number || "N/A",
            input_params: formattedInputParams,
            biller_id: transaction.biller_id || "N/A",
            // Additional fields for enhanced card display
            customer_name: transaction.customer_name || null,
            due_date: transaction.due_date || null,
            bill_date: transaction.bill_date || null,
            bill_number: transaction.bill_number || null,
            reference_no: transaction.reference_no || null,
            raw_input_params: rawInputParams || {},
          };
        });

        setHasMore(incoming.length === limit);
        setSkip(nextSkip + incoming.length);

        setRecentRecharges((prev) =>
          append ? [...prev, ...mappedTransactions] : mappedTransactions
        );

        if (append) {
          setLoadingMore(false);
        } else if (showMainLoader) {
          setLoading(false);
        }
      } catch (error) {
        console.error("API Error:", error);
        setError("Unable to load transactions right now.");
        setHasMore(false);
        if (append) {
          setLoadingMore(false);
        } else if (showMainLoader) {
          setLoading(false);
        }
      }
    },
    [endpoint, limit]
  );

  // Load transactions on screen focus
  useFocusEffect(
    useCallback(() => {
      setSkip(0);
      setRecentRecharges([]);
      fetchRecentTransactions({ append: false, nextSkip: 0, showMainLoader: true });
    }, [fetchRecentTransactions])
  );

  // Handle load more on scroll
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      fetchRecentTransactions({
        append: true,
        nextSkip: skip,
        showMainLoader: false,
      });
    }
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSkip(0);
    setRecentRecharges([]);
    fetchRecentTransactions({ append: false, nextSkip: 0, showMainLoader: false }).then(() =>
      setRefreshing(false)
    );
  }, [fetchRecentTransactions]);

  // Get the appropriate card component based on endpoint
  const handleRecentPress = useCallback(
    (item) => {
      handleRecentTransactionPress({
        item,
        navigation,
        endpoint,
        reminder,
        mobile,
        setLoading,
      });
    },
    [endpoint, mobile, navigation, reminder]
  );

  const getCardComponent = (item) => {
    const onPress = handleRecentPress;
    
    switch (endpoint) {
      case "Credit Card":
        return <CreditCardItem item={item} onPress={onPress} />;
      
      case "Fastag":
        return <FasTagItem item={item} onPress={onPress} />;
      
      case "Electricity":
      case "Prepaid Meter":
        return <ElectricityBillItem item={item} onPress={onPress} />;
      
      case "Water":
        return <WaterBillItem item={item} onPress={onPress} />;
      
      case "Gas":
        return <GasBillItem item={item} onPress={onPress} />;
      
      case "LPG Gas":
        return <LPGBillItem item={item} onPress={onPress} />;
      
      case "Insurance":
        return <InsuranceItem item={item} onPress={onPress} />;
      
      case "Loan Repayment":
        return <LoanItem item={item} onPress={onPress} />;
      
      case "Recurring Deposit":
        return <RecurringDepositItem item={item} onPress={onPress} />;
      
      case "Education Fees":
      case "National Pension System":
        return <EducationItem item={item} onPress={onPress} />;
      
      case "DTH":
        return <DTHItem item={item} onPress={onPress} />;
      
      case "Broadband Postpaid":
        return <BroadbandItem item={item} onPress={onPress} />;
      
      case "Cable TV":
        return <CableTVItem item={item} onPress={onPress} />;
      
      case "Subscription":
        return <SubscriptionItem item={item} onPress={onPress} />;
      
      case "Mobile Postpaid":
        return <MobilePostpaidItem item={item} onPress={onPress} />;
      
      case "Landline Postpaid":
        return <LandlineItem item={item} onPress={onPress} />;
      
      case "Housing Society":
      case "Housing society":
        return <HousingSocietyItem item={item} onPress={onPress} />;
      
      case "Municipal Taxes":
      case "Municipal Services":
        return <MunicipalItem item={item} onPress={onPress} />;
      
      case "Rental":
        return <RentalItem item={item} onPress={onPress} />;
      
      case "Clubs and Associations":
        return <ClubsItem item={item} onPress={onPress} />;
      
      default:
        return <DefaultBillerItem item={item} onPress={onPress} />;
    }
  };

  const renderRechargeItem = ({ item }) => {
    return getCardComponent(item);
  };

  const renderHeader = () => {
    const categoryDetails = getCategoryDetails(endpoint);

    return (
      <View style={styles.headerContainer}>
        {/* Fetch Bill Banner for Credit Card */}
        {/* {endpoint === "Credit Card" && (
          <TouchableOpacity style={styles.fetchBillBanner} activeOpacity={0.8}>
            <View style={styles.fetchBillContent}>
              <Text style={styles.fetchBillText}>Fetch your credit card bills in</Text>
              <Text style={styles.fetchBillTextBold}>single tap {">"}</Text>
            </View>
            <View style={styles.fetchBillIcon}>
              <MaterialIcons name="search" size={24} color={Theme.colors.primary} />
              <MaterialIcons name="trending-up" size={20} color="#4CAF50" style={{ marginLeft: -8 }} />
            </View>
          </TouchableOpacity>
        )}
         */}
        {/* Section Label */}
        {recentRecharges.length > 0 && (
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>
              {endpoint === "Credit Card" ? "Your Credit Cards" : "Saved Billers"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    const categoryDetails = getCategoryDetails(endpoint);

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Text style={styles.emptyEmoji}>{categoryDetails.emoji}</Text>
        </View>
        <Text style={styles.emptyTitle}>No saved billers</Text>
        <Text style={styles.emptyDesc}>
          Add a biller to make quick payments
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={Theme.colors.primary} />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={40} color="#999" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchRecentTransactions({ append: false, nextSkip: 0, showMainLoader: true })}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recentRecharges}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderRechargeItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
              tintColor={Theme.colors.primary}
            />
          }
        />
      )}

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate("BillerSearch", {
              endpoint: endpoint,
              reminder: reminder,
            })
          }
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>{btnName}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingBottom: 16,
  },
  
  // Center Container (Loading/Error)
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  
  // Header
  headerContainer: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  fetchBillBanner: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  fetchBillContent: {
    flex: 1,
  },
  fetchBillText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  fetchBillTextBold: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  fetchBillIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionLabelRow: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  categoryBanner: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    padding: isSmallDevice ? 14 : 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryIconBox: {
    width: isSmallDevice ? 44 : 50,
    height: isSmallDevice ? 44 : 50,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: isSmallDevice ? 22 : 26,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: isSmallDevice ? 12 : 13,
    color: "rgba(255,255,255,0.75)",
  },
  sectionLabelRow: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  
  // Biller Card
  billerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: isSmallDevice ? 12 : 14,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  billerIconBox: {
    width: isSmallDevice ? 42 : 48,
    height: isSmallDevice ? 42 : 48,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  billerImage: {
    width: isSmallDevice ? 30 : 34,
    height: isSmallDevice ? 30 : 34,
    borderRadius: 6,
  },
  billerInfo: {
    flex: 1,
    marginRight: 8,
  },
  billerName: {
    fontSize: isSmallDevice ? 14 : 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  billerParams: {
    fontSize: isSmallDevice ? 12 : 13,
    color: "#888",
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
  },
  
  // Loading Footer
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  loadingMoreText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 13,
  },
  
  // Bottom Bar
  bottomBar: {
    paddingHorizontal: isSmallDevice ? 12 : 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
  },
  addBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 20,
    paddingVertical: isSmallDevice ? 15 : 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: isSmallDevice ? 15 : 16,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default ServiceCategory;
