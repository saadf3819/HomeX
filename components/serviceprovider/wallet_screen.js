import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Keyboard,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../integrations/firebase';
import { Ionicons } from '@expo/vector-icons';
import { WALLET_BACKEND_URL } from '@env';

const COLORS = {
  primary: '#007bff',
  background: '#f7f9fc',
  textDark: '#222',
  textLight: '#666',
  white: '#fff',
  border: '#e0e0e0',
  success: '#28a745',
};

export default function WalletTopUpScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingBalance, setFetchingBalance] = useState(true);

  // ✅ Fetch wallet balance
  const fetchWalletBalance = async () => {
    try {
      const userId = await AsyncStorage.getItem('userid');
      if (!userId) return;

      const providerRef = doc(db, 'serviceProviders', userId);
      const providerSnap = await getDoc(providerRef);

      if (providerSnap.exists()) {
        setBalance(providerSnap.data().wallet || 0);
      } else {
        setBalance(0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setFetchingBalance(false);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  // ✅ Handle Payment
  const openPaymentSheet = async () => {
    Keyboard.dismiss();

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    try {
      setLoading(true);
      // const { data } = await axios.post('http://192.168.1.3:5000/create-payment-intent', {
      //   amount: parseFloat(amount) * 100,
      //   currency: 'pkr',
      // });
const { data } = await axios.post(`${WALLET_BACKEND_URL}/create-payment-intent`, {
    amount: parseFloat(amount) * 100,
    currency: 'pkr',
});

      const initSheet = await initPaymentSheet({
        paymentIntentClientSecret: data.clientSecret,
        merchantDisplayName: 'My App Wallet',
      });

      if (initSheet.error) {
        Alert.alert('Error', initSheet.error.message);
        return;
      }

      const paymentResult = await presentPaymentSheet();

      if (paymentResult.error) {
        Alert.alert('Payment Failed', paymentResult.error.message);
      } else {
        Alert.alert('Success', `Wallet credited with Rs ${amount}!`);

        const userId = await AsyncStorage.getItem('userid');
        if (userId) {
          const providerRef = doc(db, 'serviceProviders', userId);
          const providerSnap = await getDoc(providerRef);
          const newBalance = balance + parseFloat(amount);

          if (providerSnap.exists()) {
            await updateDoc(providerRef, { wallet: newBalance });
          } else {
            await setDoc(providerRef, {
              wallet: newBalance,
              userId: userId,
              createdAt: new Date().toISOString(),
            });
          }

          setBalance(newBalance);
        }

        setAmount('');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#007bff', '#4facfe']} style={styles.headerGradient}>
        <Text style={styles.headerText}>My Wallet</Text>
      </LinearGradient>

      <View style={styles.container}>
        {/* Wallet Balance Card */}
        <LinearGradient
          colors={['#007bff', '#00b4ff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Ionicons name="wallet-outline" size={40} color={COLORS.white} />
          {fetchingBalance ? (
            <ActivityIndicator size="small" color={COLORS.white} style={{ marginTop: 10 }} />
          ) : (
            <>
              <Text style={styles.balanceLabel}>Available Balance</Text>
              <Text style={styles.walletBalance}>₨ {balance.toFixed(2)}</Text>
            </>
          )}
        </LinearGradient>

        {/* Input Section */}
        <View style={styles.inputCard}>
          <Text style={styles.label}>Enter Amount (PKR)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 500"
            placeholderTextColor={COLORS.textLight}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <TouchableOpacity
            onPress={openPaymentSheet}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#007bff', '#4facfe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.button, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <View style={styles.btnRow}>
                  <Ionicons name="add-circle-outline" size={22} color={COLORS.white} />
                  <Text style={styles.buttonText}>Add Money</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ✅ Modern Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    height: Platform.OS === 'ios' ? 120 : 70,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
  },
  headerText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  balanceCard: {
    borderRadius: 20,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
  },
  balanceLabel: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.9,
    marginTop: 10,
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 5,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 25,
    marginTop: 40,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.textDark,
    marginBottom: 25,
    backgroundColor: '#fafafa',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 17,
  },
});
