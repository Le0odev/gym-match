import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

class LocationService {
  constructor() {
    this.currentLocation = null;
    this.watchId = null;
  }

  // Solicitar permissão de localização
  async requestLocationPermission() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão de Localização',
          'Para encontrar parceiros de treino próximos, precisamos acessar sua localização. Você pode alterar isso nas configurações do app.',
          [
            { text: 'Agora não', style: 'cancel' },
            { text: 'Configurações', onPress: () => this.openAppSettings() }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Verificar se a permissão foi concedida
  async hasLocationPermission() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  async openAppSettings() {
    try {
      if (Location.openAppSettings) {
        // SDKs mais novos
        await Location.openAppSettings();
      } else if (Location.openAppSettingsAsync) {
        await Location.openAppSettingsAsync();
      }
    } catch (e) {
      console.error('Error opening app settings:', e);
    }
  }

  // Obter localização atual
  async getCurrentLocation() {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        const granted = await this.requestLocationPermission();
        if (!granted) {
          return null;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: Date.now(),
      };

      // Persistir localização
      await this.saveLocationToStorage(this.currentLocation);

      // Obter endereço reverso
      const address = await this.reverseGeocode(
        location.coords.latitude,
        location.coords.longitude
      );

      return {
        ...this.currentLocation,
        address,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      
      // Tentar carregar localização salva
      const savedLocation = await this.getLocationFromStorage();
      if (savedLocation) {
        return savedLocation;
      }

      throw new Error('Não foi possível obter sua localização');
    }
  }

  // Geocodificação reversa (coordenadas para endereço)
  async reverseGeocode(latitude, longitude) {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result && result.length > 0) {
        const location = result[0];
        return {
          street: location.street,
          city: location.city,
          region: location.region,
          country: location.country,
          postalCode: location.postalCode,
          formattedAddress: `${location.city}, ${location.region}`,
        };
      }

      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Geocodificação (endereço para coordenadas)
  async geocode(address) {
    try {
      const result = await Location.geocodeAsync(address);
      
      if (result && result.length > 0) {
        return {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding:', error);
      return null;
    }
  }

  // Calcular distância entre duas coordenadas (em km)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Arredondar para 1 casa decimal
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Salvar localização no AsyncStorage
  async saveLocationToStorage(location) {
    try {
      await AsyncStorage.setItem('userLocation', JSON.stringify(location));
    } catch (error) {
      console.error('Error saving location to storage:', error);
    }
  }

  // Carregar localização do AsyncStorage
  async getLocationFromStorage() {
    try {
      const locationString = await AsyncStorage.getItem('userLocation');
      if (locationString) {
        const location = JSON.parse(locationString);
        
        // Verificar se a localização não é muito antiga (24 horas)
        const isOld = Date.now() - location.timestamp > 24 * 60 * 60 * 1000;
        if (!isOld) {
          return location;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading location from storage:', error);
      return null;
    }
  }

  // Limpar localização salva
  async clearLocationFromStorage() {
    try {
      await AsyncStorage.removeItem('userLocation');
      this.currentLocation = null;
    } catch (error) {
      console.error('Error clearing location from storage:', error);
    }
  }

  // Iniciar monitoramento de localização
  async startLocationTracking() {
    try {
      const hasPermission = await this.hasLocationPermission();
      if (!hasPermission) {
        return false;
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 60000, // Atualizar a cada 1 minuto
          distanceInterval: 100, // Ou quando mover 100 metros
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
          };
          
          // Salvar nova localização
          this.saveLocationToStorage(this.currentLocation);
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  // Parar monitoramento de localização
  stopLocationTracking() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  // Verificar se os serviços de localização estão habilitados
  async isLocationServicesEnabled() {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  // Obter localização com fallback para localização salva
  async getLocationWithFallback() {
    try {
      // Tentar obter localização atual
      const currentLocation = await this.getCurrentLocation();
      return currentLocation;
    } catch (error) {
      // Fallback para localização salva
      const savedLocation = await this.getLocationFromStorage();
      if (savedLocation) {
        return savedLocation;
      }
      
      // Se não há localização salva, retornar null
      return null;
    }
  }
}

export default new LocationService();

