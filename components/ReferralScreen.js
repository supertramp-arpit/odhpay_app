import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Theme from './Theme';
import * as Clipboard from 'expo-clipboard';
import { useNavigation } from '@react-navigation/native';
import useUserStore from '../store/useUserStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { formatDate } from '../utils/helper';

const ReferralScreen = () => {

  const [referralCode, setReferralCode] = useState('');
  const [isPrime, setIsPrime] = useState(false);
  const [totalReferrals, setTotalReferrals] = useState(0);
  // const [isRefreshing, setIsRefreshing] = useState(false);


  const user = useUserStore((s) => s.user);
  const navigation = useNavigation();

  useEffect(() => {
    // Fetch user only if missing or stale; avoid forcing on every mount
    const { user: storeUser, updatedAt } = useUserStore.getState();
    const ttlMs = 5 * 60 * 1000;
    if (!storeUser || Date.now() - (updatedAt || 0) > ttlMs) {
      useUserStore.getState().fetchUser().catch((e) => console.log('fetchUser error', e));
    }
  }, []);

  useEffect(() => {
    // accept both shapes coming from API: { user: {...}} or direct payload
    const payload = user?.user ? user.user : user;
    console.log(`Referral page user info ->`, payload);
    setReferralCode(payload?.member_id || '');
    setIsPrime(Boolean(payload?.prime_status));
  }, [user]);


  // const referralData = [
  //   {
  //     name: 'MITHLESH KUMAR',
  //     phone: '90XXXXXX33',
  //     registrationDate: '20-03-2022',
  //   },
  //   {
  //     name: 'TEST',
  //     phone: '98XXXXXX61',
  //     registrationDate: '25-03-2022',
  //   },
  //   {
  //     name: 'PAWNESH MISHRA',
  //     phone: '89XXXXXX63',
  //     registrationDate: '03-08-2022',
  //   },
  // ];



  const [referralData, setResult] = useState([]);
  const [loading, setLoading] = useState(false)

  const ReferalData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');
      console.log(token)

      const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`, // Ensure correct format
      };

      const response = await axios.post(
        `https://newapi.odhpay.com/network/direct_network`,
        {},  // Empty body, since it's a POST request
        { headers } // Pass headers correctly inside an object
      );

      console.log(`---------------------->`, response.data.data[0])


      if (response.status === 200) {
        if (response.data && Array.isArray(response.data.data)) {
          setResult(response.data.data);
          setTotalReferrals(response.data.data.length);
        }
      }
      else {
        // keep screen; show empty state
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error fetching data:", error);
    }
  };

  useEffect(() => {
    ReferalData();
  }, [])


  const handleWhatsAppShare = () => {
    if (!isPrime) {
      Alert.alert('Not Eligible', 'Only Prime users can share referral codes.');
      return;
    }
    if (!referralCode) {
      Alert.alert('No referral code', 'Referral code is not available yet.');
      return;
    }
    const message = `Join ${Theme.Text.Company}  PAY and earn rewards! 🚀\n\nUse my referral code: *${referralCode}* to sign up and get started. 🎉\n\nDownload now: https://odhpay.com/assets/odhpay.apk`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          alert('WhatsApp is not installed on your device.');
        }
      })
        .catch((err) => console.error('An error occurred', err));
  };

    const handleCopyReferral = async () => {
      if (!referralCode) {
        Alert.alert('No referral code', 'Referral code is not available');
        return;
      }
      await Clipboard.setStringAsync(referralCode);
      Alert.alert('Copied', 'Referral code copied to clipboard');
    };

  const renderReferralItem = ({ item }) => (
    <View style={styles.referralItem}>
      <View style={styles.referralImageContainer}>
        <Image source={require('../assets/men1.jpg')} style={styles.referralImage2} />
      </View>
      <View style={styles.referralDetails}>
        <Text style={styles.referralName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.referralPhone}>{String(item.mobile || '').replace(/(\d{2})(\d{4})(\d{4})/, 'XX-XXXX-$3')}</Text>
        <Text style={styles.referralDate}>Registration Date: {formatDate(item.joiningDate)}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerText}>Refer & Earn</Text>
            <View style={styles.rewardBadge}><Text style={styles.rewardText}>₹50</Text></View>
          </View>
          <Text style={styles.headerSubtext}>
            Earn ₹50 cashback every time a friend makes their 1st payment from Bank A/c on {Theme.Text.Company} PAY.
          </Text>
          <View style={styles.codeRow}>
            <View style={styles.referralCodeCard}>
              <Text style={styles.referralCodeLabel}>Your Code</Text>
              <Text style={styles.referralCode}>{referralCode || '—'}</Text>
            </View>
            <TouchableOpacity style={[styles.copyButton, { opacity: isPrime ? 1 : 0.5 }]} onPress={handleCopyReferral} disabled={!isPrime}>
              <MaterialIcons name="content-copy" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareButton, { opacity: isPrime ? 1 : 0.5 }]} onPress={handleWhatsAppShare} disabled={!isPrime}>
              <MaterialIcons name="share" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

        </View>

        <View style={styles.imageContainer}>
          <Image source={require('../assets/ReferAndEarn.png')} style={styles.referralImage} />
        </View>

        <TouchableOpacity style={[styles.whatsappButton, { opacity: !isPrime ? 0.5 : 1, }]} onPress={handleWhatsAppShare} disabled={!isPrime}>
          <MaterialIcons name="offline-share" size={24} color="white" />
          <Text style={styles.whatsappButtonText}>Refer via WhatsApp</Text>
        </TouchableOpacity>

        <View style={styles.referralListContainer}>
          <Text style={styles.totalReferrals}>Total referrals: {totalReferrals}</Text>
          <Text style={styles.listTitle}>Referral List</Text>
          <FlatList
            data={referralData}
            renderItem={renderReferralItem}
            keyExtractor={(item, index) => item.mobile ? String(item.mobile) : index.toString()}
            onRefresh={ReferalData}
            refreshing={loading}
            scrollEnabled={false}
          />
          {loading && <ActivityIndicator style={{ marginTop: 12 }} size="small" color={Theme.colors.primary} />}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referralCodeLabel: {
    fontSize: 14,
  },
  referralCode: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  referralCodeCard: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    flex: 1,
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: Theme.colors.primary,
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  shareButton: {
    backgroundColor: Theme.colors.primary,
    padding: 8,
    borderRadius: 8,
  },
  totalReferrals: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  referralImage: {
    width: '90%',
    height: 250,
    resizeMode: 'contain',
    borderRadius: 10,
    marginTop: -45,
    marginBottom: -20
  },
  whatsappButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  whatsappButtonText: {
    color: Theme.colors.secondary,
    marginLeft: 10,
  },
  referralListContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 5,
    backgroundColor: Theme.colors.secondary,
  },
  referralImageContainer: {
    marginRight: 15,

  },
  referralImage2: {
    width: 40,
    height: 40,
    borderRadius: 30,
  },
  referralDetails: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  referralPhone: {
    color: '#666',
    fontSize: 14,
  },
  referralDate: {
    color: '#999',
    fontSize: 12,
  },
});

export default ReferralScreen;