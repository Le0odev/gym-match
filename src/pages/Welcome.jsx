import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomButton } from '../components';
import { colors } from '../styles/colors';

const { width, height } = Dimensions.get('window');

const Welcome = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo.png')} // Assumindo que você tem um logo.png
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Bem-vindo ao Workout Partner!</Text>
        <Text style={styles.subtitle}>
          Encontre seu parceiro ideal para treinar e alcançar seus objetivos.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <CustomButton
          title="Entrar"
          onPress={() => navigation.navigate('Login')}
          variant="primary"
          style={styles.button}
        />
        <CustomButton
          title="Criar Conta"
          onPress={() => navigation.navigate('Register')}
          variant="outline"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: width * 0.6,
    height: height * 0.2,
    marginBottom: 30,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '80%',
  },
  button: {
    marginBottom: 15,
  },
});

export default Welcome;


