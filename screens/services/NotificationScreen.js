import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Linking,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  X,
  Calendar,
  Video,
  ExternalLink,
  Gift,
  CreditCard,
  Megaphone,
  ChevronRight,
  Clock,
} from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleDeepLink } from "../../hooks/notification/useNotifee";
import Theme from "../../components/Theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, meetings, transactions, promotions
  const LIMIT = 20;

  // Get notification type based on data
  const getNotificationType = useCallback((item) => {
    const dataObj = item?.data || {};
    const template = dataObj?.template?.toLowerCase() || "";

    if (
      template.includes("meeting") ||
      dataObj?.meeting_title ||
      dataObj?.deep_link?.includes("meet") ||
      dataObj?.meet_url
    ) {
      return "meeting";
    }
    if (template.includes("transaction") || template.includes("payment")) {
      return "transaction";
    }
    if (template.includes("offer") || template.includes("promo")) {
      return "promotion";
    }
    return "general";
  }, []);

  // Get icon based on notification type
  const getNotificationIcon = useCallback((type) => {
    switch (type) {
      case "meeting":
        return { Icon: Video, color: "#4CAF50", bg: "#E8F5E9" };
      case "transaction":
        return { Icon: CreditCard, color: "#FF9800", bg: "#FFF3E0" };
      case "promotion":
        return { Icon: Gift, color: "#E91E63", bg: "#FCE4EC" };
      default:
        return { Icon: Bell, color: Theme.colors.primary, bg: "#F3E8FF" };
    }
  }, []);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    return notifications.filter((item) => {
      const type = getNotificationType(item);
      if (activeTab === "meetings") return type === "meeting";
      if (activeTab === "transactions") return type === "transaction";
      if (activeTab === "promotions") return type === "promotion";
      return true;
    });
  }, [notifications, activeTab, getNotificationType]);

  const fetchNotifications = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setPaginationLoading(true);
      } else {
        setLoading(true);
        setOffset(0);
      }

      const token = await AsyncStorage.getItem("access_token");
      const currentOffset = isLoadMore ? offset + LIMIT : 0;

      const response = await axios.get(
        "https://newapi.odhpay.com/notification/my-notifications",
        {
          params: {
            limit: LIMIT,
            offset: currentOffset,
          },
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data || {};
      const items = data.items || [];
      const total = data.total_count || 0;

      console.log("Notification API response:", data.items);

      console.log("Notifications fetched:", items.length, "Total:", total);

      const mergedNotifications = isLoadMore
        ? [...notifications, ...items]
        : items;
      const moreAvailable =
        mergedNotifications.length < total && items.length > 0;

      setNotifications(mergedNotifications);
      setOffset(isLoadMore ? currentOffset : 0);

      setTotalCount(total);
      setHasMore(moreAvailable);
    } catch (err) {
      console.log("Fetch notifications error:", err.message);
    } finally {
      if (isLoadMore) {
        setPaginationLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const cleanContent = useCallback((content, vars) => {
    if (!content) return "";
    return content.replace(/\$\$(.+?)\$\$/g, (_, key) => {
      const cleanedKey = key?.trim();
      return (vars && cleanedKey && vars[cleanedKey]) || "";
    });
  }, []);

  const handleNotificationAction = useCallback(
    async (item) => {
      const dataObj = item?.data || {};

      // Use the centralized deep link handler
      const success = await handleDeepLink(dataObj, navigation);

      if (!success) {
        // Fallback for legacy format
        const legacyLink =
          dataObj?.action_url ||
          item?.vars?.["ZOOM LINK"] ||
          item?.vars?.zoom_link;

        if (legacyLink) {
          Linking.openURL(legacyLink).catch((err) => {
            console.log("Failed to open link:", err);
            Alert.alert(
              "Unable to open link",
              "The link could not be opened on this device."
            );
          });
        }
      }
    },
    [navigation]
  );

  const getActionLabel = useCallback((item) => {
    const dataObj = item?.data || {};

    // Return appropriate label based on notification type
    if (dataObj?.meeting_title || dataObj?.meet_url) return "Join Meeting";
    if (dataObj?.deep_link?.includes("meet")) return "Join Meeting";
    if (dataObj?.deep_link) return "Open Link";
    if (dataObj?.action_url) return "View Offer";
    return "Learn More";
  }, []);

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      if (isNaN(d)) return dateStr?.slice(0, 10) || "";

      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch (e) {
      return dateStr?.slice(0, 10) || "";
    }
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <NotificationCard
        item={item}
        onPressAction={handleNotificationAction}
        onPressCard={() => {
          setSelectedNotification(item);
          setDetailModalVisible(true);
        }}
        formatDate={formatDate}
        cleanContent={cleanContent}
        getActionLabel={getActionLabel}
        getNotificationType={getNotificationType}
        getNotificationIcon={getNotificationIcon}
      />
    ),
    [
      handleNotificationAction,
      formatDate,
      cleanContent,
      getActionLabel,
      getNotificationType,
      getNotificationIcon,
    ]
  );

  const keyExtractor = useCallback(
    (item, index) => `notif-${item?.id || index}`,
    []
  );

  const handleEndReached = () => {
    if (hasMore && !paginationLoading && !loading) {
      fetchNotifications(true);
    }
  };

  const renderFooter = () => {
    if (!paginationLoading) return null;
    return (
      <View style={styles.paginationLoader}>
        <Text style={styles.paginationText}>Loading more notifications...</Text>
      </View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Bell size={22} color="#fff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              Stay up to date with ODH Pay
            </Text>
          </View>
          {totalCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalCount}</Text>
            </View>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {[
              { key: "all", label: "All", Icon: Bell },
              { key: "meetings", label: "Meetings", Icon: Video },
              { key: "transactions", label: "Payments", Icon: CreditCard },
              { key: "promotions", label: "Offers", Icon: Gift },
            ].map(({ key, label, Icon }) => (
              <TouchableOpacity
                key={key}
                style={[styles.tab, activeTab === key && styles.tabActive]}
                onPress={() => setActiveTab(key)}
                activeOpacity={0.7}
              >
                <Icon
                  size={16}
                  color={activeTab === key ? Theme.colors.primary : "#8A8A8A"}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === key && styles.tabTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredNotifications}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            filteredNotifications.length ? styles.listContent : styles.emptyContent
          }
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => fetchNotifications(false)}
              tintColor={Theme.colors.primary}
              colors={[Theme.colors.primary]}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconWrapper}>
                  <Bell size={32} color={Theme.colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>You're all caught up!</Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === "all"
                    ? "New announcements will appear here once available."
                    : `No ${activeTab} notifications yet.`}
                </Text>
              </View>
            ) : null
          }
        />

        {/* Full notification detail modal */}
        <NotificationDetailModal
          visible={detailModalVisible}
          notification={selectedNotification}
          onClose={() => {
            setDetailModalVisible(false);
            setSelectedNotification(null);
          }}
          onPressAction={handleNotificationAction}
          formatDate={formatDate}
          cleanContent={cleanContent}
          getActionLabel={getActionLabel}
          getNotificationType={getNotificationType}
          getNotificationIcon={getNotificationIcon}
        />
      </View>
    </View>
  );
}


