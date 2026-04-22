import React, { useState, useEffect } from 'react';
import MapView, { UrlTile, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { View, StyleSheet, Alert } from 'react-native';

const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${process.env.EXPO_PUBLIC_MAPBOX_TOKEN}`;

export default function LiveTrackingDemo() {
  const [position, setPosition] = useState({ latitude: 37.7749, longitude: -122.4194 });
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        Alert.alert('Permission Needed', 'Enable location access for live tracking.');
        return;
      }

      const watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 10,
        },
        (location) => {
          setPosition(location.coords);
          setError(null); // Clear any prior errors on successful update
        },
        (err) => setError(err.message)
      );

      // Cleanup on unmount
      return () => Location.stopLocationUpdatesAsync(watchId);
    })();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Alert title="Location Error" message={error} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: position.latitude,
          longitude: position.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        <UrlTile urlTemplate={MAPBOX_TILE_URL} maximumZ={19} flipY={false} />
        <Marker
          coordinate={position}
          title="Your Location"
          description="Live tracking"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});