import { getDatabase, ref, get } from 'firebase/database';

export const getUserData = async (uid) => {
  try {
    if (!uid) throw new Error('User ID is required');
    
    const db = getDatabase();
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return snapshot.val(); // ✅ returns user data object
    } else {
      console.log('No user found with this UID');
      return null;
    }

  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};