const NotificationCard = React.memo(
  ({
    item,
    onPressAction,
    onPressCard,
    formatDate,
    cleanContent,
    getActionLabel,
    getNotificationType,
    getNotificationIcon,
  }) => {
    // Handle both old format (vars) and new format (items from API)
    const vars = item?.vars || {};
    const dataObj = item?.data || {};

    // Use new format fields if available, fallback to old format
    const title = item?.title || vars?.title || "Notification";
    const body = item?.body || vars?.subtitle || "";
    const imageUrl = item?.image_url || dataObj?.image_url || vars?.image_url;
    const description = cleanContent(
      item?.content || vars?.content || "",
      vars
    );
    const ctaLink =
      dataObj?.cta_link ||
      vars?.["ZOOM LINK"] ||
      vars?.zoom_link ||
      vars?.cta_link;
    const sentAt = item?.sent_at || item?.updated_at;
    const hasDeepLink = Boolean(
      dataObj?.deep_link || dataObj?.meet_url || dataObj?.action_url
    );
    const isRead = item?.status === "read";

    // Get notification type and icon
    const notifType = getNotificationType(item);
    const { Icon: TypeIcon, color: iconColor, bg: iconBg } =
      getNotificationIcon(notifType);

    // Meeting specific info
    const meetingTitle = dataObj?.meeting_title;

    return (
      <TouchableOpacity
        style={[styles.card, isRead && styles.cardRead]}
        activeOpacity={0.7}
        onPress={onPressCard}
      >
        {!isRead && <View style={styles.unreadIndicator} />}

        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <TypeIcon size={18} color={iconColor} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text
              style={[styles.title, !isRead && styles.titleBold]}
              numberOfLines={2}
            >
              {title}
            </Text>
            <View style={styles.timeRow}>
              <Clock size={12} color="#8A8A8A" />
              <Text style={styles.time}>{formatDate(sentAt)}</Text>
            </View>
          </View>
          <ChevronRight size={20} color="#CCC" style={styles.chevron} />
        </View>

        {body ? (
          <Text
            style={[styles.subtitle, !isRead && styles.subtitleBold]}
            numberOfLines={2}
          >
            {body}
          </Text>
        ) : null}

        {/* Meeting info badge */}
        {meetingTitle && (
          <View style={styles.meetingBadge}>
            <Video size={14} color="#4CAF50" />
            <Text style={styles.meetingBadgeText}>{meetingTitle}</Text>
          </View>
        )}

        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : null}

        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}

        {/* Action buttons */}
        {hasDeepLink ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.button,
              notifType === "meeting" && styles.buttonMeeting,
            ]}
            onPress={() => onPressAction(item)}
          >
            {notifType === "meeting" ? (
              <Video size={16} color="#fff" style={{ marginRight: 6 }} />
            ) : (
              <ExternalLink size={14} color="#fff" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.buttonText}>{getActionLabel(item)}</Text>
          </TouchableOpacity>
        ) : ctaLink ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.button}
            onPress={() => Linking.openURL(ctaLink).catch(() => {})}
          >
            <Text style={styles.buttonText}>
              {dataObj?.cta_label || vars?.cta_label || "Learn More"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    );
  }
);

