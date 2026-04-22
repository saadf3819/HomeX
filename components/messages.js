import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './colors';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, onSnapshot, getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../integrations/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EXTENDED_COLORS = {
  ...COLORS,
  lightGray: '#F5F7FA',
  mediumBlue: '#4DA3FF',
  darkBlue: '#0056B3',
  accentGreen: '#28CC9E',
  softWhite: '#F8FBFF'
};

const Messages = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmedProviders, setConfirmedProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Get userId from AsyncStorage or Firebase Auth
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const storedId = await AsyncStorage.getItem('userid');
          const finalUserId = storedId || user.uid;
          setUserId(finalUserId);
        } catch (error) {
          console.error('Error reading user ID from AsyncStorage:', error);
          setUserId(user.uid);
        }
      } else {
        setUserId(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch confirmed jobs for the current user and get provider data
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'jobs'),
      where('userId', '==', userId),
      where('status', '==', 'booked')
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const providerMap = new Map();

      for (const docSnap of querySnapshot.docs) {
        const jobData = docSnap.data();
        const providerId = jobData.providerId;
        if (!providerId) continue;

        // Avoid duplicates
        if (!providerMap.has(providerId)) {
          // Fetch provider data from serviceProviders collection
          let providerDoc = null;
          try {
            const providerRef = doc(db, 'serviceProviders', providerId);
            const providerSnap = await getDoc(providerRef);
            providerDoc = providerSnap.exists() ? providerSnap.data() : null;
          } catch (err) {
            console.error('Error fetching provider data:', err);
          }

          providerMap.set(providerId, {
            id: providerId,
            name: providerDoc?.name || jobData.providerName || 'Service Provider',
            service: jobData.service || jobData.category || 'General Service',
            image: providerDoc?.image || jobData.providerImage || null,
            lastMessage: `Confirmed booking for ${jobData.service || 'service'}`,
            timestamp: jobData.date || jobData.createdAt || new Date().toISOString(),
            jobId: docSnap.id,
          });
        }
      }

      setConfirmedProviders(Array.from(providerMap.values()));
      setLoading(false);
    }, (error) => {
      console.error('Firestore snapshot error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleChatPress = (provider) => {
    navigation.navigate('chat_screen', { user: provider });
  };

  const renderTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    try {
      const now = new Date();
      const msgDate = new Date(timestamp);
      const diffMins = Math.floor((now - msgDate) / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return msgDate.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  const getUnreadCount = (index) => {
    const counts = [0, 0, 2, 0, 5, 0, 1];
    return counts[index % counts.length];
  };

  // Filter providers safely
  const filteredProviders = confirmedProviders.filter(provider =>
    (provider.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (provider.service || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.mainContainer, styles.centered]}>
        <ActivityIndicator size="large" color={EXTENDED_COLORS.blue} />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient
        colors={[EXTENDED_COLORS.blue, EXTENDED_COLORS.mediumBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Messages</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <MaterialCommunityIcons name="dots-vertical" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={EXTENDED_COLORS.darkGray} style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Search conversations..."
              placeholderTextColor={EXTENDED_COLORS.darkGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color={EXTENDED_COLORS.darkGray} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.title}>Recent Chats</Text>
          <Text style={styles.chatCount}>
            {filteredProviders.length} {filteredProviders.length === 1 ? 'chat' : 'chats'}
          </Text>
        </View>

        <FlatList
          data={filteredProviders}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const unreadCount = getUnreadCount(index);
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.chatCard, unreadCount > 0 && styles.unreadChatCard]}
                onPress={() => handleChatPress(item)}
              >
                <View style={styles.avatarContainer}>
                  <Image
                    source={
                      item.image
                        ? { uri: item.image }
                        : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || 'User')}&background=random&size=200` }
                    }
                    style={styles.avatar}
                  />
                  {index % 3 === 0 && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{item.name || 'Service Provider'}</Text>
                    <Text style={styles.chatTime}>{renderTimeAgo(item.timestamp)}</Text>
                  </View>

                  <View style={styles.chatPreview}>
                    <Text style={[styles.previewText, unreadCount > 0 && styles.unreadText]} numberOfLines={1}>
                      {item.lastMessage || 'Booking confirmed'}
                    </Text>

                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={64} color={EXTENDED_COLORS.darkGray} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No chats found' : 'No confirmed bookings yet'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try searching with a different keyword'
                  : 'Book a service and get it confirmed to start chatting with providers'}
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: EXTENDED_COLORS.softWhite },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: EXTENDED_COLORS.darkGray, marginTop: 10 },
  header: { paddingTop: StatusBar.currentHeight + 10, paddingBottom: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerContent: { paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
  headerActions: { flexDirection: 'row' },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 20, paddingVertical: 12, paddingHorizontal: 15, marginBottom: 10, elevation: 3 },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: EXTENDED_COLORS.darkGray },
  clearBtn: { padding: 4 },
  container: { flex: 1, backgroundColor: EXTENDED_COLORS.softWhite, marginTop: -15, borderTopLeftRadius: 25, borderTopRightRadius: 25 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', color: EXTENDED_COLORS.darkGray },
  chatCount: { color: EXTENDED_COLORS.blue, fontWeight: '600', fontSize: 14 },
  chatList: { paddingHorizontal: 20, paddingBottom: 30 },
  chatCard: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 15, padding: 12, marginBottom: 10, elevation: 2 },
  unreadChatCard: { backgroundColor: COLORS.lightBlue },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: COLORS.lightBlue },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: EXTENDED_COLORS.accentGreen, borderWidth: 2, borderColor: COLORS.white },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  chatName: { fontSize: 17, fontWeight: '600', color: EXTENDED_COLORS.darkGray },
  chatTime: { fontSize: 12, color: EXTENDED_COLORS.darkGray, opacity: 0.6 },
  chatPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  previewText: { flex: 1, fontSize: 14, color: EXTENDED_COLORS.darkGray, opacity: 0.8 },
  unreadText: { fontWeight: '600', opacity: 1 },
  unreadBadge: { backgroundColor: EXTENDED_COLORS.blue, borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  unreadCount: { color: COLORS.white, fontSize: 12, fontWeight: 'bold', paddingHorizontal: 6 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: EXTENDED_COLORS.darkGray, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 16, color: EXTENDED_COLORS.darkGray, textAlign: 'center', opacity: 0.7, paddingHorizontal: 40 },
});

export default Messages;
