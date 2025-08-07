import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { RootNavigator } from './src/navigation';
import { colors } from './src/styles/colors';
import locationService from './src/services/locationService';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  // Inicializar localização
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        // Verificar se os serviços de localização estão habilitados
        const servicesEnabled = await locationService.isLocationServicesEnabled();
        if (!servicesEnabled) {
          console.log('Location services are disabled');
          return;
        }

        // Verificar se já tem permissão
        const hasPermission = await locationService.hasLocationPermission();
        if (!hasPermission) {
          // Aguardar um pouco antes de solicitar permissão para não interferir com o carregamento
          setTimeout(async () => {
            await locationService.requestLocationPermission();
          }, 3000);
        } else {
          // Se já tem permissão, tentar obter localização atual
          try {
            await locationService.getCurrentLocation();
          } catch (error) {
            console.log('Could not get current location:', error.message);
          }
        }
      } catch (error) {
        console.error('Error initializing location:', error);
      }
    };

    if (fontsLoaded) {
      initializeLocation();
    }
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <AuthProvider>
        <StatusBar style="dark" backgroundColor={colors.white} />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

