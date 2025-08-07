import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Dashboard, Discover, Matches, Profile, EditProfile, Chat, WorkoutPreferences } from '../pages';
import { colors } from '../styles/colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator para Profile (inclui EditProfile)
const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={Profile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="WorkoutPreferences" component={WorkoutPreferences} />
    </Stack.Navigator>
  );
};

// Stack Navigator para Matches (inclui Chat)
const MatchesStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MatchesMain" component={Matches} />
      <Stack.Screen name="Chat" component={Chat} />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  const getTabBarIcon = (routeName, focused, color, size) => {
    let iconName;

    switch (routeName) {
      case 'Dashboard':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'Discover':
        iconName = focused ? 'search' : 'search-outline';
        break;
      case 'Matches':
        iconName = focused ? 'heart' : 'heart-outline';
        break;
      case 'Profile':
        iconName = focused ? 'person' : 'person-outline';
        break;
      default:
        iconName = 'circle-outline';
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) =>
          getTabBarIcon(route.name, focused, color, size),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[100],
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          lineHeight: 16,
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          title: 'Início',
          tabBarBadge: undefined, // Can be used for notifications
        }}
      />
      <Tab.Screen
        name="Discover"
        component={Discover}
        options={{
          title: 'Descobrir',
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesStack}
        options={{
          title: 'Matches',
          tabBarBadge: undefined, // Can be used for new matches count
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          title: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;

