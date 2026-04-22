import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './colors';

const PrivacyPolicy = () => {
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[COLORS.blue, '#4DA3FF', '#6BB6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </LinearGradient>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.paragraph}>
          Welcome to HomeX! We value your privacy and want to be transparent about how we handle your information.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We may collect personal information such as your name, email, phone number, profile picture, and location to provide our services efficiently.
        </Text>

        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          Your information is used to:
        </Text>
        <Text style={styles.bulletPoint}>• Provide service provider and client connections</Text>
        <Text style={styles.bulletPoint}>• Improve app experience</Text>
        <Text style={styles.bulletPoint}>• Send important updates or notifications</Text>

        <Text style={styles.sectionTitle}>3. Sharing of Information</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal data. Information may be shared only with service providers, clients, or trusted partners to facilitate app services.
        </Text>

        <Text style={styles.sectionTitle}>4. Security</Text>
        <Text style={styles.paragraph}>
          We take reasonable measures to protect your data from unauthorized access. However, no system is 100% secure.
        </Text>

        <Text style={styles.sectionTitle}>5. Your Choices</Text>
        <Text style={styles.paragraph}>
          You can update your profile information or delete your account anytime from the app.
        </Text>

        <Text style={styles.sectionTitle}>6. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about your data or this policy, you can contact us at: aqibmuhammad695@gmail.com
        </Text>

        <Text style={styles.paragraph}>
          By using HomeX, you agree to this Privacy Policy.
        </Text>
      </ScrollView>
    </View>
  );
};

export default PrivacyPolicy;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FBFF' },
  header: {
    paddingTop: StatusBar.currentHeight + 20,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 6,
    color: COLORS.blue,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginLeft: 10,
  },
});
