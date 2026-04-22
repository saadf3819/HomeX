// Service.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native-paper';
import { collection, query, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../integrations/firebase';
import { COLORS } from './colors';

const { width: screenWidth } = Dimensions.get('window');
const bannerWidth = screenWidth - 40;

// Local fallback images (replace with your assets)
const CATEGORY_IMAGES = {
  plumbing: require('../assets/plumber.jpg'),
  electrical: require('../assets/electrican.jpg'),
  ac: require('../assets/tutor.png'),
  default: require('../assets/plumber.jpg'),
};

// Choose image based on category
const chooseImageByCategory = (category) => {
  if (!category) return CATEGORY_IMAGES.default;
  const key = category.toLowerCase();
  if (key.includes('plumb')) return CATEGORY_IMAGES.plumbing;
  if (key.includes('elect')) return CATEGORY_IMAGES.electrical;
  if (key.includes('ac') || key.includes('air')) return CATEGORY_IMAGES.ac;
  return CATEGORY_IMAGES.default;
};

const Service = ({ navigation }) => {
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const db = getFirestore(app);
      const q = query(collection(db, 'serviceProviders'));
      const snap = await getDocs(q);

      const list = snap.docs
        .map((doc) => {
          const data = doc.data() || {};
          if (!data.isVerified) return null;

          const category =
            typeof data.serviceCategory === 'string' && data.serviceCategory.length
              ? data.serviceCategory.charAt(0).toUpperCase() + data.serviceCategory.slice(1)
              : 'General';
          const priceStr = data.price ? `RS ${data.price}` : 'RS 0';

          return {
            id: doc.id,
            uid: data.uid || null,
            name: data.name || 'Unknown',
            category,
            price: priceStr,
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            description: data.description || '',
            rating: data.rating || 4.5,
            experience: data.experience || '—',
            createdAt: data.createdAt || null,
            image: data.image ? { uri: data.image } : chooseImageByCategory(data.serviceCategory || ''),
            raw: data,
          };
        })
        .filter(Boolean);

      if (list.length === 0) {
        setProviders([
          {
            id: 'fallback1',
            name: 'Ali Electrician',
            category: 'Electrical',
            price: 'RS 1200',
            address: 'Lahore',
            phone: '0333-000000',
            rating: 4.9,
            image: CATEGORY_IMAGES.electrical,
            uid: null,
          },
        ]);
      } else {
        setProviders(list);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
      setProviders([
        {
          id: 'fallback_err',
          name: 'Hassan Plumber',
          category: 'Plumbing',
          price: 'RS 1000',
          address: 'Lahore',
          phone: '0333-000000',
          rating: 4.7,
          image: CATEGORY_IMAGES.plumbing,
          uid: null,
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProviders();
  };

  const filteredProviders = providers.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    );
  });

  const renderProviderCard = ({ item }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.providerCard}
        onPress={() =>
          navigation.navigate('ServiceProviderDetail', {
            uid: item.uid,
            provider: item,
          })
        }
      >
        <Image source={item.image} style={styles.providerImage} />
        <View style={styles.providerInfo}>
          <View style={styles.providerRow}>
            <Text style={styles.providerName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>{item.price}</Text>
            </View>
          </View>
          <Text style={styles.providerCategory}>{item.category}</Text>
          <View style={styles.metaRow}>
            <View style={styles.rating}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
            {item.address ? (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={COLORS.darkGray} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.hireButton}
              onPress={() =>
                navigation.navigate('ServiceProviderDetail', {
                  uid: item.uid,
                  provider: item,
                })
              }
            >
              <Text style={styles.hireText}>Hire Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero */}
      <LinearGradient
        colors={[COLORS.blue, COLORS.lightBlue]}
        style={styles.hero}
        start={[0, 0]}
        end={[1, 1]}
      >
        <Text style={styles.heroTitle}>Find Trusted Services</Text>
        <Text style={styles.heroSubtitle}>Hire verified experts around you</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.darkGray} />
          <TextInput
            placeholder="Search services, names or city..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Providers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Providers</Text>
            <Text style={styles.sectionSub}>{filteredProviders.length} found</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.blue} style={{ marginTop: 30 }} />
          ) : filteredProviders.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No providers found</Text>
              <Text style={styles.emptySubtitle}>Try another keyword or refresh the list.</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchProviders}>
                <Text style={styles.retryText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredProviders}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderProviderCard}
              contentContainerStyle={{ paddingLeft: 20, paddingVertical: 8 }}
            />
          )}
        </View>

        {/* How it Works */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsContainer}>
            {[
              {
                icon: 'search-outline',
                title: 'Choose Service',
                desc: 'Browse a wide range of home services',
              },
              {
                icon: 'calendar-outline',
                title: 'Book Provider',
                desc: 'Select a date & confirm your booking',
              },
              {
                icon: 'people-outline',
                title: 'Enjoy Service',
                desc: 'Relax while professionals do their job',
              },
            ].map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepIcon}>
                  <Ionicons name={step.icon} size={24} color={COLORS.white} />
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Service;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  hero: {
    padding: 22,
    paddingTop: 48,
    paddingBottom: 26,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  heroSubtitle: { fontSize: 14, color: COLORS.white, opacity: 0.95, marginBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  searchInput: { flex: 1, backgroundColor: 'transparent', fontSize: 15, marginLeft: 8, paddingVertical: 6 },
  content: { paddingVertical: 18 },
  section: { marginTop: 20, paddingBottom: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.darkGray,marginLeft:10 },
  sectionSub: { fontSize: 13, color: COLORS.darkGray, opacity: 0.7 },
  providerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginRight: 14,
    width: 260,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    overflow: 'hidden',
  },
  providerImage: { width: '100%', height: 140, resizeMode: 'cover' },
  providerInfo: { padding: 12 },
  providerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  providerName: { fontSize: 16, fontWeight: '700', color: COLORS.darkGray, flex: 1, marginRight: 8 },
  priceBadge: { backgroundColor: 'rgba(0,128,128,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priceBadgeText: { color: COLORS.blue, fontWeight: '700', fontSize: 13 },
  providerCategory: { fontSize: 13, color: COLORS.darkGray, opacity: 0.75, marginTop: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'space-between' },
  rating: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { marginLeft: 6, fontSize: 13, color: COLORS.darkGray, fontWeight: '600' },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationText: { marginLeft: 6, fontSize: 12, color: COLORS.darkGray, maxWidth: 120, opacity: 0.9 },
  cardActions: { flexDirection: 'row', marginTop: 12, alignItems: 'center', justifyContent: 'space-between' },
  hireButton: { backgroundColor: COLORS.blue, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  hireText: { color: COLORS.white, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.darkGray, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: COLORS.darkGray, opacity: 0.8, marginBottom: 12 },
  retryButton: { backgroundColor: COLORS.blue, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: COLORS.white, fontWeight: '700' },

  // Steps
  stepsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 20 },
  stepCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    flex: 1,
    marginHorizontal: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    alignItems: 'center',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTitle: { fontSize: 14, fontWeight: '700', color: COLORS.darkGray, textAlign: 'center' },
  stepDesc: { fontSize: 12, color: COLORS.darkGray, opacity: 0.8, textAlign: 'center', marginTop: 4 },
});
