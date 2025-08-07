import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { EditProfile } from '../pages';

const Stack = createStackNavigator();

const RootNavigator = () => {
  const { user, loading, isFirstTimeUser } = useAuth();

  if (loading) {
    return <LoadingSpinner visible={true} text="Carregando..." />;
  }

  return (
    <NavigationContainer>
      {user ? (
        isFirstTimeUser ? (
          // Usuário novo - redirecionar para edição de perfil
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen 
              name="FirstTimeEditProfile" 
              component={EditProfile}
              initialParams={{ 
                profile: user,
                isFirstTime: true 
              }}
            />
          </Stack.Navigator>
        ) : (
          // Usuário existente - navegação normal
          <MainNavigator />
        )
      ) : (
        // Usuário não autenticado
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;

