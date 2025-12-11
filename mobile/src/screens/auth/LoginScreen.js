import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { Text, TextInput, Button, Surface, useTheme, Avatar } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext'; // Renamed to avoid conflict

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const { signIn } = useAuth();
  const theme = useTheme(); // Material 3 Theme
  const { lastUserPhoto } = useAppTheme(); // Legacy context for photo
  
  // Animaciones
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ✅ Verificar soporte biométrico y credenciales guardadas
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricSupported(compatible && enrolled);

      const credentials = await SecureStore.getItemAsync('user_credentials');
      setHasStoredCredentials(!!credentials);
    })();

    // Iniciar animación de entrada
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación Biométrica',
        fallbackLabel: 'Usar contraseña',
      });

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLoading(true);
        const credentialsJson = await SecureStore.getItemAsync('user_credentials');
        if (credentialsJson) {
          const { email: storedEmail, password: storedPassword } = JSON.parse(credentialsJson);
          await signIn(storedEmail, storedPassword);
        }
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error('Error biométrico:', error);
      Alert.alert('Error', 'Falló la autenticación biométrica');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // ✅ Preguntar si desea guardar credenciales para biometría
      if (isBiometricSupported) {
        Alert.alert(
          'Habilitar Biometría',
          '¿Deseas usar tu huella/rostro para iniciar sesión la próxima vez?',
          [
            { text: 'No', style: 'cancel' },
            { 
              text: 'Sí', 
              onPress: async () => {
                await SecureStore.setItemAsync('user_credentials', JSON.stringify({ email, password }));
                Alert.alert('Éxito', 'Biometría habilitada');
              }
            }
          ]
        );
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Error en login:', error);
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Usuario deshabilitado';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          
          {/* Header Section */}
          <Animated.View style={[styles.headerContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.logoWrapper}>
              {lastUserPhoto ? (
                <Avatar.Image 
                  size={100} 
                  source={{ uri: lastUserPhoto }} 
                  style={{ backgroundColor: theme.colors.primaryContainer }}
                />
              ) : (
                <Avatar.Text 
                  size={100} 
                  label="DR" 
                  style={{ backgroundColor: theme.colors.primary }}
                  color={theme.colors.onPrimary}
                  labelStyle={{ fontSize: 40, fontWeight: 'bold' }}
                />
              )}
            </View>
            
            <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
              Bienvenido
            </Text>
            <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.secondary }]}>
              Dr Group Mobile
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View 
            style={[
              styles.formContainer, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            <TextInput
              label="Correo Electrónico"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              outlineStyle={{ borderRadius: 16 }}
            />

            <TextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={secureTextEntry}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={secureTextEntry ? "eye" : "eye-off"} 
                  onPress={() => setSecureTextEntry(!secureTextEntry)} 
                />
              }
              outlineStyle={{ borderRadius: 16 }}
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              INICIAR JORNADA
            </Button>

            {/* Biometric Button */}
            {isBiometricSupported && hasStoredCredentials && (
              <Button
                mode="outlined"
                onPress={handleBiometricLogin}
                disabled={loading}
                style={styles.biometricButton}
                icon="fingerprint"
              >
                Ingresar con Biometría
              </Button>
            )}

            <Surface style={[styles.infoBox, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
                ⏱️ Al iniciar sesión se registrará tu hora de entrada automáticamente.
              </Text>
            </Surface>

          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: '500',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
    borderRadius: 100, // Pill shape
    elevation: 4,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  biometricButton: {
    marginTop: 16,
    borderRadius: 100,
    borderColor: 'transparent',
  },
  infoBox: {
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
});
