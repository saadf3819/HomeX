import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from './colors';

const { width } = Dimensions.get('window');

const DynamicCoursel = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        pagingEnabled
        data={data}
        renderItem={({ item }) => (
          <LinearGradient
            colors={[COLORS.lightBlue, COLORS.white]}
            style={[styles.banner, { width: width - 32 }]}
          >
            <Text style={styles.percentage}>{item.percentage}</Text>
            <Text style={styles.text}>{item.text}</Text>
            <Text style={styles.subtext}>{item.subtext}</Text>
          </LinearGradient>
        )}
        keyExtractor={item => item.id}
        onScroll={({ nativeEvent }) => {
          const index = Math.round(nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        showsHorizontalScrollIndicator={false}
      />
      
      <View style={styles.pagination}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.activeDot
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  banner: {
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 16,
  },
  percentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.blue,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: COLORS.darkGray,
    opacity: 0.8,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.lightBlue,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.blue,
  },
});

export default DynamicCoursel;