import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Gift, Clock3, Check, CircleAlert, Share2 } from 'lucide-react-native';

import ScratchReward from './ScratchReward';
import { useAppStore, loadScratchedIds } from '../../store/useAppStore';
import { formatDate, formatINR } from '../../utils/helper';
import { color, space, radius, type, tabularNums, elevation } from '../../theme/tokens';

const { width } = Dimensions.get('window');
const GRID_GUTTER = space.lg;
const CARD_GAP = space.md;
const CARD_WIDTH = Math.floor((width - GRID_GUTTER * 2 - CARD_GAP) / 2);
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.22);

// ---------------------------------------------------------------------------
// Skeleton — pulsing placeholders while rewards load
// ---------------------------------------------------------------------------
const SkeletonBlock = ({ style }) => {
  const pulse = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View style={[styles.skeleton, style, { opacity: pulse }]} />;
};

const LoadingState = () => (
  <View style={styles.stateWrap}>
    <SkeletonBlock style={styles.skeletonSummary} />
    <View style={styles.skeletonGrid}>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonBlock key={i} style={styles.skeletonCard} />
      ))}
    </View>
  </View>
);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
const ScratchCardScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selectedScratchCard, setSelectedScratchCard] = useState(null);
  const { scratchCards, setScratchCards } = useAppStore();

  const fetchScratchCards = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem('access_token');
      const userJSON = await AsyncStorage.getItem('user');
      let memberId = null;
      if (userJSON) {
        try {
          const userObj = JSON.parse(userJSON);
          memberId = userObj?.member_id || userObj?.user?.member_id || null;
        } catch {
          // ignore parse error
        }
      }
      if (!memberId) {
        setScratchCards([]);
        return;
      }

      // /referral/scratch-cards returns stable ids (lcrmoney.srno), newest
      // first — unlike /lcrmoneydetail which has no id and no ordering.
      const [response, scratchedIds] = await Promise.all([
        axios.get(
          `https://newapi.odhpay.com/referral/scratch-cards?userid=${memberId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        loadScratchedIds(),
      ]);

      if (response.status === 200 && Array.isArray(response.data?.data)) {
        const cards = response.data.data.map((item, index) => {
          const id = item.id ?? `row-${index}`;
          const amount = Number(item.amount ?? 0);
          return {
            id,
            amount,
            receivedDate: item.receivedDate || item.date || null,
            // Reveal state is device-local: the money is already credited
            // server-side; the backend has no scratched flag.
            IsScratched: scratchedIds.has(String(id)),
            IsRedeemable: amount > 0,
          };
        });
        setScratchCards(cards);
      } else {
        setScratchCards([]);
      }
    } catch (e) {
      setError('Couldn’t load your rewards');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setScratchCards]);

  useEffect(() => {
    fetchScratchCards();
  }, [fetchScratchCards]);

  const stats = useMemo(() => {
    const total = scratchCards.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const unopened = scratchCards.filter((c) => c.IsRedeemable && !c.IsScratched).length;
    return { total, unopened };
  }, [scratchCards]);

  const handleScratchCard = useCallback((item) => {
    if (!item?.IsRedeemable || item?.IsScratched) return;
    setSelectedScratchCard(item);
    setVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setVisible(false);
    setSelectedScratchCard(null);
  }, []);

  const renderCard = useCallback(
    ({ item, index }) => {
      const isScratched = !!item?.IsScratched;
      const amount = Number(item?.amount ?? 0);
      const dateText = item?.receivedDate ? formatDate(item.receivedDate) : '';

      if (isScratched) {
        // Revealed — quiet paper card, credited amount in the one money-green
        return (
          <View style={[styles.card, styles.cardRevealed]}>
            <View style={styles.claimedBadge}>
              <Check size={12} color={color.successFg} strokeWidth={2.5} />
              <Text style={styles.claimedBadgeText}>Claimed</Text>
            </View>
            <View style={styles.cardCenter}>
              <Text style={styles.revealedAmount}>{formatINR(amount)}</Text>
              <Text style={styles.revealedCaption}>Added to wallet</Text>
            </View>
            <View style={styles.cardFooter}>
              <Clock3 size={12} color={color.textTertiary} strokeWidth={2} />
              <Text style={styles.cardFooterText}>{dateText || 'Recently'}</Text>
            </View>
          </View>
        );
      }

      // Face-down — ink card, one gift mark, an invitation not a circus
      return (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.card, styles.cardFaceDown]}
          onPress={() => handleScratchCard(item)}
          accessibilityRole="button"
          accessibilityLabel={`Scratch card ${index + 1}, tap to scratch and reveal your reward`}
        >
          <View style={styles.giftDisc}>
            <Gift size={26} color={color.textInverse} strokeWidth={1.75} />
          </View>
          <Text style={styles.faceDownTitle}>Scratch & win</Text>
          <Text style={styles.faceDownCaption}>Tap to reveal</Text>
        </TouchableOpacity>
      );
    },
    [handleScratchCard]
  );

  const listHeader = (
    <View style={styles.summaryCard}>
      <View style={styles.summaryLeft}>
        <Text style={styles.summaryLabel}>Total rewards earned</Text>
        <Text style={styles.summaryAmount}>{formatINR(stats.total)}</Text>
      </View>
      {stats.unopened > 0 && (
        <View style={styles.unopenedPill}>
          <Text style={styles.unopenedPillText}>
            {stats.unopened} to scratch
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeModal}
      >
        <View style={styles.modalScrim}>
          {selectedScratchCard && (
            <ScratchReward item={selectedScratchCard} onClose={closeModal} />
          )}
        </View>
      </Modal>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <View style={styles.stateCenter}>
          <View style={[styles.stateDisc, { backgroundColor: color.errorBg }]}>
            <CircleAlert size={28} color={color.errorFg} strokeWidth={2} />
          </View>
          <Text style={styles.stateTitle}>{error}</Text>
          <Text style={styles.stateBody}>
            Check your connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => fetchScratchCards()}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Retry loading rewards"
          >
            <Text style={styles.primaryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : scratchCards.length === 0 ? (
        <View style={styles.stateCenter}>
          <View style={styles.stateDisc}>
            <Gift size={30} color={color.textSecondary} strokeWidth={1.75} />
          </View>
          <Text style={styles.stateTitle}>No rewards yet</Text>
          <Text style={styles.stateBody}>
            Invite friends with your referral code and earn scratch-card
            rewards when they join.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('ReferralScreen')}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Invite friends and earn rewards"
          >
            <Share2 size={16} color={color.textInverse} strokeWidth={2} />
            <Text style={[styles.primaryBtnText, { marginLeft: space.sm }]}>
              Invite & earn
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={scratchCards}
          keyExtractor={(item, index) => (item?.id != null ? String(item.id) : `scratch-${index}`)}
          numColumns={2}
          renderItem={renderCard}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchScratchCards(true);
              }}
              tintColor={color.ink900}
              colors={[color.ink900]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },

  // Summary
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    paddingVertical: space.base,
    paddingHorizontal: space.lg,
    marginBottom: space.lg,
    ...elevation.level1,
  },
  summaryLeft: {
    flexShrink: 1,
  },
  summaryLabel: {
    ...type.caption,
    color: color.textSecondary,
    marginBottom: space.xs,
  },
  summaryAmount: {
    ...type.h1,
    ...tabularNums,
    color: color.moneyCredit,
  },
  unopenedPill: {
    backgroundColor: color.ink900,
    borderRadius: radius.pill,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  unopenedPillText: {
    ...type.micro,
    ...tabularNums,
    color: color.textInverse,
  },

  // Grid
  listContent: {
    paddingHorizontal: GRID_GUTTER,
    paddingTop: space.lg,
    paddingBottom: space.xxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },

  // Cards
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    marginBottom: CARD_GAP,
    overflow: 'hidden',
  },
  cardFaceDown: {
    backgroundColor: color.ink900,
    borderWidth: 1,
    borderColor: color.ink700,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.base,
    ...elevation.level2,
  },
  giftDisc: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: color.pressTintInverse,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  faceDownTitle: {
    ...type.h3,
    color: color.textInverse,
  },
  faceDownCaption: {
    ...type.caption,
    color: color.gray400,
    marginTop: space.xs,
  },
  cardRevealed: {
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: space.md,
    justifyContent: 'space-between',
    ...elevation.level1,
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: color.successBg,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
  },
  claimedBadgeText: {
    ...type.micro,
    color: color.successFg,
    marginLeft: space.xs,
  },
  cardCenter: {
    alignItems: 'center',
  },
  revealedAmount: {
    ...type.h2,
    ...tabularNums,
    color: color.moneyCredit,
  },
  revealedCaption: {
    ...type.caption,
    color: color.textSecondary,
    marginTop: space.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooterText: {
    ...type.caption,
    ...tabularNums,
    color: color.textTertiary,
    marginLeft: space.xs,
  },

  // Modal
  modalScrim: {
    flex: 1,
    backgroundColor: color.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Shared state layouts
  stateWrap: {
    flex: 1,
    paddingHorizontal: GRID_GUTTER,
    paddingTop: space.lg,
  },
  stateCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: space.xxl,
    paddingTop: space.giant,
  },
  stateDisc: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: color.gray150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  stateTitle: {
    ...type.h3,
    color: color.text,
    marginBottom: space.sm,
    textAlign: 'center',
  },
  stateBody: {
    ...type.bodySm,
    color: color.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: space.xl,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    backgroundColor: color.ink900,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
  },
  primaryBtnText: {
    ...type.button,
    color: color.textInverse,
  },

  // Skeletons
  skeleton: {
    backgroundColor: color.gray150,
    borderRadius: radius.lg,
  },
  skeletonSummary: {
    height: 84,
    marginBottom: space.lg,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skeletonCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: CARD_GAP,
  },
});

export default ScratchCardScreen;
