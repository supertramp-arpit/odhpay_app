import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
  Animated,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import useUserStore from '../../store/useUserStore';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Theme from '../Theme';
import { 
  getFcmToken, 
  registerTokenWithBackend, 
  unregisterTokenWithBackend,
  getNotificationStatus 
} from '../../hooks/notification/registerToken';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallDevice = SCREEN_WIDTH < 375;

const SettingScreen = () => {
  const navigation = useNavigation();
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(false);
  const [fingerPrintStatus, setFingerPrintStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Notification state
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const user = useUserStore(s => s.user);
  const payload = user?.user ? user.user : user;
  
  // Start entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Fetch notification status on mount
  const handleGetNotificationStatus = async () => {
    try {
      const status = await getNotificationStatus();
      setIsNotificationEnabled(status);
    } catch (error) {
      console.error('Error fetching notification status:', error);
      setIsNotificationEnabled(true); // Default to enabled
    }
  };

  // Toggle notification registration
  const toggleNotification = async (value) => {
    try {
      setIsNotificationLoading(true);
      
      if (value) {
        // Register for notifications
        const token = await getFcmToken();
        if (!token) {
          Alert.alert(
            'Permission Required',
            'Please enable notification permissions in your device settings to receive notifications.',
            [{ text: 'OK' }]
          );
          setIsNotificationLoading(false);
          return;
        }
        
        const result = await registerTokenWithBackend(token);
        if (result.success) {
          setIsNotificationEnabled(true);
          Alert.alert('Success', 'Notifications enabled successfully!');
        } else {
          Alert.alert('Error', 'Failed to enable notifications. Please try again.');
        }
      } else {
        // Unregister from notifications
        Alert.alert(
          'Disable Notifications',
          'Are you sure you want to disable push notifications? You will no longer receive updates about transactions and offers.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Disable',
              style: 'destructive',
              onPress: async () => {
                const result = await unregisterTokenWithBackend();
                if (result.success) {
                  setIsNotificationEnabled(false);
                } else {
                  Alert.alert('Error', 'Failed to disable notifications. Please try again.');
                  setIsNotificationEnabled(true);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsNotificationEnabled(!value);
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const handleGetFingerPrintStatus = async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const response = await axios.get(
        'https://newapi.odhpay.com/misc/get_fingerprint_status',
        { headers }
      );

      const serverStatus = response.data.fingerprint_status === 1;
      setFingerPrintStatus(response.data.fingerprint_status);
      setIsFingerprintEnabled(serverStatus);
      await AsyncStorage.setItem('fingerPrintStatus', JSON.stringify(response.data.fingerprint_status));
    } catch (error) {
      setError('Failed to fetch fingerprint status');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFingerprint = async (value) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      };

      const newStatus = value ? 1 : 2;

      const response = await axios.post(
        'https://newapi.odhpay.com/misc/set_fingerprint_status',
        { "type": newStatus },
        { headers }
      );

      if (response.status === 200) {
        setFingerPrintStatus(newStatus);
        setIsFingerprintEnabled(newStatus === 1);
        await AsyncStorage.setItem('fingerPrintStatus', JSON.stringify(newStatus));
      }
    } catch (error) {
      setError('Failed to update fingerprint settings');
      console.error('Error:', error);
      setIsFingerprintEnabled(!value);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetFingerPrintStatus();
    handleGetNotificationStatus();
  }, []);

  // Animated Setting Item Component
  const SettingItem = ({ iconName, iconFamily, title, description, onPress, showToggle, isToggled, disabled, iconBgColor, delay = 0 }) => {
    const itemFade = useRef(new Animated.Value(0)).current;
    const itemSlide = useRef(new Animated.Value(20)).current;
    const pressAnim = useRef(new Animated.Value(1)).current;
    
    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemFade, {
          toValue: 1,
          duration: 300,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(itemSlide, {
          toValue: 0,
          duration: 300,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const handlePressIn = () => {
      Animated.spring(pressAnim, {
        toValue: 0.97,
        friction: 8,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(pressAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }).start();
    };

    const IconComponent = iconFamily === 'Feather' ? Feather : 
                          iconFamily === 'Ionicons' ? Ionicons : MaterialIcons;

    return (
      <Animated.View
        style={{
          opacity: itemFade,
          transform: [
            { translateX: itemSlide },
            { scale: pressAnim }
          ],
        }}
      >
        <TouchableOpacity
          style={[styles.settingItem, disabled && styles.settingItemDisabled]}
          onPress={showToggle ? undefined : onPress}
          onPressIn={!showToggle ? handlePressIn : undefined}
          onPressOut={!showToggle ? handlePressOut : undefined}
          disabled={disabled || isLoading || showToggle}
          activeOpacity={0.9}
        >
          <View style={styles.settingItemLeft}>
            <LinearGradient
              colors={iconBgColor || ['#F0F0F0', '#E8E8E8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <IconComponent 
                name={iconName} 
                size={20} 
                color={iconBgColor ? '#FFFFFF' : Theme.colors.primary} 
              />
            </LinearGradient>
            <View style={styles.textContainer}>
              <Text style={styles.settingItemText}>{title}</Text>
              {description && (
                <Text style={styles.settingItemSub}>{description}</Text>
              )}
            </View>
          </View>
          {showToggle ? (
            <View style={styles.switchContainer}>
              <Switch
                value={isToggled}
                onValueChange={onPress}
                disabled={disabled || isLoading}
                trackColor={{ false: '#E5E7EB', true: '#34C759' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
                style={styles.switch}
              />
            </View>
          ) : (
            <View style={styles.chevronContainer}>
              <Feather name="chevron-right" size={20} color="#C7C7CC" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Section Header Component
  const SectionHeader = ({ icon, title, subtitle }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  if (isLoading && !error) {
    return (
      <SafeAreaView style={styles.loadingContainer} >
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
          <Text style={styles.loadingText}>Loading your settings...</Text>
          <Text style={styles.loadingSubText}>Please wait a moment</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor={Theme.colors.background} />
      <Animated.ScrollView 
        style={[styles.scrollView, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }]} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
      
        {/* Error Message */}
        {error && (
          <Animated.View style={[styles.errorContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.errorIconContainer}>
              <Feather name="alert-circle" size={20} color="#DC2626" />
            </View>
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Something went wrong</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleGetFingerPrintStatus}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <SettingItem
              iconName="lock"
              iconFamily="Feather"
              iconBgColor={['#4F46E5', '#6366F1']}
              title={payload?.TransactionPIN ? "Update Transaction PIN" : "Set Transaction PIN"}
              description={payload?.TransactionPIN ? "Change your secure PIN" : "Add an extra layer of security"}
              onPress={() => navigation.navigate(payload?.TransactionPIN ? "SetTransctionpin" : "TransactionPin")}
              delay={100}
            />
            {Platform.OS !== 'web' && (
              <SettingItem
                iconName="finger-print"
                iconFamily="Ionicons"
                iconBgColor={['#059669', '#10B981']}
                title="Biometric Login"
                description={isFingerprintEnabled ? "Enabled for quick access" : "Use fingerprint or face ID"}
                showToggle
                isToggled={isFingerprintEnabled}
                onPress={toggleFingerprint}
                disabled={isLoading}
                delay={150}
              />
            )}
            
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <SectionHeader 
            title="Preferences" 
            subtitle="Customize your experience"
          />
          <View style={styles.sectionCard}>
            <SettingItem
              iconName="bell"
              iconFamily="Feather"
              iconBgColor={['#F59E0B', '#FBBF24']}
              title="Push Notifications"
              description={isNotificationEnabled ? "Receiving alerts & updates" : "Notifications disabled"}
              showToggle
              isToggled={isNotificationEnabled}
              onPress={toggleNotification}
              disabled={isNotificationLoading}
              delay={250}
            />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <SectionHeader 
            title="Help & Support" 
            subtitle="Get assistance when needed"
          />
          <View style={styles.sectionCard}>
            <SettingItem
              iconName="help-circle"
              iconFamily="Feather"
              iconBgColor={['#0EA5E9', '#38BDF8']}
              title="Help Center"
              description="FAQs & troubleshooting"
              onPress={() => {}}
              delay={400}
            />
            <SettingItem
              iconName="message-circle"
              iconFamily="Feather"
              iconBgColor={['#14B8A6', '#2DD4BF']}
              title="Contact Support"
              description="Chat with our team"
              onPress={() => navigation.navigate('ChatScreen')}
              delay={450}
            />
            <SettingItem
              iconName="star"
              iconFamily="Feather"
              iconBgColor={['#F97316', '#FB923C']}
              title="Rate Us"
              description="Share your feedback"
              onPress={() => {}}
              delay={500}
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <SectionHeader 
            title="Legal" 
            subtitle="Terms and policies"
          />
          <View style={styles.sectionCard}>
            <SettingItem
              iconName="file-text"
              iconFamily="Feather"
              iconBgColor={['#6B7280', '#9CA3AF']}
              title="Privacy Policy"
              description="How we handle your data"
              onPress={() => {}}
              delay={550}
            />
            <SettingItem
              iconName="book-open"
              iconFamily="Feather"
              iconBgColor={['#6B7280', '#9CA3AF']}
              title="Terms of Service"
              description="Rules and guidelines"
              onPress={() => {}}
              delay={600}
            />
          </View>
        </View>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <View style={styles.appInfo}>
            <Text style={styles.appName}>ODH Pay</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
          <Text style={styles.copyright}>© 2025 ODH Pay. All rights reserved.</Text>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  loadingSubText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  
  // Profile Card
  profileCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  profileGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#2D2D2D',
  },
  profileTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  profileArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Error Container
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
  },
  retryButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section Styles
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  sectionCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  // Setting Item Styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#FFFFFF',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  settingItemText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  settingItemSub: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
    lineHeight: 17,
  },
  switchContainer: {
    marginLeft: 8,
  },
  switch: {
    transform: Platform.OS === 'ios' ? [{ scaleX: 0.9 }, { scaleY: 0.9 }] : [],
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Footer Styles
  footer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  copyright: {
    fontSize: 12,
    color: '#AEAEB2',
  },
});

export default SettingScreen;
