import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { app, auth } from '../../../integrations/firebase';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  blue: '#007BFF',
  lightBlue: '#D7EAFD',
  darkGray: '#4A4A4A',
  yellow: '#FFE680',
  white: '#FFFFFF',
  errorRed: '#FF3333'
};

const serviceCategories = [
  { id: 'plumbing', label: 'Plumbing', icon: 'water', description: 'Water systems and fixture repairs' },
  { id: 'electrician', label: 'Electrical', icon: 'flash', description: 'Electrical repairs and installations' },
  { id: 'cleaning', label: 'Cleaning', icon: 'sparkles', description: 'Home cleaning and organization' },
  { id: 'Photography', label: 'Photography', icon: 'camera', description: 'Capture memorable moments with professional photography services.' },
  { id: 'errands', label: 'Errands', icon: 'cart', description: 'Shopping and delivery tasks' },
 { 
  id: 'carpenter', 
  label: 'Carpentry', 
  icon: 'hammer', 
  description: 'Professional woodwork, furniture repair, and custom carpentry services.' 
},
 { 
  id: 'ac_repair', 
  label: 'AC Repair', 
  icon: 'snow', 
  description: 'Expert air conditioning installation, maintenance, and repair services.' 
},
  { id: 'events', label: 'Events', icon: 'calendar', description: 'Event planning and organization' },
 { 
  id: 'painting', 
  label: 'Painting', 
  icon: 'color-palette', 
  description: 'Professional wall painting and interior finishing services for your home or office.' 
}
];

const formConfig = {
  login: {
    fields: [
      { id: 'email', placeholder: 'Email', icon: 'mail', keyboardType: 'email-address' },
      { id: 'password', placeholder: 'Password', icon: 'lock-closed', secure: true }
    ],
    button: { text: 'Sign In', color: COLORS.blue },
    switchText: "Don't have a provider account? ",
    switchLink: 'Register as Provider'
  },
  signup: {
    fields: [
      { id: 'name', placeholder: 'Full Name', icon: 'person' },
      { id: 'email', placeholder: 'Email', icon: 'mail', keyboardType: 'email-address' },
      { id: 'phone', placeholder: 'Phone Number', icon: 'call', keyboardType: 'phone-pad' },
      { id: 'cnic', placeholder: 'CNIC (35201-1234567-8)', icon: 'card', keyboardType: 'number-pad' },
      { id: 'address', placeholder: 'Current Address', icon: 'home' },
      { id: 'password', placeholder: 'Password', icon: 'lock-closed', secure: true }
    ],
    button: { text: 'Verify Your Identity', color: COLORS.blue },
    switchText: "Already have a provider account? ",
    switchLink: 'Sign In'
  }
};

