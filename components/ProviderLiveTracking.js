import * as Location from "expo-location";
import { getDatabase, ref, set } from "firebase/database";
import { app } from "../integrations/firebase";

const shareProviderLocation = async (providerId) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return;

  Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
    (location) => {
      const db = getDatabase(app);
      const providerRef = ref(db, `providers/${providerId}/location`);
      set(providerRef, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      });
    }
  );
};
