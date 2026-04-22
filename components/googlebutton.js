// components/GoogleSignInButton.js
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './colors'; // Create a colors constants file

const GoogleSignInButton = ({ onPress, isLoading }) => {
  return (
    <TouchableOpacity
      style={styles.googleButton}
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={COLORS.blue} />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color={COLORS.blue} />
          <Text style={styles.googleText}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = {
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.blue
  },
  googleText: {
    marginLeft: 10,
    color: COLORS.darkGray,
    fontWeight: '500'
  }
};

export default GoogleSignInButton;