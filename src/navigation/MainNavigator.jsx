import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Dashboard, Discover, Matches, Profile, EditProfile, Chat, WorkoutPreferences } from '../pages';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { notificationService } from '../services/notificationService';
import { getSocket } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { eventBus } from '../services/eventBus';

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
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  // Polling leve + socket para atualizar badge
  useEffect(() => {
    let interval;
    let cleanup;
    const fetchUnread = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        setUnread(res.count || 0);
      } catch {}
    };
    fetchUnread();
    interval = setInterval(fetchUnread, 15000);
    (async () => {
      const socket = await getSocket();
      if (user?.id) socket.emit('register', user.id);
      const onNotify = () => fetchUnread();
      socket.on('message:new', onNotify);
      cleanup = () => socket.off('message:new', onNotify);
    })();
    const offBadgeClear = eventBus.on('badge:clear', () => setUnread(0));
    return () => {
      clearInterval(interval);
      cleanup && cleanup();
      offBadgeClear && offBadgeClear();
    };
  }, [user?.id]);
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
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
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
          height: 64,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          lineHeight: 16,
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
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
        options={({ route }) => {
          const nestedRoute = getFocusedRouteNameFromRoute(route) ?? 'MatchesMain';
          const hideTab = nestedRoute === 'Chat';
          const isMatchesMain = nestedRoute === 'MatchesMain';
          return {
            title: 'Matches',
            tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
            // Esconde a tab bar quando estiver no Chat e melhora visual no Matches
            tabBarStyle: hideTab
              ? { display: 'none' }
              : isMatchesMain
              ? {
                  backgroundColor: colors.white,
                  borderTopWidth: 1,
                  borderTopColor: colors.gray[200],
                  height: 68,
                  paddingTop: 6,
                  paddingBottom: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: -2 },
                  elevation: 8,
                }
              : undefined,
          };
        }}
        listeners={{
          tabPress: async () => {
            try {
              await notificationService.markAllAsRead();
              setUnread(0);
            } catch {}
          },
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

