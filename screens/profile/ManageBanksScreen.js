import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleAlert, Landmark, Plus, Trash2 } from 'lucide-react-native';
import { color, space, radius, type, tabularNums, elevation, hitSlop8 } from '../../theme/tokens';
import { useBankStore, apiErrorMessage } from '../../store/useBankStore';
import WalletGate from '../../components/Wallet/WalletGate';

// Saved accounts for wallet withdrawals (real data: /api/v1/wallet/banks).
function ManageBanks() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { banks, maxAccounts, isLoading, loaded, error, fetchBanks, removeBank } = useBankStore();
  const [removingId, setRemovingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchBanks();
    }, [fetchBanks])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBanks();
    setRefreshing(false);
  }, [fetchBanks]);

  const confirmRemove = (bank) => {
    Alert.alert('Remove bank account?', `${bank.bankName} ${bank.accountNumber} will be removed from ODH Pay.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingId(bank.id);
          try {
            await removeBank(bank.id);
          } catch (e) {
            Alert.alert("Couldn't remove account", apiErrorMessage(e));
          } finally {
            setRemovingId(null);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item: bank }) => (
    <View style={styles.card}>
      <View style={styles.bankIcon}>
        <Landmark size={18} color={color.text} strokeWidth={1.8} />
      </View>
      <View style={styles.flex1}>
        <Text style={styles.bankName} numberOfLines={1}>{bank.bankName}</Text>
        <Text style={styles.meta} numberOfLines={1}>{bank.accountHolderName}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {bank.accountNumber} · {bank.ifscCode}
        </Text>
      </View>
      {removingId === bank.id ? (
        <ActivityIndicator color={color.textSecondary} />
      ) : (
        <TouchableOpacity
          onPress={() => confirmRemove(bank)}
          hitSlop={hitSlop8}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${bank.bankName} account ending ${String(bank.accountNumber).slice(-4)}`}
        >
          <Trash2 size={18} color={color.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
      )}
    </View>
  );

  const ListEmpty = () => {
    if (!loaded || isLoading) {
      return (
        <>
          <View style={styles.skel} />
          <View style={styles.skel} />
        </>
      );
    }
    if (error) {
      return (
        <View style={styles.errorBox}>
          <CircleAlert size={16} color={color.errorFg} strokeWidth={1.8} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchBanks} hitSlop={hitSlop8} accessibilityRole="button">
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <View style={styles.bankIcon}>
          <Landmark size={18} color={color.text} strokeWidth={1.8} />
        </View>
        <Text style={styles.emptyTitle}>No bank accounts yet</Text>
        <Text style={styles.emptyBody}>Add an account in your name to withdraw from your wallet.</Text>
      </View>
    );
  };

  const atLimit = banks.length >= maxAccounts;

  return (
    <View style={styles.container}>
      <FlatList
        data={banks}
        keyExtractor={(b) => String(b.id)}
        renderItem={renderItem}
        ListHeaderComponent={
          <Text style={styles.caption}>Wallet withdrawals are paid to these accounts.</Text>
        }
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.text} />}
      />
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.base) }]}>
        {atLimit ? (
          <Text style={styles.limitText}>
            You can save up to {maxAccounts} accounts. Remove one to add another.
          </Text>
        ) : null}
        <TouchableOpacity
          style={[styles.primaryBtn, atLimit && styles.btnDisabled]}
          disabled={atLimit}
          onPress={() => navigation.navigate('NewBank')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add bank account"
        >
          <Plus size={18} color={color.textInverse} strokeWidth={2} />
          <Text style={styles.primaryBtnText}>Add bank account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ManageBanksScreen() {
  return (
    <WalletGate>
      <ManageBanks />
    </WalletGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  list: { padding: space.base, paddingBottom: space.xxl },
  flex1: { flex: 1 },
  caption: { ...type.bodySm, color: color.textSecondary, marginBottom: space.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: color.border,
    padding: space.base,
    marginBottom: space.md,
    ...elevation.level1,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: color.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankName: { ...type.label, color: color.text },
  meta: { ...type.caption, ...tabularNums, color: color.textSecondary, marginTop: 2 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  skel: { height: 76, borderRadius: radius.lg, backgroundColor: color.surfaceSunken, marginBottom: space.md },
  empty: { alignItems: 'center', paddingVertical: space.xxl, gap: space.sm },
  emptyTitle: { ...type.label, color: color.text },
  emptyBody: { ...type.bodySm, color: color.textSecondary, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: color.errorBg,
    borderRadius: radius.md,
    padding: space.md,
  },
  errorText: { ...type.bodySm, color: color.errorFg, flex: 1 },
  retry: { ...type.buttonSm, color: color.errorFg },
  footer: {
    paddingHorizontal: space.base,
    paddingTop: space.md,
    backgroundColor: color.surface,
    borderTopWidth: 1,
    borderTopColor: color.border,
  },
  limitText: { ...type.caption, color: color.textSecondary, textAlign: 'center', marginBottom: space.sm },
  primaryBtn: {
    flexDirection: 'row',
    gap: space.sm,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: color.ink900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  primaryBtnText: { ...type.button, color: color.textInverse },
});
