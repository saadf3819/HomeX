import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from './colors';

const DynamicCard = ({ provider }) => {
  return (
    <TouchableOpacity style={styles.card}>
      <Image source={provider.image} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.name}>{provider.name}</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.rating}>⭐ {provider.rating}</Text>
          <Text style={styles.price}>{provider.price}</Text>
        </View>
        <Text style={styles.experience}>{provider.experience} experience</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.lightBlue,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  rating: {
    color: COLORS.darkGray,
    fontSize: 14,
  },
  price: {
    color: COLORS.blue,
    fontWeight: '600',
    fontSize: 14,
  },
  experience: {
    color: COLORS.darkGray,
    fontSize: 12,
    opacity: 0.8,
  },
});

export default DynamicCard;