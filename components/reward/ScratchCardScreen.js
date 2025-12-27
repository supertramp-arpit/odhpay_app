import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Portal, PaperProvider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import ScratchReward from '../reward/ScratchReward';
import Theme from '../Theme';
import { useAppStore } from '../../store/useAppStore';
import { formatDate } from '../../utils/helper';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.max((width - 48) / 2, 155);
const CARD_HEIGHT = Math.max(Math.round(CARD_WIDTH * 1.25), 200);

const ScratchCardScreen = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedScratchCard, setSelectedScratchCard] = useState(null);
  const { scratchCards, setScratchCards } = useAppStore();

  const containerStyle = useMemo(
    () => ({
      alignSelf: 'center',
      width: Math.min(width - 40, 340),
      height: Math.min(height * 0.7, 520),
      borderRadius: 28,
      backgroundColor: 'transparent',
      overflow: 'hidden',
    }),
    []
  );

  const handleScratchCard = (item) => {
    if (!item?.IsRedeemable || item?.IsScratched) return;
    setSelectedScratchCard(item);
    setVisible(true);
  };

  const fetchScratchCards = async () => {
    try {
      setLoading(true);
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
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      };
      const response = await axios.get(
        `https://newapi.odhpay.com/referral/lcrmoneydetail?userid=${memberId}`,
        { headers }
      );

      if (response.status === 200 && Array.isArray(response.data.data)) {
        const cards = response.data.data.map((item, index) => ({
          id: item.id || index,
          amount: item.amount || item.value || 0,
          receivedDate: item.date || item.receivedDate || item.created_at,
          IsScratched: item.status === 1 || item.is_scratched === 1 || item.IsScratched,
          IsRedeemable: (item.amount || item.value || 0) > 0,
        }));
        setScratchCards(cards);
      }
    } catch (error) {
      console.error('Error fetching scratch cards', error?.response || error?.message || error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScratchCards();
  }, []);

  const renderCard = ({ item, index }) => {
    const isRedeemable = item?.IsRedeemable !== false;
    const isScratched = !!item?.IsScratched;
    const amount = item?.amount ?? 0;
    const rewardText = `₹${amount}`;
    const dateText = item?.receivedDate ? formatDate(item.receivedDate) : '';

    return (
      <TouchableOpacity
        activeOpacity={isRedeemable && !isScratched ? 0.85 : 1}
        style={[styles.cardContainer, !isRedeemable && styles.cardDisabled]}
        onPress={() => handleScratchCard(item)}
        accessibilityRole="button"
        accessibilityLabel={`Scratch card ${index + 1}. ${isScratched ? 'Already opened' : 'Tap to open'}`}
      >
        {isScratched ? (
          // Revealed Card Design
          <LinearGradient
            colors={['#1a1f35', '#0d1321']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.revealedCard}
          >
            {/* Decorative Elements */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            
            {/* Status Badge */}
            <View style={styles.cardTopRow}>
              <View style={styles.revealedBadge}>
                <MaterialIcons name="check-circle" size={12} color="#10b981" />
                <Text style={styles.revealedBadgeText}>Claimed</Text>
              </View>
            </View>

            {/* Reward Display */}
            <View style={styles.rewardSection}>
              <View style={styles.coinIconContainer}>
                <LinearGradient
                  colors={['#fbbf24', '#f59e0b']}
                  style={styles.coinIcon}
                >
                  <Text style={styles.coinSymbol}>₹</Text>
                </LinearGradient>
              </View>
              <Text style={styles.rewardAmount}>{rewardText}</Text>
              <Text style={styles.rewardLabel}>Added to Wallet</Text>
            </View>

            {/* Date Footer */}
            <View style={styles.cardFooter}>
              <MaterialIcons name="access-time" size={12} color="#64748b" />
              <Text style={styles.dateText}>{dateText || 'Recently'}</Text>
            </View>
          </LinearGradient>
        ) : (
          // Unscratched Card Design
          <View style={styles.unscratchedCard}>
            <LinearGradient
              colors={['#6366f1', '#8b5cf6', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.unscratchedGradient}
            >
              {/* Shine Effect */}
              <View style={styles.shineEffect} />
              
              {/* Scratch Pattern */}
              <View style={styles.scratchPatternContainer}>
                <View style={styles.scratchPattern}>
                  {[...Array(6)].map((_, i) => (
                    <View key={i} style={styles.scratchLine} />
                  ))}
                </View>
              </View>

              {/* Center Content */}
              <View style={styles.unscratchedContent}>
                <View style={styles.giftIconContainer}>
                  <MaterialIcons name="card-giftcard" size={36} color="#fff" />
                </View>
                <Text style={styles.scratchTitle}>Mystery Reward</Text>
                <Text style={styles.scratchSubtitle}>Scratch to reveal</Text>
              </View>

              {/* Bottom Action */}
              <View style={styles.scratchAction}>
                <View style={styles.scratchButton}>
                  <MaterialIcons name="touch-app" size={16} color="#8b5cf6" />
                  <Text style={styles.scratchButtonText}>Tap to Scratch</Text>
                </View>
              </View>

              {/* Lock Overlay */}
              {!isRedeemable && (
                <View style={styles.lockOverlay}>
                  <View style={styles.lockIconBox}>
                    <MaterialIcons name="lock" size={24} color="#fff" />
                  </View>
                  <Text style={styles.lockMessage}>Complete a transaction to unlock</Text>
                </View>
              )}
            </LinearGradient>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => setVisible(false)}
            contentContainerStyle={containerStyle}
            theme={{ colors: { backdrop: 'rgba(0,0,0,0.85)' } }}
          >
            {selectedScratchCard && (
              <ScratchReward 
                item={selectedScratchCard} 
                onClose={() => setVisible(false)} 
              />
            )}
          </Modal>
        </Portal>

   
        {loading ? (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={styles.loadingText}>Loading rewards...</Text>
            </View>
          </View>
        ) : scratchCards?.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBox}>
              <MaterialIcons name="card-giftcard" size={48} color="#6366f1" />
            </View>
            <Text style={styles.emptyTitle}>No scratch cards yet</Text>
            <Text style={styles.emptySubtitle}>
              Invite friends using your referral code to earn exciting scratch card rewards!
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => {}} activeOpacity={0.8}>
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtnGradient}
              >
                <MaterialIcons name="share" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Share Referral Code</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={scratchCards}
            keyExtractor={(item, index) => (item?.id ? String(item.id) : `scratch-${index}`)}
            numColumns={2}
            renderItem={renderCard}
            contentContainerStyle={styles.flatListContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchScratchCards();
            }}
          />
        )}
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e1a',
  },
  
  // Hero Header
  heroGradient: {
    paddingBottom: 16,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroTextBlock: {
    flex: 1,
  },
  heroTitle: {
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 14,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(165, 180, 252, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
  },
  
  // FlatList
  flatListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  
  // Card Container
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardDisabled: {
    opacity: 0.5,
  },
  
  // Revealed Card
  revealedCard: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    borderRadius: 20,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  revealedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  revealedBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  rewardSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  coinIconContainer: {
    marginBottom: 8,
  },
  coinIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinSymbol: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  rewardAmount: {
    color: '#f1f5f9',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rewardLabel: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
    marginLeft: 4,
  },
  
  // Unscratched Card
  unscratchedCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  unscratchedGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  shineEffect: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scratchPatternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
  },
  scratchPattern: {
    width: '100%',
    height: '100%',
  },
  scratchLine: {
    height: 2,
    backgroundColor: '#fff',
    marginVertical: 12,
    borderRadius: 1,
  },
  unscratchedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giftIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scratchTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  scratchSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  scratchAction: {
    alignItems: 'center',
  },
  scratchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  scratchButtonText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  lockMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  
  // Loading
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    maxWidth: 280,
  },
  primaryBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
});

export default ScratchCardScreen;
