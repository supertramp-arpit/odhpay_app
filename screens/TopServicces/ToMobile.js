import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ToMobile = () => {
  const navigation = useNavigation();
  const [recipientNumber, setRecipientNumber] = useState('');
  const [showSearchResult, setShowSearchResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(null);
  const [error, setError] = useState('');

  // Contact picker states
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [recentContacts, setRecentContacts] = useState([]);

  useEffect(() => {
    loadRecentContacts();
    loadContacts();
  }, []);

  const loadRecentContacts = async () => {
    try {
      const saved = await AsyncStorage.getItem('recent_transfer_contacts');
      if (saved) setRecentContacts(JSON.parse(saved));
    } catch (err) {
      console.log('Error loading recent contacts:', err);
    }
  };

  const loadContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.Image],
        });

        const contactsWithPhone = data
          .filter(contact => contact.phoneNumbers?.length > 0)
          .map(contact => ({
            id: contact.id,
            name: contact.name || 'Unknown',
            phone: contact.phoneNumbers[0].number.replace(/[^0-9]/g, '').slice(-10),
            fullPhone: contact.phoneNumbers[0].number,
            image: contact.image?.uri || null,
          }))
          .filter(contact => contact.phone.length === 10);

        setContacts(contactsWithPhone);
        setFilteredContacts(contactsWithPhone);
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const saveRecentContact = async (contact) => {
    try {
      const updated = [contact, ...recentContacts.filter(c => c.phone !== contact.phone)].slice(0, 5);
      setRecentContacts(updated);
      await AsyncStorage.setItem('recent_transfer_contacts', JSON.stringify(updated));
    } catch (err) {
      console.log('Error saving recent contact:', err);
    }
  };

  const handleContactSearch = (query) => {
    setContactSearchQuery(query);
    if (query.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      setFilteredContacts(contacts.filter(contact =>
        contact.name.toLowerCase().includes(query.toLowerCase()) ||
        contact.phone.includes(query)
      ));
    }
  };

  const selectContact = (contact) => {
    setRecipientNumber(contact.phone);
    setContactSearchQuery('');
    fetchMobileNumber(contact.phone);
    saveRecentContact(contact);
  };

  const fetchMobileNumber = async (mobileNumber) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("access_token");

      if (!token) {
        setError('Authentication error. Please login again.');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `https://newapi.odhpay.com/misc/check_mobile_number_peer?mobile=${mobileNumber}`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          }
        }
      );

      console.log("API Response:", response.data);

      // if (response.status === 200 && response.data) {
      //   setName(response.data.data ? response.data.data[0] : "New User");
      //   setShowSearchResult(true);
      // }

      setName("Test User");
      setShowSearchResult(true);

      navigation.navigate('ChatScreen', {
        recipientNumber,
        recipientName: name || 'New Contact'
      });
    } catch (err) {
      console.error("Error fetching data:", err.message);
      setError('Failed to verify number. Please try again.');
      setName(null);
      setShowSearchResult(false);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    return colors[name ? name.charCodeAt(0) % colors.length : 0];
  };

  const renderContactItem = ({ item }) => (
    <TouchableOpacity style={styles.contactItem} onPress={() => selectContact(item)} activeOpacity={0.7}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.contactAvatar} />
      ) : (
        <View style={[styles.contactAvatar, { backgroundColor: getAvatarColor(item.name) }]}>
          <Text style={styles.contactInitials}>{getInitials(item.name)}</Text>
        </View>
      )}
      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.fullPhone}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container} >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or number"
          placeholderTextColor="#999"
          value={contactSearchQuery}
          onChangeText={handleContactSearch}
        />
        {contactSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleContactSearch('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Contact Count */}
      <Text style={styles.contactCount}>
        {filteredContacts.length} contacts with phone numbers
      </Text>

      {/* Contact List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contactList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>No contacts found</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  contactCount: {
    fontSize: 13,
    color: '#999',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  contactList: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});

export default ToMobile;