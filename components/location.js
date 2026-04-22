import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, ActivityIndicator } from "react-native";
import * as Location from "expo-location";

export default function LocationScreen() {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const getLocation = async () => {
    try {
      setLoading(true);

      // Ask for permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        setLoading(false);
        return;
      }

      // Get current position
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Reverse geocode to get human-readable address
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      setAddress(addr);
    } catch (error) {
      setErrorMsg("Failed to get location");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : errorMsg ? (
        <Text style={styles.text}>{errorMsg}</Text>
      ) : address ? (
        <View style={styles.addressContainer}>
          <Text style={styles.text}>📍 {address.name || ""}</Text>
          <Text style={styles.text}>
            {address.street ? `${address.street}, ` : ""}
            {address.city || address.subregion || ""}, {address.region || ""}
          </Text>
          <Text style={styles.text}>{address.country || ""}</Text>
        </View>
      ) : (
        <Text style={styles.text}>Fetching location...</Text>
      )}
      <Button title="Refresh Location" onPress={getLocation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  text: { fontSize: 16, textAlign: "center", marginVertical: 4 },
  addressContainer: { marginBottom: 20, alignItems: "center" },
});
