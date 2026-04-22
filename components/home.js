import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions, ScrollView, StatusBar, Image, Animated, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ServiceProviderData } from './serviceproviders_data';
import { useSelector } from 'react-redux';
import { collection, getDocs, getFirestore, query } from 'firebase/firestore';
import { app } from '../integrations/firebase';

const { width } = Dimensions.get('window');

const COLORS = {
  blue: '#007BFF',
  lightBlue: '#D7EAFD',
  darkGray: '#4A4A4A',
  yellow: '#FFE680',
  white: '#FFFFFF',
  lightGray: '#F5F7FA',
  mediumBlue: '#4DA3FF',
  darkBlue: '#0056B3',
  accentYellow: '#FFCC00',
  accentGreen: '#28CC9E',
  accentOrange: '#FF9966',
  accentPurple: '#9966FF',
  accentPink: '#FF6699'
};

const Home = ({ navigation }) => {
  const [selectedService, setSelectedService] = useState('Plumbing');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollY] = useState(new Animated.Value(0));
  const [userdata, setuserdata] = useState();
  const [providers, setProviders] = useState(ServiceProviderData);
  const [activeIndex, setActiveIndex] = useState(0);
 
  const getdata = useSelector((state) => state.users);

  useEffect(() => {
    if (getdata) {
      setuserdata(getdata);
    }
  }, [getdata]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const db = getFirestore(app);
        const q = query(collection(db, 'serviceProviders'));
        const querySnapshot = await getDocs(q);

        const dbProviders = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            if (!data.isVerified) return null;

            // const category = data.serviceCategory.charAt(0).toUpperCase() + data.serviceCategory.slice(1);
// Format category properly - handle underscores and special cases
const formatCategory = (cat) => {
  // Handle special case for AC_Repair
  if (cat.toLowerCase() === 'ac_repair') return 'AC_Repair';
  
  // Default: capitalize each word separated by underscore
  return cat
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('_');
};

const category = formatCategory(data.serviceCategory);
            return {
              id: doc.id,
              uid: data.uid,
              name: data.name,
              category: category,
              price: `Rs${data.price}`,
              address: data.address,
              phone: data.phone,
              email: data.email,
              description: data.description,
              rating: 4.5,
              experience: '5 years',
              image: require('../assets/plumber.jpg'),
            };
          })
          .filter((provider) => provider !== null);

        const hardcodedWithExtras = ServiceProviderData.map((p) => ({
          ...p,
          uid: null,
          address: 'Default City',
        }));

        setProviders([...hardcodedWithExtras, ...dbProviders]);
      } catch (error) {
        console.error('Error fetching providers:', error);
        setProviders(
          ServiceProviderData.map((p) => ({ ...p, uid: null, address: 'Default City' }))
        );
      }
    };

    fetchProviders();
  }, []);

  const categories = [
    { id: '1', name: 'Plumbing', icon: 'pipe-wrench', gradient: [COLORS.blue, COLORS.mediumBlue] },
    { id: '2', name: 'Electrician', icon: 'lightning-bolt', gradient: [COLORS.accentYellow, '#FFD700'] },
    { id: '3', name: 'Cleaning', icon: 'broom', gradient: [COLORS.accentGreen, '#1A9978'] },
    { id: '4', name: 'Photography', icon: 'camera', gradient: [COLORS.accentPurple, '#7747CC'] },
    { id: '5', name: 'Errands', icon: 'run-fast', gradient: [COLORS.accentOrange, '#FF7744'] },
    { id: '6', name: 'Carpenter', icon: 'hammer', gradient: [COLORS.darkBlue, '#003D82'] },
    { id: '7', name: 'AC_Repair', icon: 'air-conditioner', gradient: [COLORS.mediumBlue, '#1E90FF'] },
    { id: '8', name: 'Events', icon: 'party-popper', gradient: [COLORS.accentPink, '#FF3366'] },
    { id: '9', name: 'Painting', icon: 'format-paint', gradient: [COLORS.accentOrange, '#FF8C42'] },
    // { id: '10', name: 'Gardening', icon: 'flower', gradient: [COLORS.accentGreen, '#32CD32'] },
  ];

  const popularServices = ['Plumbing', 'Electrician', 'Carpenter', 'AC Repair', 'Painting', 'Cleaning'];

  const carouselData = [
    {
      id: '1',
      percentage: '40% OFF',
      text: 'Get a discount for your next service order!',
      subtext: 'Limited time offer - Book now!',
      gradientColors: [COLORS.blue, COLORS.mediumBlue]
    },
    {
      id: '2',
      percentage: '30% OFF',
      text: 'Special member discount!',
      subtext: 'Premium services at exclusive prices',
      gradientColors: [COLORS.accentPurple, '#7747CC']
    },
    {
      id: '3',
      percentage: '25% OFF',
      text: 'Weekend Special!',
      subtext: 'Book any service this weekend',
      gradientColors: [COLORS.accentGreen, '#1A9978']
    },
  ];

  const featuredServices = [
    {
      id: '1',
      title: '24/7 Emergency',
      subtitle: 'Quick Response',
      icon: 'clock-alert-outline',
      color: COLORS.accentOrange,
      gradient: [COLORS.accentOrange, '#FF7744']
    },
    {
      id: '2',
      title: 'Verified Pros',
      subtitle: 'Trusted Experts',
      icon: 'shield-check',
      color: COLORS.accentGreen,
      gradient: [COLORS.accentGreen, '#1A9978']
    },
    {
      id: '3',
      title: 'Best Prices',
      subtitle: 'Great Deals',
      icon: 'tag-multiple',
      color: COLORS.accentPurple,
      gradient: [COLORS.accentPurple, '#7747CC']
    },
    {
      id: '4',
      title: 'Easy Booking',
      subtitle: 'Book in Seconds',
      icon: 'calendar-check',
      color: COLORS.blue,
      gradient: [COLORS.blue, COLORS.mediumBlue]
    }
  ];

  const filteredProviders = providers.filter((provider) => {
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      provider.name.toLowerCase().includes(lowerQuery) ||
      provider.category.toLowerCase().includes(lowerQuery) ||
      provider.description?.toLowerCase().includes(lowerQuery);
    const matchesTag = provider.category === selectedService;

    if (searchQuery) return matchesSearch;
    return matchesTag;
  });

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [200, 120],
    extrapolate: 'clamp'
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp'
  });

  const EnhancedCarousel = ({ data }) => {
    return (
      <View style={styles.carouselContainer}>
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={width - 40}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <View style={[styles.carouselItem, { width: width - 40 }]}>
              <LinearGradient colors={item.gradientColors} style={styles.carouselContent}>
                <View style={styles.carouselLeft}>
                  <Text style={styles.discountText}>{item.percentage}</Text>
                  <Text style={styles.carouselTitle}>{item.text}</Text>
                  <Text style={styles.carouselSubtitle}>{item.subtext}</Text>
                </View>
                <View style={styles.carouselImageContainer}>
                  <View style={styles.carouselImagePlaceholder}>
                    <MaterialCommunityIcons name="tag-heart" size={40} color={COLORS.white} />
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}
          keyExtractor={(item) => item.id}
          onScroll={({ nativeEvent }) => {
            const slideIndex = Math.floor(nativeEvent.contentOffset.x / (width - 40));
            setActiveIndex(slideIndex);
          }}
        />
        <View style={styles.pagination}>
          {carouselData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                activeIndex === index && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <Animated.View style={[styles.header, { height: headerHeight, opacity: headerOpacity }]}>
        <LinearGradient colors={[COLORS.lightBlue, COLORS.white]} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.greeting}>{userdata?.name || 'Guest'}</Text>
              </View>
              <View style={styles.headerRightButtons}>
                {/* <TouchableOpacity style={styles.iconButton}>
                  <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.darkGray} />
                  <View style={styles.notificationBadge} />
                </TouchableOpacity> */}
                <TouchableOpacity style={styles.avatarContainer}>
               <Image
  source={userdata && userdata.photo ? { uri: userdata.photo } : require('../assets/plumber.jpg')}
  style={styles.avatar}
/>


                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={24} color={COLORS.darkGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for services..."
                placeholderTextColor={COLORS.darkGray}
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
              />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Special Offers Carousel */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <Text style={styles.seeAll}>View All</Text>
          </View>
          <EnhancedCarousel data={carouselData} />
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Text style={styles.seeAll}>See all</Text>
          </View>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => {
                  setSelectedService(item.name);
                  setSearchQuery('');
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={item.gradient}
                  style={styles.categoryGradient}
                >
                  <View style={styles.categoryIconContainer}>
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={32}
                      color={COLORS.white}
                    />
                  </View>
                  <Text style={styles.categoryText}>{item.name}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>

        {/* Popular Services */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Services</Text>
            <Text style={styles.seeAll}>See all</Text>
          </View>
          <FlatList
            data={popularServices}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsContainer}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[
                  styles.serviceTag,
                  selectedService === item && styles.selectedServiceTag
                ]}
                onPress={() => {
                  setSelectedService(item);
                  setSearchQuery('');
                }}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedService === item && styles.selectedTagText
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>

        {/* Filtered Provider Cards */}
        <View style={styles.providersContainer}>
          {filteredProviders.length > 0 ? (
            filteredProviders.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.providerCard}
                onPress={() =>
                  navigation.navigate('ServiceProviderDetail', {
                    uid: item.uid,
                    address: item.address,
                    provider: item
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.providerImageContainer}>
                  <Image source={item.image} style={styles.providerImage} />
                  {item.uid && (
                    <View style={styles.verifiedBadge}>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={20}
                        color={COLORS.blue}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.providerDetails}>
                  <View style={styles.providerHeader}>
                    <Text style={styles.providerName}>{item.name}</Text>
                    <View style={styles.ratingContainer}>
                      <MaterialCommunityIcons name="star" size={16} color={COLORS.accentYellow} />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>

                  <Text style={styles.providerCategory}>{item.category}</Text>
                  <Text style={styles.providerExperience}>{item.experience} experience</Text>

                  <View style={styles.providerFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Starting from</Text>
                      <Text style={styles.providerPrice}>{item.price}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() =>
                        navigation.navigate('ServiceProviderDetail', {
                          uid: item.uid,
                          address: item.address,
                          provider: item
                        })
                      }
                    >
                      <Text style={styles.bookButtonText}>Book</Text>
                      <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={60} color={COLORS.darkGray} />
              <Text style={styles.emptyText}>No providers found for this search</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={() => setSearchQuery('')}>
                <Text style={styles.refreshButtonText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Why Choose Us */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Why Choose Us</Text>
          </View>
          <View style={styles.featuredContainer}>
            {featuredServices.map((item) => (
              <View key={item.id} style={styles.featureCard}>
                <LinearGradient colors={item.gradient} style={styles.featureGradient}>
                  <View style={styles.featureIconContainer}>
                    <MaterialCommunityIcons name={item.icon} size={32} color={COLORS.white} />
                  </View>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  scrollContainer: {
    paddingTop: 200,
    paddingBottom: 30,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 5,
  },
  headerGradient: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.darkGray,
    opacity: 0.8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    top: 8,
    right: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
  },
  searchInput: {
    marginLeft: 10,
    color: COLORS.darkGray,
    flex: 1,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  seeAll: {
    color: COLORS.blue,
    fontWeight: '600',
    fontSize: 14,
  },
  carouselContainer: {
    marginBottom: 10,
  },
  carouselItem: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 160,
    elevation: 5,
  },
  carouselContent: {
    flexDirection: 'row',
    padding: 20,
    height: '100%',
  },
  carouselLeft: {
    flex: 3,
    justifyContent: 'space-between',
  },
  discountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  carouselTitle: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  carouselSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: 12,
  },
  carouselImageContainer: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lightBlue,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 16,
    backgroundColor: COLORS.blue,
  },
  // CATEGORIES SECTION STYLES
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  categoryCard: {
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  categoryGradient: {
    width: 100,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  // FEATURED SERVICES STYLES
  featuredContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 56) / 2,
    marginHorizontal: 8,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
  },
  featureGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  featureIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  // POPULAR SERVICES STYLES
  tagsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  serviceTag: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 12,
    elevation: 2,
  },
  selectedServiceTag: {
    backgroundColor: COLORS.blue,
  },
  tagText: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  selectedTagText: {
    color: COLORS.white,
  },
  // PROVIDER CARDS STYLES
  providersContainer: {
    paddingHorizontal: 20,
  },
  providerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    elevation: 4,
  },
  providerImageContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  providerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.lightBlue,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 2,
    elevation: 2,
  },
  providerDetails: {
    flex: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
    color: COLORS.darkGray,
    fontSize: 12,
  },
  providerCategory: {
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  providerExperience: {
    color: COLORS.darkGray,
    opacity: 0.7,
    fontSize: 13,
    marginBottom: 12,
  },
  providerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: COLORS.darkGray,
    opacity: 0.7,
    marginBottom: 2,
  },
  providerPrice: {
    fontWeight: 'bold',
    color: COLORS.blue,
    fontSize: 16,
  },
  bookButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  bookButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});