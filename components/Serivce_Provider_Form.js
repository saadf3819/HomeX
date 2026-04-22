// import React, { useState } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { doc, updateDoc, getFirestore } from "firebase/firestore";
// import { app } from '../integrations/firebase';
// import { getAuth } from 'firebase/auth';
// const COLORS = {
//   primary: '#667eea',
//   primaryDark: '#764ba2',
//   background: '#f8faff',
//   surface: '#ffffff',
//   text: '#2d3748',
//   border: '#e2e8f0',
//   white: '#ffffff',
// };

// const ServiceInfoForm = ({ navigation }) => {
//   const [price, setPrice] = useState('');
//   const [description, setDescription] = useState('');

//   const handleSave = async () => {
//   if (!price) {
//     Alert.alert("Missing Field", "Please enter a price.");
//     return;
//   }

//   try {
//     const auth = getAuth();
//     const user = auth.currentUser;
//     if (!user) {
//       Alert.alert("Error", "No user logged in.");
//       return;
//     }

//     const db = getFirestore(app);
//     const providerRef = doc(db, "serviceProviders", user.uid);

//     await updateDoc(providerRef, {
//       price: price,
//       description: description,
//       updatedAt: new Date().toISOString(),
//     });

//     Alert.alert("Success", "Service info saved successfully!");
//     navigation.navigate('serviceprovider_dashboard')
//   } catch (error) {
//     console.error("Error saving service info:", error);
//     Alert.alert("Error", "Failed to save service info.");
//   }
// };


//   return (
//     <View style={styles.container}>
//       <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
//         <Text style={styles.headerTitle}>Service Information</Text>
//         <Text style={styles.headerSubtitle}>Add your price and short description</Text>
//       </LinearGradient>

//       <View style={styles.form}>
//         <Text style={styles.label}>Service Price (Rs)</Text>
//         <TextInput
//           style={styles.input}
//           value={price}
//           onChangeText={setPrice}
//           placeholder="e.g., 1500"
//           keyboardType="numeric"
//           placeholderTextColor="#999"
//         />

//         <Text style={styles.label}>Service Description</Text>
//         <TextInput
//           style={[styles.input, styles.textArea]}
//           value={description}
//           onChangeText={setDescription}
//           placeholder="Write something about your service..."
//           multiline
//           placeholderTextColor="#999"
//         />

//         <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
//           <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.saveGradient}>
//             <MaterialCommunityIcons name="content-save" size={20} color={COLORS.white} />
//             <Text style={styles.saveText}>Save</Text>
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// export default ServiceInfoForm;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   header: {
//     padding: 20,
//     paddingTop: 50,
//   },
//   headerTitle: {
//     color: COLORS.white,
//     fontSize: 22,
//     fontWeight: 'bold',
//   },
//   headerSubtitle: {
//     color: 'rgba(255,255,255,0.9)',
//     fontSize: 14,
//     marginTop: 4,
//   },
//   form: {
//     flex: 1,
//     padding: 20,
//   },
//   label: {
//     fontSize: 14,
//     color: COLORS.text,
//     marginBottom: 6,
//     fontWeight: '500',
//   },
//   input: {
//     backgroundColor: COLORS.surface,
//     borderColor: COLORS.border,
//     borderWidth: 1,
//     borderRadius: 10,
//     padding: 12,
//     marginBottom: 16,
//     color: COLORS.text,
//   },
//   textArea: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   saveButton: {
//     borderRadius: 10,
//     overflow: 'hidden',
//     marginTop: 10,
//     elevation: 4,
//     shadowColor: COLORS.primary,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//   },
//   saveGradient: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 14,
//   },
//   saveText: {
//     color: COLORS.white,
//     fontWeight: '600',
//     fontSize: 16,
//     marginLeft: 8,
//   },
// });


































import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, updateDoc, getFirestore } from "firebase/firestore";
import { app } from '../integrations/firebase';
import { getAuth } from 'firebase/auth';

const COLORS = {
  primary: '#667eea',
  primaryDark: '#764ba2',
  background: '#f8faff',
  surface: '#ffffff',
  text: '#2d3748',
  border: '#e2e8f0',
  white: '#ffffff',
};

const ServiceInfoForm = ({ navigation }) => {
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [shopAddress, setShopAddress] = useState('');

  const handleSave = async () => {
    if (!price || !shopAddress) {
      Alert.alert("Missing Field", "Please fill out all required fields (Price and Shop Address).");
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "No user logged in.");
        return;
      }

      const db = getFirestore(app);
      const providerRef = doc(db, "serviceProviders", user.uid);

      await updateDoc(providerRef, {
        price: price,
        description: description,
        shopAddress: shopAddress, // ✅ new field saved in Firestore
        updatedAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Service info saved successfully!");
      navigation.navigate('serviceprovider_dashboard');
    } catch (error) {
      console.error("Error saving service info:", error);
      Alert.alert("Error", "Failed to save service info.");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>Service Information</Text>
        <Text style={styles.headerSubtitle}>Add your price, address & service description</Text>
      </LinearGradient>

      <View style={styles.form}>
        
        {/* Price */}
        <Text style={styles.label}>Service Price (Rs)</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="e.g., 1500"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        {/* Shop Address */}
        <Text style={styles.label}>Shop Address (Required)</Text>
        <TextInput
          style={styles.input}
          value={shopAddress}
          onChangeText={setShopAddress}
          placeholder="Your shop full address..."
          placeholderTextColor="#999"
        />

        {/* Description */}
        <Text style={styles.label}>Service Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Write something about your service..."
          multiline
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.saveGradient}>
            <MaterialCommunityIcons name="content-save" size={20} color={COLORS.white} />
            <Text style={styles.saveText}>Save</Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>
    </View>
  );
};

export default ServiceInfoForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  saveGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  saveText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});
