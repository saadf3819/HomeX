import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Dimensions,
  FlatList,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  collection, 
  addDoc, 
  getFirestore, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  getDoc, 
  doc 
} from 'firebase/firestore';
import * as Location from 'expo-location';
import { app } from '../integrations/firebase';
import axios from 'axios';
import { useSelector } from 'react-redux';
const { width } = Dimensions.get('window');

// Enhanced color palette with gradients and modern aesthetics
const COLORS = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  secondary: '#f093fb',
  secondaryLight: '#f5f7ff',
  background: '#f8faff',
  surface: '#ffffff',
  text: '#2d3748',
  textSecondary: '#718096',
  accent: '#ffd89b',
  accentDark: '#19547b',
  success: '#48bb78',
  warning: '#ed8936',
  error: '#f56565',
  border: '#e2e8f0',
  shadow: 'rgba(0,0,0,0.1)',
  white: '#ffffff',
  disabled: '#a0aec0',
  overlay: 'rgba(0,0,0,0.5)'
};

// Static reviews for fallback
const staticReviews = [
  {
    id: '1',
    name: 'Ahmed Cheema',
    rating: 5.0,
    date: '2 days ago',
    comment: 'Outstanding service! Very professional, arrived on time, and exceeded my expectations. Would definitely hire again.',
    avatar: { uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100&h=100&fit=crop&crop=face' },
    verified: true
  },
  {
    id: '2',
    name: 'Zohaib Rashid',
    rating: 4.8,
    date: '5 days ago',
    comment: 'Great work quality and attention to detail. Communication was excellent throughout the process.',
    avatar: { uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
    verified: true
  },
  {
    id: '3',
    name: 'Sara ',
    rating: 5.0,
    date: '1 week ago',
    comment: 'Highly knowledgeable professional. Solved the problem efficiently and provided helpful tips for maintenance.',
    avatar: { uri: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
    verified: true
  }
];

const ServiceProviderDetail = ({ route }) => {
  const { provider, uid: providerId } = route.params;
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('about');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCustomPriceModal, setShowCustomPriceModal] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [priceOfferNote, setPriceOfferNote] = useState('');
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [reviews, setReviews] = useState([]);
 const [selectedTime, setSelectedTime] = useState(new Date());
const [showTimePicker, setShowTimePicker] = useState(false);

  const [averageRating, setAverageRating] = useState(4.8);
  const [reviewCount, setReviewCount] = useState(127);
  const [ratingDistribution, setRatingDistribution] = useState({1: 0, 2: 2, 3: 5, 4: 12, 5: 108});
  const db = getFirestore(app);
  // Enhanced provider image with fallback
  const providerImage = provider.image || { 
    uri: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face`
  };

  const useerdata = useSelector((state) => state.users);

  // Fetch user address on component mount
  useEffect(() => {
    if (useerdata) {
      console.log(useerdata, 'userdata in booking');
      setUserAddress(useerdata.address);
    }
  }, [useerdata]);
const formatTime = (date) => {
  if (!date) return "Select time";
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutes} ${ampm}`;
};

  // Fetch reviews from Firestore
  useEffect(() => {
    const fetchReviews = async () => {
      if (!providerId) return;
      try {
        const q = query(
          collection(db, 'reviews'),
          where('providerId', '==', providerId),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const reviewPromises = snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const review = {
            id: docSnap.id,
            jobId: data.jobId,
            rating: data.rating,
            comment: data.review,
            timestamp: data.timestamp,
            userId: data.userId,
          };
          // Fetch user details
          try {
            const userSnap = await getDoc(doc(db, 'users', data.userId));
            console.log(userSnap,'iser review')
            if (userSnap.exists()) {
              const userData = userSnap.data();
              review.name = userData.name || 'Anonymous User';
              review.avatar = userData.photo ? { uri: userData.photo } : { uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100&h=100&fit=crop&crop=face' };
              review.verified = userData.verified || true;
              console.log(review.avatar,'image')
            } else {
              review.name = 'Anonymous User';
              review.avatar = { uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100&h=100&fit=crop&crop=face' };
              review.verified = false;
            }
          } catch (error) {
            console.error('Error fetching user:', error);
            review.name = 'Anonymous User';
            review.avatar = { uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=100&h=100&fit=crop&crop=face' };
            review.verified = false;
          }
          // Format date for review
          const reviewDate = data.timestamp.toDate();
          review.date = formatReviewDate(reviewDate);
          return review;
        });
        const reviewsData = await Promise.all(reviewPromises);
        if (reviewsData.length > 0) {
          // Compute stats
          let totalRating = 0;
          const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          reviewsData.forEach((review) => {
            totalRating += review.rating;
            dist[review.rating]++;
          });
          const avg = totalRating / reviewsData.length;
          setReviews(reviewsData);
          setAverageRating(avg.toFixed(1));
          setReviewCount(reviewsData.length);
          setRatingDistribution(dist);
        }
        // If no reviews, keep static
      } catch (error) {
        console.error('Error fetching reviews:', error);
        // Keep static on error
      }
    };
    fetchReviews();
  }, [providerId]);

  // Simple service pricing - Fixed price parsing to handle different currency formats
  const cleanPrice = (priceStr) => {
    if (!priceStr) return '50';
    // Remove any non-numeric characters except dots and commas (for thousands separator)
    const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(/,/g, '');
    return cleaned || '50';
  };
  const basePrice = parseFloat(cleanPrice(provider.price)) || 50;
  const defaultService = { 
    id: '1', 
    title: 'Standard Service', 
    price: basePrice,
    duration: 'As required'
  };

  // Date handling
  const onDateChange = (date) => {
    setShowDatePicker(false);
    setSelectedDate(date || new Date());
  };

  const formatDate = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const formatReviewDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  };

  const calculateTotal = () => {
    if (useCustomPrice && customPrice) {
      return parseFloat(customPrice);
    }
    return defaultService.price;
  };

  const handleCustomPriceSubmit = () => {
    if (!customPrice || parseFloat(customPrice) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price amount.');
      return;
    }
    setUseCustomPrice(true);
    setShowCustomPriceModal(false);
    Alert.alert(
      'Price Offer Submitted', 
      `Your offer of Rs ${customPrice} has been sent to ${provider.name}. You'll be notified when they respond.`
    );
  };

  const handleBooking = async () => {
    try {
      const userId = await AsyncStorage.getItem('userid');
      if (!userId) {
        Alert.alert('Error', 'User not logged in. Please log in to book a service.');
        return;
      }

      if (!providerId) {
        Alert.alert('Error', 'This provider is not available for booking.');
        return;
      }

      const jobData = {
        userId,
        providerId,
        date: selectedDate.toISOString(),
        time: selectedTime.toISOString(),            // ⭐ ADDED
  formattedTime: formatTime(selectedTime),
        service: defaultService.title,
        price: calculateTotal(),
        status: useCustomPrice ? 'price_offer' : 'booked',
        note: useCustomPrice ? priceOfferNote : '',
        address: userAddress,
        createdAt: new Date().toISOString(),
        category: provider.category,
        providerName: provider.name
      };

      await addDoc(collection(db, 'jobs'), jobData);

      Alert.alert(
        'Success', 
        `Your ${useCustomPrice ? 'price offer' : 'booking'} has been created successfully with ${provider.name}!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating job:', error);
      Alert.alert('Error', `Failed to create ${useCustomPrice ? 'offer' : 'booking'}: ${error.message}`);
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{provider.name}</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialCommunityIcons name="share-variant" size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );




  const renderAboutTab = () => (
  <View style={styles.tabContent}>

    {/* ABOUT SECTION */}
    <Text style={styles.sectionTitle}>About Professional</Text>
    <View style={styles.card}>
      <Text style={styles.sectionText}>
        {provider.description
          ? provider.description
          : `${provider.name} is a professional ${provider.category.toLowerCase()} service provider.`}
      </Text>

      {/* DYNAMIC HIGHLIGHTS */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {provider.experience || "1+"}
          </Text>
          <Text style={styles.statLabel}>Years Experience</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {provider.completedJobs || "—"}
          </Text>
          <Text style={styles.statLabel}>Jobs Completed</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {provider.rating ? provider.rating.toFixed(1) : "—"}
          </Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>
    </View>

    {/* SPECIALIZATIONS */}
    {provider.specializations?.length > 0 && (
      <>
        <Text style={styles.sectionTitle}>Specializations</Text>
        <View style={styles.tagsContainer}>
          {provider.specializations.map((tag, index) => (
            <View key={index} style={styles.enhancedTag}>
              <MaterialCommunityIcons
                name="check-circle"
                size={14}
                color={COLORS.success}
              />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </>
    )}

    {/* REVIEWS */}
    <Text style={styles.sectionTitle}>Recent Reviews</Text>

    {reviews.length === 0 ? (
      <View style={styles.card}>
        <Text style={{ textAlign: "center", color: COLORS.textSecondary }}>
          Be the first one to leave a review!
        </Text>
      </View>
    ) : (
      reviews.slice(0, 2).map((review) => (
        <View key={review.id} style={styles.enhancedReviewCard}>
          <View style={styles.reviewHeader}>
            <Image source={review.avatar} style={styles.reviewAvatar} />
            <View style={styles.reviewInfo}>
              <View style={styles.reviewNameRow}>
                <Text style={styles.reviewName}>{review.name}</Text>
                {review.verified && (
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={16}
                    color={COLORS.primary}
                  />
                )}
              </View>

              <View style={styles.reviewMeta}>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialCommunityIcons
                      key={star}
                      name={
                        star <= Math.floor(review.rating)
                          ? "star"
                          : "star-outline"
                      }
                      size={14}
                      color={COLORS.accent}
                    />
                  ))}
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.reviewComment}>{review.comment}</Text>
        </View>
      ))
    )}
  </View>
);


const renderBookTab = () => (
  <View style={styles.tabContent}>
    <Text style={styles.sectionTitle}>Service Details</Text>
    <View style={styles.enhancedServiceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceTitle}>{defaultService.title}</Text>
        <Text style={styles.servicePrice}>Rs {defaultService.price}</Text>
      </View>

      <View style={styles.serviceMeta}>
        <View style={styles.durationBadge}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.primary} />
          <Text style={styles.durationText}>{defaultService.duration}</Text>
        </View>
      </View>
    </View>

    {/* Custom Price Offer */}
    <View style={styles.customPriceSection}>
      <View style={styles.customPriceHeader}>
        <MaterialCommunityIcons name="tag-outline" size={24} color={COLORS.primary} />
        <Text style={styles.customPriceTitle}>Have a Different Budget?</Text>
      </View>
      <Text style={styles.customPriceDescription}>
        Make your own price offer and negotiate directly with the professional
      </Text>

      <TouchableOpacity
        style={styles.customPriceButton}
        onPress={() => setShowCustomPriceModal(true)}
      >
        <MaterialCommunityIcons name="cash" size={20} color={COLORS.white} />
        <Text style={styles.customPriceButtonText}>Make Price Offer</Text>
      </TouchableOpacity>
    </View>

    {/* Select Date */}
    <Text style={styles.sectionTitle}>Select Date</Text>
    <TouchableOpacity
      style={styles.enhancedDatePicker}
      onPress={() => setShowDatePicker(true)}
    >
      <View style={styles.datePickerContent}>
        <MaterialCommunityIcons name="calendar-month" size={24} color={COLORS.primary} />
        <View>
          <Text style={styles.dateLabel}>Preferred Date</Text>
          <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>

    {/* Date Picker Modal */}
    <DatePicker
      date={selectedDate}
      mode="date"
      modal
      open={showDatePicker}
      minimumDate={new Date()}
      onConfirm={(date) => onDateChange(date)}
      onCancel={() => setShowDatePicker(false)}
    />

    {/* NEW — Select Time */}
    <Text style={styles.sectionTitle}>Select Time</Text>
    <TouchableOpacity
      style={styles.enhancedDatePicker}
      onPress={() => setShowTimePicker(true)}
    >
      <View style={styles.datePickerContent}>
        <MaterialCommunityIcons name="clock-outline" size={24} color={COLORS.primary} />
        <View>
          <Text style={styles.dateLabel}>Preferred Time</Text>
          <Text style={styles.dateText}>{formatTime(selectedTime)}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>

    {/* Time Picker Modal */}
    <DatePicker
      modal
      open={showTimePicker}
      date={selectedTime}
      mode="time"
      onConfirm={(time) => {
        setSelectedTime(time);
        setShowTimePicker(false);
      }}
      onCancel={() => setShowTimePicker(false)}
    />

    {/* Booking Summary */}
    <Text style={styles.sectionTitle}>Booking Summary</Text>
    <View style={styles.enhancedSummaryCard}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Service</Text>
        <Text style={styles.summaryValue}>{defaultService.title}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Date</Text>
        <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Time</Text>
        <Text style={styles.summaryValue}>{formatTime(selectedTime)}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Professional</Text>
        <Text style={styles.summaryValue}>{provider.name}</Text>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Address</Text>
        <Text style={styles.summaryValue}>
          {userAddress ? userAddress : 'Fetching location...'}
        </Text>
      </View>

      {useCustomPrice && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Your Offer</Text>
          <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
            Rs {customPrice} (Pending approval)
          </Text>
        </View>
      )}

      <View style={styles.summaryDivider} />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryTotalLabel}>Total Amount</Text>
        <Text style={styles.summaryTotalValue}>
          Rs {calculateTotal().toFixed(2)}
        </Text>
      </View>
    </View>
  </View>
);


  // Custom Price Modal
  const renderCustomPriceModal = () => (
    <Modal
      visible={showCustomPriceModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCustomPriceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Make Your Price Offer</Text>
            <TouchableOpacity onPress={() => setShowCustomPriceModal(false)}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalDescription}>
            Suggest your budget for this service. The professional will review and respond to your offer.
          </Text>
          
          <View style={styles.priceInputContainer}>
            <Text style={styles.priceInputLabel}>Your Offer (Rs)</Text>
            <TextInput
              style={styles.priceInput}
              value={customPrice}
              onChangeText={setCustomPrice}
              placeholder="Enter amount"
              keyboardType="numeric"
              maxLength={6}
            />
          </View>
          
          <View style={styles.noteInputContainer}>
            <Text style={styles.noteInputLabel}>Additional Note (Optional)</Text>
            <TextInput
              style={styles.noteInput}
              value={priceOfferNote}
              onChangeText={setPriceOfferNote}
              placeholder="Add any specific requirements or details..."
              multiline={true}
              numberOfLines={3}
              maxLength={200}
            />
            <Text style={styles.characterCount}>{priceOfferNote.length}/200</Text>
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCustomPriceModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSubmitButton}
              onPress={handleCustomPriceSubmit}
            >
              <Text style={styles.modalSubmitText}>Send Offer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  
const renderReviewsTab = () => (
  <View style={styles.tabContent}>

    {/* ⭐ If NO reviews → show message */}
    {reviews.length === 0 ? (
      <View style={styles.card}>
        <Text style={{ 
          textAlign: "center", 
          color: COLORS.textSecondary,
          paddingVertical: 20,
          fontSize: 14
        }}>
          Be the first one to leave a review!
        </Text>
      </View>
    ) : (
      /* ⭐ If reviews exist → show list */
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.enhancedReviewCard}>
            <View style={styles.reviewHeader}>
             <Image
  source={item.avatar}
  style={styles.reviewAvatar}
/>


              <View style={styles.reviewInfo}>
                <View style={styles.reviewNameRow}>
                  <Text style={styles.reviewName}>{item.name}</Text>
                  {item.verified && (
                    <MaterialCommunityIcons 
                      name="check-decagram" 
                      size={16} 
                      color={COLORS.primary} 
                    />
                  )}
                </View>

                <View style={styles.reviewMeta}>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <MaterialCommunityIcons
                        key={star}
                        name={
                          star <= Math.floor(item.rating)
                            ? "star"
                            : "star-outline"
                        }
                        size={14}
                        color={COLORS.accent}
                      />
                    ))}
                  </View>

                  <Text style={styles.reviewDate}>
                    {item.date || ""}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.reviewComment}>{item.comment}</Text>
          </View>
        )}
      />
    )}
  </View>
);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      {renderHeader()}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Hero Section */}
        <View style={styles.enhancedHero}>
          <Image source={providerImage} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroTop}>
              <TouchableOpacity style={styles.favoriteButton}>
                <MaterialCommunityIcons name="heart-outline" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>
            <View style={styles.heroBottom}>
              <Text style={styles.providerName}>{provider.name}</Text>
              <View style={styles.heroMeta}>
                <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons name="star" size={16} color={COLORS.accent} />
                  <Text style={styles.ratingText}>{averageRating}</Text>
                </View>
                <Text style={styles.category}>{provider.category}</Text>
              </View>
              <View style={styles.badges}>
                <View style={styles.badge}>
                  <MaterialCommunityIcons name="shield-check" size={16} color={COLORS.white} />
                  <Text style={styles.badgeText}>Verified Pro</Text>
                </View>
                <View style={styles.badge}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.white} />
                  <Text style={styles.badgeText}>{provider.experience}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Enhanced Tabs */}
        <View style={styles.enhancedTabs}>
          {[
            { key: 'about', label: 'About', icon: 'information-outline' },
            { key: 'reviews', label: 'Reviews', icon: 'star-outline' },
            { key: 'book', label: 'Book Now', icon: 'calendar-check' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.enhancedTab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialCommunityIcons 
                name={tab.icon} 
                size={18} 
                color={activeTab === tab.key ? COLORS.white : COLORS.textSecondary} 
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'reviews' && renderReviewsTab()}
        {activeTab === 'book' && renderBookTab()}
      </ScrollView>

      {/* Enhanced Footer */}
      <LinearGradient
        colors={[COLORS.background, COLORS.white]}
        style={styles.footer}
      >
        <View style={styles.footerContent}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>
              {useCustomPrice ? 'Your Offer' : 'Starting from'}
            </Text>
            <Text style={styles.priceText}>
              Rs {calculateTotal().toFixed(2)}
              {useCustomPrice && <Text style={styles.pendingText}> (Pending)</Text>}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.enhancedBookButton}
            onPress={handleBooking}
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryDark]}
              style={styles.buttonGradient}
            >
              <MaterialCommunityIcons name="calendar-check" size={20} color={COLORS.white} />
              <Text style={styles.bookButtonText}>
                {useCustomPrice ? 'Send Offer' : 'Confirm Booking'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {renderCustomPriceModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  scrollContent: { 
    paddingBottom: 120 
  },

  // Enhanced Header
  header: { 
    paddingTop: StatusBar.currentHeight + 8, 
    paddingBottom: 16,
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  headerContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: COLORS.white,
    letterSpacing: 0.5
  },

  // Enhanced Hero Section
  enhancedHero: { 
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12
  },
  heroImage: { 
    width: '100%', 
    height: 280,
    resizeMode: 'cover'
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150
  },
  heroContent: { 
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: 20
  },
  heroTop: {
    alignItems: 'flex-end'
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  heroBottom: {
    alignItems: 'flex-start'
  },
  providerName: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: COLORS.white,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3
  },
  heroMeta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    borderRadius: 20, 
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12 
  },
  ratingText: { 
    color: COLORS.text, 
    fontSize: 14, 
    fontWeight: '600',
    marginLeft: 4 
  },
  category: { 
    fontSize: 16, 
    color: COLORS.white,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2
  },
  badges: { 
    flexDirection: 'row',
    gap: 8
  },
  badge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    borderRadius: 20, 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  badgeText: { 
    color: COLORS.white, 
    fontSize: 12, 
    fontWeight: '600',
    marginLeft: 6 
  },

  // Enhanced Tabs
  enhancedTabs: { 
    flexDirection: 'row', 
    marginHorizontal: 20, 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 6, 
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 8
  },
  enhancedTab: { 
    flex: 1, 
    paddingVertical: 12, 
    paddingHorizontal: 8,
    alignItems: 'center', 
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  activeTab: { 
    backgroundColor: COLORS.primary,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  tabText: { 
    fontSize: 14, 
    color: COLORS.textSecondary, 
    fontWeight: '600' 
  },
  activeTabText: { 
    color: COLORS.white, 
    fontWeight: '700' 
  },

  // Content Styles
  tabContent: { 
    padding: 20 
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: COLORS.text, 
    marginBottom: 16, 
    marginTop: 8 
  },
  sectionText: { 
    fontSize: 16, 
    color: COLORS.textSecondary, 
    lineHeight: 26,
    fontWeight: '400'
  },

  // Enhanced Cards
  card: { 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 20, 
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border
  },

  // Enhanced Tags
  tagsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 20,
    gap: 8
  },
  enhancedTag: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight, 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '20'
  },
  tagText: { 
    color: COLORS.text, 
    fontSize: 14, 
    fontWeight: '500',
    marginLeft: 6
  },

  // Work Hours
  workHourRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '40'
  },
  workHourContent: {
    marginLeft: 12,
    flex: 1
  },
  workHourDay: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2
  },
  workHourTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },

  // Enhanced Reviews
  enhancedReviewCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16, 
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4
  },
  reviewHeader: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  reviewAvatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    marginRight: 16 
  },
  reviewInfo: {
    flex: 1
  },
  reviewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  reviewName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: COLORS.text 
  },
  reviewMeta: { 
    flexDirection: 'row', 
    alignItems: 'center',
    gap: 8
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2
  },
  reviewDate: { 
    fontSize: 12, 
    color: COLORS.textSecondary, 
    fontWeight: '500'
  },
  reviewComment: { 
    fontSize: 15, 
    color: COLORS.text, 
    lineHeight: 22,
    fontWeight: '400'
  },

  // Enhanced Rating Summary
  enhancedRatingSummary: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6
  },
  ratingLeft: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    minWidth: 120
  },
  ratingNumber: { 
    fontSize: 40, 
    fontWeight: '800', 
    color: COLORS.text,
    marginBottom: 8
  },
  stars: { 
    flexDirection: 'row', 
    marginBottom: 8,
    gap: 2
  },
  ratingCount: { 
    fontSize: 14, 
    color: COLORS.textSecondary, 
    fontWeight: '500',
    textAlign: 'center'
  },
  ratingRight: {
    flex: 1,
    paddingLeft: 20
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  ratingBarLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    width: 20,
    fontWeight: '500'
  },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginHorizontal: 8
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 3
  },
  ratingBarCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    width: 25,
    textAlign: 'right',
    fontWeight: '500'
  },

  // Enhanced Service Cards
  enhancedServiceCard: { 
    backgroundColor: COLORS.white,
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16, 
    borderWidth: 2, 
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    position: 'relative'
  },
  selectedServiceCard: { 
    borderColor: COLORS.primary, 
    backgroundColor: COLORS.primary,
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3
  },
  popularService: {
    borderColor: COLORS.accent,
    borderWidth: 2
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 4
  },
  popularText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  serviceTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: COLORS.text,
    flex: 1
  },
  priceContainer: {
    alignItems: 'flex-end'
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    fontWeight: '500',
    marginBottom: 2
  },
  servicePrice: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: COLORS.primary 
  },
  selectedText: { 
    color: COLORS.white 
  },
  selectedPriceText: {
    color: COLORS.white
  },
  serviceDescription: { 
    fontSize: 14, 
    color: COLORS.textSecondary, 
    marginBottom: 12,
    lineHeight: 20
  },
  serviceMeta: {
    marginBottom: 12
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start'
  },
  durationText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4
  },
  featuresContainer: {
    gap: 8
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  featureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },

  // Custom Price Section
  customPriceSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary + '20',
    borderStyle: 'dashed'
  },
  customPriceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  customPriceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 12
  },
  customPriceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16
  },
  customPriceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8
  },
  customPriceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white
  },

  // Enhanced Date Picker
  enhancedDatePicker: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white, 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 20, 
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginLeft: 16,
    marginBottom: 2
  },
  dateText: { 
    fontSize: 16, 
    color: COLORS.text, 
    fontWeight: '600',
    marginLeft: 16
  },

  // Enhanced Summary
  enhancedSummaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + '20'
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12
  },
  summaryLabel: { 
    fontSize: 15, 
    color: COLORS.textSecondary, 
    fontWeight: '500',
    flex: 1
  },
  summaryValue: { 
    fontSize: 15, 
    color: COLORS.text, 
    fontWeight: '600',
    flex: 2,
    textAlign: 'right'
  },
  summaryDivider: { 
    height: 1, 
    backgroundColor: COLORS.border, 
    marginVertical: 8 
  },
  summaryTotalLabel: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '700'
  },
  summaryTotalValue: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '800'
  },

  // Custom Price Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20
  },
  priceInputContainer: {
    marginBottom: 20
  },
  priceInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8
  },
  priceInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: COLORS.background
  },
  noteInputContainer: {
    marginBottom: 24
  },
  noteInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8
  },
  noteInput: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    textAlignVertical: 'top',
    minHeight: 80
  },
  characterCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginTop: 4
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center'
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white
  },

  // Enhanced Footer
  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1, 
    borderTopColor: COLORS.border + '60'
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  priceInfo: {
    flex: 1
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 2
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text
  },
  pendingText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600'
  },
  enhancedBookButton: { 
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8
  },
  bookButtonText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: COLORS.white 
  }
});

export default ServiceProviderDetail;