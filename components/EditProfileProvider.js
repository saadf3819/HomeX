import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { app } from '../integrations/firebase';
import { COLORS } from './colors';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dizlxll8w/image/upload';
const UPLOAD_PRESET = 'unsigned_preset';

const EditProfileProvider = ({ navigation }) => {
  const db = getFirestore(app);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchProviderData = async () => {
    try {
      const uid = await AsyncStorage.getItem('userid');
      if (!uid) return;
      const docRef = doc(db, 'serviceProviders', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviderData();
  }, []);

  const handleInputChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        uploadImageToCloudinary(result.assets[0].base64);
      }
    } catch (error) {
      console.error('ImagePicker error:', error);
    }
  };

  const uploadImageToCloudinary = async (base64Image) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', `data:image/jpeg;base64,${base64Image}`);
      formData.append('upload_preset', UPLOAD_PRESET);

      const res = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        setProfile((prev) => ({ ...prev, photo: data.secure_url }));
      }
      setUploading(false);
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      setUploading(false);
      Alert.alert('Upload Failed', 'Could not upload image. Try again.');
    }
  };

  const handleSave = async () => {
    try {
      if (!profile) return;
      setSaving(true);

      const uid = await AsyncStorage.getItem('userid');
      const docRef = doc(db, 'serviceProviders', uid);

      await updateDoc(docRef, {
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        description: profile.description || '',
        price: profile.price || '',
        serviceCategory: profile.serviceCategory || '',
        photo: profile.photo || '',
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient
        colors={[COLORS.blue, '#4DA3FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{
                uri: profile?.photo
                  ? profile.photo
                  : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfVuGdiPJQRi4thppytG_8zWv9UgS0MCvgiQ&s',
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
              {uploading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="camera" size={18} color="white" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile?.name || 'Service Provider'}</Text>
          <Text style={styles.profileEmail}>{profile?.email || ''}</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {[
            { label: 'Full Name', key: 'name', type: 'default' },
            { label: 'Email', key: 'email', type: 'email-address' },
            { label: 'Phone', key: 'phone', type: 'phone-pad' },
            { label: 'Address', key: 'address', type: 'default' },
            { label: 'Service Category', key: 'serviceCategory', type: 'default' },
            { label: 'Price', key: 'price', type: 'numeric' },
          ].map((item, index) => (
            <View key={index} style={styles.inputGroup}>
              <Text style={styles.label}>{item.label}</Text>
              <TextInput
                style={styles.input}
                value={profile?.[item.key]?.toString() || ''}
                onChangeText={(text) => handleInputChange(item.key, text)}
                keyboardType={item.type}
              />
            </View>
          ))}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile?.description || ''}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.blue, '#4DA3FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveText}>Save Changes</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default EditProfileProvider;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F7FF' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingTop: StatusBar.currentHeight + 25,
    paddingBottom: 25,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  backButton: { marginRight: 10 },
  headerTitle: { color: 'white', fontSize: 22, fontWeight: '700' },

  scrollContent: { padding: 20, paddingBottom: 40 },

  profileCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 20,
    elevation: 3,
    marginBottom: 20,
  },
  profileImageContainer: { position: 'relative' },
  profileImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#E9F1FF' },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.blue,
    borderRadius: 20,
    padding: 6,
    elevation: 3,
  },
  profileName: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 10 },
  profileEmail: { fontSize: 14, color: '#777' },

  formContainer: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 2 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 14, color: '#555', fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: '#F0F5FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: { height: 100, textAlignVertical: 'top' },

  saveButton: { marginTop: 25, borderRadius: 30, overflow: 'hidden' },
  gradientButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 30,
  },
  saveText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
});
