import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from './colors';
import Home from './home';
import Services from './services';
import Profile from './profile';
import Messages from './messages';
import Bookings from './bookings';
import { Dimensions, View } from 'react-native';
import { useSelector } from 'react-redux';
const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get('window');

const TabNavigation = () => {
const get = useSelector((state) => state.users);   // ✅ correct key
console.log(get, "user id from redux");

  return(
  <Tab.Navigator
    initialRouteName="Home"
    screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard:true,
      tabBarActiveTintColor: COLORS.blue,
      tabBarInactiveTintColor: COLORS.darkGray,
      tabBarStyle: {
        backgroundColor: '#D7EAFD',
        borderTopWidth: 0,
        elevation: 8,
        height: 60,
        paddingBottom: 8,
      
        width:width*1,
        borderRadius:25,
    //   borderTopLeftRadius:30,
    //   borderTopRightRadius:30,
        alignSelf:'center'
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
      
    }}
  >
    <Tab.Screen
      name="Home"
      component={Home}
      options={{
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="home" size={28} color={color} />
        ),
      }}
    />

    <Tab.Screen
      name="Services"
      component={Services}
      options={{
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="magnify" size={32} color={color} />
        ),
      }}
    />

    <Tab.Screen
      name="Bookings"
      component={Bookings}
      options={{
        tabBarIcon: ({ color }) => (
          <View style={styles.createButton}>
            <MaterialCommunityIcons name="calendar" size={32} color={COLORS.blue} style={{alignSelf:'center'}} />
          </View>
        ),
        // tabBarLabel: () => null,
      }}
    />

    <Tab.Screen
      name="messages"
      component={Messages}
      options={{
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="heart-outline" size={28} color={color} />
        ),
      }}
    />

    <Tab.Screen
      name="Profile"
      component={Profile}
      options={{
        tabBarIcon: ({ color }) => (
          <MaterialCommunityIcons name="account-circle" size={28} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
  )
};

const styles = {
  createButton: {
    position:'absolute',
    top: -15,
    backgroundColor: COLORS.white,
    borderRadius: 30,
    alignSelf:'center',
   width:width*0.12,
   height:height*0.050,
    elevation: 4,
  },
};

export default TabNavigation;