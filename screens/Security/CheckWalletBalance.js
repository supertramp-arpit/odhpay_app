import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  MaterialCommunityIcons,
  Ionicons,
  Feather,
} from "@expo/vector-icons";
import Theme from "../../components/Theme";
import { useWalletStore } from "../../store/useWalletStore";

const { width } = Dimensions.get("window");
const OFFER_W = width * 0.78;

const GLASS_BG = "rgba(255,255,255,0.06)";
const GLASS_BORDER = "rgba(255,255,255,0.10)";
const GLASS_TEXT_DIM = "rgba(255,255,255,0.6)";
const GLASS_TEXT_FAINT = "rgba(255,255,255,0.4)";

const formatINR = (n) => {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const formatDate = (raw) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const time = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  if (sameDay) return `Today, ${time}`;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const CheckWalletBalance = () => {
  const navigation = useNavigation();
  const { fetchBalance, fetchWalletHistory } = useWalletStore();

  const [balances, setBalances] = useState({ rupees: null, money: null });
  const [hidden, setHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [txns, setTxns] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setTxnsLoading(true);
    try {
      const [balData, histData] = await Promise.allSettled([
        fetchBalance(),
        fetchWalletHistory(1, 5, "money"),
      ]);

      if (balData.status === "fulfilled" && balData.value) {
        const d = balData.value;
        setBalances({
          rupees: d?.odh_rupees ?? d?.balance ?? d?.main_balance ?? 0,
          money: d?.odh_money ?? d?.rewards ?? d?.reward_balance ?? 0,
        });
      }

      if (histData.status === "fulfilled" && histData.value) {
        const raw = histData.value;
        const list =
          raw?.transactions ??
          raw?.data ??
          raw?.results ??
          (Array.isArray(raw) ? raw : []);
        setTxns(list.slice(0, 5));
      }
    } catch (e) {
      // soft-fail; UI handles empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
      setTxnsLoading(false);
    }
  }, [fetchBalance, fetchWalletHistory]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const goToWallet = (redUrl, title) => {
    navigation.navigate("SecurityPin", { screenName: redUrl, title });
  };

  const total = (balances.rupees || 0) + (balances.money || 0);

  const offers = [
    {
      id: "o1",
      title: "5% Cashback",
      subtitle: "On every bill payment",
      tag: "Limited time",
      colors: ["#FF6B6B", "#EE5A5A"],
      icon: "lightning-bolt",
    },
    {
      id: "o2",
      title: "Refer & Earn ₹100",
      subtitle: "For every friend who joins",
      tag: "Trending",
      colors: ["#6C63FF", "#8B85FF"],
      icon: "gift-outline",
    },
    {
      id: "o3",
      title: "Prime at 50% off",
      subtitle: "Unlock higher rewards",
      tag: "New",
      colors: ["#1F2937", "#374151"],
      icon: "star-four-points",
    },
  ];

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {/* === Total Balance Glass Strip === */}
        <BlurView intensity={30} tint="dark" style={styles.glassStrip}>
          <View style={styles.glassStripInner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.totalLabel}>Total Balance</Text>
              <View style={styles.totalRow}>
                <Text style={styles.totalAmount}>
                  {hidden ? "••••••" : loading ? "—" : formatINR(total)}
                </Text>
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setHidden((h) => !h)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather
                    name={hidden ? "eye-off" : "eye"}
                    size={15}
                    color={GLASS_TEXT_DIM}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.refreshChip}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={12} color="#fff" />
              <Text style={styles.refreshChipText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </BlurView>

        {/* === ODH Rupees Card === */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => goToWallet("odhRupees", "ODH Rupees")}
          style={styles.cardWrap}
        >
          <LinearGradient
            colors={["#10B981", "#047857"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0)"]}
              style={styles.cardSheen}
              pointerEvents="none"
            />
            <View style={[styles.orb, styles.orb1]} />
            <View style={[styles.orb, styles.orb2]} />

            <View style={styles.cardHeader}>
              <View style={styles.cardIconBadge}>
                <MaterialCommunityIcons name="wallet" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>ODH Rupees</Text>
                <Text style={styles.cardSub}>Add cash for faster checkout</Text>
              </View>
            </View>

            <View style={styles.cardBalanceRow}>
              <View>
                <Text style={styles.cardBalanceLabel}>Available balance</Text>
                <Text style={styles.cardBalance}>
                  {hidden ? "••••••" : loading ? "—" : formatINR(balances.rupees)}
                </Text>
              </View>
              <View style={styles.cardCta}>
                <Text style={styles.cardCtaText}>View</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* === ODH Money Card === */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => goToWallet("odhMoney", "ODH Money")}
          style={styles.cardWrap}
        >
          <LinearGradient
            colors={["#6C63FF", "#4338CA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.walletCard}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0)"]}
              style={styles.cardSheen}
              pointerEvents="none"
            />
            <View style={[styles.orb, styles.orb1]} />
            <View style={[styles.orb, styles.orb2]} />

            <View style={styles.cardHeader}>
              <View style={styles.cardIconBadge}>
                <MaterialCommunityIcons
                  name="trophy-variant"
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>ODH Money</Text>
                <Text style={styles.cardSub}>Track and manage rewards</Text>
              </View>
            </View>

            <View style={styles.cardBalanceRow}>
              <View>
                <Text style={styles.cardBalanceLabel}>Reward balance</Text>
                <Text style={styles.cardBalance}>
                  {hidden ? "••••••" : loading ? "—" : formatINR(balances.money)}
                </Text>
              </View>
              <View style={styles.cardCta}>
                <Text style={styles.cardCtaText}>View</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* === Quick Actions (glass) === */}
        <BlurView intensity={25} tint="dark" style={styles.glassActions}>
          <View style={styles.actionsRow}>
            <QuickAction
              icon="add"
              label="Add Money"
              onPress={() => goToWallet("odhRupees", "ODH Rupees")}
            />
            <ActionDivider />
            <QuickAction
              icon="send"
              label="Send"
              onPress={() => goToWallet("odhRupees", "ODH Rupees")}
            />
            <ActionDivider />
            <QuickAction
              icon="qr-code-outline"
              label="Pay"
              onPress={() => goToWallet("odhRupees", "ODH Rupees")}
            />
            <ActionDivider />
            <QuickAction
              icon="time-outline"
              label="History"
              onPress={() => goToWallet("odhRupees", "ODH Rupees")}
            />
          </View>
        </BlurView>

        {/* === Offers === */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Exclusive Offers</Text>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.offersScroll}
          decelerationRate="fast"
          snapToInterval={OFFER_W + 12}
          snapToAlignment="start"
        >
          {offers.map((o) => (
            <TouchableOpacity key={o.id} activeOpacity={0.9} style={styles.offerWrap}>
              <LinearGradient
                colors={o.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.offerCard}
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0)"]}
                  style={styles.cardSheen}
                  pointerEvents="none"
                />
                <View style={styles.offerTag}>
                  <Text style={styles.offerTagText}>{o.tag}</Text>
                </View>

                <View style={styles.offerIconBadge}>
                  <MaterialCommunityIcons name={o.icon} size={22} color="#fff" />
                </View>

                <Text style={styles.offerTitle}>{o.title}</Text>
                <Text style={styles.offerSub}>{o.subtitle}</Text>

                <View style={styles.offerCta}>
                  <Text style={styles.offerCtaText}>Claim now</Text>
                  <Ionicons name="arrow-forward" size={13} color="#fff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* === Recent ODH Money Transactions === */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent ODH Money Activity</Text>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => goToWallet("odhMoney", "ODH Money")}
          >
            <Text style={styles.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        <BlurView intensity={25} tint="dark" style={styles.glassPanel}>
          {txnsLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : txns.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  name="trophy-outline"
                  size={22}
                  color={GLASS_TEXT_DIM}
                />
              </View>
              <Text style={styles.emptyTitle}>No ODH Money activity yet</Text>
              <Text style={styles.emptySub}>
                Earn rewards by paying bills, recharging, and referring friends
              </Text>
            </View>
          ) : (
            txns.map((t, idx) => {
              const amount = Number(
                t?.amount ?? t?.transaction_amount ?? t?.value ?? 0
              );
              const type = (
                t?.type ??
                t?.transaction_type ??
                (amount >= 0 ? "credit" : "debit")
              )
                .toString()
                .toLowerCase();
              const isCredit = type.includes("credit") || amount > 0;
              const title =
                t?.title ??
                t?.description ??
                t?.remark ??
                (isCredit ? "Reward credited" : "Reward redeemed");
              const date =
                t?.date ??
                t?.created_at ??
                t?.transaction_date ??
                t?.timestamp;

              return (
                <View key={t?.id ?? idx}>
                  <View style={styles.txnRow}>
                    <View
                      style={[
                        styles.txnIcon,
                        {
                          backgroundColor: isCredit
                            ? "rgba(16,185,129,0.18)"
                            : "rgba(255,107,107,0.18)",
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={isCredit ? "arrow-bottom-left" : "arrow-top-right"}
                        size={18}
                        color={isCredit ? "#34D399" : "#FF8B8B"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txnTitle} numberOfLines={1}>
                        {title}
                      </Text>
                      <Text style={styles.txnDate}>{formatDate(date)}</Text>
                    </View>
                    <Text
                      style={[
                        styles.txnAmount,
                        { color: isCredit ? "#34D399" : "#FF8B8B" },
                      ]}
                    >
                      {isCredit ? "+" : "−"}
                      {formatINR(Math.abs(amount))}
                    </Text>
                  </View>
                  {idx < txns.length - 1 && <View style={styles.txnSep} />}
                </View>
              );
            })
          )}
        </BlurView>

        {/* === Security footer === */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={13} color={GLASS_TEXT_FAINT} />
          <Text style={styles.securityText}>
            Protected by ODH-Secure. Tap a wallet to view full details.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const QuickAction = ({ icon, label, onPress }) => (
  <TouchableOpacity
    style={styles.quickAction}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View style={styles.quickIconBadge}>
      <Ionicons name={icon} size={18} color="#fff" />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const ActionDivider = () => <View style={styles.actionDivider} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  scroll: {
    paddingHorizontal: Theme.spacing.md,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.xl,
  },

  // Glass total strip
  glassStrip: {
    borderRadius: Theme.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    marginBottom: Theme.spacing.md,
    backgroundColor: GLASS_BG,
  },
  glassStripInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  totalLabel: {
    fontSize: 11,
    color: GLASS_TEXT_DIM,
    fontWeight: "500",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  eyeBtn: {
    marginLeft: 10,
    padding: 4,
  },
  refreshChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.full,
  },
  refreshChipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 6,
  },

  // Wallet card
  cardWrap: {
    marginBottom: Theme.spacing.md,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  walletCard: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  orb1: {
    width: 160,
    height: 160,
    top: -60,
    right: -40,
  },
  orb2: {
    width: 90,
    height: 90,
    bottom: -30,
    right: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  cardSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  cardBalanceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  cardBalanceLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardBalance: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  cardCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Theme.borderRadius.full,
  },
  cardCtaText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    marginRight: 4,
  },

  // Quick actions glass
  glassActions: {
    borderRadius: Theme.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    marginBottom: Theme.spacing.lg,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  quickAction: {
    flex: 1,
    alignItems: "center",
  },
  actionDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  quickIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },

  // Section heads
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: 12,
    color: "#8B85FF",
    fontWeight: "600",
  },

  // Offers
  offersScroll: {
    paddingRight: Theme.spacing.md,
    paddingBottom: 4,
    marginBottom: Theme.spacing.md,
  },
  offerWrap: {
    width: OFFER_W,
    marginRight: 12,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  offerCard: {
    padding: 16,
    minHeight: 140,
    position: "relative",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  offerTag: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    marginBottom: 10,
  },
  offerTagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  offerIconBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  offerSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    marginBottom: 14,
  },
  offerCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  offerCtaText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    marginRight: 4,
  },

  // Transactions glass panel
  glassPanel: {
    borderRadius: Theme.borderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    paddingVertical: 4,
    marginBottom: Theme.spacing.md,
  },
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  txnIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txnTitle: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  txnDate: {
    fontSize: 11,
    color: GLASS_TEXT_DIM,
  },
  txnAmount: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  txnSep: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 64,
  },
  emptyState: {
    paddingVertical: 28,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 11,
    color: GLASS_TEXT_DIM,
    textAlign: "center",
    lineHeight: 16,
  },

  // Security footer
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: 4,
  },
  securityText: {
    fontSize: 11,
    color: GLASS_TEXT_FAINT,
    marginLeft: 6,
  },
});

export default CheckWalletBalance;