// Notification detail modal component
const NotificationDetailModal = React.memo(
  ({
    visible,
    notification,
    onClose,
    onPressAction,
    formatDate,
    cleanContent,
    getActionLabel,
    getNotificationType,
    getNotificationIcon,
  }) => {
    if (!notification) return null;

    const vars = notification?.vars || {};
    const dataObj = notification?.data || {};
    const title = notification?.title || vars?.title || "Notification";
    const body = notification?.body || vars?.subtitle || "";
    const imageUrl =
      notification?.image_url || dataObj?.image_url || vars?.image_url;
    const description = cleanContent(
      notification?.content || vars?.content || "",
      vars
    );
    const ctaLink =
      dataObj?.cta_link ||
      vars?.["ZOOM LINK"] ||
      vars?.zoom_link ||
      vars?.cta_link;
    const sentAt = notification?.sent_at || notification?.updated_at;
    const hasDeepLink = Boolean(
      dataObj?.deep_link || dataObj?.meet_url || dataObj?.action_url
    );

    // Get notification type and icon
    const notifType = getNotificationType(notification);
    const { Icon: TypeIcon, color: iconColor, bg: iconBg } =
      getNotificationIcon(notifType);

    // Meeting specific info
    const meetingTitle = dataObj?.meeting_title;
    const deepLinkUrl = dataObj?.deep_link || dataObj?.meet_url;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={28} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Notification Details</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalCard}>
              {/* Type badge */}
              <View style={styles.typeBadgeContainer}>
                <View style={[styles.typeBadge, { backgroundColor: iconBg }]}>
                  <TypeIcon size={16} color={iconColor} />
                  <Text style={[styles.typeBadgeText, { color: iconColor }]}>
                    {notifType.charAt(0).toUpperCase() + notifType.slice(1)}
                  </Text>
                </View>
              </View>

              <View
                style={[styles.modalIconContainer, { backgroundColor: iconBg }]}
              >
                <TypeIcon size={28} color={iconColor} />
              </View>

              <Text style={styles.modalTitle}>{title}</Text>

              {body && <Text style={styles.modalSubtitle}>{body}</Text>}

              {/* Meeting info card */}
              {meetingTitle && (
                <View style={styles.meetingInfoCard}>
                  <View style={styles.meetingInfoRow}>
                    <Video size={20} color="#4CAF50" />
                    <View style={styles.meetingInfoText}>
                      <Text style={styles.meetingInfoLabel}>Meeting</Text>
                      <Text style={styles.meetingInfoValue}>
                        {meetingTitle}
                      </Text>
                    </View>
                  </View>
                  {deepLinkUrl && (
                    <View style={styles.meetingInfoRow}>
                      <ExternalLink size={20} color={Theme.colors.primary} />
                      <View style={styles.meetingInfoText}>
                        <Text style={styles.meetingInfoLabel}>Link</Text>
                        <Text
                          style={styles.meetingInfoLink}
                          numberOfLines={1}
                        >
                          {deepLinkUrl}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {imageUrl && (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}

              {description && (
                <Text style={styles.modalDescription}>{description}</Text>
              )}

              <View style={styles.modalMeta}>
                <View style={styles.metaRow}>
                  <Clock size={16} color="#6A5C82" />
                  <Text style={styles.modalDate}>{formatDate(sentAt)}</Text>
                </View>
              </View>

              {/* Action button */}
              {hasDeepLink ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.modalButton,
                    notifType === "meeting" && styles.modalButtonMeeting,
                  ]}
                  onPress={() => {
                    onPressAction(notification);
                    onClose();
                  }}
                >
                  {notifType === "meeting" ? (
                    <Video size={18} color="#fff" style={{ marginRight: 8 }} />
                  ) : (
                    <ExternalLink
                      size={16}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text style={styles.modalButtonText}>
                    {getActionLabel(notification)}
                  </Text>
                </TouchableOpacity>
              ) : ctaLink ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.modalButton}
                  onPress={() => {
                    Linking.openURL(ctaLink).catch(() => {});
                    onClose();
                  }}
                >
                  <Text style={styles.modalButtonText}>
                    {dataObj?.cta_label || vars?.cta_label || "Learn More"}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F6FC",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 16,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    elevation: 4,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B6B6B",
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: "center",
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  // Tab styles
  tabContainer: {
    marginBottom: 12,
  },
  tabScrollContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E8E0F0",
  },
  tabActive: {
    backgroundColor: "#F3E8FF",
    borderColor: Theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    color: "#8A8A8A",
    fontWeight: "600",
    marginLeft: 6,
  },
  tabTextActive: {
    color: Theme.colors.primary,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 100,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  // Card styles
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 20,
    marginBottom: 14,
    elevation: 3,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F0EBF7",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  chevron: {
    marginLeft: 8,
  },
  cardImage: {
    width: "100%",
    height: 160,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "#f2f2f2",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 14,
    color: "#6A5C82",
    marginBottom: 10,
    lineHeight: 20,
  },
  description: {
    fontSize: 14,
    color: "#4A4A4A",
    lineHeight: 22,
    marginBottom: 10,
  },
  meetingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  meetingBadgeText: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "600",
    marginLeft: 6,
  },
  button: {
    marginTop: 4,
    backgroundColor: Theme.colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonMeeting: {
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  time: {
    fontSize: 12,
    color: "#8A8A8A",
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: "#8A8A8A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B6B6B",
    textAlign: "center",
    lineHeight: 22,
  },
  paginationLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  paginationText: {
    fontSize: 13,
    color: "#6B6B6B",
  },
  // Unread indicator
  unreadIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    height: "100%",
    backgroundColor: Theme.colors.primary,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cardRead: {
    opacity: 0.8,
    backgroundColor: "#FAFAFA",
  },
  titleBold: {
    fontWeight: "700",
  },
  subtitleBold: {
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8F6FC",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E0F0",
    backgroundColor: "#FFFFFF",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  typeBadgeContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 10,
    lineHeight: 32,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6A5C82",
    marginBottom: 20,
    fontWeight: "500",
    lineHeight: 24,
    textAlign: "center",
  },
  meetingInfoCard: {
    backgroundColor: "#F8FFF8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  meetingInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  meetingInfoText: {
    marginLeft: 12,
    flex: 1,
  },
  meetingInfoLabel: {
    fontSize: 12,
    color: "#6B6B6B",
    fontWeight: "500",
  },
  meetingInfoValue: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "600",
    marginTop: 2,
  },
  meetingInfoLink: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: "500",
    marginTop: 2,
  },
  modalImage: {
    width: "100%",
    height: 220,
    borderRadius: 18,
    marginBottom: 20,
    backgroundColor: "#f2f2f2",
  },
  modalDescription: {
    fontSize: 16,
    color: "#4A4A4A",
    lineHeight: 26,
    marginBottom: 20,
  },
  modalMeta: {
    backgroundColor: "#F8F6FC",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalDate: {
    fontSize: 14,
    color: "#6A5C82",
    fontWeight: "600",
    marginLeft: 8,
  },
  modalButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
    elevation: 4,
    shadowColor: Theme.colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  modalButtonMeeting: {
    backgroundColor: "#4CAF50",
    shadowColor: "#4CAF50",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
