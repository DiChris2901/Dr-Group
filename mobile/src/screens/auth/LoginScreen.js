import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Animated,
  Dimensions
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  const { signIn } = useAuth();
  const { getGradient, getPrimaryColor, lastUserPhoto } = useTheme();
  
  // Animaciones
  const slideAnim = useRef(new Animated.Value(height)).current;
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

  // ✅ Colores dinámicos del tema
  const primaryColor = getPrimaryColor();

  return (
    <LinearGradient
      colors={getGradient()}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
            {lastUserPhoto ? (
              <Image
                source={{ uri: lastUserPhoto }}
                style={styles.lastUserPhoto}
              />
            ) : (
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>DR</Text>
              </View>
            )}
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Control de Asistencia</Text>
          </Animated.View>

          {/* Formulario */}
          <Animated.View 
            style={[
              styles.form, 
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="ejemplo@drgroup.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.button, 
                { backgroundColor: primaryColor }, // ✅ Color dinámico del tema
                loading && styles.buttonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>INICIAR JORNADA</Text>
              )}
            </TouchableOpacity>

            {/* ✅ Botón Biométrico */}
            {isBiometricSupported && hasStoredCredentials && (
              <TouchableOpacity
                style={[styles.biometricButton, { borderColor: primaryColor }]}
                onPress={handleBiometricLogin}
                disabled={loading}
              >
                <Text style={[styles.biometricText, { color: primaryColor }]}>
                  👆 Ingresar con Biometría
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ⏱️ Al iniciar sesión se registrará tu hora de entrada
              </Text>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
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
    justifyContent: 'flex-end', // ✅ Empujar contenido hacia abajo
    padding: 0, // ✅ Eliminar padding global para que el sheet toque los bordes
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
    flex: 1,
    justifyContent: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)', // Solo web, pero no estorba
  },
  lastUserPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  form: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 60,
    borderWidth: 0, // ✅ Sin bordes
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 17,
    backgroundColor: '#F3F4F6', // ✅ Fondo gris claro moderno
    color: '#1F2937',
    fontWeight: '500',
  },
  button: {
    height: 60,
    borderRadius: 20, // ✅ Rounded moderno
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  biometricButton: {
    height: 56,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  biometricText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f0f4ff',
    borderRadius: 16, // 🎨 Material 3 Medium (antes 8)
    borderLeftWidth: 4,
    // borderLeftColor se aplicará dinámicamente si se necesita
    borderLeftColor: '#667eea', // Mantener como fallback
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});
