import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLORS } from './colors';
import { app } from '../integrations/firebase';

const RateReview = ({ route, navigation }) => {
  const { job } = route.params;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const db = getFirestore(app);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Please select a rating.');
      return;
    }

    try {
      const userId = await AsyncStorage.getItem('userid');

      await addDoc(collection(db, 'reviews'), {
        jobId: job.id,
        userId,
        providerId: job.providerId,
        rating,
        review,
        timestamp: serverTimestamp(),
      });

      Alert.alert('Thank you!', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      Alert.alert('Error', 'Could not submit review.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Rate Your Experience</Text>
          <Text style={styles.headerSubtitle}>
            Tell us how your service with <Text style={{ color: COLORS.blue }}>{job.providerName}</Text> went.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overall Rating</Text>
          <View style={styles.starContainer}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity key={num} onPress={() => setRating(num)} activeOpacity={0.8}>
                <MaterialIcons
                  name={num <= rating ? 'star' : 'star-border'}
                  size={42}
                  color={COLORS.blue}
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Write a Review</Text>
          <TextInput
            style={styles.input}
            placeholder="Share your experience..."
            value={review}
            onChangeText={setReview}
            multiline
            placeholderTextColor="#A0A0A0"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { opacity: rating === 0 ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={rating === 0}
          activeOpacity={0.9}
        >
          <MaterialIcons name="send" size={18} color={COLORS.white} style={{ marginRight: 6 }} />
          <Text style={styles.submitText}>Submit Review</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: COLORS.white,
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.lightBlue,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 10,
    marginTop: 10,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightBlue,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: COLORS.darkGray,
    backgroundColor: '#FAFAFA',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    borderRadius: 30,
    paddingVertical: 14,
    marginTop: 30,
    marginBottom: 20,
    alignSelf: 'center',
    width: '100%',
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  submitText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default RateReview;
