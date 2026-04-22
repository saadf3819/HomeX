import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../integrations/firebase";

const MAPBOX_TILE_URL = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}?access_token=${process.env.EXPO_PUBLIC_MAPBOX_TOKEN}`;

export default function ClientTrackingMap({ route }) {
  const { providerId } = route.params;
  const [providerLocation, setProviderLocation] = useState(null);

  useEffect(() => {
    if (!providerId) return;

    const db = getDatabase(app);
    const locationRef = ref(db, `liveLocations/${providerId}`);

    const unsubscribe = onValue(
      locationRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const jobs = snapshot.val();
          let latestLocation = null;

          Object.keys(jobs).forEach((jobId) => {
            const jobLoc = jobs[jobId];
            if (!latestLocation || new Date(jobLoc.timestamp) > new Date(latestLocation.timestamp)) {
              latestLocation = jobLoc;
            }
          });

          if (latestLocation && latestLocation.lat && latestLocation.lng) {
            setProviderLocation({
              latitude: parseFloat(latestLocation.lat),
              longitude: parseFloat(latestLocation.lng),
            });
          }
        } else {
          console.log("No live location found for provider:", providerId);
        }
      },
      (error) => {
        console.error("Firebase listener error:", error);
        Alert.alert("Error", "Failed to fetch provider location.");
      }
    );

    return () => unsubscribe();
  }, [providerId]);

  // Show loader until location is available
  if (!providerLocation) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: providerLocation.latitude,
          longitude: providerLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        <UrlTile urlTemplate={MAPBOX_TILE_URL} maximumZ={19} flipY={false} />
        <Marker
          coordinate={providerLocation}
          title="Service Provider"
          description="Live Location"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
});
