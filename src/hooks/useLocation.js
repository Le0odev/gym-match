import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import locationService from '../services/locationService';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Verificar permissão de localização
  const checkPermission = useCallback(async () => {
    try {
      const permission = await locationService.hasLocationPermission();
      setHasPermission(permission);
      return permission;
    } catch (err) {
      console.error('Error checking location permission:', err);
      setHasPermission(false);
      return false;
    }
  }, []);

  // Solicitar permissão de localização
  const requestPermission = useCallback(async () => {
    try {
      setLoading(true);
      const granted = await locationService.requestLocationPermission();
      setHasPermission(granted);
      
      if (granted) {
        await getCurrentLocation();
      }
      
      return granted;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      setError('Erro ao solicitar permissão de localização');
      setHasPermission(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter localização atual
  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);
      
      return currentLocation;
    } catch (err) {
      console.error('Error getting current location:', err);
      setError('Não foi possível obter sua localização');
      
      // Tentar carregar localização salva
      try {
        const savedLocation = await locationService.getLocationFromStorage();
        if (savedLocation) {
          setLocation(savedLocation);
          return savedLocation;
        }
      } catch (savedErr) {
        console.error('Error loading saved location:', savedErr);
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obter localização com fallback
  const getLocationWithFallback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const locationData = await locationService.getLocationWithFallback();
      setLocation(locationData);
      
      return locationData;
    } catch (err) {
      console.error('Error getting location with fallback:', err);
      setError('Não foi possível obter sua localização');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcular distância entre duas coordenadas
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    return locationService.calculateDistance(lat1, lon1, lat2, lon2);
  }, []);

  // Limpar localização
  const clearLocation = useCallback(async () => {
    try {
      await locationService.clearLocationFromStorage();
      setLocation(null);
      setError(null);
    } catch (err) {
      console.error('Error clearing location:', err);
    }
  }, []);

  // Inicializar localização ao montar o componente
  useEffect(() => {
    const initializeLocation = async () => {
      // Verificar permissão
      const permission = await checkPermission();
      
      if (permission) {
        // Tentar carregar localização salva primeiro
        try {
          const savedLocation = await locationService.getLocationFromStorage();
          if (savedLocation) {
            setLocation(savedLocation);
          } else {
            // Se não há localização salva, obter localização atual
            await getCurrentLocation();
          }
        } catch (err) {
          console.error('Error initializing location:', err);
        }
      }
    };

    initializeLocation();
  }, [checkPermission, getCurrentLocation]);

  // Monitorar mudanças no estado do app
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && hasPermission) {
        // App voltou ao primeiro plano, atualizar localização se necessário
        const updateLocationIfNeeded = async () => {
          if (location) {
            const isOld = Date.now() - location.timestamp > 30 * 60 * 1000; // 30 minutos
            if (isOld) {
              await getCurrentLocation();
            }
          }
        };
        
        updateLocationIfNeeded();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
    };
  }, [hasPermission, location, getCurrentLocation]);

  return {
    location,
    loading,
    error,
    hasPermission,
    requestPermission,
    getCurrentLocation,
    getLocationWithFallback,
    calculateDistance,
    clearLocation,
    checkPermission,
  };
};

