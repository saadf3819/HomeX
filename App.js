import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { StripeProvider } from '@stripe/stripe-react-native';

import store from './redux/store';

// Screens
import LoginUser from './components/auth/login_user';
import SplashScreen from './components/splash_screen';
import OnboardingCarousel from './components/image_coursel';
import AuthScreen from './components/auth/login_user';
import Profile from './components/profile';
import ServiceProviderLogin from './components/serviceprovider/auth/serviceproviderlogin';
import ServiceProviderDashboard from './components/serviceprovider/serviceprovider_dashboard';
import Cnic_Verification from './components/serviceprovider/auth/cnic_verifciation';
import SelfieScreen from './components/serviceprovider/auth/SelfieScreen';
import ServiceProviderDetail from './components/ServiceProviderDetail';
import Bookings from './components/bookings';
import CategoryScreen from './components/CategoryScreen';
import Tab_Navigation from './components/tab_navigation';
import ChatScreen from './components/chat_screen';
import chat_provider from './components/chat_provider';
import ServiceProviderForm from './components/Serivce_Provider_Form';
import LiveTrackingDemo from './components/live_tracking';
import WalletTopUpScreen from './components/serviceprovider/wallet_screen';
import ProviderLiveTracking from './components/ProviderLiveTracking';
import RateReview from './components/RateReview';
import ClientTrackingMap from './components/ClientTrackingMap';
import EditProfile from './components/EditProfile';
import PrivacyPolicy from './components/PrivacyPolicy';
import ProviderProfile from './components/ProviderEditProfile';
import EditProfileProvider from './components/EditProfileProvider';
import { STRIPE_PUBLISHABLE_KEY } from '@env';

const Stack = createNativeStackNavigator();

export default function App() {
  const [issplashshow, setissplashshow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setissplashshow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Provider store={store}>
      {/* 👇 Wrap everything inside StripeProvider */}
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {issplashshow ? (
              <Stack.Screen name="splash_screen" component={SplashScreen} />
            ) : (
                    
                      //  
               <Stack.Screen name="image_coursel" component={OnboardingCarousel} />
               
            )}
            <Stack.Screen name="login_user" component={AuthScreen} />
            <Stack.Screen name="profile" component={Profile} />
            <Stack.Screen name="chat_screen" component={ChatScreen} />
            <Stack.Screen name="CategoryScreen" component={CategoryScreen} />
            <Stack.Screen name="tab_navigation" component={Tab_Navigation} />
            <Stack.Screen name="serviceprovider_dashboard" component={ServiceProviderDashboard} />
            <Stack.Screen name="cnic_verifciation" component={Cnic_Verification} />
            <Stack.Screen name="ServiceProviderDetail" component={ServiceProviderDetail} />
            <Stack.Screen name="SelfieScreen" component={SelfieScreen} />
            <Stack.Screen name="chat_provider" component={chat_provider} />
            <Stack.Screen name="ServiceProviderForm" component={ServiceProviderForm} />
            {/* <Stack.Screen name="ProviderLiveTracking" component={ProviderLiveTracking}/> */}
            <Stack.Screen name="WalletTopUpScreen" component={WalletTopUpScreen} />
            <Stack.Screen name='ClientTrackingMap' component={ClientTrackingMap}/>
            <Stack.Screen name="RateReview" component={RateReview} />
           <Stack.Screen name="serviceproviderlogin" component={ServiceProviderLogin} />
             <Stack.Screen name="tracking" component={LiveTrackingDemo} />
             <Stack.Screen name='EditProfile' component={EditProfile}/>
             <Stack.Screen name='PrivacyPolicy' component={PrivacyPolicy}/>
             <Stack.Screen name='ProviderEditProfile' component={ProviderProfile}/>
             <Stack.Screen name='EditProfileProvider' component={EditProfileProvider}  />
          </Stack.Navigator>
        </NavigationContainer>
      </StripeProvider>
    </Provider>
  );
}
