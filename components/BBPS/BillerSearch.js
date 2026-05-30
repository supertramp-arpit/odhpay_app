import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import CusomSpinner from "../miscellaneous/CustomSpinner";
import Theme from "../Theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FAST = () => {
  const route = useRoute();
  const { endpoint, reminder } = route.params;
  console.log(`endpoint`, endpoint);

  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");

  // ===========================================================================
  //  implementing the Api Call Start here
  // ===========================================================================

  const [billerDetails, SetBillerDetails] = useState([]);
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [skip, setSkip] = useState(0);
  const [limit] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searching, setSearching] = useState(false);




  const fetchApi = async ({
    append = false,
    nextSkip = 0,
    query = searchQuery,
    showMainLoader = true,
  } = {}) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else if (showMainLoader) {
        setLoading(true);
      } else {
        setSearching(true);
      }
      setError("");

      const access_token = await AsyncStorage.getItem("access_token");
      if (!access_token) {
        setError("Please sign in to view billers.");
        if (append) {
          setLoadingMore(false);
        } else if (showMainLoader) {
          setLoading(false);
        } else {
          setSearching(false);
        }
        return;
      }
      const response = await axios.get(
        "https://newapi.odhpay.com/api/v1/bbps/billers/search/fast",
        {
          params: {
            category: endpoint,
            skip: nextSkip,
            limit: limit,
            q: query.length > 0 ? query?.trim() : endpoint,
          },
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${access_token}`,
          },
        }
      );



      const incoming = Array.isArray(response.data["data"]?.results)
        ? response.data["data"]?.results
        : [];
      const mappedBillers = incoming.map((biller) => ({
        id: biller.blr_id,
        name: biller.blr_name,
        aliasName: biller.blr_alias_name,
        blr_image: biller.blr_image,
      }));

      setHasMore(incoming.length === limit);
      setSkip(nextSkip + incoming.length);

      setResult((prev) => (append ? [...prev, ...incoming] : incoming));

      SetBillerDetails((prev) => {
        const combined = append ? [...prev, ...mappedBillers] : mappedBillers;
        const deduped = new Map();
        combined.forEach((biller) => deduped.set(biller.id, biller));
        return Array.from(deduped.values());
      });

      if (append) {
        setLoadingMore(false);
      } else if (showMainLoader) {
        setLoading(false);
      } else {
        setSearching(false);
      }
    } catch (error) {
      if (append) {
        setLoadingMore(false);
      } else if (showMainLoader) {
        setLoading(false);
      } else {
        setSearching(false);
      }
      console.error("API Error:", error);
      setError("Unable to load billers right now.");
      setHasMore(false);
    }
  };

  useEffect(() => {
    fetchApi({ append: false, nextSkip: 0 });

    navigation.setOptions({
      title: endpoint,
    });
  }, [endpoint, navigation]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSkip(0);
      setHasMore(true);
      fetchApi({
        append: false,
        nextSkip: 0,
        query: searchQuery,
        showMainLoader: false,
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const filteredTransactions = billerDetails.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      item.name?.toLowerCase().includes(query) ||
      item.aliasName?.toLowerCase().includes(query)
    );
  });

  // ===========================================================================
  //  Fetch the Particular Biller Details Condtions Function Start here
  // ===========================================================================
  const FetchBillerConditions = async (Biller) => {
    try {
      const access_token = await AsyncStorage.getItem("access_token");
      if (!access_token) {
        setError("Please sign in to view billers.");
        return;
      }

      const response = await axios.get(
        `https://newapi.odhpay.com/api/v1/bbps/billers/ui-info/${Biller.blr_id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      console.log("api/v1/bbps/billers/ui-info/--->", response.data.data);




      // =======================================================
      // If Support the BillFetch
      // =======================================================
      if (response?.data?.data?.shouldNaviagteToManualInput) {
        navigation.navigate("ProceedToPayment", {
          registrationCond: response.data?.data?.inputParams || [],
          paymentBnak: response?.data?.data?.billerName,
          reminder: reminder,
          biller_id: response?.data?.data?.billerId,
          tagName: endpoint,
          iconImage: Biller?.blr_image,
          doesSupportBillFetch: response?.data?.data?.doesSupportBillFetch,
          doesSupportUserInput: response?.data?.data?.doesSupportUserInput,
          isBillFetchMandatory: response?.data?.data?.isBillFetchMandatory,
          shouldNaviagteToManualInput: response?.data?.data?.shouldNaviagteToManualInput,
          paymentChannels: response?.data?.data?.paymentChannels || [],
          billerName: response?.data?.data?.billerName,
          billerCategory: response?.data?.data?.billerCategory,
          allDiscomsList: response?.data?.data?.allDiscomsList || [],
        })
        return;
      }
      else {
        navigation.navigate("BillerInputForm", {
          registrationCond: response.data?.data?.inputParams || [],
          paymentBnak: response?.data?.data?.billerName,
          reminder: reminder,
          biller_id: response?.data?.data?.billerId,
          tagName: endpoint,
          iconImage: Biller?.blr_image,
          doesSupportBillFetch: response?.data?.data?.doesSupportBillFetch,
          doesSupportUserInput: response?.data?.data?.doesSupportUserInput,
          isBillFetchMandatory: response?.data?.data?.isBillFetchMandatory,
          shouldNaviagteToManualInput: response?.data?.data?.shouldNaviagteToManualInput,
          paymentChannels: response?.data?.data?.paymentChannels || [],
          billerName: response?.data?.data?.billerName,
          billerCategory: response?.data?.data?.billerCategory,
          allDiscomsList: response?.data?.data?.allDiscomsList || [],
        })
      }


    } catch (error) {
      console.error("API Error:", error);
    };
  }

  // ===========================================================================
  //  implementing the Api Call End here
  // ===========================================================================

  const renderRecentTransaction = ({ item }) => {
    const billerInfo =
      result?.find((val) => val.blr_id === item.id) || {};

    const initials = (item?.name || billerInfo?.blr_name || "BL")
      .trim()
      .substring(0, 2)
      .toUpperCase();

    return (
      <TouchableOpacity
        style={styles.recentTransaction}
        onPress={() =>
          FetchBillerConditions(billerInfo)
        }
      >
        <View style={styles.accountInfo}>
          <View style={styles.initialsCircle}>
            {item?.blr_image ? (<Image style={{ width: 37, height: 37 }} source={{ uri: item?.blr_image }} />) : (<Text style={styles.initials}>{initials}</Text>)}
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.accountName}>{item.name}</Text>
            <Text style={styles.accountDetails}>
              {billerInfo?.blr_coverage || "Tap to continue"}
            </Text>
          </View>
        </View>

      </TouchableOpacity>
    );
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || !hasMore || error) return;
    fetchApi({ append: true, nextSkip: skip, query: searchQuery });
  };

  const renderFooter = () =>
    loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={Theme.colors.primary} size="small" />
        <Text style={styles.footerLoaderText}>Loading more billers...</Text>
      </View>
    ) : null;




  return (
    <View style={{ flex: 1, backgroundColor: "#f2f4f7" }}>
      {loading ? (
        <CusomSpinner />
      ) : (
        <View style={styles.container}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#aaa"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchBox}
              placeholder={`Search ${endpoint} Biller...`}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {error ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Something went wrong</Text>
              <Text style={styles.stateSub}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchApi}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              renderItem={renderRecentTransaction}
              keyExtractor={(item) => item.id?.toString()}
              contentContainerStyle={[
                styles.listContent,
                filteredTransactions.length === 0 && styles.emptyListContent,
              ]}
              ListHeaderComponent={
                searching ? (
                  <View style={styles.inlineLoader}>
                    <ActivityIndicator
                      color={Theme.colors.primary}
                      size="small"
                    />
                    <Text style={styles.inlineLoaderText}>Searching...</Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.stateCard}>
                  <Text style={styles.stateTitle}>No billers found</Text>
                  <Text style={styles.stateSub}>
                    Try a different search or refresh to load more options.
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButtonLight}
                    onPress={fetchApi}
                  >
                    <Text style={styles.retryTextAlt}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              }
              ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              ListFooterComponent={renderFooter}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: "#f2f4f7",
  },
  listContent: {
    paddingBottom: 45,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchBox: {
    flex: 1,
    height: 40,
  },
  recentTransactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recentTransactionsLabel: {
    fontSize: 14,
  },
  seeAllLabel: {
    color: Theme.colors.primary,
    fontSize: 12,
  },
  recentTransaction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: Theme.colors.secondary,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    width: "100%",
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  initialsCircle: {
    backgroundColor: Theme.colors.primary,
    width: 37,
    height: 37,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  initials: {
    fontSize: 18,
    color: Theme.colors.secondary,
    fontWeight: "bold",
  },
  nameBlock: {
    flexShrink: 1,
    maxWidth: 250,
  },
  accountName: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  accountDetails: {
    fontSize: 12,
    color: Theme.colors.subtext,
    marginTop: 2,
  },
  editIcon: {
    width: 20,
    height: 20,
  },
  stateCard: {
    padding: 18,
    backgroundColor: Theme.colors.secondary,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    marginTop: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  stateSub: {
    marginTop: 6,
    fontSize: 13,
    color: Theme.colors.subtext,
  },
  retryButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  retryButtonLight: {
    marginTop: 12,
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Theme.colors.primary,
  },
  retryText: {
    color: Theme.colors.secondary,
    fontWeight: "600",
  },
  retryTextAlt: {
    color: Theme.colors.primary,
    fontWeight: "600",
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  inlineLoader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 8,
  },
  inlineLoaderText: {
    marginLeft: 8,
    color: Theme.colors.subtext,
    fontSize: 13,
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  footerLoaderText: {
    marginLeft: 8,
    color: Theme.colors.subtext,
    fontSize: 13,
  },
});

export default FAST;
