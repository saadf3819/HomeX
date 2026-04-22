import { View, Image, StyleSheet, Dimensions } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

const SplashScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require('../assets/splash_image_homex.png')}
          style={styles.splashImage}
          resizeMode="cover" 
        />
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b0f2b', // Optional: make it match your splash screen background
  },
  container: {
    flex: 1,
  },
  splashImage: {
    width: width,
    height: height,
  },
});
