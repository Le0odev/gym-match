import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setIsFirstTimeUser(false);
    } catch (error) {
      console.error('Login failed', error.response?.data || error.message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, accessToken, refreshToken } = response.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      setIsFirstTimeUser(true); // Marca como primeiro acesso
    } catch (error) {
      console.error('Registration failed', error.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        // Opcional: invalidar o refresh token no backend
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout failed', error.response?.data || error.message);
    } finally {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      setUser(null);
      setIsFirstTimeUser(false);
    }
  };

  const completeProfile = () => {
    setIsFirstTimeUser(false);
  };

  const updateUser = async (updatedUserData) => {
    try {
      // Buscar dados atualizados do usuário
      const response = await api.get('/users/me');
      const updatedUser = response.data;
      
      // Atualizar no estado e no storage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Failed to update user data', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isFirstTimeUser,
      login, 
      register, 
      logout,
      completeProfile,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


