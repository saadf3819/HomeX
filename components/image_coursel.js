import React, { useRef, useState } from 'react';
import { View, Text, Image, Dimensions, StyleSheet, Animated, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  blue: '#007BFF',
  lightBlue: '#D7EAFD',
  darkGray: '#4A4A4A',
  yellow: '#FFE680',
  white: '#FFFFFF'
};

const onboardingData = [

  {
    id: '1',
    image: require('../assets/plumber.jpg'),
    title: 'Skilled Professionals',
    subtitle: 'Home Services Made Easy',
    description: 'Find trusted professionals for all your home maintenance needs',
    color: COLORS.blue,
  },
  {
    id: '2',
    image: require('../assets/event.png'),
    title: 'Event Specialists',
    subtitle: 'Memorable Experiences',
    description: 'Plan your perfect event with our expert coordinators and vendors',
    color: COLORS.blue,
  },
  // {
  //   id: '3',
  //   image: require('../assets/tutor.png'),
  //   title: 'Expert Tutors',
  //   subtitle: 'Personalized Learning',
  //   description: 'Connect with qualified tutors for one-on-one sessions in various subjects',
  //   color: COLORS.blue,
  // },
];

const OnboardingCarousel = ({ onComplete }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef(null);
  const navigation = useNavigation();

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const scrollTo = (index) => {
    if (index < 0 || index >= onboardingData.length) return;
    slidesRef.current.scrollToIndex({ index });
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <LinearGradient
          colors={[COLORS.lightBlue, COLORS.white]}
          style={styles.gradient}
        >
          <View style={styles.imageContainer}>
            <View style={[styles.imageFrame, { borderColor: item.color }]}>
              <Animated.View 
                style={[
                  styles.animatedImage, 
                  { 
                    transform: [{ scale }], 
                    opacity,
                    backgroundColor: `${COLORS.blue}10`,
                  }
                ]}
              >
                <Image source={item.image} style={styles.image} />
              </Animated.View>
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: COLORS.darkGray }]}>{item.title}</Text>
            <Text style={[styles.subtitle, { color: COLORS.darkGray }]}>{item.subtitle}</Text>
            <Text style={[styles.description, { color: COLORS.darkGray }]}>{item.description}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const Pagination = () => {
    return (
      <View style={styles.pagination}>
        {onboardingData.map((_, i) => {
          const inputRange = [
            (i - 1) * SCREEN_WIDTH,
            i * SCREEN_WIDTH,
            (i + 1) * SCREEN_WIDTH,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: onboardingData[i].color,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={slidesRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } }}],
              { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}

      />

      <Pagination />

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={() => scrollTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          style={[styles.controlButton, currentIndex === 0 && styles.disabled]}
        >
          <Feather
            name="chevron-left"
            size={28}
            color={currentIndex === 0 ? '#ccc' : COLORS.blue}
          />
        </TouchableOpacity>

        {currentIndex === onboardingData.length - 1 ? (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: COLORS.blue }]}
            onPress={() => navigation.navigate('login_user')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.button}
            onPress={() => scrollTo(currentIndex + 1)}
          >
            <Text style={[styles.buttonText, { color: COLORS.blue }]}>
              Next
            </Text>
            <Feather
              name="chevron-right"
              size={24}
              color={COLORS.blue}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  gradient: {
    flex: 1,
    padding: 24,
    paddingTop: 48,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFrame: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: 30,
    borderWidth: 4,
    padding: 10,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.darkGray,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  animatedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  controlButton: {
    padding: 12,
    borderRadius: 30,
    backgroundColor: COLORS.lightBlue,
  },
  disabled: {
    opacity: 0.5,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: COLORS.lightBlue,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default OnboardingCarousel;