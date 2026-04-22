import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
ScrollView,
  ActivityIndicator,
  Animated,
  StatusBar,
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CNIC_BACKEND_URL } from '@env';


const { width } = Dimensions.get('window');

const COLORS = {
  primaryBlue: '#2563EB', // Modern, vibrant blue
  secondaryBlue: '#60A5FA', // Lighter blue for gradient
  accentGreen: '#10B981', // Fresh mint green for success
  errorRed: '#EF4444', // Bright red for errors
  softWhite: '#F8FAFC', // Very light background
  darkGray: '#1F2937', // Darker text for contrast
  mediumGray: '#6B7280', // Medium gray for secondary text
  lightGray: '#E5E7EB', // For borders and subtle elements
  white: '#FFFFFF',
  cardBg: '#F1F5F9', // Light card background
  shadow: 'rgba(0, 0, 0, 0.1)', // Shadow color
};

const CNICVerification = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cnic: providedCnic, name: providedName } = route.params || {};
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const resultSlideUp = useRef(new Animated.Value(50)).current;

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(resultSlideUp, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
    })();
  }, []);

  // Animation for button press
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.spring(buttonScale, { 
        toValue: 0.92, 
        friction: 8, 
        useNativeDriver: true 
      }),
      Animated.spring(buttonScale, { 
        toValue: 1, 
        friction: 6, 
        useNativeDriver: true 
      })
    ]).start();
  };

  const pickImage = async () => {
    if (hasPermission !== true) {
      alert('Gallery permissions are required to select a CNIC image.');
      return;
    }

    animateButtonPress();
    setLoading(true);
    setVerificationResult(null);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 2],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        await verifyCNIC(result.assets[0].uri);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image. Please try again.');
      setLoading(false);
    }
  };

  // const verifyCNIC = async (uri) => {
  //   try {
  //     setLoading(true);
  //     const base64Image = await FileSystem.readAsStringAsync(uri, {
  //       encoding: FileSystem.EncodingType.Base64,
  //     });
  //     const base64String = `data:image/jpeg;base64,${base64Image}`;

  //     const serverIP = 'http://192.168.1.7:8000';
  //     const response = await axios.post(`${serverIP}/api/verify-cnic/`, {
  //       image: base64String,
  //     }, {
  //       timeout: 10000,
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //     });

  //     const { extracted_text, valid, cnic_number, name, error,face_image } = response.data;
  //     setExtractedText(extracted_text);

  //     const cleanProvidedCnic = providedCnic ? providedCnic.replace(/[-\s]/g, '') : '';
  //     const cleanExtractedCnic = cnic_number ? cnic_number.replace(/[-\s]/g, '') : '';

  //     let cnicMatch = false;
  //     let nameMatch = false;

  //     if (cleanProvidedCnic && cleanExtractedCnic) {
  //       cnicMatch = cleanProvidedCnic === cleanExtractedCnic;
  //     }

  //     if (providedName && name) {
  //       nameMatch = providedName.trim().toLowerCase() === name.trim().toLowerCase();
  //     }

  //     if (valid && cnicMatch) {
  //       setVerificationResult({
  //         valid: true,
  //         number: cnic_number,
  //         name,
  //         face_image,
  //         message: nameMatch ? 'CNIC and name verified successfully!' : 'CNIC verified successfully!'
  //       });
  //       // Navigate to ServiceProviderDashboard after a short delay to show success message
  //       // setTimeout(() => {
  //       //   navigation.navigate('serviceprovider_dashboard');
  //       // }, 1500); // 1.5 seconds delay
  //     } else {
  //       let errorMessage = 'CNIC verification failed';
  //       if (!valid) {
  //         errorMessage = error || 'Invalid CNIC image';
  //       } else if (!cnicMatch) {
  //         errorMessage = 'CNIC number does not match provided CNIC';
  //       } else if (!nameMatch) {
  //         errorMessage = 'Name does not match provided name';
  //       }
  //       setVerificationResult({
  //         valid: false,
  //         number: cnic_number,
  //         name,
  //         face_image,
  //         error: errorMessage
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error verifying CNIC:', error.message || error);
  //     let errorMessage = 'Network error. Ensure the server is running and accessible.';
  //     if (error.code === 'ECONNABORTED') {
  //       errorMessage = 'Request timed out. Check server connection.';
  //     } else if (error.response) {
  //       console.log('Response Data:', error.response.data);
  //       errorMessage = error.response.data.error || 'Invalid request';
  //     }
  //     setVerificationResult({ valid: false, error: errorMessage });
  //   } finally {
  //     setLoading(false);
      
  //     // Animate result appearance
  //     if (!verificationResult) {
  //       Animated.parallel([
  //         Animated.timing(fadeAnim, {
  //           toValue: 1,
  //           duration: 500,
  //           useNativeDriver: true,
  //         }),
  //         Animated.spring(resultSlideUp, {
  //           toValue: 0,
  //           tension: 50,
  //           friction: 7,
  //           useNativeDriver: true,
  //         })
  //       ]).start();
  //     }
  //   }
  // };






