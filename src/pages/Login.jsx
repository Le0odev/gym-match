import React, { useState, useContext } from 'react';
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
import { AuthContext } from '../contexts/AuthContext';
import { CustomButton, CustomInput, LoadingOverlay } from '../components';
import { colors } from '../styles/colors';
import { validateEmail, validatePassword } from '../utils/validation';

const Login = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);

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

  const validateForm = () => {
    const newErrors = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      // Navigation will be handled by AuthContext
    } catch (error) {
      Alert.alert(
        'Erro no Login',
        error.message || 'Ocorreu um erro ao fazer login. Tente novamente.',
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
    paddingTop: 40,
  });

  const getHeaderStyle = () => ({
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 32,
  });

  const getForgotPasswordStyle = () => ({
    alignSelf: 'flex-end',
    marginBottom: 32,
  });

  const getForgotPasswordTextStyle = () => ({
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  });

  const getDividerContainerStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
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
                Bem-vindo de volta!
              </Text>
              <Text style={getSubtitleStyle()}>
                Entre na sua conta para encontrar seu parceiro de treino
              </Text>
            </View>

            {/* Form */}
            <View style={getFormStyle()}>
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

              <TouchableOpacity
                style={getForgotPasswordStyle()}
                onPress={() => {
                  // TODO: Implement forgot password
                  Alert.alert('Em breve', 'Funcionalidade em desenvolvimento');
                }}
                activeOpacity={0.7}
              >
                <Text style={getForgotPasswordTextStyle()}>
                  Esqueceu a senha?
                </Text>
              </TouchableOpacity>

              <CustomButton
                title="Entrar"
                onPress={handleLogin}
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

            {/* Social Login */}
            <CustomButton
              title="Continuar com Google"
              variant="outline"
              onPress={() => {
                // TODO: Implement Google login
                Alert.alert('Em breve', 'Login com Google em desenvolvimento');
              }}
              style={{ marginBottom: 16 }}
            />

            <CustomButton
              title="Continuar com Apple"
              variant="outline"
              onPress={() => {
                // TODO: Implement Apple login
                Alert.alert('Em breve', 'Login com Apple em desenvolvimento');
              }}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={getFooterStyle()}>
          <Text style={getFooterTextStyle()}>
            Não tem uma conta?
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.7}
          >
            <Text style={getFooterLinkStyle()}>
              Cadastre-se
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={loading} text="Fazendo login..." />
    </SafeAreaView>
  );
};

export default Login;