const ServiceProviderLogin = () => {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const currentForm = isLogin ? formConfig.login : formConfig.signup;

  const validateField = (id, value) => {
    let error = '';
    switch (id) {
      case 'email':
        if (!value.trim()) error = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        break;
      case 'password':
        if (!value) error = 'Password is required';
        else if (value.length < 6) error = 'Password must be at least 6 characters';
        else if (!/[A-Z]/.test(value)) error = 'Password must contain at least one capital letter';
        break;
      case 'name':
        if (!value.trim()) error = 'Name is required';
        else if (/\d/.test(value)) error = 'Name cannot contain numbers';
        break;
      case 'phone':
        if (!value.trim()) error = 'Phone number is required';
        else if (!/^\d+$/.test(value)) error = 'Phone number must contain only digits';
        else if (value.length > 11) error = 'Phone number cannot exceed 11 digits';
        break;
      case 'cnic':
        const digitsOnly = value.replace(/\D/g, '');
        if (!value.trim()) error = 'CNIC is required';
        else if (digitsOnly.length !== 13) error = 'CNIC must be 13 digits';
        break;
      case 'address':
        if (!value.trim()) error = 'Address is required';
        break;
    }
    return error;
  };

  const formatCNIC = (text) => {
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly.length <= 5) {
      return digitsOnly;
    } else if (digitsOnly.length <= 12) {
      return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5)}`;
    } else {
      return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 12)}-${digitsOnly.slice(12, 13)}`;
    }
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    if (field === 'cnic') {
      formattedValue = formatCNIC(value);
    }
    setFormData({ ...formData, [field]: formattedValue });
    setFormErrors({ ...formErrors, [field]: validateField(field, formattedValue) });
  };

  const validateForm = () => {
    const errors = {};
    currentForm.fields.forEach(field => {
      const error = validateField(field.id, formData[field.id] || '');
      if (error) errors[field.id] = error;
    });
    if (!isLogin && !selectedCategory) {
      errors.categories = 'Please select one service category';
    }
    if (!checked) {
      errors.checkbox = 'Please accept the terms and conditions';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

 const handleAuth = async () => {
  if (!validateForm()) return;

  try {
    setIsLoading(true);
    const db = getFirestore(app);
    const authInstance = getAuth(app);

    // ✅ Clear old AsyncStorage data before any new login/signup
    await AsyncStorage.clear();

    if (isLogin) {
      // -------------------- LOGIN --------------------
      const userCredential = await signInWithEmailAndPassword(
        authInstance,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // ✅ Save user id in AsyncStorage
      await AsyncStorage.setItem('userid', user.uid);

      // Fetch provider data
      const providerDoc = await getDoc(doc(db, "serviceProviders", user.uid));

      if (!providerDoc.exists()) {
        setFormErrors({ general: "No service provider account found with this email." });
        return;
      }
      const providerData = providerDoc.data();

      // Check for price and description
      if (providerData.price && providerData.description) {
        // Go directly to Dashboard
        navigation.navigate("serviceprovider_dashboard");
      } else {
        // Incomplete profile → go to form
        navigation.navigate("ServiceProviderForm");
      }

    } else {
      // -------------------- SIGNUP --------------------
      const userCredential = await createUserWithEmailAndPassword(
        authInstance,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // ✅ Save new user id in AsyncStorage
      await AsyncStorage.setItem('userid', user.uid);

      // Save provider basic data
      await setDoc(doc(db, "serviceProviders", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cnic: formData.cnic,
        isVerified:false,
        address: formData.address,
        serviceCategory: selectedCategory,
        createdAt: new Date().toISOString(),
      });

      // Navigate to CNIC verification screen after signup
      navigation.navigate("cnic_verifciation", {
        cnic: formData.cnic,
        name: formData.name,
      });
    }

  } catch (error) {
    console.error("Auth Error:", error);
    setFormErrors({
      ...formErrors,
      general: error.message || "An error occurred. Please try again.",
    });
  } finally {
    setIsLoading(false);
  }
};
  const handleSwitch = () => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true
      })
    ]).start(() => {
      setIsLogin(!isLogin);
      setFormData({});
      setFormErrors({});
      setSelectedCategory(null);
      setChecked(false);
    });
  };

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true })
    ]).start();
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setFormErrors({ ...formErrors, categories: null });
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50]
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/homexlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          {isLogin ? 'Provider Login' : 'Become a HomeX Provider'}
        </Text>

        <Text style={styles.subtitle}>
          {isLogin
            ? 'Access your provider dashboard'
            : 'Join our network of verified professionals'}
        </Text>

        {formErrors.general && (
          <Text style={styles.errorText}>{formErrors.general}</Text>
        )}

        <Animated.View style={{ transform: [{ translateX }] }}>
          {currentForm.fields.map((field) => (
            <View key={field.id}>
              <Animated.View style={[
                styles.inputContainer,
                formErrors[field.id] && styles.inputError
              ]}>
                <Ionicons
                  name={field.icon}
                  size={20}
                  color={formErrors[field.id] ? COLORS.errorRed : COLORS.blue}
                />
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor="#999"
                  secureTextEntry={field.secure}
                  keyboardType={field.keyboardType}
                  onChangeText={(text) => handleInputChange(field.id, text)}
                  value={formData[field.id] || ''}
                  maxLength={field.id === 'cnic' ? 15 : undefined}
                />
              </Animated.View>
              {formErrors[field.id] && (
                <Text style={styles.errorText}>{formErrors[field.id]}</Text>
              )}
            </View>
          ))}
        </Animated.View>

        {!isLogin && (
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Select Your Service:</Text>
            {formErrors.categories && (
              <Text style={styles.errorText}>{formErrors.categories}</Text>
            )}
            <View style={styles.serviceCardContainer}>
              {serviceCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.serviceCard,
                    selectedCategory === category.id && styles.selectedServiceCard
                  ]}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.iconContainer,
                    selectedCategory === category.id && styles.selectedIconContainer
                  ]}>
                    <Ionicons
                      name={category.icon}
                      size={24}
                      color={selectedCategory === category.id ? COLORS.white : COLORS.blue}
                    />
                  </View>
                  <Text style={[
                    styles.serviceCardTitle,
                    selectedCategory === category.id && styles.selectedServiceText
                  ]}>
                    {category.label}
                  </Text>
                  <Text style={[
                    styles.serviceCardDescription,
                    selectedCategory === category.id && styles.selectedServiceText
                  ]}>
                    {category.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.checkboxContainer}>
          <Checkbox
            status={checked ? 'checked' : 'unchecked'}
            onPress={() => {
              setChecked(!checked);
              setFormErrors({ ...formErrors, checkbox: !checked ? '' : 'Please accept the terms and conditions' });
            }}
            color={formErrors.checkbox ? COLORS.errorRed : COLORS.blue}
          />
          <Text style={styles.checkboxLabel}>
            {isLogin ? 'I agree to the ' : 'I agree to all '}
            <Text style={styles.link} onPress={() => console.log('Terms of Service')}>
              Terms & Conditions
            </Text>
            {!isLogin && (
              <Text>
                {' '}and <Text style={styles.link} onPress={() => console.log('Provider Policy')}>
                  Provider Policies
                </Text>
              </Text>
            )}
          </Text>
        </View>
        {formErrors.checkbox && (
          <Text style={styles.errorText}>{formErrors.checkbox}</Text>
        )}

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: currentForm.button.color,
                opacity: isLoading ? 0.7 : 1
              }
            ]}
            onPressIn={handleButtonPress}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>{currentForm.button.text}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity onPress={handleSwitch} style={styles.switch}>
          <Text style={styles.switchText}>
            {currentForm.switchText}
            <Text style={styles.link}>{currentForm.switchLink}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBlue,
  },
  contentContainer: {
    padding: 25,
    paddingTop: 40,
    paddingBottom: 100
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 25,
    textAlign: 'center',
    opacity: 0.8
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 12,
    marginVertical: 8,
    elevation: 2,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  inputError: {
    borderColor: COLORS.errorRed
  },
  errorText: {
    color: COLORS.errorRed,
    fontSize: 12,
    marginLeft: 10,
    marginBottom: 5
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.darkGray,
    fontSize: 16
  },
  categorySection: {
    marginTop: 15,
    marginBottom: 10
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 12
  },
  serviceCardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  serviceCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center'
  },
  selectedServiceCard: {
    backgroundColor: COLORS.blue
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  serviceCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: 4,
    textAlign: 'center'
  },
  serviceCardDescription: {
    fontSize: 11,
    color: COLORS.darkGray,
    opacity: 0.7,
    textAlign: 'center'
  },
  selectedServiceText: {
    color: COLORS.white
  },
  button: {
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 20
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16
  },
  switch: {
    marginTop: 15,
    alignSelf: 'center'
  },
  switchText: {
    color: COLORS.darkGray
  },
  link: {
    color: COLORS.blue,
    fontWeight: '500'
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10
  },
  checkboxLabel: {
    color: COLORS.darkGray,
    marginLeft: 8,
    fontSize: 14,
    flex: 1
  }
});

export default ServiceProviderLogin;