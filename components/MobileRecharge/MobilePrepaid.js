import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";
import {
  View,
  Text,
  TextInput,
  Platform,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  InteractionManager,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Contacts from "expo-contacts";
import { SafeAreaView } from 'react-native-safe-area-context';
import Theme from "../Theme";

const CHUNK = 100;
const INDEX_CHUNK = 800;
const SEARCH_RESULT_CAP = 300;
const DEBOUNCE_MS = 150;

const scheduleIdle = (fn) => {
  if (typeof global.requestIdleCallback === "function") {
    return requestIdleCallback(fn, { timeout: 100 });
  }
  return setTimeout(fn, 0);
};

const digitsOnly = (s = "") => s.replace(/[^\d]/g, "");
const norm = (s = "") => s.toLowerCase().trim();

const getMatchScore = (text, query) => {
  const textLower = norm(text);
  const queryLower = norm(query);
  if (textLower.startsWith(queryLower)) return 100;
  const words = textLower.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    if (words[i].startsWith(queryLower)) return 80 - i;
  }
  if (textLower.includes(queryLower)) return 50;
  return 0;
};

const getAvatarColor = (name) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#9C27B0', '#FF9800', '#009688', '#E91E63'];
  const n = (name || "X").split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return colors[n % colors.length];
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const MobilePrepaid = () => {
  const navigation = useNavigation();

  const [hasPermission, setHasPermission] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [browsingAll, setBrowsingAll] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [visibleContacts, setVisibleContacts] = useState([]);

  const allRef = useRef([]);
  const appendedIndexRef = useRef(0);
  const appendingRef = useRef(false);
  const indexRef = useRef([]);
  const [indexReady, setIndexReady] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const numbersSetRef = useRef(new Set());
  const [unknownProceedDigits, setUnknownProceedDigits] = useState("");
  const mountedRef = useRef(true);
  const searchTimer = useRef(null);

  useEffect(() => () => { mountedRef.current = false; }, []);

  // Permission request
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        setPermissionDenied(status !== 'granted');
      } catch {
        setPermissionDenied(true);
      }
    })();
  }, []);

  const getContactName = (c) =>
    c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Unknown";

  const CACHE_KEY = "CONTACTS_CACHE_V2";

  const minimalize = (c) => ({
    id: c.id,
    _name: c._name || getContactName(c),
    phoneNumbers: (c.phoneNumbers || []).map((n) => ({ number: n.number })),
    imageUri: c.image?.uri || c.imageUri || null,
  });

  const saveCache = async (arr) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(arr.map(minimalize)));
    } catch { }
  };

  const loadCache = async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const startIndexing = useCallback((cleaned) => {
    if (!mountedRef.current) return;
    setIndexing(true);
    setIndexReady(false);
    indexRef.current = [];
    numbersSetRef.current = new Set();

    let i = 0;
    const buildChunk = () => {
      if (!mountedRef.current || i >= cleaned.length) {
        setIndexing(false);
        setIndexReady(true);
        return;
      }
      const end = Math.min(i + INDEX_CHUNK, cleaned.length);
      const slice = cleaned.slice(i, end).map((c, idx) => {
        const numsDigits = (c.phoneNumbers || [])
          .map((n) => digitsOnly(n?.number || "").slice(-10));
        numsDigits.forEach((d) => { if (d.length >= 10) numbersSetRef.current.add(d); });
        return { id: c.id || `${i + idx}`, nameLower: norm(c._name), numsDigits, refIndex: i + idx };
      });
      indexRef.current.push(...slice);
      i = end;
      scheduleIdle(buildChunk);
    };
    scheduleIdle(buildChunk);
  }, []);

  // Load cache on mount
  useEffect(() => {
    (async () => {
      const cached = await loadCache();
      if (cached.length > 0) {
        allRef.current = cached.map((c) => ({ ...c, _name: c._name || getContactName(c) }));
        setBrowsingAll(true);
        appendedIndexRef.current = 0;
        appendNextChunk(true);
        if (indexRef.current.length === 0) startIndexing(allRef.current);
      }
    })();
  }, [startIndexing]);

  // Background fetch from device
  useEffect(() => {
    if (!hasPermission) return;
    (async () => {
      try {
        await new Promise((res) => InteractionManager.runAfterInteractions(res));
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.Image],
        });
        const cleaned = (data || [])
          .filter((c) => c.phoneNumbers?.length > 0)
          .map((c) => ({ ...c, _name: getContactName(c), imageUri: c.image?.uri || null }));
        allRef.current = cleaned;
        saveCache(cleaned);
        startIndexing(cleaned);
        setBrowsingAll(true);
        appendedIndexRef.current = 0;
        appendNextChunk(true);
      } catch { }
    })();
  }, [hasPermission, startIndexing]);

  const runLocalIndexSearch = (q) => {
    const qLower = norm(q);
    const qDigits = digitsOnly(q);
    const results = [];
    const idx = indexRef.current;

    if (qDigits.length >= 3) {
      const normalized = qDigits.slice(-10);
      for (const it of idx) {
        const match = it.numsDigits.find(d => d.includes(normalized));
        if (match) {
          results.push({ ...allRef.current[it.refIndex], _matchScore: qDigits.length === 10 ? 100 : 50 });
        }
      }
    }

    if (qLower.length > 0 && (!/^\d+$/.test(q) || qDigits.length < 3)) {
      for (const it of idx) {
        const score = getMatchScore(it.nameLower, qLower);
        if (score > 0 && !results.find(r => r.id === allRef.current[it.refIndex].id)) {
          results.push({ ...allRef.current[it.refIndex], _matchScore: score });
        }
      }
    }

    results.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0) || (a._name || "").localeCompare(b._name || ""));
    return results.slice(0, SEARCH_RESULT_CAP);
  };

  const last10 = (d = "") => digitsOnly(d).slice(-10);
  const isKnownNumber = (d) => d && numbersSetRef.current.has(last10(d));

  const onChangeSearchText = (text) => {
    setSearchText(text);
    const candidate = last10(text);
    setUnknownProceedDigits(candidate.length === 10 && !isKnownNumber(candidate) ? candidate : "");

    if (!hasPermission) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);

    const q = text.trim();
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        // Always use local index search (expo-contacts doesn't have native search)
        setSearchResults(runLocalIndexSearch(q));
      } catch { }
      finally { setSearchLoading(false); }
    }, DEBOUNCE_MS);
  };

  const appendNextChunk = (immediate = false) => {
    if (appendingRef.current) return;
    const all = allRef.current;
    if (appendedIndexRef.current >= all.length) return;

    const doAppend = () => {
      appendingRef.current = true;
      const start = appendedIndexRef.current;
      const end = Math.min(start + CHUNK, all.length);
      setVisibleContacts((prev) => (start === 0 ? all.slice(0, end) : [...prev, ...all.slice(start, end)]));
      appendedIndexRef.current = end;
      appendingRef.current = false;
    };

    immediate ? doAppend() : scheduleIdle(doAppend);
  };

  useEffect(() => {
    if (hasPermission && !browsingAll) {
      setBrowsingAll(true);
      setBrowseLoading(true);
      appendNextChunk(true);
      setBrowseLoading(false);
    }
  }, [hasPermission]);

  const navigateWithNumber = (name, number) => {
    navigation.navigate("RechargeScreen", { contactName: name, contactNumber: (number || "").replace(/\s+/g, "") });
  };

  const handleContactPress = useCallback((contact) => {
    const num = contact?.phoneNumbers?.[0]?.number;
    if (num) navigateWithNumber(contact._name || "Unknown", num);
  }, []);

  const refreshContacts = useCallback(async () => {
    if (refreshLoading) return;
    setRefreshLoading(true);
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.Image],
      });
      const cleaned = (data || [])
        .filter((c) => c.phoneNumbers?.length > 0)
        .map((c) => ({ ...c, _name: getContactName(c), imageUri: c.image?.uri || null }));
      allRef.current = cleaned;
      saveCache(cleaned);
      startIndexing(cleaned);
      appendedIndexRef.current = 0;
      setVisibleContacts([]);
      appendNextChunk(true);
    } catch { }
    finally { setRefreshLoading(false); }
  }, [refreshLoading, startIndexing]);

  const ContactCard = memo(({ item, onPress }) => {
    const name = item._name || "Unknown";
    const primaryNumber = item?.phoneNumbers?.[0]?.number || "-";
    const imageUri = item.image?.uri || item.imageUri || null;

    return (
      <TouchableOpacity style={styles.contactItem} onPress={() => onPress(item)} activeOpacity={0.7}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(name) }]}>
            <Text style={styles.avatarText}>{getInitials(name)}</Text>
          </View>
        )}
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>{name}</Text>
          <Text style={styles.contactPhone} numberOfLines={1}>{primaryNumber}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </TouchableOpacity>
    );
  });

  const deferredSearch = (React.useDeferredValue || ((v) => v))(searchText);
  const data = useMemo(() => {
    if (deferredSearch.trim()) return searchResults;
    if (browsingAll) return visibleContacts;
    return [];
  }, [deferredSearch, searchResults, browsingAll, visibleContacts]);

  const renderItem = useCallback(({ item }) => <ContactCard item={item} onPress={handleContactPress} />, [handleContactPress]);

  const renderEmpty = () => {
    if (!hasPermission) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name={permissionDenied ? "lock-closed-outline" : "hourglass-outline"} size={48} color="#CCC" />
          <Text style={styles.emptyTitle}>{permissionDenied ? "Permission Denied" : "Checking permission..."}</Text>
          {permissionDenied && <Text style={styles.emptyText}>Enable contacts in Settings</Text>}
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={48} color="#CCC" />
        <Text style={styles.emptyTitle}>No contacts found</Text>
        <Text style={styles.emptyText}>Try searching by name or number</Text>
      </View>
    );
  };

  return (
    <View style={styles.container} >

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Contact</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshContacts} disabled={refreshLoading}>
          {refreshLoading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Ionicons name="refresh" size={20} color="#000" />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or number"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={onChangeSearchText}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => onChangeSearchText("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <Text style={styles.contactCount}>
          {searchText ? `${searchResults.length} results` : `${visibleContacts.length} / ${allRef.current.length} contacts`}
        </Text>
        {indexing && <Text style={styles.indexingText}>Indexing...</Text>}
      </View>

      {/* Unknown Number Card */}
      {unknownProceedDigits ? (
        <TouchableOpacity
          style={styles.unknownCard}
          onPress={() => navigateWithNumber("Unknown", unknownProceedDigits)}
          activeOpacity={0.8}
        >
          <View style={[styles.avatar, { backgroundColor: "#9CA3AF" }]}>
            <Text style={styles.avatarText}>?</Text>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>Unknown Number</Text>
            <Text style={styles.contactPhone}>{unknownProceedDigits}</Text>
          </View>
          <View style={styles.proceedBadge}>
            <Text style={styles.proceedText}>Proceed</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Contact List */}
      <FlatList
        data={data}
        keyExtractor={(item, index) => item.id || String(index)}
        renderItem={renderItem}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : styles.contactList}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.15}
        onEndReached={() => browsingAll && appendNextChunk(false)}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={15}
        removeClippedSubviews={Platform.OS === 'android'}
        keyboardShouldPersistTaps="handled"
        getItemLayout={(_, index) => ({ length: 72, offset: 72 * index, index })}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          searchLoading || browseLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#000" />
              <Text style={styles.emptyText}>{searchLoading ? "Searching..." : "Loading contacts..."}</Text>
            </View>
          ) : renderEmpty()
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    marginHorizontal: 20,
    marginBottom: 12,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  contactCount: {
    fontSize: 13,
    color: '#999',
  },
  indexingText: {
    fontSize: 12,
    color: '#999',
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
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
  unknownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  proceedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  proceedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

export default MobilePrepaid;


