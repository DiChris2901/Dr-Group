import React, { useState } from 'react';
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
  Image
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { getGradient, getPrimaryColor, lastUserPhoto } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // La navegación se maneja automáticamente por el AuthContext
    } catch (error) {
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
          <View style={styles.logoContainer}>
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
            <Text style={styles.title}>DR Group</Text>
            <Text style={styles.subtitle}>Control de Asistencia</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>📧 Email</Text>
              <TextInput
                style={styles.input}
                placeholder="tu.email@drgroup.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>🔒 Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#999"
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

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ⏱️ Al iniciar sesión se registrará tu hora de entrada
              </Text>
              <Text style={styles.infoText}>
                📍 Se guardará tu ubicación para control
              </Text>
            </View>
          </View>
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
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  lastUserPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16, // ✅ Diseño sobrio - borderRadius: 2 (16px para cards)
    padding: 24,
    // ✅ Sombras sobrias - Nivel 3 (Modales principales)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08, // ✅ Reducido de 0.3 a 0.08 (light mode)
    shadowRadius: 20,
    elevation: 4, // ✅ Reducido de 8 a 4
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8, // ✅ Diseño sobrio - borderRadius: 1 (8px)
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    height: 56,
    // backgroundColor removido - se aplica dinámicamente desde primaryColor
    borderRadius: 8, // ✅ Diseño sobrio - borderRadius: 1 (8px)
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    // ✅ Sombras sobrias - Nivel 2
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08, // ✅ Reducido de 0.3 a 0.08 (diseño sobrio)
    shadowRadius: 12,
    elevation: 3, // ✅ Reducido de 4 a 3
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
  infoBox: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f0f4ff',
    borderRadius: 8, // ✅ Diseño sobrio - borderRadius: 1 (8px)
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
