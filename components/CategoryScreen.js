import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  Animated,
  FlatList,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// Enhanced color palette
export const COLORS = {
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
  accentPink: '#FF6699',
  softGray: '#E8ECF1',
  black: '#111111',
  error: '#FF3B30',
  success: '#34C759'
};

// Screen dimensions
const { width } = Dimensions.get('window');

// Dummy Service Provider Data
const dummyProviders = [
  {
    id: 1,
    name: "Ahmed Shah",
    category: "Cleaning",
    image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnvWGrQXwJuMUWhAoWekb0sC3JiJTsOOz4Dw&s' },
    rating: 4.9,
    price: "Rs 1000/hr",
    experience: 7,
    featured: true,
    availability: "Available today",
    jobs: 124,
    bio: "Professional cleaner with attention to detail and eco-friendly practices."
  },
  {
    id: 2,
    name: "Zohaib Hassan",
    category: "Cleaning",
    image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnvWGrQXwJuMUWhAoWekb0sC3JiJTsOOz4Dw&s' },
    rating: 4.8,
    price: "Rs 1000/hr",
    experience: 5,
    featured: true,
    availability: "Available tomorrow",
    jobs: 98,
    bio: "Specialized in deep cleaning for allergic households and sanitization."
  },
  {
    id: 3,
    name: "Naeem Ahmed",
    category: "Cleaning",
    image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnvWGrQXwJuMUWhAoWekb0sC3JiJTsOOz4Dw&s' },
    rating: 4.7,
    price: "Rs 1000/hr",
    experience: 8,
    featured: false,
    availability: "Available today",
    jobs: 156,
    bio: "Commercial and residential cleaning expert with references available."
  },
  {
    id: 4,
    name: "Azhar Ibrahim",
    category: "Repairs",
    image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnvWGrQXwJuMUWhAoWekb0sC3JiJTsOOz4Dw&s' },
    rating: 4.9,
    price: "Rs 1500/hr",
    experience: 10,
    featured: true,
    availability: "Available today",
    jobs: 210,
    bio: "Master handyman with expertise in all home repair needs."
  },
  {
    id: 5,
    name: "Javed Hassan",
    category: "Plumbing",
    image: { uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnvWGrQXwJuMUWhAoWekb0sC3JiJTsOOz4Dw&s' },
    rating: 4.8,
    price: "Rs 1500/hr",
    experience: 6,
    featured: true,
    availability: "Available tomorrow",
    jobs: 87,
    bio: "Licensed plumber specializing in emergency leak repairs."
  }
];

const CategoryScreen = ({ route }) => {
  const { category } = route.params;
  const navigation = useNavigation();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [topProviders, setTopProviders] = useState([]);

  // Define services covered for each category
  const servicesCovered = {
    Cleaning: [
      'House Cleaning',
      'Deep Cleaning',
      'Carpet Cleaning',
      'Window Cleaning',
      'Office Cleaning',
      'Move-out Cleaning'
    ],
    Repairs: [
      'Appliance Repair',
      'Furniture Repair',
      'Electronics Repair',
      'General Maintenance',
      'Wall Repairs',
      'Door & Lock Repair'
    ],
    Painting: [
      'Interior Painting',
      'Exterior Painting',
      'Wall Texturing',
      'Fence Painting',
      'Decorative Painting',
      'Cabinet Refinishing'
    ],
    Plumbing: [
      'Pipe Repair',
      'Leak Detection',
      'Drain Cleaning',
      'Water Heater Installation',
      'Faucet Replacement',
      'Toilet Installation'
    ],
    Electrical: [
      'Wiring Installation',
      'Lighting Setup',
      'Circuit Breaker Repair',
      'Outlet Installation',
      'Electrical Inspections',
      'Smart Home Setup'
    ],
    Carpentry: [
      'Furniture Building',
      'Cabinet Installation',
      'Wood Repairs',
      'Deck Construction',
      'Trim Work',
      'Custom Shelving'
    ],
    'AC Repair': [
      'AC Unit Maintenance',
      'Refrigerant Recharge',
      'Duct Cleaning',
      'Thermostat Installation',
      'AC Installation',
      'Heating System Repair'
    ],
    Gardening: [
      'Lawn Mowing',
      'Tree Trimming',
      'Garden Design',
      'Weed Control',
      'Planting',
      'Irrigation Setup'
    ],
    Laundry: [
      'Wash and Fold',
      'Dry Cleaning',
      'Ironing Services',
      'Stain Removal',
      'Bulk Laundry',
      'Garment Repairs'
    ],
    'Pest Control': [
      'Insect Extermination',
      'Rodent Control',
      'Termite Treatment',
      'Bed Bug Removal',
      'Preventive Spraying',
      'Natural Pest Solutions'
    ]
  };

  useEffect(() => {
    // Filter top providers for the selected category
    const filteredProviders = dummyProviders
      .filter(provider => provider.category === category.name)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
    
    // If we don't have providers for this category, use some of the dummy providers
    const providers = filteredProviders.length > 0 ? 
      filteredProviders : 
      dummyProviders.slice(0, 3).map(p => ({...p, category: category.name}));
    
    setTopProviders(providers);

    // Combined animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, [category.name]);

  // Header component with improved design
  const renderHeader = () => (
    <LinearGradient
      colors={[category.color || COLORS.blue, category.color ? `${category.color}90` : COLORS.mediumBlue]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name}</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <MaterialCommunityIcons name="magnify" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderServiceItem = ({ item }) => (
    <TouchableOpacity style={styles.serviceItem}>
      <View style={styles.serviceIconContainer}>
        <MaterialCommunityIcons 
          name="check-circle" 
          size={18} 
          color={category.color || COLORS.accentGreen} 
        />
      </View>
      <Text style={styles.serviceText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderProviderItem = ({ item: provider }) => (
    <Animated.View style={[
      styles.providerCardContainer,
      {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }
    ]}>
      <TouchableOpacity
        key={provider.id}
        style={styles.providerCard}
        onPress={() => navigation.navigate('ServiceProviderDetail', { provider })}
      >
        <Image
          source={provider.image || { uri: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 1}.jpg` }}
          style={styles.providerImage}
        />
        {provider.featured && (
          <View style={styles.featuredBadge}>
            <MaterialCommunityIcons name="star" size={12} color={COLORS.white} />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <View style={styles.providerDetails}>
          <View style={styles.providerNameRow}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <View style={styles.ratingContainer}>
              <MaterialCommunityIcons name="star" size={14} color={COLORS.accentYellow} />
              <Text style={styles.ratingText}>{provider.rating}</Text>
            </View>
          </View>
          
          <View style={styles.badgesContainer}>
            <View style={styles.experienceBadge}>
              <MaterialCommunityIcons name="briefcase-outline" size={14} color={category.color || COLORS.blue} />
              <Text style={styles.badgeText}>{provider.experience} yrs</Text>
            </View>
            <View style={styles.jobsBadge}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={14} color={COLORS.accentOrange} />
              <Text style={styles.badgeText}>{provider.jobs}+ jobs</Text>
            </View>
          </View>
          
          <View style={styles.providerInfoRow}>
            <Text style={styles.providerPrice}>{provider.price}</Text>
            <View style={styles.availabilityContainer}>
              <View style={styles.availabilityDot} />
              <Text style={styles.availabilityText}>{provider.availability}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.bookButton, {backgroundColor: category.color || COLORS.accentGreen}]}
            onPress={() => navigation.navigate('ServiceProviderDetail', { provider })}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={category.color || COLORS.blue} />
      {renderHeader()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Hero Section with improved design */}
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })}]
        }}>
          <LinearGradient
            colors={[category.color || COLORS.blue, category.color ? `${category.color}90` : COLORS.mediumBlue]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.8 }}
            style={styles.hero}
          >
            <View style={[styles.heroIconContainer, { backgroundColor: `${category.color || COLORS.blue}33` }]}>
              <MaterialCommunityIcons name={category.icon || "tools"} size={52} color={COLORS.white} />
            </View>
            <Text style={styles.heroTitle}>{category.name} Services</Text>
            <Text style={styles.heroSubtitle}>
              Find trusted professionals for all your {category.name.toLowerCase()} needs
            </Text>
            
            <View style={styles.heroStatsContainer}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNumber}>{topProviders.length}</Text>
                <Text style={styles.heroStatLabel}>Top Pros</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNumber}>{servicesCovered[category.name].length}</Text>
                <Text style={styles.heroStatLabel}>Services</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNumber}>4.8</Text>
                <Text style={styles.heroStatLabel}>Avg. Rating</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Services Covered Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Popular Services</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>See All</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={category.color || COLORS.blue} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.servicesContainer}>
            <FlatList
              data={servicesCovered[category.name]}
              renderItem={renderServiceItem}
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              scrollEnabled={false}
            />
          </View>
        </View>

        {/* Top Providers Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Top Rated Professionals</Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllText}>View All</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={category.color || COLORS.blue} />
            </TouchableOpacity>
          </View>
          
          {topProviders.length > 0 ? (
            <FlatList
              data={topProviders}
              renderItem={renderProviderItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="alert-circle-outline" 
                size={48} 
                color={category.color || COLORS.blue} 
              />
              <Text style={styles.emptyText}>No top rated providers available for this category yet.</Text>
              <TouchableOpacity
                style={[styles.exploreButton, {backgroundColor: category.color || COLORS.blue}]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.exploreButtonText}>Explore Other Categories</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Bottom Floating Action Button */}
        <View style={styles.fabContainer}>
          <TouchableOpacity 
            style={[styles.fab, {backgroundColor: category.color || COLORS.accentGreen}]}
            onPress={() => navigation.navigate('BookService', { category })}
          >
            <MaterialCommunityIcons name="calendar-plus" size={24} color={COLORS.white} />
            <Text style={styles.fabText}>Book {category.name} Service</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingTop: StatusBar.currentHeight + 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  hero: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  heroStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  heroStat: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  heroStatLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: 4,
  },
  heroStatDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  sectionContainer: {
    marginTop: 25,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 15,
    color: COLORS.blue,
    fontWeight: '600',
  },
  servicesContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flex: 0.5,
    paddingRight: 10,
  },
  serviceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  serviceText: {
    fontSize: 15,
    color: COLORS.darkGray,
    flex: 1,
  },
  providerCardContainer: {
    marginBottom: 16,
  },
  providerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  providerImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  featuredBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: COLORS.accentOrange,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  providerDetails: {
    padding: 16,
  },
  providerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
    color: COLORS.darkGray,
    fontSize: 14,
  },
  badgesContainer: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  jobsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 153, 102, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  providerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerPrice: {
    fontWeight: 'bold',
    color: COLORS.blue,
    fontSize: 18,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentGreen,
    marginRight: 6,
  },
  availabilityText: {
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.7,
  },
  bookButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  }
});

export default CategoryScreen;