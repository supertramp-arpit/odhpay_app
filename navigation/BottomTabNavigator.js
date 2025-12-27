import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Theme from '../components/Theme';

import HomeScreen from '../screens/HomeScreen';
import TravelScreen from '../screens/TravelScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AllServicesScreen from '../screens/AllServicesScreen';
import Scan from '../components/ScanPay/Scan';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = ({ navigation }) => {
  const handleScanPress = () => {
    navigation.navigate('Scan');
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Theme.colors.BottomNav,
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            paddingBottom: 8,
            paddingTop: 8,
            height: 75,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            marginBottom: 5,
            fontWeight: '500',
          },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: Theme.colors.secondary,
          tabBarShowLabel: true,
          tabBarItemStyle: {
            flex: 1,
            paddingHorizontal: 0,
          },
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="home" size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="TravelTab"
          component={TravelScreen}
          options={{
            tabBarLabel: 'Travel',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="mode-of-travel" size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Scan"
          component={Scan}
          options={{
            tabBarButton: () => null,
            tabBarLabel: 'Scan',
          }}
        />

        <Tab.Screen
          name="HistoryTab"
          component={HistoryScreen}
          options={{
            tabBarLabel: 'History',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="swap-horiz" size={24} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="MoreTab"
          component={AllServicesScreen}
          options={{
            tabBarLabel: 'More',
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="more" size={24} color={color} />
            ),
          }}
        />
      </Tab.Navigator>

      {/* Floating Circular Scan Button - Black & White */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleScanPress}
        activeOpacity={0.75}
      >
        <View style={styles.buttonInner}>
          <MaterialIcons name="qr-code-scanner" size={36} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    marginLeft: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 20,
    zIndex: 100,
  },
  buttonInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default BottomTabNavigator;
