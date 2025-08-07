import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { CustomButton, CustomInput, LoadingSpinner } from '../components';
import { colors } from '../styles/colors';
import { validateEmail, validatePassword, validateName } from '../utils/validation';

const Register = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { register } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        birthDate: selectedDate,
      }));
      
      // Clear error when date is selected
      if (errors.birthDate) {
        setErrors(prev => ({
          ...prev,
          birthDate: null,
        }));
      }
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR');
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name) {
      newErrors.name = 'Nome é obrigatório';
    } else if (!validateName(formData.name)) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    // Birth date validation
    if (!formData.birthDate) {
      newErrors.birthDate = 'Data de nascimento é obrigatória';
    } else {
      const age = calculateAge(formData.birthDate);
      if (age < 13) {
        newErrors.birthDate = 'Você deve ter pelo menos 13 anos';
      } else if (age > 120) {
        newErrors.birthDate = 'Data de nascimento inválida';
      }
    }

    // Terms validation
    if (!acceptedTerms) {
      newErrors.terms = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        birthDate: formData.birthDate.toISOString(),
      });
      // A navegação será automática quando o estado do usuário mudar
    } catch (error) {
      Alert.alert(
        'Erro no Cadastro',
        error.message || 'Ocorreu um erro ao criar sua conta. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getContainerStyle = () => ({
    flex: 1,
    backgroundColor: colors.background,
  });

  const getContentStyle = () => ({
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  });

  const getHeaderStyle = () => ({
    alignItems: 'center',
    marginBottom: 32,
  });

  const getLogoStyle = () => ({
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  });

  const getTitleStyle = () => ({
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    lineHeight: 36,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 8,
  });

  const getSubtitleStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.gray[600],
    textAlign: 'center',
  });

  const getFormStyle = () => ({
    marginBottom: 24,
  });

  const getTermsContainerStyle = () => ({
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  });

  const getCheckboxStyle = () => ({
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: acceptedTerms ? colors.primary : colors.gray[300],
    backgroundColor: acceptedTerms ? colors.primary : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  });

  const getTermsTextStyle = () => ({
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[600],
  });

  const getTermsLinkStyle = () => ({
    color: colors.primary,
    fontFamily: 'Inter-Medium',
  });

  const getErrorTextStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: colors.secondary,
    marginTop: 4,
  });

  const getDividerContainerStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  });

  const getDividerLineStyle = () => ({
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[200],
  });

  const getDividerTextStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[500],
    marginHorizontal: 16,
  });

  const getFooterStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
  });

  const getFooterTextStyle = () => ({
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray[600],
  });

  const getFooterLinkStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
    marginLeft: 4,
  });

  return (
    <SafeAreaView style={getContainerStyle()}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={getContentStyle()}>
            {/* Header */}
            <View style={getHeaderStyle()}>
              <View style={getLogoStyle()}>
                <Ionicons
                  name="fitness"
                  size={40}
                  color={colors.white}
                />
              </View>
              <Text style={getTitleStyle()}>
                Crie sua conta
              </Text>
              <Text style={getSubtitleStyle()}>
                Junte-se à comunidade e encontre seu parceiro de treino ideal
              </Text>
            </View>

            {/* Form */}
            <View style={getFormStyle()}>
              <CustomInput
                label="Nome completo"
                placeholder="Digite seu nome"
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                error={errors.name}
                autoCapitalize="words"
                leftIcon="person-outline"
              />

              <CustomInput
                label="Email"
                placeholder="Digite seu email"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon="mail-outline"
              />

              <CustomInput
                label="Senha"
                placeholder="Digite sua senha"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                secureTextEntry={true}
                leftIcon="lock-closed-outline"
              />

              <CustomInput
                label="Confirmar senha"
                placeholder="Confirme sua senha"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                error={errors.confirmPassword}
                secureTextEntry={true}
                leftIcon="lock-closed-outline"
              />

              {/* Birth Date */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontFamily: 'Inter-Medium',
                  fontSize: 14,
                  lineHeight: 20,
                  color: colors.gray[700],
                  marginBottom: 8,
                }}>
                  Data de nascimento
                </Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: errors.birthDate ? colors.secondary : colors.gray[300],
                    borderRadius: 12,
                    backgroundColor: colors.white,
                  }}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.gray[500]}
                    style={{ marginRight: 12 }}
                  />
                  <Text style={{
                    flex: 1,
                    fontFamily: 'Inter-Regular',
                    fontSize: 16,
                    lineHeight: 24,
                    color: formData.birthDate ? colors.gray[900] : colors.gray[500],
                  }}>
                    {formData.birthDate ? formatDate(formData.birthDate) : 'Selecione sua data de nascimento'}
                  </Text>
                  {formData.birthDate && (
                    <Text style={{
                      fontFamily: 'Inter-Medium',
                      fontSize: 14,
                      lineHeight: 20,
                      color: colors.primary,
                    }}>
                      {calculateAge(formData.birthDate)} anos
                    </Text>
                  )}
                </TouchableOpacity>
                {errors.birthDate && (
                  <Text style={getErrorTextStyle()}>
                    {errors.birthDate}
                  </Text>
                )}
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.birthDate || new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}

              {/* Terms and Conditions */}
              <TouchableOpacity
                style={getTermsContainerStyle()}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                activeOpacity={0.7}
              >
                <View style={getCheckboxStyle()}>
                  {acceptedTerms && (
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={colors.white}
                    />
                  )}
                </View>
                <Text style={getTermsTextStyle()}>
                  Eu aceito os{' '}
                  <Text
                    style={getTermsLinkStyle()}
                    onPress={() => {
                      // TODO: Open terms of service
                      Alert.alert('Em breve', 'Termos de uso em desenvolvimento');
                    }}
                  >
                    Termos de Uso
                  </Text>
                  {' '}e a{' '}
                  <Text
                    style={getTermsLinkStyle()}
                    onPress={() => {
                      // TODO: Open privacy policy
                      Alert.alert('Em breve', 'Política de privacidade em desenvolvimento');
                    }}
                  >
                    Política de Privacidade
                  </Text>
                </Text>
              </TouchableOpacity>

              {errors.terms && (
                <Text style={getErrorTextStyle()}>
                  {errors.terms}
                </Text>
              )}

              <CustomButton
                title="Criar conta"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
              />
            </View>

            {/* Divider */}
            <View style={getDividerContainerStyle()}>
              <View style={getDividerLineStyle()} />
              <Text style={getDividerTextStyle()}>ou</Text>
              <View style={getDividerLineStyle()} />
            </View>

            {/* Social Register */}
            <CustomButton
              title="Continuar com Google"
              variant="outline"
              onPress={() => {
                // TODO: Implement Google register
                Alert.alert('Em breve', 'Cadastro com Google em desenvolvimento');
              }}
              style={{ marginBottom: 16 }}
            />

            <CustomButton
              title="Continuar com Apple"
              variant="outline"
              onPress={() => {
                // TODO: Implement Apple register
                Alert.alert('Em breve', 'Cadastro com Apple em desenvolvimento');
              }}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={getFooterStyle()}>
          <Text style={getFooterTextStyle()}>
            Já tem uma conta?
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={getFooterLinkStyle()}>
              Entrar
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} text="Criando conta..." />
    </SafeAreaView>
  );
};

Register.propTypes = {
  navigation: PropTypes.object.isRequired,
};

export default Register;

