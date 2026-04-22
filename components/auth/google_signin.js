// utils/googleAuth.js
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '@env';


export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    profileImageSize: 150,
    prompt: 'select_account',
  });
};

export const handleGoogleSignIn = async (onSuccess, onError) => {
  try {
    await GoogleSignin.hasPlayServices();
    // await GoogleSignin.signOut(); // Clear previous session
    const userInfo = await GoogleSignin.signIn({
      prompt: 'select_account',
    });

    if (userInfo.idToken) {
      onSuccess(userInfo);
    } else {
      onError('Google Sign-In failed: No ID token received');
    }
  } catch (error) {
    let errorMessage = 'Google Sign-In failed';
    
    if (error.code) {
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          errorMessage = 'Sign in cancelled';
          break;
        case statusCodes.IN_PROGRESS:
          errorMessage = 'Operation in progress';
          break;
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          errorMessage = 'Play services not available';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    }
    
    onError(errorMessage);
  }
};