// inside CNICVerification component (replace verifyCNIC function body)
const verifyCNIC = async (uri) => {
  try {
    setLoading(true);
    setVerificationResult(null);
    const base64Image = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const base64String = `data:image/jpeg;base64,${base64Image}`;

    // const serverIP = 'http://192.168.1.3:8000';
    const serverIP = 'https://web-production-467d3d.up.railway.app';
    const response = await axios.post(`${serverIP}/api/verify-cnic/`, {
      image: base64String,
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { extracted_text, valid, cnic_number, name, error, face_image } = response.data;
    setExtractedText(extracted_text);

    const cleanProvidedCnic = providedCnic ? providedCnic.replace(/[-\s]/g, '') : '';
    const cleanExtractedCnic = cnic_number ? cnic_number.replace(/[-\s]/g, '') : '';

    let cnicMatch = false;
    let nameMatch = false;

    if (cleanProvidedCnic && cleanExtractedCnic) {
      cnicMatch = cleanProvidedCnic === cleanExtractedCnic;
    }

    if (providedName && name) {
      nameMatch = providedName.trim().toLowerCase() === name.trim().toLowerCase();
    }

    if (valid && cnicMatch) {
      setVerificationResult({
        valid: true,
        number: cnic_number,
        name,
        message: nameMatch ? 'CNIC and name verified successfully!' : 'CNIC verified successfully!',
        face_image, // base64 from backend (no header)
      });
      // DO NOT auto-navigate — let user capture selfie (button appears)
    } else {
      let errorMessage = 'CNIC verification failed';
      if (!valid) {
        errorMessage = error || 'Invalid CNIC image';
      } else if (!cnicMatch) {
        errorMessage = 'CNIC number does not match provided CNIC';
      } else if (!nameMatch) {
        errorMessage = 'Name does not match provided name';
      }
      setVerificationResult({
        valid: false,
        number: cnic_number,
        name,
        error: errorMessage
      });
    }
  } catch (error) {
    console.error('Error verifying CNIC:', error.message || error);
    let errorMessage = 'Network error. Ensure the server is running and accessible.';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out. Check server connection.';
    } else if (error.response) {
      console.log('Response Data:', error.response.data);
      errorMessage = error.response.data.error || 'Invalid request';
    }
    setVerificationResult({ valid: false, error: errorMessage });
  } finally {
    setLoading(false);
    // Animate result
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(resultSlideUp, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }
};




  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Initializing verification...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="no-photography" size={70} color={COLORS.errorRed} />
        <Text style={styles.errorText}>Gallery Access Required</Text>
        <Text style={styles.permissionText}>
          Please grant gallery permissions in your device settings to use this feature.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView>
    <View style={styles.mainContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
   
      <LinearGradient
        colors={[COLORS.primaryBlue, COLORS.secondaryBlue]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CNIC Verification</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.contentContainer, 
            { opacity: fadeAnim, transform: [{ translateY: resultSlideUp }] }
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Verify Your CNIC</Text>
            <Text style={styles.subtitle}>
              Select a clear image of your CNIC to verify your identity
            </Text>
          </View>

      
          <View style={styles.imageSection}>
            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <View style={styles.imageBadge}>
                  <Ionicons name="document" size={16} color={COLORS.white} />
                  <Text style={styles.imageBadgeText}>CNIC Image</Text>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="id-card-outline" size={70} color={COLORS.primaryBlue} />
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}

         
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[
                  styles.button,
                  image ? styles.secondaryButton : styles.primaryButton
                ]}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={image ? "refresh-circle" : "image"} 
                  size={24} 
                  color={image ? COLORS.primaryBlue : COLORS.white} 
                  style={styles.buttonIcon} 
                />
                <Text style={[
                  styles.buttonText,
                  image ? styles.secondaryButtonText : styles.primaryButtonText
                ]}>
                  {image ? "Select Another Image" : "Select CNIC from Gallery"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.primaryBlue} />
              <Text style={styles.loaderText}>Verifying CNIC...</Text>
            </View>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <Animated.View 
              style={[
                styles.resultContainer,
                verificationResult.valid ? styles.successContainer : styles.errorContainer,
                { opacity: fadeAnim, transform: [{ translateY: resultSlideUp }] }
              ]}
            >
              <View style={styles.resultIconContainer}>
                <Ionicons 
                  name={verificationResult.valid ? "checkmark-circle" : "close-circle"} 
                  size={40} 
                  color={verificationResult.valid ? COLORS.accentGreen : COLORS.errorRed} 
                />
              </View>
              
              <View style={styles.resultContent}>
                <Text style={[
                  styles.resultTitle,
                  verificationResult.valid ? styles.successTitle : styles.errorTitle
                ]}>
                  {verificationResult.valid ? "Verification Successful" : "Verification Failed"}
                </Text>
                
                <Text style={styles.resultMessage}>
                  {verificationResult.valid 
                    ? verificationResult.message 
                    : verificationResult.error}
                </Text>
                
                {verificationResult.valid && (
                  <View style={styles.detailsContainer}>
                    {verificationResult.number && (
                      <View style={styles.detailItem}>
                        <Ionicons name="card-outline" size={16} color={COLORS.darkGray} />
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>CNIC: </Text>
                          {verificationResult.number}
                        </Text>
                      </View>
                    )}
                    
                    {verificationResult.name && (
                      <View style={styles.detailItem}>
                        <Ionicons name="person-outline" size={16} color={COLORS.darkGray} />
                        <Text style={styles.detailText}>
                          <Text style={styles.detailLabel}>Name: </Text>
                          {verificationResult.name}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {verificationResult.valid && verificationResult.face_image && (
  <TouchableOpacity
    onPress={() => navigation.navigate('SelfieScreen', { cnicFace: verificationResult.face_image })}
    style={{
      marginTop: 12,
      backgroundColor: COLORS.primaryBlue,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      alignSelf: 'center'
    }}
  >
    <Text style={{ color: COLORS.white, fontWeight: '700' }}>Capture Selfie</Text>
  </TouchableOpacity>
)}
                 {verificationResult.face_image && (
  <View style={{ marginTop: 15, alignItems: "center" }}>
    <Text style={{ fontSize: 14, fontWeight: "600", color: COLORS.darkGray, marginBottom: 8 }}>
      Extracted CNIC Photo
    </Text>
    <Image
      source={{ uri: `data:image/jpeg;base64,${verificationResult.face_image}` }}
      style={{
        width: 120,
        height: 120,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        resizeMode: "cover",
      }}
    />
  </View>
)}

              </View>
            </Animated.View>
          )}
        </Animated.View>
      </View>
    </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.softWhite,
  },
  header: {
    paddingTop: StatusBar.currentHeight + 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.softWhite,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingTop: 10,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 15,
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginHorizontal: 20,
    lineHeight: 22,
  },
  imageSection: {
    alignItems: 'center',
    marginVertical: 15,
  },
  imagePlaceholder: {
    width: width * 0.85,
    height: 180,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 10,
    color: COLORS.mediumGray,
    fontSize: 16,
  },
  imagePreviewContainer: {
    width: width * 0.85,
    height: 180,
    borderRadius: 16,
    marginBottom: 20,
    position: 'relative',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    backgroundColor: COLORS.white,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },
  imageBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.primaryBlue,
    width: width * 0.85,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primaryBlue,
    width: width * 0.85,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: COLORS.white,
  },
  secondaryButtonText: {
    color: COLORS.primaryBlue,
  },
  loaderContainer: {
    marginVertical: 25,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  resultContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    width: width * 0.85,
    alignSelf: 'center',
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    flexDirection: 'row',
  },
  successContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accentGreen,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.errorRed,
  },
  resultIconContainer: {
    marginRight: 12,
    paddingTop: 5,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  successTitle: {
    color: COLORS.accentGreen,
  },
  errorTitle: {
    color: COLORS.errorRed,
  },
  resultMessage: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 12,
    lineHeight: 20,
  },
  detailsContainer: {
    marginTop: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 8,
  },
  detailLabel: {
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.softWhite,
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginTop: 20,
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.mediumGray,
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
});

export default CNICVerification;