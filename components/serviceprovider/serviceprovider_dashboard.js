import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Alert,
  FlatList,
  PermissionsAndroid,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';

import { 
  getAuth,
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  getFirestore
} from 'firebase/firestore';
import {
  getDatabase,
  ref,
  set
} from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from '../../integrations/firebase';
import WalletTopUpScreen from './wallet_screen';
import EditProfile from '../EditProfile';
import ProviderProfile from '../ProviderEditProfile';


const COLORS = {
  blue: '#007BFF',
  lightBlue: '#D7EAFD',
  darkGray: '#4A4A4A',
  yellow: '#FFE680',
  white: '#FFFFFF',
  green: '#4CAF50',
  red: '#F44336',
  orange: '#FF9800',
  teal: '#009688',
  lightGray: '#F5F5F5',
  mediumGray: '#9E9E9E'
};

const ServiceProviderDashboard = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('week');
  const [expandedJob, setExpandedJob] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [providerData, setProviderData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [confirmedCustomers, setConfirmedCustomers] = useState([]);
  const [sharingLocation, setSharingLocation] = useState({}); // { jobId: boolean }
  const [locationSubscription, setLocationSubscription] = useState(null);
  
  const db = getFirestore(app);
  const auth = getAuth(app);
  const database = getDatabase(app);

useEffect(() => {
  const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setCurrentUser(user);
      await requestLocationPermissions();
      fetchProviderData(user.uid);
      fetchUsersAndJobs(user.uid);
    } else {
      setCurrentUser(null);
    }
  });

  return unsubscribeAuth;
}, []);
const fetchUsersAndJobs = (providerId) => {
  // Listen to users collection
  const unsubscribeUsers = onSnapshot(collection(db, 'users'), (querySnapshot) => {
    const userMap = {};
    querySnapshot.docs.forEach((doc) => {
      userMap[doc.id] = doc.data();
    });
    setUsers(userMap);

    // Now listen to jobs
    const unsubscribeJobs = onSnapshot(
      query(collection(db, 'jobs'), where('providerId', '==', providerId)),
      (querySnapshot) => {
        const jobList = querySnapshot.docs.map((docSnap) => {
          const job = docSnap.data();
          return {
            id: docSnap.id,
            customer: userMap[job.userId]?.name || 'Unknown User',
            customerImage: userMap[job.userId]?.photo || null,
            service: job.category,
            title: job.service,
            address: job.address || 'Address not provided',
            date: new Date(job.date).toLocaleDateString('en-GB'),
            time: job.time || 'Time not specified',
            price: job.price,
            formattedTime: job.formattedTime,
            status: job.status,
            description: job.note || 'No description provided',
            userId: job.userId,
            providerId: job.providerId,
            createdAt: job.createdAt,
          };
        });

        setJobs(jobList);

        // Update confirmed customers
        const customers = [];
        const seenUsers = new Set();
        jobList
          .filter((j) => j.status === 'confirmed' || j.status === 'booked')
          .forEach((job) => {
            if (!seenUsers.has(job.userId)) {
              seenUsers.add(job.userId);
              customers.push({
                id: job.userId,
                name: job.customer,
                image: job.customerImage,
                category: job.category,
                service: job.service,
                lastMessage: `Service: ${job.service}`,
                timestamp: job.date,
              });
            }
          });
        setConfirmedCustomers(customers);
      }
    );

    // Return both unsubscribes in case cleanup needed
    return () => {
      unsubscribeJobs();
    };
  });

  return () => {
    unsubscribeUsers();
  };
};

  useEffect(() => {
    if (route.params?.screen) {
      setActiveTab(route.params.screen);
    }
  }, [route.params?.screen]);
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchProviderData(user.uid);
        fetchJobs(user.uid);
        fetchUsers();
        requestLocationPermissions();
      } else {
        setCurrentUser(null);
      }
    });

    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    setNotifications([
      {
        id: '1',
        title: 'New Job Request',
        message: 'You have a new job request for plumbing service.',
        time: '2 hours ago',
        read: false
      }
    ]);
  }, []);

  // Update job customer names when users data loads
  useEffect(() => {
    if (Object.keys(users).length > 0 && jobs.length > 0) {
      setJobs(prevJobs =>
        prevJobs.map(job => ({
          ...job,
          customer: users[job.userId]?.name || job.customer
        }))
      );
    }
  }, [users]);

  useEffect(() => {
    const customers = [];
    const seenUsers = new Set();
    jobs.filter(j => j.status === 'confirmed' || j.status === 'booked').forEach(job => {
      const userId = job.userId;
      if (!seenUsers.has(userId)) {
        seenUsers.add(userId);
        customers.push({
          id: userId,
          name: users[userId]?.name || job.customer || 'Unknown User',
          image: users[userId]?.photo || null,
          category: job.category || job.service,
          service: job.service,
          lastMessage: `Service: ${job.service}`,
          timestamp: job.date || job.createdAt,
        });
      }
    });
    setConfirmedCustomers(customers);
  }, [jobs, users]);

  const requestLocationPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to location to share live location.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Permission Denied', 'Location sharing requires permission.');
        return false;
      }
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location sharing requires permission.');
        return false;
      }
    }
    return true;
  };

  const startLocationSharing = async (jobId) => {
    if (!(await requestLocationPermissions())) return;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Update every 10 seconds
        distanceInterval: 10, // Update if moved 10 meters
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        const locationData = {
          lat: latitude,
          lng: longitude,
          timestamp: new Date().toISOString(),
        };
        const locationRef = ref(database, `liveLocations/${currentUser.uid}/${jobId}`);
        set(locationRef, locationData)
          .then(() => console.log('Location updated'))
          .catch((error) => console.error('Error updating location:', error));
      }
    );

    setLocationSubscription(subscription);
    setSharingLocation(prev => ({ ...prev, [jobId]: true }));
    Alert.alert('Success', 'Live location sharing started.');
  };

  const stopLocationSharing = (jobId) => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setSharingLocation(prev => ({ ...prev, [jobId]: false }));
    const locationRef = ref(database, `liveLocations/${currentUser.uid}/${jobId}`);
    set(locationRef, null);
    Alert.alert('Success', 'Live location sharing stopped.');
  };

  const toggleLocationSharing = (jobId) => {
    if (sharingLocation[jobId]) {
      stopLocationSharing(jobId);
    } else {
      startLocationSharing(jobId);
    }
  };

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  const fetchProviderData = (uid) => {
    const q = query(collection(db, 'serviceProviders'), where('uid', '==', uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setProviderData({
          name: data.name,
          
          rating: data.rating || 4.8,
          completedJobs: data.completedJobs || 0,
          profileImage: { uri: data.photo || 'data:image/jpeg;base64,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' },
          overallRating: data.rating || 4.8,
          activeServices: [data.serviceCategory],
          currentBalance: data.wallet || 0,
          experience: data.experience || '5 years'
        });
      }
    });
    return unsubscribe;
  };

  const fetchJobs = (providerId) => {
    const q = query(collection(db, 'jobs'), where('providerId', '==', providerId));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const jobList = querySnapshot.docs.map(docSnap => {
        const job = docSnap.data();
        return {
          id: docSnap.id,
          customer: users[job.userId]?.name || 'Unknown User',
          service: job.category,
          title: job.service,
          address: job.address || 'Address not provided',
          date: new Date(job.date).toLocaleDateString('en-GB'),
          time: job.time || 'Time not specified',
          price: job.price,
          formattedTime:job.formattedTime,
          status: job.status,
          description: job.note || 'No description provided',
          userId: job.userId,
          providerId: job.providerId,
          createdAt: job.createdAt
        };
      });
      setJobs(jobList);
    });
    return unsubscribe;
  };

  const fetchUsers = () => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (querySnapshot) => {
      const userMap = {};
      querySnapshot.docs.forEach((doc) => {
        userMap[doc.id] = doc.data();
      });
      setUsers(userMap);
    });
    return unsubscribe;
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleApproveJob = async (jobId) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), { status: 'booked' });
      Alert.alert('Success', 'Job approved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve job.');
    }
  };

  const handleRejectJob = async (jobId) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), { status: 'rejected' });
      Alert.alert('Success', 'Job rejected.');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject job.');
    }
  };

  const getPendingJobs = () => jobs.filter(job => job.status === 'price_offer');
