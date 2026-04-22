import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from "../../../integrations/firebase";
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET, SELFIE_VERIFICATION_URL } from '@env';

export default function SelfieScreen({ navigation,route }) {
  const [selfie, setSelfie] = useState(null);
  const [loading, setLoading] = useState(false);
  const { cnicFace } = route.params || {}; // <-- This will also be uploaded to Cloudinary
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dizlxll8w/image/upload";
  const UPLOAD_PRESET = "unsigned_preset"; // create one in Cloudinary dashboard (unsigned)

  // Upload to Cloudinary and return URL
  const uploadToCloudinary = async (base64Image) => {
    try {
      let formData = new FormData();
      formData.append("file", `data:image/jpeg;base64,${base64Image}`);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log('uplaoded success image',data)
      return data.secure_url; // Cloudinary gives a hosted image URL
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      return null;
    }
  };

  const takeSelfie = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Camera access is needed to take a selfie.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled) {
        setSelfie(result.assets[0].uri);

        // Upload selfie + CNIC face to Cloudinary
        const selfieUrl = await uploadToCloudinary(result.assets[0].base64);
        const cnicUrl = await uploadToCloudinary(cnicFace);

        if (selfieUrl && cnicUrl) {
          verifySelfie(selfieUrl, cnicUrl);
        } else {
          Alert.alert("Upload Error", "Could not upload images to Cloudinary.");
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Something went wrong while taking selfie.");
    }
  };

  
const verifySelfie = async (selfieUrl, cnicUrl) => {
  try {
    setLoading(true); // use the useState variable
    const apiUrl = "https://selfie-production-9ae9.up.railway.app/verify";

    let formData = new FormData();
    formData.append("file1", { uri: cnicUrl, type: "image/jpeg", name: "cnic.jpg" });
    formData.append("file2", { uri: selfieUrl, type: "image/jpeg", name: "selfie.jpg" });

    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    });

    const result = await response.json();
    console.log("API Response:", result);

    if (result.final_verified) {
      const userId = await AsyncStorage.getItem('userid');
      if (userId) {
        const userRef = doc(db, "serviceProviders", userId);
        await updateDoc(userRef, { isVerified: true });
      }

      Alert.alert("✅ Verification Successful", "Selfie matches the CNIC face.");
      navigation.navigate('ServiceProviderForm'); // use prop
    } else {
      Alert.alert("❌ Verification Failed", "Selfie does not match CNIC face.");
    }
  } catch (error) {
    console.error("Verification error:", error);
    Alert.alert("Error", "Failed to verify selfie.");
  } finally {
    setLoading(false);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Take a Selfie for Verification</Text>

      {selfie && <Image source={{ uri: selfie }} style={styles.image} />}

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={takeSelfie}>
          <Text style={styles.buttonText}>📸 Take Selfie</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  image: { width: 250, height: 250, borderRadius: 125, marginBottom: 20, borderWidth: 2, borderColor: "#007bff" },
  button: { backgroundColor: "#007bff", padding: 15, borderRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
