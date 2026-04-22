import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { app } from '../integrations/firebase';
import { useSelector } from 'react-redux';
import { COLORS } from './colors';

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dizlxll8w/image/upload";
const UPLOAD_PRESET = "unsigned_preset";

const EditProfile = ({ navigation }) => {
  const getdata = useSelector(state => state.users);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getdata) {
      setName(getdata.name || '');
      setEmail(getdata.email || '');
      setPhone(getdata.phone || '');
      setAddress(getdata.address || '');
      setPhoto(getdata.photo || null);
    }
  }, [getdata]);

  // Pick image and upload
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Library access is needed to pick an image.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true, // important for Cloudinary
      });

      if (!result.canceled) {
        uploadImageToCloudinary(result.assets[0].base64);
      }
    } catch (error) {
      console.error("ImagePicker error:", error);
    }
  };

  const uploadImageToCloudinary = async (base64Image) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${base64Image}`);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setPhoto(data.secure_url);
      setLoading(false);
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      setLoading(false);
      Alert.alert("Upload Failed", "Could not upload image. Try again.");
    }
  };

  const saveProfile = async () => {
    try {
      if (!getdata?.uid) return;

      const db = getFirestore(app);
      const userRef = doc(db, 'users', getdata.uid);

      await updateDoc(userRef, {
        name,
        email,
        phone,
        address,
        photo,
      });

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <LinearGradient
        colors={[COLORS.blue, '#4DA3FF', '#6BB6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.blue} />
          ) : (
            <Image 
              source={{ uri: photo || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfVuGdiPJQRi4thppytG_8zWv9UgS0MCvgiQ&s' }} 
              style={styles.avatar} 
            />
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="white" />
          </View>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput 
            value={name} 
            onChangeText={setName} 
            style={styles.input} 
            placeholder="Enter your name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            value={email} 
            onChangeText={setEmail} 
            style={styles.input} 
            placeholder="Enter your email"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone</Text>
          <TextInput 
            value={phone} 
            onChangeText={setPhone} 
            style={styles.input} 
            placeholder="Enter your phone"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput 
            value={address} 
            onChangeText={setAddress} 
            style={[styles.input, { height: 80 }]} 
            placeholder="Enter your address"
            multiline
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <LinearGradient
            colors={[COLORS.blue, '#4DA3FF', '#6BB6FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveGradient}
          >
            <Text style={styles.saveText}>Save Changes</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FBFF' },
  header: {
    paddingTop: StatusBar.currentHeight + 20,
    paddingBottom: 40,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  contentContainer: { padding: 20, paddingTop: 30 },
  avatarContainer: { alignSelf: 'center', marginBottom: 30, position: 'relative' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: COLORS.blue },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.blue,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  saveButton: { marginTop: 10, borderRadius: 15, overflow: 'hidden' },
  saveGradient: { paddingVertical: 15, alignItems: 'center', borderRadius: 15 },
  saveText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
