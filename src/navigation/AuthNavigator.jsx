import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Login, Register, Welcome } from '../pages';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={Welcome}
        options={{
          title: 'Bem-vindo',
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={Login}
        options={{
          title: 'Entrar',
        }}
      />
      <Stack.Screen 
        name="Register" 
        component={Register}
        options={{
          title: 'Cadastrar',
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

