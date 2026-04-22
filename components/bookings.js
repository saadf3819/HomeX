import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { COLORS } from './colors';
import { app } from '../integrations/firebase';

const Bookings = ({ navigation }) => {
  const [selectedSegment, setSelectedSegment] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const db = getFirestore(app);
const handleCancelJob = async (job) => {
  try {
    const jobRef = doc(db, "jobs", job.id);

    // 1️⃣ Update job status to cancelled
    await updateDoc(jobRef, { status: "cancelled" });

    Alert.alert("⚠️ Job Cancelled", "This booking has been cancelled.");

    // 2️⃣ Refresh bookings
    fetchUserBookings();
  } catch (error) {
    console.error("❌ Error cancelling job:", error);
    Alert.alert("Error", "Could not cancel this booking.");
  }
};

  // ✅ Fetch all bookings for this user
  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userid');
      if (!userId) {
        console.log('⚠️ No user ID found');
        setBookings([]);
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'jobs'), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      const jobs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ✅ Remove duplicates by creating a unique key
      const uniqueJobsMap = new Map();
      jobs.forEach((job) => {
        const uniqueKey = `${job.userId}_${job.providerId}_${job.date}_${job.category}`;
        if (!uniqueJobsMap.has(uniqueKey)) {
          uniqueJobsMap.set(uniqueKey, job);
        }
      });
const uniqueJobs = Array.from(uniqueJobsMap.values());

// 🔽 Sort so the latest bookings appear on top
const sortedJobs = uniqueJobs.sort((a, b) => {
  return new Date(b.date) - new Date(a.date);
});

setBookings(sortedJobs);

      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserBookings();
    setRefreshing(false);
  };

  const handleCompleteJob = async (job) => {
  try {
    const jobRef = doc(db, "jobs", job.id);

    // 1️⃣ Update job status to completed
    await updateDoc(jobRef, { status: "completed" });

    // 2️⃣ Get provider ID from job
    const providerId = job.providerId;

    // 3️⃣ Fetch service provider document
    const providerRef = doc(db, "serviceProviders", providerId);
    const providerSnap = await getDocs(
      query(collection(db, "serviceProviders"), where("uid", "==", providerId))
    );

    if (providerSnap.empty) {
      console.log("❌ Provider not found");
      return;
    }

    const providerDoc = providerSnap.docs[0];
    const providerData = providerDoc.data();

    // 4️⃣ Deduct 7% from wallet
    const jobPrice = Number(job.price);
    const deduction = jobPrice * 0.10; // 7%
    const updatedWallet = Number(providerData.wallet) - deduction;

    // 5️⃣ Update provider wallet
    await updateDoc(doc(db, "serviceProviders", providerDoc.id), {
      wallet: updatedWallet,
    });

    console.log("💰 Wallet Updated:", updatedWallet);

    Alert.alert("✅ Job Completed", "You can now rate this service.", [
      {
        text: "OK",
        onPress: () => navigation.navigate("RateReview", { job }),
      },
    ]);

    fetchUserBookings();
  } catch (error) {
    console.error("❌ Error completing job:", error);
    Alert.alert("Error", "Could not complete job or update wallet.");
  }
};


  const filteredBookings = bookings.filter((booking) =>
    selectedSegment === 'upcoming'
      ? booking.status === 'booked' || booking.status === 'confirmed'
      : booking.status === 'completed' || booking.status === 'cancelled'
  );





const renderBookingItem = ({ item }) => (
  <View style={styles.bookingCard}>
    <Image
      source={require('../assets/plumber.jpg')}
      style={styles.providerImage}
    />
    <View style={styles.bookingDetails}>
      <Text style={styles.serviceName}>{item.category}</Text>
      <Text style={styles.providerName}>{item.providerName}</Text>

      <View style={styles.timeContainer}>
        <MaterialIcons name="calendar-today" size={16} color={COLORS.darkGray} />
        <Text style={styles.timeText}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'booked'
                  ? COLORS.lightBlue
                  : item.status === 'completed'
                  ? '#E8F5E9'
                  : '#FFEBEE',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === 'booked'
                    ? COLORS.blue
                    : item.status === 'completed'
                    ? '#43A047'
                    : '#E53935',
              },
            ]}
          >
            {item.status}
          </Text>
        </View>

        <Text style={styles.priceText}>₨{item.price}</Text>
      </View>

      {selectedSegment === 'upcoming' ? (
  <View style={styles.actionContainer}>

    {/* FIRST ROW -> Cancel + Start Tracking */}
    <View style={styles.firstRowButtons}>
      <TouchableOpacity style={styles.cancelButton}
       onPress={() => handleCancelJob(item)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.rescheduleButton, { marginLeft: 8 }]}
        onPress={() =>
          navigation.navigate('ClientTrackingMap', {
            providerId: item.providerId,
          })
        }
      >
        <Text style={styles.rescheduleButtonText}>Start Tracking</Text>
      </TouchableOpacity>
    </View>

    {/* SECOND ROW -> Completed below Cancel */}
    <TouchableOpacity
      style={[styles.completedButton, { marginTop: 8 }]}
      onPress={() => handleCompleteJob(item)}
    >
      <Text style={styles.completedButtonText}>Completed</Text>
    </TouchableOpacity>

  </View>
)  : (
        <TouchableOpacity
          style={styles.rateButton}
          onPress={() => navigation.navigate('RateReview', { job: item })}
        >
          <Text style={styles.rateButtonText}>Rate Service</Text>
          <MaterialIcons name="star-border" size={18} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Bookings</Text>
        </View>

        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedSegment === 'upcoming' && styles.activeSegment,
            ]}
            onPress={() => setSelectedSegment('upcoming')}
          >
            <Text
              style={[
                styles.segmentText,
                selectedSegment === 'upcoming' && styles.activeSegmentText,
              ]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedSegment === 'past' && styles.activeSegment,
            ]}
            onPress={() => setSelectedSegment('past')}
          >
            <Text
              style={[
                styles.segmentText,
                selectedSegment === 'past' && styles.activeSegmentText,
              ]}
            >
              Past
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.blue} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="assignment" size={48} color={COLORS.lightBlue} />
                <Text style={styles.emptyText}>
                  No {selectedSegment} bookings found
                </Text>
              </View>
            }
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
  },
  header: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBlue,
  },
  completedButton: {
  backgroundColor: '#4CAF50',
  borderRadius: 20,
  paddingVertical: 6,
  paddingHorizontal: 16,
  marginLeft: 8,
},
completedButtonText: {
  color: COLORS.white,
  fontSize: 12,
  fontWeight: '500',
},

  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  segmentContainer: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lightBlue,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeSegment: {
    backgroundColor: COLORS.blue,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.darkGray,
  },
  activeSegmentText: {
    color: COLORS.white,
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    elevation: 2,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  bookingDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.8,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue,
  },
actionContainer: {
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8, // optional spacing
},
firstRowButtons: {
  flexDirection: 'row',
  alignItems: 'center',
}
,
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.lightBlue,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '500',
  },
  rescheduleButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  rescheduleButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  rateButton: {
    backgroundColor: COLORS.blue,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginTop: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default Bookings;
