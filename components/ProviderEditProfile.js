import React, { useEffect, useState } from 'react';
import { 
  View, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  StatusBar, 
  RefreshControl 
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './colors';
import { useDispatch } from 'react-redux';
import { clearUser } from '../redux/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, getDoc, getFirestore, doc, query, where } from 'firebase/firestore';
import { app } from '../integrations/firebase';
import { useNavigation } from '@react-navigation/native';

const ProviderProfile = () => {
  const navigation = useNavigation();
  const [userdata, setUserdata] = useState(null);
  const [jobCount, setJobCount] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const dispatch = useDispatch();
  const db = getFirestore(app);

  const menuItems = [
    { icon: 'person-outline', title: 'Edit Profile', color: '#4ECDC4' },
    { icon: 'event', title: 'My Jobs', color: '#FF6B6B' },
    { icon: 'policy', title: 'Privacy Policy', color: '#A29BFE' },
  ];


  // Fetch provider data from Firestore
  const fetchProviderData = async () => {
    try {
      const uid = await AsyncStorage.getItem('userid');
      if (!uid) return;

      const providerDoc = await getDoc(doc(db, 'serviceProviders', uid));
      if (providerDoc.exists()) {
        const data = providerDoc.data();
        console.log(data,'provider ddataaaaaa')
        setUserdata(data);
        setWalletBalance(data.wallet || 0);

        // Fetch job stats
        fetchJobStats(uid);
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
    }
  };

  // Fetch job stats
  const fetchJobStats = async (userId) => {
    try {
      if (!userId) return;

      const jobsQuery = query(collection(db, "jobs"), where("providerId", "==", userId));
      const jobsSnapshot = await getDocs(jobsQuery);
      setJobCount(jobsSnapshot.size);

      const completedQuery = query(
        collection(db, "jobs"),
        where("providerId", "==", userId),
        where("status", "==", "completed")
      );
      const completedSnapshot = await getDocs(completedQuery);
      setCompletedJobs(completedSnapshot.size);
    } catch (error) {
      console.error("Error fetching provider stats:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProviderData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProviderData();
  }, []);

  const logout = async () => {
    try {
      await AsyncStorage.clear();
      dispatch(clearUser());
      navigation.navigate('login_user');
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Gradient Header */}
      <LinearGradient
        colors={[COLORS.blue, '#4DA3FF', '#6BB6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>

          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: userdata?.photo
                    ? userdata.photo
                    : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfVuGdiPJQRi4thppytG_8zWv9UgS0MCvgiQ&s'
                }}
                style={styles.avatar}
              />
              <View style={styles.onlineIndicator} />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{userdata?.name || "Guest"}</Text>
              <Text style={styles.email}>{userdata?.email || "Guest@gmail.com"}</Text>
              {userdata?.isVerified && (
                <TouchableOpacity
                  style={styles.verifyBadge}
                  onPress={() => navigation.navigate('serviceprovider_dashboard')}
                >
                  <Ionicons name="shield-checkmark" size={14} color="#28CC9E" />
                  <Text style={styles.verifyText}>Verified Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.blue}
            colors={[COLORS.blue]}
          />
        }
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{jobCount}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{completedJobs}</Text>
            <Text style={styles.statLabel}>Completed Jobs</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>Rs {walletBalance}</Text>
            <Text style={styles.statLabel}>Wallet</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}
              onPress={() => {
                if (item.title === 'My Jobs')  navigation.navigate('serviceprovider_dashboard', { screen: 'jobs' });
                if (item.title === 'Edit Profile') navigation.navigate('EditProfileProvider');
                if (item.title === 'Privacy Policy') navigation.navigate('PrivacyPolicy');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <MaterialIcons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <View style={styles.chevronContainer}>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <MaterialIcons name="logout" size={24} color="#FF6B6B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ProviderProfile;


const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FBFF' },
  header: { paddingTop: StatusBar.currentHeight + -10, paddingBottom: 10, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingHorizontal: 25, position: 'relative', overflow: 'hidden' },
  decorativeCircle1: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)', top: -20, right: -30 },
  decorativeCircle2: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)', bottom: 20, left: -20 },
  headerContent: { alignItems: 'flex-start', zIndex: 1 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 25, letterSpacing: 0.5 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  avatarContainer: { position: 'relative', marginRight: 20 },
  avatar: { width: 85, height: 85, borderRadius: 42.5, borderWidth: 4, borderColor: 'rgba(255,255,255,0.3)' },
  onlineIndicator: { position: 'absolute', bottom: 5, right: 5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#28CC9E', borderWidth: 3, borderColor: 'white' },
  profileInfo: { flex: 1 },
  name: { fontSize: 24, fontWeight: '700', color: 'white', marginBottom: 4 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  verifyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 25, alignSelf: 'flex-start', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  verifyText: { color: '#28CC9E', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  contentContainer: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40 },
  statsCard: { backgroundColor: 'white', borderRadius: 20, padding: 20, marginBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: COLORS.blue, marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '500' },
  statDivider: { width: 1, height: 30, backgroundColor: '#E8F3FF', marginHorizontal: 10 },
  menuContainer: { backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F5F7FA' },
  lastMenuItem: { borderBottomWidth: 0 },
  menuIcon: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, color: '#333', fontWeight: '600', marginBottom: 4 },
  chevronContainer: { padding: 5 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 15, marginTop: 20, borderWidth: 1, borderColor: '#FFE5E5' },
  logoutText: { color: '#FF6B6B', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