const getUpcomingJobs = () =>
  jobs.filter(job =>
    job.status === 'confirmed' || job.status === 'booked'
  );


  const getCompletedJobs = () => jobs.filter(job => job.status === 'completed');

  const getChartData = () => {
  // Filter only booked or confirmed jobs
  const bookedJobs = jobs.filter(job => job.status === 'booked' || job.status === 'confirmed');

  const now = new Date();
  let labels = [];
  let data = [];

  switch (timeFilter) {
    case 'week':
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      data = labels.map((_, i) => {
        const day = i; // 0 = Mon, 6 = Sun
        return bookedJobs.filter(job => {
          const jobDate = new Date(job.date); // assume job.date is a valid date string
          return jobDate.getDay() === (day + 1) % 7; // JS getDay(): 0=Sun, 1=Mon...
        }).length;
      });
      break;

    case 'month':
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      data = labels.map((_, i) => {
        const start = new Date(now.getFullYear(), now.getMonth(), i * 7 + 1);
        const end = new Date(now.getFullYear(), now.getMonth(), (i + 1) * 7);
        return bookedJobs.filter(job => {
          const jobDate = new Date(job.date);
          return jobDate >= start && jobDate <= end;
        }).length;
      });
      break;

    case 'year':
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      data = labels.map((_, i) => {
        return bookedJobs.filter(job => {
          const jobDate = new Date(job.date);
          return jobDate.getMonth() === i && jobDate.getFullYear() === now.getFullYear();
        }).length;
      });
      break;
  }

  return { labels, data };
};

