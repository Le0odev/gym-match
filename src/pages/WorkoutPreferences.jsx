import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton, LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { userService } from '../services/userService';

const WorkoutPreferences = ({ navigation }) => {
  const [preferences, setPreferences] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPreferences, setFilteredPreferences] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPreferences();
  }, [searchQuery, preferences]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [preferencesData, categoriesData, userProfile] = await Promise.all([
        userService.getWorkoutPreferences(),
        userService.getWorkoutPreferenceCategories(),
        userService.getProfile(),
      ]);
      
      setPreferences(preferencesData);
      setCategories(categoriesData);
      setSelectedPreferences(userProfile.workoutPreferences?.map(p => p.id) || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Erro', 'Não foi possível carregar as preferências');
    } finally {
      setLoading(false);
    }
  };

  const filterPreferences = () => {
    if (!searchQuery.trim()) {
      setFilteredPreferences(preferences);
    } else {
      const filtered = preferences.filter(preference =>
        preference.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        preference.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPreferences(filtered);
    }
  };

  const togglePreference = (preferenceId) => {
    setSelectedPreferences(prev => {
      if (prev.includes(preferenceId)) {
        return prev.filter(id => id !== preferenceId);
      } else {
        return [...prev, preferenceId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userService.updateWorkoutPreferences(selectedPreferences);
      Alert.alert('Sucesso', 'Preferências atualizadas com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Erro', 'Não foi possível salvar as preferências');
    } finally {
      setSaving(false);
    }
  };

  const renderPreferencesByCategory = () => {
    const groupedPreferences = {};
    
    filteredPreferences.forEach(preference => {
      const category = preference.category || 'Outros';
      if (!groupedPreferences[category]) {
        groupedPreferences[category] = [];
      }
      groupedPreferences[category].push(preference);
    });

    return Object.keys(groupedPreferences).map(category => (
      <View key={category} style={getCategoryContainerStyle()}>
        <Text style={getCategoryTitleStyle()}>{category}</Text>
        <View style={getPreferencesGridStyle()}>
          {groupedPreferences[category].map(preference => (
            <TouchableOpacity
              key={preference.id}
              style={getPreferenceChipStyle(selectedPreferences.includes(preference.id))}
              onPress={() => togglePreference(preference.id)}
              activeOpacity={0.7}
            >
              <Text style={getPreferenceChipTextStyle(selectedPreferences.includes(preference.id))}>
                {preference.name}
              </Text>
              {preference.description && (
                <Text style={getPreferenceDescriptionStyle(selectedPreferences.includes(preference.id))}>
                  {preference.description}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ));
  };

  const getContainerStyle = () => ({
    flex: 1,
    backgroundColor: colors.background,
  });

  const getHeaderStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  });

  const getBackButtonStyle = () => ({
    padding: 8,
    marginRight: 16,
  });

  const getHeaderTitleStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    lineHeight: 28,
    color: colors.gray[900],
    flex: 1,
  });

  const getSearchContainerStyle = () => ({
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  });

  const getSearchInputContainerStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  });

  const getSearchInputStyle = () => ({
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[900],
    marginLeft: 8,
  });

  const getSelectedCountStyle = () => ({
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  });

  const getSelectedCountTextStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
    textAlign: 'center',
  });

  const getCategoryContainerStyle = () => ({
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.white,
    marginBottom: 16,
  });

  const getCategoryTitleStyle = () => ({
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    lineHeight: 28,
    color: colors.gray[900],
    marginBottom: 16,
  });

  const getPreferencesGridStyle = () => ({
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  });

  const getPreferenceChipStyle = (isSelected) => ({
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isSelected ? colors.primary : colors.gray[300],
    backgroundColor: isSelected ? colors.primary : colors.white,
    marginHorizontal: 4,
    marginBottom: 8,
    minWidth: 100,
  });

  const getPreferenceChipTextStyle = (isSelected) => ({
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    lineHeight: 20,
    color: isSelected ? colors.white : colors.gray[700],
    textAlign: 'center',
  });

  const getPreferenceDescriptionStyle = (isSelected) => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: isSelected ? colors.white + '80' : colors.gray[500],
    textAlign: 'center',
    marginTop: 4,
  });

  const getSaveButtonStyle = () => ({
    marginHorizontal: 24,
    marginVertical: 24,
  });

  if (loading) {
    return (
      <SafeAreaView style={getContainerStyle()}>
        <LoadingSpinner visible={true} text="Carregando preferências..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={getContainerStyle()}>
      {/* Header */}
      <View style={getHeaderStyle()}>
        <TouchableOpacity
          style={getBackButtonStyle()}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.gray[700]}
          />
        </TouchableOpacity>
        <Text style={getHeaderTitleStyle()}>
          Preferências de Treino
        </Text>
      </View>

      {/* Search */}
      <View style={getSearchContainerStyle()}>
        <View style={getSearchInputContainerStyle()}>
          <Ionicons
            name="search"
            size={20}
            color={colors.gray[500]}
          />
          <TextInput
            style={getSearchInputStyle()}
            placeholder="Buscar preferências..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray[500]}
          />
        </View>
      </View>

      {/* Selected Count */}
      {selectedPreferences.length > 0 && (
        <View style={getSelectedCountStyle()}>
          <Text style={getSelectedCountTextStyle()}>
            {selectedPreferences.length} {selectedPreferences.length === 1 ? 'preferência selecionada' : 'preferências selecionadas'}
          </Text>
        </View>
      )}

      {/* Preferences List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {renderPreferencesByCategory()}
      </ScrollView>

      {/* Save Button */}
      <CustomButton
        title="Salvar Preferências"
        onPress={handleSave}
        loading={saving}
        style={getSaveButtonStyle()}
        disabled={selectedPreferences.length === 0}
      />
    </SafeAreaView>
  );
};

export default WorkoutPreferences;

