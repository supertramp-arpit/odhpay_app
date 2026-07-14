import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
  Copy,
  Share2,
  MessageCircle,
  UserPlus,
  IndianRupee,
  Users,
} from 'lucide-react-native';

import Theme from './Theme';
import useUserStore from '../store/useUserStore';
import { formatDate } from '../utils/helper';
import { color, space, radius, type, tabularNums, elevation, hitSlop8 } from '../theme/tokens';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ODHPAY_PROJ.com';
const REWARD_AMOUNT = '₹50';

// PII rule: never show a full mobile number — keep the last 4 digits only.
const maskMobile = (mobile) => {
  const digits = String(mobile || '').replace(/\D/g, '');
  return digits.length >= 4 ? `•••••• ${digits.slice(-4)}` : '——';
};

const HOW_IT_WORKS = [
  {
    icon: Share2,
    title: 'Share your code',
    body: 'Send your referral code to friends and family.',
  },
  {
    icon: UserPlus,
    title: 'Friend joins',
    body: 'They sign up with your code on the app.',
  },
  {
    icon: IndianRupee,
    title: `You earn ${REWARD_AMOUNT}`,
    body: 'Cashback when they make their first bank payment.',
  },
];

const ReferralScreen = () => {
  const [referralCode, setReferralCode] = useState('');
  const [referralData, setReferralData] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = useUserStore((s) => s.user);

  useEffect(() => {
    // Fetch user only if missing or stale; avoid forcing on every mount
    const { user: storeUser, updatedAt } = useUserStore.getState();
    const ttlMs = 5 * 60 * 1000;
    if (!storeUser || Date.now() - (updatedAt || 0) > ttlMs) {
      useUserStore.getState().fetchUser().catch(() => {});
    }
  }, []);

  useEffect(() => {
    // accept both shapes coming from API: { user: {...}} or direct payload
    const payload = user?.user ? user.user : user;
    setReferralCode(payload?.member_id || '');
  }, [user]);

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.post(
        'https://newapi.odhpay.com/network/direct_network',
        {},
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200 && Array.isArray(response.data?.data)) {
        setReferralData(response.data.data);
      }
    } catch {
      // keep whatever we had; the list shows its empty message otherwise
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const shareMessage = `Join ${Theme.Text.Company} PAY and earn rewards!\n\nUse my referral code *${referralCode}* when you sign up.\n\nGet the app: ${PLAY_STORE_URL}`;

  const handleWhatsAppShare = () => {
    if (!referralCode) {
      Alert.alert('No referral code', 'Referral code is not available yet.');
      return;
    }
    const url = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) return Linking.openURL(url);
        Alert.alert('WhatsApp not found', 'WhatsApp is not installed on this device.');
      })
      .catch(() => {});
  };

  const handleCopyReferral = async () => {
    if (!referralCode) {
      Alert.alert('No referral code', 'Referral code is not available yet.');
      return;
    }
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('Copied', 'Referral code copied to clipboard');
  };

  const renderReferralItem = ({ item }) => (
    <View style={styles.referralRow}>
      <View style={styles.initialDisc}>
        <Text style={styles.initialText}>
          {(item.name || '?').trim().charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.referralDetails}>
        <Text style={styles.referralName} numberOfLines={1}>
          {item.name || 'Unknown'}
        </Text>
        <Text style={styles.referralMeta}>{maskMobile(item.mobile)}</Text>
      </View>
      <Text style={styles.referralDate}>
        {item.joiningDate ? formatDate(item.joiningDate) : ''}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetchReferrals}
          tintColor={color.ink900}
          colors={[color.ink900]}
        />
      }
    >
      {/* Reward hero */}
      <View style={styles.card}>
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Refer & Earn</Text>
          <View style={styles.rewardPill}>
            <Text style={styles.rewardPillText}>{REWARD_AMOUNT}</Text>
          </View>
        </View>
        <Text style={styles.heroBody}>
          Earn {REWARD_AMOUNT} cashback every time a friend makes their first
          payment from a bank account on {Theme.Text.Company} PAY.
        </Text>

        {/* Code + actions */}
        <View style={styles.codeRow}>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Your referral code</Text>
            <Text style={styles.codeValue} selectable>
              {referralCode || '——'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleCopyReferral}
            hitSlop={hitSlop8}
            accessibilityRole="button"
            accessibilityLabel="Copy referral code"
          >
            <Copy size={18} color={color.textInverse} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleWhatsAppShare}
            hitSlop={hitSlop8}
            accessibilityRole="button"
            accessibilityLabel="Share referral code"
          >
            <Share2 size={18} color={color.textInverse} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>How it works</Text>
        {HOW_IT_WORKS.map((step, i) => (
          <View
            key={step.title}
            style={[styles.stepRow, i < HOW_IT_WORKS.length - 1 && styles.stepRowDivider]}
          >
            <View style={styles.stepDisc}>
              <step.icon size={18} color={color.text} strokeWidth={2} />
            </View>
            <View style={styles.stepTextWrap}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Primary CTA */}
      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={handleWhatsAppShare}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Refer via WhatsApp"
      >
        <MessageCircle size={18} color={color.textInverse} strokeWidth={2} />
        <Text style={styles.primaryBtnText}>Refer via WhatsApp</Text>
      </TouchableOpacity>

      {/* Referral list */}
      <View style={styles.card}>
        <View style={styles.listHeaderRow}>
          <View style={styles.listTitleWrap}>
            <Users size={16} color={color.textSecondary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Your referrals</Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{referralData.length}</Text>
          </View>
        </View>
        <FlatList
          data={referralData}
          renderItem={renderReferralItem}
          keyExtractor={(item, index) =>
            item.mobile ? String(item.mobile) : index.toString()
          }
          scrollEnabled={false}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyListText}>
                No referrals yet — share your code to start earning.
              </Text>
            ) : null
          }
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.background,
  },
  scrollContent: {
    padding: space.lg,
    paddingBottom: space.xxl,
  },

  card: {
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
    padding: space.lg,
    marginBottom: space.base,
    ...elevation.level1,
  },

  // Hero
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    ...type.h2,
    color: color.text,
  },
  rewardPill: {
    backgroundColor: color.successBg,
    borderRadius: radius.pill,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  rewardPillText: {
    ...type.label,
    ...tabularNums,
    color: color.successFg,
  },
  heroBody: {
    ...type.bodySm,
    color: color.textSecondary,
    marginTop: space.sm,
    marginBottom: space.base,
  },

  // Code row
  codeRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  codeBox: {
    flex: 1,
    backgroundColor: color.surfaceMuted,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    marginRight: space.sm,
    justifyContent: 'center',
  },
  codeLabel: {
    ...type.caption,
    color: color.textSecondary,
  },
  codeValue: {
    ...type.h3,
    ...tabularNums,
    color: color.text,
    letterSpacing: 1,
  },
  iconBtn: {
    width: 48,
    borderRadius: radius.md,
    backgroundColor: color.ink900,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: space.xs,
  },

  // How it works
  sectionTitle: {
    ...type.h3,
    color: color.text,
    marginBottom: space.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
  },
  stepRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.divider,
  },
  stepDisc: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: color.gray150,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    ...type.label,
    color: color.text,
  },
  stepBody: {
    ...type.bodySm,
    color: color.textSecondary,
    marginTop: space.xxs,
  },

  // Primary CTA
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    backgroundColor: color.ink900,
    borderRadius: radius.md,
    marginBottom: space.base,
  },
  primaryBtnText: {
    ...type.button,
    color: color.textInverse,
    marginLeft: space.sm,
  },

  // Referral list
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  listTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  countPill: {
    minWidth: 28,
    alignItems: 'center',
    backgroundColor: color.gray150,
    borderRadius: radius.pill,
    paddingVertical: space.xxs,
    paddingHorizontal: space.sm,
  },
  countPillText: {
    ...type.label,
    ...tabularNums,
    color: color.text,
  },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.divider,
  },
  initialDisc: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: color.gray150,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  initialText: {
    ...type.label,
    color: color.text,
  },
  referralDetails: {
    flex: 1,
  },
  referralName: {
    ...type.label,
    color: color.text,
  },
  referralMeta: {
    ...type.caption,
    ...tabularNums,
    color: color.textSecondary,
    marginTop: space.xxs,
  },
  referralDate: {
    ...type.caption,
    ...tabularNums,
    color: color.textTertiary,
    marginLeft: space.sm,
  },
  emptyListText: {
    ...type.bodySm,
    color: color.textSecondary,
    paddingVertical: space.md,
  },
});

export default ReferralScreen;