const CustomLineChart = () => {
  const { labels, data } = getChartData();
  const chartWidth = Dimensions.get('window').width - 50;
  const chartHeight = 200;
  const maxValue = Math.max(...data, 1);
  const minValue = 0;
  const valueRange = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = data.length > 1 ? (index / (data.length - 1)) * (chartWidth - 40) + 20 : chartWidth / 2;
    const y = chartHeight - 20 - ((value - minValue) / valueRange) * (chartHeight - 40);
    return { x, y, value };
  });

  const labelPositions = labels.map((_, index) =>
    data.length > 1 ? (index / (labels.length - 1)) * (chartWidth - 40) + 20 : chartWidth / 2
  );

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chart}>
        <View style={styles.grid}>
          {Array.from({ length: 5 }).map((_, index) => (
            <View
              key={index}
              style={[styles.gridLine, { top: (chartHeight - 20) * (index / 4) }]}
            />
          ))}
        </View>

        {points.map((point, index) => {
          if (index === points.length - 1) return null;
          const nextPoint = points[index + 1];
          return (
            <View key={index}>
              <View
                style={{
                  position: 'absolute',
                  left: point.x,
                  top: point.y,
                  width: Math.sqrt(
                    Math.pow(nextPoint.x - point.x, 2) + Math.pow(nextPoint.y - point.y, 2)
                  ),
                  height: 2,
                  backgroundColor: COLORS.blue,
                  transform: [
                    { rotate: `${Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x)}rad` }
                  ]
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  left: point.x - 5,
                  top: point.y - 5,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: COLORS.blue,
                  borderWidth: 2,
                  borderColor: COLORS.white
                }}
              />
            </View>
          );
        })}

        {points.length > 0 && (
          <View
            style={{
              position: 'absolute',
              left: points[points.length - 1].x - 5,
              top: points[points.length - 1].y - 5,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: COLORS.blue,
              borderWidth: 2,
              borderColor: COLORS.white
            }}
          />
        )}

        <View style={styles.labelsContainer}>
          {labels.map((label, index) => (
            <Text key={index} style={[styles.labelText, { left: labelPositions[index] - 15 }]}>
              {label}
            </Text>
          ))}
        </View>

        <View style={styles.yAxisLabels}>
          {Array.from({ length: 5 }).map((_, index) => {
            const value = maxValue - (index * valueRange) / 4;
            return (
              <Text key={index} style={[styles.yAxisLabel, { top: (chartHeight - 20) * (index / 4) - 10 }]}>
                {value >= 1000 ? `${Math.round(value / 1000)}K` : Math.round(value)}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
};


  const renderJobCard = ({ item }) => {
    const isExpanded = expandedJob === item.id;
    const isPriceOffer = item.status === 'price_offer';
    const now = new Date('2025-10-05');
    const jobDate = parseDate(item.date);
    const isUpcoming = jobDate >= now;
    const isSharing = sharingLocation[item.id];
    
    return (
      <TouchableOpacity 
        style={[styles.jobCard, 
          item.status === 'confirmed' ? styles.confirmedJobCard : 
          item.status === 'completed' ? styles.completedJobCard : 
          item.status === 'price_offer' ? styles.pendingJobCard :
          styles.pendingJobCard
        ]}
        onPress={() => setExpandedJob(isExpanded ? null : item.id)}
      >
        <View style={styles.jobCardHeader}>
          <View style={styles.jobServiceBadge}>
            <Text style={styles.jobServiceText}>{item.service}</Text>
          </View>
          <Text style={styles.jobPrice}>Rs. {item.price}</Text>
        </View>
        
        <Text style={styles.jobTitle}>{item.title}</Text>
        
        <View style={styles.jobInfoRow}>
          <Ionicons name="person" size={16} color={COLORS.darkGray} />
          <Text style={styles.jobInfoText}>{item.customer}</Text>
        </View>
        
        <View style={styles.jobInfoRow}>
          <Ionicons name="calendar" size={16} color={COLORS.darkGray} />
          <Text style={styles.jobInfoText}>{item.date}</Text>
        </View>
        <View style={styles.jobInfoRow}>
  <Ionicons name="time" size={16} color={COLORS.darkGray} />
  <Text style={styles.jobInfoText}>
    {item.formattedTime ? item.formattedTime : 'Time not selected'}
  </Text>
</View>

        
        <View style={styles.jobInfoRow}>
          <Ionicons name="location" size={16} color={COLORS.darkGray} />
          {/* <Text style={styles.jobInfoText} numberOfLines={isExpanded ? 0 : 1}>{item.address}</Text> */}
          <Text style={styles.jobInfoText} numberOfLines={isExpanded ? 0 : 1}>
  {item.address
    ? item.address
    : 'Address not available'}
</Text>

        </View>
        
        {isExpanded && (
          <View style={styles.jobExpandedContent}>
            <Text style={styles.jobSectionTitle}>Description:</Text>
            <Text style={styles.jobDescription}>{item.description}</Text>
            
            {item.status === 'completed' && (
              <View style={styles.feedbackContainer}>
                <Text style={styles.jobSectionTitle}>Customer Feedback:</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons 
                      key={star}
                      name={star <= 4 ? "star" : "star-outline"} 
                      size={16} 
                      color={COLORS.yellow} 
                    />
                  ))}
                </View>
                <Text style={styles.feedbackText}>No feedback available</Text>
              </View>
            )}
            
            <View style={styles.actionButtonsContainer}>
              {isPriceOffer && (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => handleApproveJob(item.id)}
                  >
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => handleRejectJob(item.id)}
                  >
                    <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Disapprove</Text>
                  </TouchableOpacity>
                </>
              )}
{/*               
              {item.status === 'confirmed' && isUpcoming && (
                <>
                  <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
                    <Text style={styles.actionButtonText}>Start Job</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
                    <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Reschedule</Text>
                  </TouchableOpacity>
                </>
              )} */}
              
              {item.status === 'completed' && (
                <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
                  <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>View Details</Text>
                </TouchableOpacity>
              )}

              {(item.status === 'confirmed' || item.status === 'booked') && (
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.locationButton,
                    isSharing && styles.locationButtonActive
                  ]}
                  onPress={() => toggleLocationSharing(item.id)}
                >
                  <Ionicons 
                    name={isSharing ? "location" : "location-outline"} 
                    size={16} 
                    color={isSharing ? COLORS.white : COLORS.blue} 
                  />
                  <Text style={[
                    styles.actionButtonText, 
                    { color: isSharing ? COLORS.white : COLORS.blue }
                  ]}>
                    {isSharing ? 'Stop Sharing' : 'Share Location'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.expandIconContainer}>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={18} 
            color={COLORS.darkGray} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  const handleChatPress = (customer) => {
    navigation.navigate('chat_screen', { user: customer });
    console.log(customer, 'customer');
  };

  const renderTimeAgo = (timestamp) => {
    if (!timestamp) {
      const times = ['2m ago', '15m ago', '1h ago', 'Yesterday', '2d ago', '5d ago'];
      return times[Math.floor(Math.random() * times.length)];
    }
    const now = new Date();
    const jobDate = new Date(timestamp);
    const diffInHours = (now - jobDate) / (1000 * 60 * 60);
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return 'Yesterday';
  };

  const getUnreadCount = (index) => {
    const counts = [0, 0, 2, 0, 5, 0, 1];
    return counts[index % counts.length];
  };

  const renderChatCard = ({ item, index }) => {
    const unreadCount = getUnreadCount(index);
    return (
      <TouchableOpacity 
        activeOpacity={0.9} 
        style={[
          styles.chatCard,
          unreadCount > 0 && styles.unreadChatCard
        ]} 
        onPress={() => handleChatPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={item.image ? { uri: item.image } : require('../../assets/event.png')}
            style={styles.avatar} 
          />
          {index % 3 === 0 && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.name}</Text>
            <Text style={styles.chatTime}>{renderTimeAgo(item.timestamp)}</Text>
          </View>
          
          <View style={styles.chatPreview}>
            <Text style={[
              styles.previewText,
              unreadCount > 0 && styles.unreadText
            ]} numberOfLines={1}>
              {item.lastMessage}
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
  };

  const renderDashboardTab = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {providerData ? (
        <>
       

          <View style={styles.statsCardContainer}>
            <View style={[styles.statsCard, { backgroundColor: COLORS.blue }]}>
              <Ionicons name="cash-outline" size={28} color={COLORS.white} />
              <Text style={styles.statsAmount}>Rs. {providerData.currentBalance}</Text>
              <Text style={styles.statsLabel}>Current Wallet Balance</Text>
            </View>
            
            <View style={[styles.statsCard, { backgroundColor: COLORS.teal }]}>
              <Ionicons name="checkmark-circle-outline" size={28} color={COLORS.white} />
              <Text style={styles.statsAmount}>{getCompletedJobs().length}</Text>
              <Text style={styles.statsLabel}>Completed Jobs</Text>
            </View>
            
            <View style={[styles.statsCard, { backgroundColor: COLORS.orange }]}>
              <Ionicons name="calendar-outline" size={28} color={COLORS.white} />
              <Text style={styles.statsAmount}>{getUpcomingJobs().length}</Text>
              <Text style={styles.statsLabel}>Upcoming Jobs</Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Job Overview</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity 
                  style={[styles.filterOption, timeFilter === 'week' && styles.activeFilterOption]}
                  onPress={() => setTimeFilter('week')}
                >
                  <Text style={[styles.filterText, timeFilter === 'week' && styles.activeFilterText]}>Week</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterOption, timeFilter === 'month' && styles.activeFilterOption]}
                  onPress={() => setTimeFilter('month')}
                >
                  <Text style={[styles.filterText, timeFilter === 'month' && styles.activeFilterText]}>Month</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.filterOption, timeFilter === 'year' && styles.activeFilterOption]}
                  onPress={() => setTimeFilter('year')}
                >
                  <Text style={[styles.filterText, timeFilter === 'year' && styles.activeFilterText]}>Year</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <CustomLineChart />
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              {getPendingJobs().length > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{getPendingJobs().length}</Text>
                </View>
              )}
            </View>
            
            {getPendingJobs().length > 0 ? (
              getPendingJobs().map(job => (
                <View key={job.id}>
                  {renderJobCard({ item: job })}
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="checkmark-done-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.emptyStateText}>No pending requests</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Jobs</Text>
              <TouchableOpacity onPress={() => setActiveTab('jobs')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {getUpcomingJobs().length > 0 ? (
              getUpcomingJobs().slice(0, 2).map(job => (
                <View key={job.id}>
                  {renderJobCard({ item: job })}
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="calendar-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.emptyStateText}>No upcoming jobs</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Completions</Text>
              <TouchableOpacity onPress={() => setActiveTab('jobs')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {getCompletedJobs().length > 0 ? (
              getCompletedJobs().slice(0, 2).map(job => (
                <View key={job.id}>
                  {renderJobCard({ item: job })}
                </View>
              ))
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.emptyStateText}>No completed jobs</Text>
              </View>
            )}
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderJobsTab = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.jobsTabContainer}>
        <View style={styles.jobListContainer}>
          <View style={styles.jobListHeader}>
            <Text style={styles.jobListTitle}>Pending Requests</Text>
            {getPendingJobs().length > 0 && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{getPendingJobs().length}</Text>
              </View>
            )}
          </View>
          
          {getPendingJobs().length > 0 ? (
            getPendingJobs().map(job => (
              <View key={job.id}>
                {renderJobCard({ item: job })}
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="checkmark-done-outline" size={48} color={COLORS.mediumGray} />
              <Text style={styles.emptyStateText}>No pending requests</Text>
            </View>
          )}
          
          <Text style={styles.jobListTitle}>Upcoming Jobs</Text>
          
          {getUpcomingJobs().length > 0 ? (
            getUpcomingJobs().map(job => (
              <View key={job.id}>
                {renderJobCard({ item: job })}
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.mediumGray} />
              <Text style={styles.emptyStateText}>No upcoming jobs</Text>
            </View>
          )}
          
          <Text style={styles.jobListTitle}>Completed Jobs</Text>
          
          {getCompletedJobs().length > 0 ? (
            getCompletedJobs().map(job => (
              <View key={job.id}>
                {renderJobCard({ item: job })}
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.mediumGray} />
              <Text style={styles.emptyStateText}>No completed jobs</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderNotificationsTab = () => (
    <ScrollView
      style={styles.notificationsContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.notificationsTitle}>Notifications</Text>
      
      {notifications.map(notification => (
        <View 
          key={notification.id} 
          style={[
            styles.notificationCard,
            !notification.read && styles.unreadNotification
          ]}
        >
          <View style={styles.notificationIconContainer}>
            <Ionicons 
              name={
                notification.title.includes('Job') ? 'briefcase' :
                notification.title.includes('Payment') ? 'cash' : 'star'
              } 
              size={24} 
              color={COLORS.white} 
              style={styles.notificationIcon}
            />
          </View>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <Text style={styles.notificationTime}>{notification.time}</Text>
          </View>
          {!notification.read && (
            <View style={styles.unreadIndicator} />
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderMessagesTab = () => (
    <View style={styles.messagesContainer}>
      <Text style={styles.notificationsTitle}>Messages</Text>
      <FlatList
        data={confirmedCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderChatCard}
        contentContainerStyle={styles.chatList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons name="chatbubble-outline" size={48} color={COLORS.mediumGray} />
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={[styles.emptyStateText, { fontSize: 14, opacity: 0.7 }]}>Confirm a booking to start chatting with customers.</Text>
          </View>
        }
      />
    </View>
  );

  const handleLogout = async () => {
    // Stop all location sharing on logout
    Object.keys(sharingLocation).forEach(jobId => {
      if (sharingLocation[jobId]) {
        stopLocationSharing(jobId);
      }
    });
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userToken');
      navigation.navigate('login_user')
    } catch (error) {
      Alert.alert('Error', 'Logout failed.');
    }
  };

  const renderAccountTab = () => (
    <ScrollView
      style={styles.accountContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {providerData ? (
        <>
          <View style={styles.accountProfileSection}>
            <Image source={providerData.profileImage} style={styles.accountProfileImage} />
            <Text style={styles.accountName}>{providerData.name}</Text>
            <View style={styles.accountRatingContainer}>
              <Ionicons name="star" size={18} color={COLORS.yellow} />
              <Text style={styles.accountRatingText}>{providerData.activeServices}</Text>
            </View>
            <TouchableOpacity style={styles.editProfileButton} onPress={()=>navigation.navigate('ProviderEditProfile')}>
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.accountStatsContainer}>
            <View style={styles.accountStatCard}>
              <Text style={styles.accountStatValue}>{providerData.completedJobs}</Text>
              <Text style={styles.accountStatLabel}>Jobs Completed</Text>
            </View>
            <View style={styles.accountStatDivider} />
            <View style={styles.accountStatCard}>
              <Text style={styles.accountStatValue}>Rs. {providerData.currentBalance}</Text>
              <Text style={styles.accountStatLabel}>Total Earnings</Text>
            </View>
          </View>
          
          <View style={styles.accountMenuSection}>
            <TouchableOpacity style={styles.accountMenuItem}>
              <Ionicons name="person-outline" size={22} color={COLORS.darkGray} />
              <Text style={styles.accountMenuItemText}>Personal Information</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.accountMenuItem}>
              <Ionicons name="construct-outline" size={22} color={COLORS.darkGray} />
              <Text style={styles.accountMenuItemText}>Services & Pricing</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.accountMenuItem}>
              <Ionicons name="wallet-outline" size={22} color={COLORS.darkGray} />
              <Text style={styles.accountMenuItemText}>Payments & Banking</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.accountMenuItem}>
              <Ionicons name="document-text-outline" size={22} color={COLORS.darkGray} />
              <Text style={styles.accountMenuItemText}>Documents & Certificates</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.accountMenuItem}>
              <Ionicons name="settings-outline" size={22} color={COLORS.darkGray} />
              <Text style={styles.accountMenuItemText}>Account Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.accountMenuItem}>
              <Ionicons name="help-circle-outline" size={22} color={COLORS.darkGray} />
              <Text style={styles.accountMenuItemText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mediumGray} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#E53935" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderSelectedTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'jobs':
        return renderJobsTab();
      case 'notifications':
        return <WalletTopUpScreen />;
      case 'messages':
        return renderMessagesTab();
      case 'account':
        return <ProviderProfile/>;
      default:
        return renderDashboardTab();
    }
  };

  if (!currentUser || !providerData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    <View style={styles.header}>
  <Image
    source={require('../../assets/homexlogo.png')}
    style={styles.headerLogo}
    resizeMode="contain"
  />
  <Text style={styles.headerTitle}>Provider Dashboard</Text>
  <View style={{ width: 40 }} /> {/* Empty space to balance the logo on the left */}
</View>


      {renderSelectedTab()}

      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons 
            name={activeTab === 'dashboard' ? 'home' : 'home-outline'} 
            size={24} 
            color={activeTab === 'dashboard' ? COLORS.blue : COLORS.darkGray} 
          />
          <Text 
            style={[
              styles.navLabel, 
              activeTab === 'dashboard' && styles.activeNavLabel
            ]}
          >
            Dashboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('jobs')}
        >
          <Ionicons 
            name={activeTab === 'jobs' ? 'briefcase' : 'briefcase-outline'} 
            size={24} 
            color={activeTab === 'jobs' ? COLORS.blue : COLORS.darkGray} 
          />
          <Text 
            style={[
              styles.navLabel, 
              activeTab === 'jobs' && styles.activeNavLabel
            ]}
          >
            Jobs
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('notifications')}
        >
          <Ionicons 
            name={activeTab === 'notifications' ? 'wallet' : 'wallet-outline'} 
            size={24} 
            color={activeTab === 'notifications' ? COLORS.blue : COLORS.darkGray} 
          />
          <Text 
            style={[
              styles.navLabel, 
              activeTab === 'notifications' && styles.activeNavLabel
            ]}
          >
            Wallet
          </Text>
          {notifications.some(n => !n.read) && <View style={styles.navBadge} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('messages')}
        >
          <Ionicons 
            name={activeTab === 'messages' ? 'chatbubble' : 'chatbubble-outline'} 
            size={24} 
            color={activeTab === 'messages' ? COLORS.blue : COLORS.darkGray} 
          />
          <Text 
            style={[
              styles.navLabel, 
              activeTab === 'messages' && styles.activeNavLabel
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('account')}
        >
          <Ionicons 
            name={activeTab === 'account' ? 'person' : 'person-outline'} 
            size={24} 
            color={activeTab === 'account' ? COLORS.blue : COLORS.darkGray} 
          />
          <Text 
            style={[
              styles.navLabel, 
              activeTab === 'account' && styles.activeNavLabel
            ]}
          >
            Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingTop: 50,
  paddingBottom: 15,
  backgroundColor: COLORS.white,
  elevation: 4,
  shadowColor: COLORS.darkGray,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},
headerLogo: {
  width: 40,
  height: 40,
},
headerTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: COLORS.darkGray,
  textAlign: 'center',
},

  headerButton: {
    position: 'relative'
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.red
  },
  profileSection: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    margin: 15,
    marginTop: 20,
    elevation: 2,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  profileImageContainer: {
    position: 'relative'
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 15
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 12,
    backgroundColor: COLORS.orange,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  profileDetails: {
    flex: 1
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 5
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 5
  },
  joinDateText: {
    fontSize: 12,
    color: COLORS.mediumGray
  },
  profileButton: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  profileButtonText: {
    color: COLORS.blue,
    fontWeight: '600'
  },
  statsCardContainer: {
    marginTop:20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 20
  },
  statsCard: {
    width: '31%',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  statsAmount: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 5
  },
  statsLabel: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center'
  },
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 15
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray
  },
  seeAllText: {
    color: COLORS.blue,
    fontWeight: '500'
  },
  filterOptions: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    padding: 3
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  activeFilterOption: {
    backgroundColor: COLORS.blue
  },
  filterText: {
    fontSize: 12,
    color: COLORS.darkGray
  },
  activeFilterText: {
    color: COLORS.white,
    fontWeight: '500'
  },
  chartContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  chart: {
    marginVertical: 8,
    borderRadius: 15,
    width: Dimensions.get('window').width - 50,
    height: 200,
    position: 'relative'
  },
  grid: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: COLORS.lightGray,
    opacity: 0.5
  },
  labelsContainer: {
    position: 'absolute',
    bottom: -30,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  labelText: {
    position: 'absolute',
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: 'center',
    width: 50
  },
  yAxisLabels: {
    position: 'absolute',
    left: -40,
    height: '100%'
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: 12,
    color: COLORS.darkGray
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  confirmedJobCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.blue
  },
  pendingJobCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.orange
  },
  completedJobCard: {
    borderLeftWidth: 5,
    borderLeftColor: COLORS.green
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  jobServiceBadge: {
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  jobServiceText: {
    color: COLORS.blue,
    fontWeight: '500',
    fontSize: 12
  },
  jobPrice: {
    color: COLORS.darkGray,
    fontWeight: 'bold',
    fontSize: 16
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 10
  },
  jobInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  jobInfoText: {
    marginLeft: 8,
    color: COLORS.darkGray,
    fontSize: 14,
    flex: 1
  },
  expandIconContainer: {
    alignItems: 'center',
    marginTop: 5
  },
  jobExpandedContent: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray
  },
  jobSectionTitle: {
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 5,
    fontSize: 14
  },
  jobDescription: {
    color: COLORS.darkGray,
    marginBottom: 15,
    lineHeight: 20
  },
  feedbackContainer: {
    marginBottom: 15
  },
  feedbackText: {
    color: COLORS.darkGray,
    fontStyle: 'italic',
    marginTop: 5
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    flexWrap: 'wrap'
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 2.5,
    marginBottom: 5
  },
  locationButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.blue,
    justifyContent: 'center'
  },
  locationButtonActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green
  },
  primaryButton: {
    backgroundColor: COLORS.blue
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.blue
  },
  actionButtonText: {
    fontWeight: '600',
    color: COLORS.white
  },
  secondaryButtonText: {
    color: COLORS.blue
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    marginBottom: 15
  },
  emptyStateText: {
    color: COLORS.mediumGray,
    marginTop: 10,
    fontSize: 16
  },
  jobsTabContainer: {
    flex: 1
  },
  jobListContainer: {
    paddingHorizontal: 15,
    paddingTop: 15
  },
  jobListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  jobListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: 20,
    marginBottom: 15
  },
  pendingBadge: {
    backgroundColor: COLORS.orange,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pendingBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  notificationsContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 20
  },
  notificationsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 20
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue
  },
  notificationIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  notificationContent: {
    flex: 1
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.mediumGray
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.blue
  },
  chatList: {
    paddingBottom: 30,
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  unreadChatCard: {
    backgroundColor: COLORS.lightBlue,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.lightBlue,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  chatTime: {
    fontSize: 12,
    color: COLORS.darkGray,
    opacity: 0.6,
  },
  chatPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.8,
  },
  unreadText: {
    fontWeight: '600',
    opacity: 1,
  },
  unreadBadge: {
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  unreadCount: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  accountContainer: {
    flex: 1,
    paddingTop: 20
  },
  accountProfileSection: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 20
  },
  accountProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15
  },
  accountName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 8
  },
  accountRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  accountRatingText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginLeft: 5,
    fontWeight: '600'
  },
  editProfileButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20
  },
  editProfileButtonText: {
    color: COLORS.white,
    fontWeight: '600'
  },
  accountStatsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    marginBottom: 20
  },
  accountStatCard: {
    flex: 1,
    alignItems: 'center'
  },
  accountStatDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray
  },
  accountStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 5
  },
  accountStatLabel: {
    fontSize: 13,
    color: COLORS.mediumGray
  },
  accountMenuSection: {
    backgroundColor: COLORS.white,
    marginBottom: 20
  },
  accountMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray
  },
  accountMenuItemText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGray,
    marginLeft: 15
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E53935'
  },
  logoutButtonText: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 10,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative'
  },
  navLabel: {
    fontSize: 10,
    color: COLORS.darkGray,
    marginTop: 4
  },
  activeNavLabel: {
    color: COLORS.blue,
    fontWeight: '600'
  },
  navBadge: {
    position: 'absolute',
    top: 0,
    right: '30%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.red
  }
});
export default ServiceProviderDashboard;